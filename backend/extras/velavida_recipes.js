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