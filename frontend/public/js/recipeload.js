// Get recipe ID from URL query params
function getRecipeIdFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('id');
}

// Get recipe data from API
function getRecipe(id) {
    return fetch('https://gq3ykajn8g.execute-api.us-east-1.amazonaws.com/prod/client/vidavida/recipe?id=' + id, {
        headers: {
            'Authorization': 'a',
            'Accept': 'application/json'
        }
    })
    .then(response => response.json())
    .then(result => result.data)
}

// Course mappings
const courses = {
    breakfast: 'desayunos',
    main_course: 'principales',
    fast_food: 'comidarapida',
    salad: 'ensaladas',
    dessert: 'postres',
    cocktail: 'cocteleria',
    barista: 'barista',
}

// Build recipe info for rendering
function buildRecipeInfo(data) {
    const {bases, recipe} = data;
    const course = courses[recipe.course];
    const baseImage = '/';

    return {
        ...recipe,
        backLink: course ? '/' + course : '/',
        image: baseImage + recipe.cover,
        ingredients: recipe.ingredients.map(ingredient => {
            return {
                ...ingredient,
                image: baseImage + ingredient.image,
            }
        }),
        related: recipe.related.map(related => {
            return {
                name: related.name,
                link: '/receta/' + related.name.toLowerCase().split(' ').join('-') + '-' + related.id,
                image: baseImage + related.cover,
            }
        }),
    }
}

// Inject recipe data into the page
function injectRecipeData(info) {
    // Update title
    const titleElement = document.querySelector('.card-title.display-4');
    if (titleElement) {
        titleElement.innerHTML = info.name;
    }

    // Update main image
    const imageElement = document.querySelector('.card-img-top');
    if (imageElement) {
        imageElement.src = info.image;
        imageElement.alt = info.name;
    }

    // Update ingredients
    const ingredientsContainer = document.querySelector('.ingredients');
    if (ingredientsContainer && info.ingredients) {
        ingredientsContainer.innerHTML = info.ingredients
            .map(ingredient => '<li>' + ingredient.name + '</li>')
            .join('');
    }

    // Update video link
    const videoLinkInput = document.getElementById('videolink');
    if (videoLinkInput) {
        videoLinkInput.value = info.link || '';
    }

    // Update related recipes
    const relatedContainer = document.querySelector('.card-columns');
    if (relatedContainer && info.related) {
        relatedContainer.innerHTML = info.related.map(related => {
            return '<a href="' + related.link + '">' +
                '<div class="card card-pin">' +
                '<img class="card-img" src="' + related.image + '" alt="Card image">' +
                '<div class="overlay">' +
                '<h2 class="card-title title">' + related.name + '</h2>' +
                '</div>' +
                '</div>' +
                '</a>';
        }).join('');
    }

    // Update page title
    document.title = 'Vela Vida | ' + info.name;

    // Update Open Graph meta tags
    updateMetaTag('og:title', 'Vela Vida | ' + info.name);
    updateMetaTag('og:image', info.image);
    updateMetaTag('og:description', info.name + ' una receta de Vela Vida, conoce más descargando nuestra App.');
}

function updateMetaTag(property, content) {
    let meta = document.querySelector('meta[property="' + property + '"]');
    if (meta) {
        meta.setAttribute('content', content);
    }
}

// Load and inject recipe data on page load
(function() {
    const recipeId = getRecipeIdFromUrl();

    if (!recipeId) {
        console.error('No recipe ID found in URL');
        // window.location.href = '/';
        return;
    }

    getRecipe(recipeId)
        .then(data => {
            if (!data || !data.recipe) {
                console.error('Recipe not found');
                window.location.href = '/';
                return;
            }

            const info = buildRecipeInfo(data);
            injectRecipeData(info);
            console.log('Recipe loaded successfully:', info.name);
        })
        .catch(error => {
            console.error('Error loading recipe:', error);
            window.location.href = '/';
        });
})();
