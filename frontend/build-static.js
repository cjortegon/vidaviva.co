const fs = require('fs');
const path = require('path');
const pug = require('pug');

// Create html directory if it doesn't exist
const htmlDir = path.join(__dirname, 'html');
if (!fs.existsSync(htmlDir)) {
    fs.mkdirSync(htmlDir, { recursive: true });
}

// Default metadata for static pages
const default_og = {
    title: "Vela Vida | Come y vive mejor",
    type: "app",
    image: "/seo/og20200604.jpg",
    description: "Más de 300 recetas para preparar con los ingredientes que tienes en casa.",
    url: "http://www.velavida.co/"
};

const default_twitter = {
    card: 'summary',
    site: '@velavidaoficial',
    title: "Vela Vida",
    image: "/seo/og20200604_rect.jpg",
    description: "Más de 300 recetas para preparar con los ingredientes que tienes en casa."
};

// Build home.html
console.log('Building home.html...');
const homeTemplate = pug.compileFile(path.join(__dirname, 'views/home.pug'));
const homeHtml = homeTemplate({
    og: default_og,
    twitter: default_twitter,
    query: {}
});
fs.writeFileSync(path.join(htmlDir, 'home.html'), homeHtml);
console.log('✓ home.html created');

// Build video.html with placeholder data
console.log('Building video.html...');
const videoTemplate = pug.compileFile(path.join(__dirname, 'views/video.pug'));
let videoHtml = videoTemplate({
    og: default_og,
    twitter: default_twitter,
    query: {},
    info: {
        name: 'Loading...',
        image: '/seo/og20200604.jpg',
        link: '',
        ingredients: [],
        related: []
    }
});

// Inject recipeload.js AFTER video.js
videoHtml = videoHtml.replace(
    '<script src="/js/video.js"></script>',
    '<script src="/js/video.js"></script><script src="/js/recipeload.js"></script>'
);

// Remove the inline loadVideo() call since recipeload.js will call it
videoHtml = videoHtml.replace('<script>loadVideo()</script>', '');

fs.writeFileSync(path.join(htmlDir, 'video.html'), videoHtml);
console.log('✓ video.html created');

console.log('\nStatic HTML files generated successfully in /frontend/html/');
