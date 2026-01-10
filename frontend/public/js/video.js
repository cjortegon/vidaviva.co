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

function loadVideo() {
    let link = document.getElementById('videolink').value
    if(link.endsWith('/')) {
        link = link.slice(0, -1)
    }
    if(link.includes('youtube')) {
        const ytParts = link.split('v=')
        if(ytParts.length > 1) {
            renderYoutube(ytParts[1])
        }
    } else if(link.includes('youtu.be')) {
        const ytParts = link.split('/')
        console.log('ytParts', ytParts)
        renderYoutube(ytParts[ytParts.length-1])
    } else if(link.includes('pinterest.com')) {
        renderPinterest(link)
    }
}
function renderYoutube(youtubeLink) {
    const videocard = document.getElementById('videocard')
    videocard.innerHTML = `<iframe width="100%" height="325" src="https://www.youtube.com/embed/${youtubeLink}" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`
}
function renderPinterest(link) {
    const videocard = document.getElementById('videocard')
    videocard.innerHTML = `<a data-pin-do="embedPin" data-pin-width="large" href="${link}"></a>`
}
