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
    return {
        "data": {
            "bases": {
                "images": "https://s3.amazonaws.com/velavida-images/"
            },
            "randomRecipes": [
                {
                    "id": "123",
                    "name": "Ensalada César",
                    "cover": "recipes/ensalada-cesar.jpg"
                },
                {
                    "id": "456",
                    "name": "Pancakes de Avena",
                    "cover": "recipes/pancakes.jpg"
                }
            ]
        }
    }
}

exports.getRecipeDetails = async (data) => {
    const {recipeId} = data
    return {
        "data": {
            "bases": {
                "images": "https://s3.amazonaws.com/velavida-images/"
            },
            "recipe": {
                "id": "123",
                "name": "Ensalada César",
                "link": "https://youtube.com/watch?v=...",
                "course": "salad",
                "cover": "recipes/ensalada-cesar.jpg",
                "ingredients": [
                    {"name": "Lechuga", "image": "ingredients/lechuga.jpg"},
                    {"name": "Pollo", "image": "ingredients/pollo.jpg"}
                ],
                "related": [
                    {"id": "789", "name": "Ensalada Griega", "cover": "recipes/griega.jpg", "kind": "salad"}
                ]
            }
        }
    }
}