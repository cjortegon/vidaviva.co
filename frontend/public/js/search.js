// SearchController class to manage search-related configuration
class SearchController {
    constructor() {
        this.baseUrl = (window.API_BASE_URL || 'https://gq3ykajn8g.execute-api.us-east-1.amazonaws.com/prod') + '/client/vidavida'
    }

    // Search recipes via API
    searchRecipes(searchTerm) {
        if (!searchTerm || searchTerm.trim().length === 0) {
            return Promise.resolve([]);
        }

        return fetch(this.baseUrl + '/recipes/search?s=' + encodeURIComponent(searchTerm), {
            headers: {
                'Authorization': 'a',
                'Accept': 'application/json'
            }
        })
        .then(response => response.json())
        .then(result => result.data || [])
        .catch(error => {
            console.error('Search error:', error);
            return [];
        });
    }
}

const search_controller = new SearchController()

// Render search results
function renderSearchResults(recipes) {
    const resultsContainer = document.getElementById('search-results');

    if (!recipes || recipes.length === 0) {
        resultsContainer.innerHTML = '<div class="dropdown-item disabled">No se encontraron recetas</div>';
        resultsContainer.classList.add('show');
        return;
    }

    resultsContainer.innerHTML = recipes.map(recipe => {
        const recipeUrl = '/receta/' + recipe.name.toLowerCase().split(' ').join('-') + '-' + recipe.id;
        return '<a class="dropdown-item" href="' + recipeUrl + '">' +
            '<div class="d-flex align-items-center">' +
            '<img src="/' + recipe.cover + '" alt="' + recipe.name + '" style="width: 50px; height: 50px; object-fit: cover; margin-right: 10px; border-radius: 4px;">' +
            '<div>' +
            '<div class="font-weight-bold">' + recipe.name + '</div>' +
            '</div>' +
            '</div>' +
            '</a>';
    }).join('');
    resultsContainer.classList.add('show');
}

// Debounced search handler
let searchTimeout;
const searchInput = document.getElementById('search-input');

if (searchInput) {
    searchInput.addEventListener('input', function(e) {
        clearTimeout(searchTimeout);
        const searchTerm = e.target.value;

        if (!searchTerm || searchTerm.trim().length === 0) {
            const resultsContainer = document.getElementById('search-results');
            resultsContainer.innerHTML = '';
            resultsContainer.classList.remove('show');
            return;
        }

        searchTimeout = setTimeout(() => {
            search_controller.searchRecipes(searchTerm).then(results => {
                renderSearchResults(results);
            });
        }, 300); // Wait 300ms after user stops typing
    });

    // Close search results when clicking outside
    document.addEventListener('click', function(e) {
        const resultsContainer = document.getElementById('search-results');
        if (!searchInput.contains(e.target) && !resultsContainer.contains(e.target)) {
            resultsContainer.innerHTML = '';
            resultsContainer.classList.remove('show');
        }
    });

    // Keep results open when clicking inside
    searchInput.addEventListener('click', function(e) {
        e.stopPropagation();
        if (searchInput.value.trim().length > 0) {
            search_controller.searchRecipes(searchInput.value).then(results => {
                renderSearchResults(results);
            });
        }
    });
}
