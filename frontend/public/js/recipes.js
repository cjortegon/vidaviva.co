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
            // For search results, data is an array directly, for random it's nested
            const recipes = Array.isArray(data) ? data : (data.randomRecipes || [])
            // baseImage = data.bases.images || ''
            baseImage = '/'

            if (recipes.length === 0 && searchTerm) {
                collection.innerHTML = '<div class="col-12 text-center mt-5"><h3>No se encontraron recetas para "' + searchTerm + '"</h3></div>';
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
