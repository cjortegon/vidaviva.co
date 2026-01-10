var dev = false

// Libraries
const fs = require('fs')
const path = require('path')
const https = require('https')
const express = require('express')
const superagent = require('superagent')
const bodyParser = require('body-parser')
const cors = require('cors')

// Starting express
var app = express()
app.set('view engine', 'pug')
app.get('*.gz', function (req, res, next) {
	res.set('Content-Encoding', 'gzip')
	next()
})
app.use(express.static('public'))
app.use(bodyParser.json())
app.use(cors())

const baseUrl = 'https://3bvjulkoul.execute-api.us-east-1.amazonaws.com/prod'

// Facebook
const pixels = require('./pixels')

// Default metadata
let default_og = {
	title: "Vela Vida | Come y vive mejor",
	type: "app",
	image: "/seo/og20200604.jpg",
	description: "Más de 300 recetas para preparar con los ingredientes que tienes en casa.",
	url: "http://www.velavida.co/"
}
let default_twitter = {
	card: 'summary',
	site: '@velavidaoficial',
	title: "Vela Vida",
	image: "/seo/og20200604_rect.jpg",
	description: "Más de 300 recetas para preparar con los ingredientes que tienes en casa."
}

app.get('/descargar', function(req, res) {
	res.render('download', {
		og: default_og,
		twitter: default_twitter,
		stores: {
			android: 'https://play.google.com/store/apps/details?id=com.mountainreacher.vela_vida&hl=es',
			ios: 'https://apps.apple.com/co/app/vela-vida/id1494649235?l=es',
		},
		facebook: {
			pixel: pixels.getPixelId(req.query)
		},
	})
})

// Bot
const telegramToken = process.env.VELA_TELEGRAM_TOKEN
app.post(`/bot/${telegramToken}`, function(req, res) {
	console.log('[post]', req.body)
	res.send(true)
})

// Mountain reacher
app.get('/contratos', (req, res) => {
	fs.readFile('./public/blog/contratos.md', 'utf8', function(err, contents) {
		res.render('md-document', {
			article: contents,
			og: default_og,
			twitter: default_twitter,
			profile: {
				img: 'https://miro.medium.com/fit/c/120/120/1*5XWyv1KZmgcT9Cq5C8dXXw.jpeg',
				name: 'Camilo Ortegón',
				date: '2020-9-2',
			}
		})
	})
})

app.get(['/receta/:recipe'], function(req, res) {
	const parts = req.params.recipe.split('-')
	const id = parts[parts.length-1]
	if(isNaN(id)) {
		res.redirect('/?s='+parts.join(' '))
		return
	}
	getRecipe(id)
	.then(data => {
		if(!data || !data.recipe) {
			res.redirect('/?s='+parts.join(' '))
		} else {
			const info = buildRecipeInfo(data)
			fastRender(req, res, 'video', info)
		}
	})
	.catch(error => {
		res.redirect('/')
	})
})
function getRecipe(id) {
	return new Promise((resolve, reject) => {
		superagent
		.get('https://gq3ykajn8g.execute-api.us-east-1.amazonaws.com/prod/client/vidaviva/recipe')
		.query({id: id})
		.set('Authorization', 'a')
		.set('accept', 'json')
		.end((error, response) => {
			if(error) {
				reject()
			} else {
				resolve(JSON.parse(response.text).data)
			}
		})
	})
}
const courses = {
	breakfast: 'desayunos',
    main_course: 'principales',
    fast_food: 'comidarapida',
    salad: 'ensaladas',
    dessert: 'postres',
    cocktail: 'cocteleria',
    barista: 'barista',
}
function buildRecipeInfo(data) {
	const {bases,recipe} = data
	const course = courses[recipe.course]
	// const baseImage = bases.images || ''
	const baseImage = '/'
	return {
		...recipe,
		backLink: course ? '/'+course : '/',
		image: `${baseImage}${recipe.cover}`,
		ingredients: recipe.ingredients.map(ingredient => {
			return {
				...ingredient,
				image: `${baseImage}${ingredient.image}`,
			}
		}),
		related: recipe.related.map(related => {
			return {
				name: related.name,
				link: `/receta/${related.name.toLowerCase().split(' ').join('-')}-${related.id}`,
				image: `${baseImage}${related.cover}`,
			}
		}),
	}
}

let fastPaths = [
	'/',
	'/:a',
	'/:a/:b',
	'/:a/:b/:c',
]
app.get(fastPaths, function(req, res) {
	fastRender(req, res, 'home')
})

function fastRender(req, res, view, info) {
	const {og, twitter} = buildOpenGraphWithInfo(info)
	res.render(view, {
		info: info ? info : {},
		og,
		twitter,
		query: req.query,
	})
}
function buildOpenGraphWithInfo(info) {
	if(info) {
		return {
			og: {
				title: `Vela Vida | ${info.name}`,
				type: "app",
				image: info.image,
				description: `${info.name} una receta de Vela Vida, conoce más descargando nuestra App.`,
				url: "http://www.velavida.co/"
			},
			twitter: {
				card: 'summary',
				site: '@velavidaoficial',
				title: `Vela Vida | ${info.name}`,
				image: info.image,
				description: "Conoce más recetas descargando nuestra App."
			}
		}
	} else {
		return {
			og: default_og,
			twitter: default_twitter,
		}
	}
}

const port = 3004
if(!dev) {
	app.listen(port, function(err) {
		if(err) return console.log('Hubo un error'), process.exit(1)
		console.log('VelaVida-landing escuchando en el puerto '+port)
	})
} else {
	// *** HTTPS localhost ***
	const certOptions = {
		key: fs.readFileSync(path.resolve('ssl/cert/server.key')),
		cert: fs.readFileSync(path.resolve('ssl/cert/server.crt'))
	}
	var server = https.createServer(certOptions, app).listen(port, function(err) {
		if(err) return console.log('Hubo un error'), process.exit(1)
		console.log('VelaVida-TEST escuchando en https://localhost:'+port)
	})
}
