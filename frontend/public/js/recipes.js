let hasEngaged = false
let timeOpen = new Date()
let engageTimestamp = new Date()

const courses = {
    desayunos: 'breakfast',
    principales: 'main_course',
    comidarapida: 'fast_food',
    ensaladas: 'salad',
    postres: 'dessert',
    cocteleria: 'cocktail',
    barista: 'barista',
}
// Use API_BASE_URL from config.js if available, otherwise fallback to production
const baseUrl = (window.API_BASE_URL || 'https://gq3ykajn8g.execute-api.us-east-1.amazonaws.com/prod') + '/client/vidaviva'
let baseImage = ''

function loadRecipes() {
    const collection = document.getElementById('cards-collection');
    const searchTerm = getSearch();

    // Determine which endpoint to use based on search parameter
    let endpoint = '/recipes/random';
    if (searchTerm) {
        endpoint = '/recipes/search?s=' + encodeURIComponent(searchTerm);
    }

    fetch(baseUrl + endpoint, {
            headers: {
                'Authorization': 'a'
            }
        })
        .then(response => response.json())
        .then(json => {
            const data = json.data
            const suggestions = json.suggestions || []
            console.log(JSON.stringify(json))
            // For search results, data is an array directly, for random it's nested
            const recipes = Array.isArray(data) ? data : (data.randomRecipes || [])
            // baseImage = data.bases.images || ''
            baseImage = '/'

            if (recipes.length === 0 && searchTerm) {
                let html = '<div class="col-12 text-center mt-5">';
                html += '<div class="card" style="max-width: 600px; margin: 0 auto; padding: 30px;">';
                html += '<i class="fas fa-search" style="font-size: 3em; color: #6c757d; margin-bottom: 20px;"></i>';
                html += '<h3 style="margin-bottom: 15px;">No se encontraron resultados</h3>';
                html += '<p style="color: #6c757d; margin-bottom: 20px;">No encontramos recetas para: <strong>"' + searchTerm + '"</strong></p>';

                if (suggestions.length > 0) {
                    html += '<div style="margin-top: 20px;">';
                    html += '<p style="color: #6c757d; margin-bottom: 12px;">¿Quizás quisiste buscar?</p>';
                    html += '<div style="display: flex; flex-wrap: wrap; justify-content: center; gap: 10px;">';

                    suggestions.forEach(function(suggestion) {
                        html += '<a href="?s=' + encodeURIComponent(suggestion) + '" class="badge badge-pill badge-primary" style="padding: 8px 16px; font-size: 1em; text-decoration: none;">' +
                                suggestion +
                                '</a>';
                    });

                    html += '</div></div>';
                }

                html += '</div></div>';
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
        const id = courses[name]
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
