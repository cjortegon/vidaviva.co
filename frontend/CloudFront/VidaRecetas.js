const HOME = '/home.html'

function handler(event) {
    var request = event.request;
    var uri = request.uri;

    // Use index.html as default
    if (uri === '/' || uri === '') {
        request.uri = HOME;
        return request;
    }

    var normalizedUri = uri.endsWith('/') ? uri.slice(0, -1) : uri;
    var hasFileExtension = /\.[^\/]+$/.test(normalizedUri);
    if (hasFileExtension) {
        return request;
    }
    
    if (normalizedUri.startsWith('/receta/')) {
        request.uri = '/video.html';
        return request;
    }

    // Default
    request.uri = HOME;

    return request;
}
