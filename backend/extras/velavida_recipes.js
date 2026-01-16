var config = require('../config')

let execute = null
let executeLambda = null
let executeInternal = null
exports.init = (executeFunction, lambdaFunction, internalFunction) => {
    execute = executeFunction
    executeLambda = lambdaFunction
    executeInternal = internalFunction
}

exports.loadRecipes = async (payload) => {
    const limit = payload?.limit || 10

    const result = await execute(
        `SELECT id, data
         FROM recipes
         ORDER BY RANDOM()
         LIMIT $1`,
        [limit]
    )

    const randomRecipes = result.rows.map(row => ({
        id: row.id,
        name: row.data.name,
        cover: row.data.cover
    }))

    return {
        "data": {
            "bases": config.velavida.bases,
            "randomRecipes": randomRecipes
        }
    }
}

exports.getRecipeDetails = async (data) => {
    const {id} = data

    // Get recipe details
    const recipeResult = await execute(
        `SELECT id, data FROM recipes WHERE id = $1`,
        [id]
    )

    if (recipeResult.rows.length === 0) {
        return {
            "error": "Recipe not found"
        }
    }

    const recipeData = recipeResult.rows[0].data
    const foodIds = recipeData.food_ids || []

    // Get ingredients (foods) for this recipe
    let ingredients = []
    if (foodIds.length > 0) {
        const foodsResult = await execute(
            `SELECT id, data FROM foods WHERE id::text = ANY($1::text[])`,
            [foodIds]
        )

        ingredients = foodsResult.rows.map(row => ({
            name: row.data.name,
            image: row.data.image
        }))
    }

    // Get related recipes (same course)
    let related = []
    if (recipeData.course) {
        const relatedResult = await execute(
            `SELECT id, data
             FROM recipes
             WHERE id != $1
               AND data->>'course' = $2
             ORDER BY RANDOM()
             LIMIT 5`,
            [id, recipeData.course]
        )

        related = relatedResult.rows.map(row => ({
            id: row.id,
            name: row.data.name,
            cover: row.data.cover,
            kind: row.data.course
        }))
    }

    return {
        "data": {
            "bases": config.velavida.bases,
            "recipe": {
                "id": recipeResult.rows[0].id,
                "name": recipeData.name,
                "link": recipeData.link,
                "course": recipeData.course,
                "cover": recipeData.cover,
                "ingredients": ingredients,
                "related": related
            }
        }
    }
}

// Helper function to generate search suggestions
async function generateSearchSuggestions(searchTerms) {
    const suggestions = new Set()

    for (const term of searchTerms) {
        // 1. Try singular form if word ends with 's' or 'es'
        const singularVariants = []
        if (term.endsWith('es') && term.length > 3) {
            singularVariants.push(term.slice(0, -2))
        } else if (term.endsWith('s') && term.length > 2) {
            singularVariants.push(term.slice(0, -1))
        }

        // 2. Try common phonetic replacements
        const phoneticVariants = [
            term.replace(/s/g, 'c'),
            term.replace(/c/g, 's'),
            term.replace(/v/g, 'b'),
            term.replace(/b/g, 'v'),
            term.replace(/z/g, 's'),
            term.replace(/ll/g, 'y'),
            term.replace(/y/g, 'll')
        ]

        // 3. Fragment matching - break into 3+ character fragments
        const fragments = []
        if (term.length >= 4) {
            for (let i = 0; i <= term.length - 3; i++) {
                fragments.push(term.substring(i, i + 3))
            }
        }

        // Combine all variants to search
        const allVariants = [...singularVariants, ...phoneticVariants]

        // Search for exact matches in recipes and foods using variants
        for (const variant of allVariants) {
            if (variant === term || variant.length < 2) continue

            try {
                // Search in recipe names
                const recipeResult = await execute(
                    `SELECT DISTINCT LOWER(data->>'name') as suggestion
                     FROM recipes
                     WHERE data->>'lang' = 'es'
                       AND LOWER(data->>'name') LIKE $1
                     LIMIT 3`,
                    [`%${variant}%`]
                )

                recipeResult.rows.forEach(row => {
                    if (row.suggestion) suggestions.add(row.suggestion)
                })

                // Search in food names
                const foodResult = await execute(
                    `SELECT DISTINCT LOWER(data->>'name') as suggestion
                     FROM foods
                     WHERE data->>'lang' = 'es'
                       AND LOWER(data->>'name') LIKE $1
                     LIMIT 3`,
                    [`%${variant}%`]
                )

                foodResult.rows.forEach(row => {
                    if (row.suggestion) suggestions.add(row.suggestion)
                })
            } catch (err) {
                console.error('Error searching variant:', variant, err)
            }
        }

        // Search using fragments
        for (const fragment of fragments) {
            try {
                const fragmentResult = await execute(
                    `SELECT DISTINCT LOWER(data->>'name') as suggestion
                     FROM recipes
                     WHERE data->>'lang' = 'es'
                       AND LOWER(data->>'name') LIKE $1
                     LIMIT 2`,
                    [`%${fragment}%`]
                )

                fragmentResult.rows.forEach(row => {
                    if (row.suggestion) suggestions.add(row.suggestion)
                })
            } catch (err) {
                console.error('Error searching fragment:', fragment, err)
            }
        }
    }

    // Return up to 5 suggestions
    return Array.from(suggestions).slice(0, 5)
}

