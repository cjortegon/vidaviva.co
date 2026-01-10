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
const baseUrl = 'https://3bvjulkoul.execute-api.us-east-1.amazonaws.com/prod'
let baseImage = ''

function loadRecipes() {
    const collection = document.getElementById('cards-collection');

    var xhr = new XMLHttpRequest();
    xhr.open("POST", baseUrl+'/graphql', true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.setRequestHeader('Authorization', 'a');
    const query = getQuery()
    xhr.send(JSON.stringify({api: 3, query: query.query}));
    xhr.onload = function() {
        try {
            const {data} = JSON.parse(this.responseText);
            console.log('response', data)
            const {bases} = data
            const recipes = data[query.collection]
            baseImage = bases.images
            collection.innerHTML = recipes
                .filter(function(recipe){return recipe.cover && recipe.cover.length > 0})
                .map(buildCard).join('')
        } catch(error) {
            console.log('error', error)
        }
    }
    
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
