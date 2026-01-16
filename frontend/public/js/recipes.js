let hasEngaged = false
let timeOpen = new Date()
let engageTimestamp = new Date()

class RecipesController {
    constructor() {
        this.baseUrl = (window.API_BASE_URL || 'https://gq3ykajn8g.execute-api.us-east-1.amazonaws.com/prod') + '/client/vidaviva'
        this.baseImage = '/'
        this.courses = {
            desayunos: 'breakfast',
            principales: 'main_course',
            comidarapida: 'fast_food',
            ensaladas: 'salad',
            postres: 'dessert',
            cocteleria: 'cocktail',
            barista: 'barista',
        }
    }
}
const recipes_controller = new RecipesController()

function loadRecipes() {
    const collection = document.getElementById('cards-collection');
    const searchTerm = getSearch();

    // Determine which endpoint to use based on search parameter
    let endpoint = '/recipes/random';
    if (searchTerm) {
        endpoint = '/recipes/search?s=' + encodeURIComponent(searchTerm);
    }

    fetch(recipes_controller.baseUrl + endpoint, {
            headers: {
                'Authorization': 'a'
            }
        })
        .then(response => response.json())
        .then(json => {
            const data = json.data
            console.log(JSON.stringify(json))
            // Both endpoints now return the same structure
            const recipes = data.randomRecipes || data.searchRecipes || []
            const suggestions = data.suggestions || []
            const searchedTerm = data.searchTerm || searchTerm
            // baseImage = data.bases.images || ''
            baseImage = '/'

            if (recipes.length === 0 && searchedTerm) {
                let html = '<div class="col-12 text-center mt-5">';
                html += '<div class="card" style="padding: 30px; max-width: 600px; margin: 0 auto;">';
                html += '<i class="fas fa-search" style="font-size: 3em; color: #999; margin-bottom: 15px;"></i>';
                html += '<h3 style="margin-bottom: 15px;">No se encontraron recetas</h3>';
                html += '<p style="color: #666; margin-bottom: 20px;">No hay resultados para: <strong>"' + searchedTerm + '"</strong></p>';

                if (suggestions && suggestions.length > 0) {
                    html += '<div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #dee2e6;">';
                    html += '<p style="color: #666; margin-bottom: 15px;">¿Quisiste decir?</p>';
                    html += '<div style="display: flex; flex-wrap: wrap; gap: 10px; justify-content: center;">';
                    suggestions.forEach(function(suggestion) {
                        html += '<a href="?s=' + encodeURIComponent(suggestion) + '" class="btn btn-primary" style="border-radius: 20px; padding: 8px 20px;">';
                        html += suggestion;
                        html += '</a>';
                    });
                    html += '</div>';
                    html += '</div>';
                }

                html += '</div>';
                html += '</div>';
                collection.innerHTML = html;
            } else {
                collection.innerHTML = recipes
                    .filter(function(recipe){return recipe.cover && recipe.cover.length > 0})
                    .map(buildCard).join('')
            }
        })
        .catch(error => {
            console.log('error', error)
        })
}

function getSearch() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('s')
}
function getCourse() {
    const path = window.location.pathname.toLowerCase().split('/')
    if(path.length > 1) {
        const name = path[1]
        const id = recipes_controller.courses[name]
        if(id) {
            return {
                id,
                name: getName(name),
            }
        }
    }
}
function getName(name) {
    switch(name) {
        case 'postres': return 'Póstres'
        case 'comidarapida': return 'Comida rápida'
    }
    return name.charAt(0).toUpperCase() + name.slice(1)
}
function getQuery() {
    const search = getSearch()
    if(search) {
        return {
            query: `{ bases{images}, searchRecipes(lang: "es", text: "${search}"){id,name,cover} }`,
            collection: 'searchRecipes',
        }
    }
    const course = getCourse()
    if(course) {
        document.getElementById('title').innerHTML = course.name
        return {
            query: `{ bases{images}, hotRecipes(lang: "es", course: "${course.id}"){id,name,cover} }`,
            collection: 'hotRecipes',
        }
    }
    return {
        query: `{ bases{images}, randomRecipes(lang: "es"){id,name,cover} }`,
        collection: 'randomRecipes',
    }
}
function buildCard(recipe) {
    return `<a href="/receta/${recipe.name.toLowerCase().split(' ').join('-')}-${recipe.id}">
        <div class="card card-pin">
            <img class="card-img" src="${baseImage}${recipe.cover}" alt="Card image">
            <div class="overlay">
                <h2 class="card-title title">${recipe.name}</h2>
            </div>
        </div>
    </a>`
}