exports.searchRecipes = async (payload) => {
    const searchString = payload?.s || ''

    // Return empty results if search is empty
    if (!searchString || searchString.trim().length === 0) {
        return {
            "data": []
        }
    }

    // Step 1: Parse search string into keywords
    const searchTerms = searchString.toLowerCase().split(' ').filter(term => term.length > 0)
    const fullSearchTerm = searchTerms.join(' ')

    // Use a Map to track unique recipe IDs with their scores
    // Map<id, {data: object, score: number}>
    const recipeScores = new Map()

    /**
     * Helper function to add or update recipe score
     * @param {number} id - Recipe ID
     * @param {object} data - Recipe data
     * @param {number} points - Points to add
     */
    const addScore = (id, data, points) => {
        if (recipeScores.has(id)) {
            recipeScores.get(id).score += points
        } else {
            recipeScores.set(id, { data, score: points })
        }
    }

    /**
     * Calculate match score based on match quality
     * @param {string} text - Text to search in
     * @param {string[]} terms - Search terms
     * @param {string} fullTerm - Full search term
     * @returns {number} - Score
     */
    const calculateMatchScore = (text, terms, fullTerm) => {
        const lowerText = text.toLowerCase()
        let score = 0

        // Exact match: 100 points
        if (lowerText === fullTerm) {
            return 100
        }

        // Starts with full search term: 70 points
        if (lowerText.startsWith(fullTerm)) {
            return 70
        }

        // Contains full search term: 50 points
        if (lowerText.includes(fullTerm)) {
            score += 50
        }

        // Check individual term matches
        let matchingTerms = 0
        let startsWithTerm = false

        for (const term of terms) {
            if (lowerText.includes(term)) {
                matchingTerms++
                if (lowerText.startsWith(term)) {
                    startsWithTerm = true
                }
            }
        }

        // Starts with any term: 30 points
        if (startsWithTerm) {
            score += 30
        }

        // Add 10 points per matching term (partial matches)
        score += matchingTerms * 10

        return score
    }

    // Step 2: Search by recipe name (highest priority)
    // Build OR conditions for each search term
    const nameConditions = searchTerms.map((_, index) =>
        `LOWER(data->>'name') LIKE $${index + 1}`
    ).join(' OR ')

    const nameParams = searchTerms.map(term => `%${term}%`)

    const nameResult = await execute(
        `SELECT id, data
         FROM recipes
         WHERE id IN (
           SELECT DISTINCT id FROM recipes
           WHERE data->>'lang' = 'es'
             AND (${nameConditions})
         )`,
        nameParams
    )

    nameResult.rows.forEach(row => {
        const recipeName = row.data.name || ''
        const score = calculateMatchScore(recipeName, searchTerms, fullSearchTerm)
        addScore(row.id, row.data, score)
    })

    // Step 3: Search by recipe tags (medium priority)
    const tagsResult = await execute(
        `SELECT id, data
         FROM recipes
         WHERE id IN (
           SELECT DISTINCT id FROM recipes
           WHERE data->>'lang' = 'es'
             AND (${nameConditions.replace(/data->>'name'/g, "data->>'tags'")})
         )`,
        nameParams
    )

    tagsResult.rows.forEach(row => {
        const recipeTags = row.data.tags || ''
        // Tags get lower base score (20 points for exact match)
        const score = Math.floor(calculateMatchScore(recipeTags, searchTerms, fullSearchTerm) * 0.2)
        addScore(row.id, row.data, score)
    })

    // Step 4: Search by ingredient names and synonyms (lower priority)
    // 4a. Find matching food IDs
    const foodNameConditions = searchTerms.map((_, index) =>
        `LOWER(data->>'name') LIKE $${index + 1}`
    ).join(' OR ')

    const foodTagConditions = searchTerms.map((_, index) =>
        `EXISTS (
            SELECT 1
            FROM json_array_elements_text(data->'tags') AS tag
            WHERE LOWER(tag) LIKE $${index + 1}
        )`
    ).join(' OR ')

    const foodsResult = await execute(
        `SELECT data->>'id' as food_id, data->>'name' as food_name, data->'tags' as food_tags
         FROM foods
         WHERE id IN (
           SELECT DISTINCT id FROM foods
           WHERE data->>'lang' = 'es'
             AND ((${foodNameConditions}) OR (${foodTagConditions}))
         )`,
        nameParams
    )

    // 4b. Find recipes containing those food IDs
    if (foodsResult.rows.length > 0) {
        const foodIds = foodsResult.rows.map(row => row.food_id)

        // Calculate ingredient match quality
        const ingredientScores = new Map()
        foodsResult.rows.forEach(row => {
            const foodName = row.food_name || ''
            const score = calculateMatchScore(foodName, searchTerms, fullSearchTerm)
            ingredientScores.set(row.food_id, score)
        })

        const recipesWithIngredientsResult = await execute(
            `SELECT id, data
             FROM recipes
             WHERE id IN (
               SELECT DISTINCT id FROM recipes
               WHERE EXISTS (
                 SELECT 1
                 FROM json_array_elements_text(data->'food_ids') AS food_id
                 WHERE food_id = ANY($1::text[])
               )
             )`,
            [foodIds]
        )

        recipesWithIngredientsResult.rows.forEach(row => {
            // Calculate average ingredient match score
            const recipeFoodIds = row.data.food_ids || []
            let totalIngredientScore = 0
            let matchingIngredients = 0

            recipeFoodIds.forEach(foodId => {
                if (ingredientScores.has(foodId)) {
                    totalIngredientScore += ingredientScores.get(foodId)
                    matchingIngredients++
                }
            })

            // Ingredient matches get 15% of their calculated score
            const avgScore = matchingIngredients > 0
                ? (totalIngredientScore / matchingIngredients) * 0.15
                : 10

            addScore(row.id, row.data, avgScore)
        })
    }

    // Step 5: Sort by score and format results
    if (recipeScores.size === 0) {
        // Generate suggestions when no results found
        const suggestions = await generateSearchSuggestions(searchTerms)
        return {
            "data": {
                "bases": config.velavida.bases,
                "searchRecipes": [],
                "suggestions": suggestions,
                "searchTerm": searchString
            }
        }
    }

    // Convert Map to array and sort by score (descending)
    const sortedRecipes = Array.from(recipeScores.entries())
        .sort((a, b) => b[1].score - a[1].score)
        .map(([id, { data }]) => ({
            id: id,
            name: data.name,
            link: data.link,
            course: data.course,
            difficulty: data.difficulty,
            cover: data.cover,
            tags: data.tags,
            lang: data.lang,
            food_ids: data.food_ids
        }))

    return {
        "data": {
            "bases": config.velavida.bases,
            "searchRecipes": sortedRecipes
        }
    }
}