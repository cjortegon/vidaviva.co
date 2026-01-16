// SearchController class to manage search-related configuration
class SearchController {
    constructor() {
        this.baseUrl = (window.API_BASE_URL || 'https://gq3ykajn8g.execute-api.us-east-1.amazonaws.com/prod') + '/client/vidavida'
    }

    // Search recipes via API
    searchRecipes(searchTerm) {
        if (!searchTerm || searchTerm.trim().length === 0) {
            return Promise.resolve({ data: [], suggestions: [] });
        }

        return fetch(this.baseUrl + '/recipes/search?s=' + encodeURIComponent(searchTerm), {
            headers: {
                'Authorization': 'a',
                'Accept': 'application/json'
            }
        })
        .then(response => response.json())
        .then(result => {
            return {
                data: result.data || [],
                suggestions: result.suggestions || [],
                searchTerm: result.searchTerm || searchTerm
            };
        })
        .catch(error => {
            console.error('Search error:', error);
            return { data: [], suggestions: [], searchTerm: searchTerm };
        });
    }
}

const search_controller = new SearchController()

// Render search results
function renderSearchResults(result) {
    const resultsContainer = document.getElementById('search-results');
    const recipes = result.data || [];
    const suggestions = result.suggestions || [];
    const searchTerm = result.searchTerm || '';

    if (!recipes || recipes.length === 0) {
        let html = '<div class="dropdown-item disabled" style="white-space: normal; padding: 15px;">';
        html += '<div style="margin-bottom: 10px;">';
        html += '<i class="fas fa-search" style="color: #999; margin-right: 8px;"></i>';
        html += '<strong>No se encontraron resultados para:</strong>';
        html += '</div>';
        html += '<div style="background-color: #f8f9fa; padding: 8px 12px; border-radius: 4px; margin-bottom: 10px; font-style: italic;">';
        html += '"' + searchTerm + '"';
        html += '</div>';

        if (suggestions && suggestions.length > 0) {
            html += '<div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid #dee2e6;">';
            html += '<div style="margin-bottom: 8px; color: #666; font-size: 0.9em;">¿Quisiste decir?</div>';
            html += '<div style="display: flex; flex-wrap: wrap; gap: 6px;">';
            suggestions.forEach(function(suggestion) {
                html += '<span class="suggestion-tag" style="background-color: #007bff; color: white; padding: 4px 10px; border-radius: 12px; cursor: pointer; font-size: 0.85em; transition: background-color 0.2s;" data-suggestion="' + suggestion + '">';
                html += suggestion;
                html += '</span>';
            });
            html += '</div>';
            html += '</div>';
        }
        html += '</div>';

        resultsContainer.innerHTML = html;
        resultsContainer.classList.add('show');

        // Add click handlers to suggestion tags
        const suggestionTags = resultsContainer.querySelectorAll('.suggestion-tag');
        suggestionTags.forEach(function(tag) {
            tag.addEventListener('click', function(e) {
                e.stopPropagation();
                const suggestion = this.getAttribute('data-suggestion');
                const searchInput = document.getElementById('search-input');
                if (searchInput) {
                    searchInput.value = suggestion;
                    search_controller.searchRecipes(suggestion).then(function(results) {
                        renderSearchResults(results);
                    });
                }
            });

            // Add hover effect
            tag.addEventListener('mouseenter', function() {
                this.style.backgroundColor = '#0056b3';
            });
            tag.addEventListener('mouseleave', function() {
                this.style.backgroundColor = '#007bff';
            });
        });
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

    // Handle Enter key - prevent clearing and trigger search
    searchInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            clearTimeout(searchTimeout);
            const searchTerm = searchInput.value;

            if (searchTerm && searchTerm.trim().length > 0) {
                search_controller.searchRecipes(searchTerm).then(results => {
                    renderSearchResults(results);
                });
            }
        }
    });
}
