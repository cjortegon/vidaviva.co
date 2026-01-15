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

    // Use a Set to track unique recipe IDs
    const recipeIds = new Set()

    // Step 2: Search by recipe name
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

    nameResult.rows.forEach(row => recipeIds.add(row.id))

    // Step 3: Search by recipe tags
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

    tagsResult.rows.forEach(row => recipeIds.add(row.id))

    // Step 4: Search by ingredient names and synonyms
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
        `SELECT data->>'id' as food_id
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

        recipesWithIngredientsResult.rows.forEach(row => recipeIds.add(row.id))
    }

    // Step 5: Get full recipe data for all matched IDs
    if (recipeIds.size === 0) {
        return {
            "data": []
        }
    }

    const finalResult = await execute(
        `SELECT id, data
         FROM recipes
         WHERE id = ANY($1)`,
        [Array.from(recipeIds)]
    )

    // Format response
    const recipes = finalResult.rows.map(row => ({
        id: row.id,
        name: row.data.name,
        link: row.data.link,
        course: row.data.course,
        difficulty: row.data.difficulty,
        cover: row.data.cover,
        tags: row.data.tags,
        lang: row.data.lang,
        food_ids: row.data.food_ids
    }))

    return {
        "data": recipes
    }
}