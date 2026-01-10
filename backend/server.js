var express = require('express')
var bodyParser = require('body-parser')
var cors = require('cors')

// Starting express
var app = express()
app.use(bodyParser.json())
app.use(cors())

// Modules
const router = require('./index')
let paths = [
    '/:a/',
    '/:a/:b',
    '/:a/:b/:c',
    '/:a/:b/:c/:d',
    '/:a/:b/:c/:d/:e',
    '/:a/:b/:c/:d/:e/:f',
]

app.get(paths, async function(req, res) {
    console.log(`[GET] ${req.path}`)
    console.log(JSON.stringify({method: 'get', resource: req.path.substr(1), payload: req.query, ...commonInfo(req)}))
    const response = await router.handler({method: 'get', resource: req.path.substr(1), payload: req.query, ...commonInfo(req)})
    res.send(response)
})
app.post(paths, async function(req, res) {
    console.log(`[POST] ${req.path}`)
    const response = await router.handler({method: 'post', resource: req.path.substr(1), payload: req.body, ...commonInfo(req)})
    res.send(response)
})
app.put(paths, async function(req, res) {
    console.log(`[PUT] ${req.path}`)
    const response = await router.handler({method: 'put', resource: req.path.substr(1), payload: req.body, ...commonInfo(req)})
    res.send(response)
})
app.delete(paths, async function(req, res) {
    console.log(`[DELETE] ${req.path}`)
    const response = await router.handler({method: 'delete', resource: req.path.substr(1), payload: req.body, ...commonInfo(req)})
    res.send(response)
})

const port = 8000
app.listen(port, function(err) {
    if(err) return console.log('Error'), process.exit(1)
    console.log('Vecci Router listening in '+port)
})

function commonInfo(req) {
    const user = getUser(req)
    const headers = transformHeaders(req.headers)
    let common = {
        stage: "prod",
        headers,
        user,
    }
    return common
}
function transformHeaders(headers) {
    let h = {}
    Object.keys(headers).map((k) => {
        h[k.charAt(0).toUpperCase() + k.slice(1)] = headers[k]
    })
    return h
}
function getUser(req) {
    let hostStr = req.headers.host || ''
    if(hostStr.split(':')[0] != 'localhost') {
        return null
    }
    return {
        email: 'cjortegon@gmail.com',
        app_id: 'vidaviva'
    }
}
