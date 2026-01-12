// Configuration for API endpoints
// Automatically detects if running in development or production

(function() {
    // Detect environment based on hostname
    const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

    // Set API base URL based on environment
    if (isDevelopment) {
        window.API_BASE_URL = 'http://localhost:8000';
        console.log('🔧 Running in DEVELOPMENT mode');
        console.log('📡 API Base URL:', window.API_BASE_URL);
    } else {
        window.API_BASE_URL = 'https://gq3ykajn8g.execute-api.us-east-1.amazonaws.com/prod';
        console.log('🚀 Running in PRODUCTION mode');
    }
})();
