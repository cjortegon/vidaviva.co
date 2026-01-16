// Use API_BASE_URL from config.js if available, otherwise fallback to production
const baseUrl = (window.API_BASE_URL || 'https://gq3ykajn8g.execute-api.us-east-1.amazonaws.com/prod') + '/client/vidavida'

// Search recipes via API
function searchRecipes(searchTerm) {
    if (!searchTerm || searchTerm.trim().length === 0) {
        return Promise.resolve({ data: [], suggestions: [], searchTerm: '' });
    }

    return fetch(baseUrl + '/recipes/search?s=' + encodeURIComponent(searchTerm), {
        headers: {
            'Authorization': 'a',
            'Accept': 'application/json'
        }
    })
    .then(response => response.json())
    .then(result => ({
        data: result.data || [],
        suggestions: result.suggestions || [],
        searchTerm: result.searchTerm || searchTerm
    }))
    .catch(error => {
        console.error('Search error:', error);
        return { data: [], suggestions: [], searchTerm: searchTerm };
    });
}

// Handle suggestion click
function handleSuggestionClick(suggestion) {
    const searchInput = document.getElementById('search-input');
    searchInput.value = suggestion;

    // Trigger search with the suggestion
    searchRecipes(suggestion).then(result => {
        renderSearchResults(result);
    });
}

// Render search results
function renderSearchResults(result) {
    const resultsContainer = document.getElementById('search-results');
    const recipes = result.data || [];
    const suggestions = result.suggestions || [];
    const searchTerm = result.searchTerm || '';

    if (recipes.length === 0) {
        // No results found - show better message with suggestions
        let html = '<div class="dropdown-item disabled" style="white-space: normal; padding: 15px;">';
        html += '<div style="margin-bottom: 10px;">';
        html += '<i class="fas fa-search" style="margin-right: 8px; color: #6c757d;"></i>';
        html += '<strong>No se encontraron resultados para:</strong> "' + searchTerm + '"';
        html += '</div>';

        if (suggestions.length > 0) {
            html += '<div style="margin-top: 12px;">';
            html += '<div style="color: #6c757d; font-size: 0.9em; margin-bottom: 8px;">Quizás quisiste buscar:</div>';
            html += '<div style="display: flex; flex-wrap: wrap; gap: 6px;">';

            suggestions.forEach(suggestion => {
                html += '<span class="badge badge-pill badge-primary" style="cursor: pointer; padding: 6px 12px; font-size: 0.85em;" ' +
                        'onclick="handleSuggestionClick(\'' + suggestion + '\')">' +
                        suggestion +
                        '</span>';
            });

            html += '</div></div>';
        }

        html += '</div>';
        resultsContainer.innerHTML = html;
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
            searchRecipes(searchTerm).then(result => {
                renderSearchResults(result);
            });
        }, 300); // Wait 300ms after user stops typing
    });

    // Handle Enter key - keep text in search box
    searchInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault(); // Prevent default form submission
            const searchTerm = e.target.value;

            if (searchTerm && searchTerm.trim().length > 0) {
                clearTimeout(searchTimeout);
                searchRecipes(searchTerm).then(result => {
                    renderSearchResults(result);
                });
            }
        }
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
            searchRecipes(searchInput.value).then(result => {
                renderSearchResults(result);
            });
        }
    });
}
