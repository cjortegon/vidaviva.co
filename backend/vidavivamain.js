var config = require('./config')
var {DatabseConnection} = require('./extras/other/database')
const db = new DatabseConnection({
    ...config.db,
    database: 'velavida'
})

// Sub-modules
const recipes = require('./extras/velavida_recipes')

const UNAUTHORIZED = {status: 0, error: "Unauthorized"}

let execute = null
let executeLambda = null
let executeInternal = null
exports.init = (lambda) => {
    execute = (query, params) => {
        return db.execute(query, params)
    }
    executeLambda = lambda
    executeInternal = new InternalExecuter(lambda, "kobapp_router")

    // Submodules
    let modules = [
        recipes,
    ]
    modules.forEach(m => {
        try { m.init(execute, executeLambda, executeInternal) } catch(e) {
            console.log(e)
        }
    })
}

const GET_PROFILE = `SELECT u.data->>'name' as name FROM "users" u where u.email=$1`
const GET_USERS = `SELECT * FROM "users" u LIMIT $1 OFFSET $2`
const FILTER_PRODUCTS = `SELECT id FROM products
WHERE data->>'sku' ilike $1 or data->>'name' ilike $1 or data->>'description' ilike $1`

exports.get = async (resource, payload, user) => {
    switch(resource) {
        case 'client/vidaviva/recipes/random':
            return await recipes.loadRecipes(payload)
        case 'client/vidaviva/recipe':
            return await recipes.getRecipeDetails(payload)
        case 'client/vidaviva/profile':
            if(!user || !user.email) { return }
            return await getProfile({
                ...payload,
                email: user.email,
            })
        case 'client/vidaviva/products':
            return {}
        case 'client/vidaviva/products/search':
            return await searchDefault(payload, FILTER_PRODUCTS)
        case 'client/vidaviva/users':
            if(!user || !user.email) { return }
            if(await getRole(payload, user) != 'superadmin') { return {status: 0, error: "Unauthorized"} }
            return await getUsers(payload)
        default:
            return {}
    }
}

function getProfile(payload, query) {
    const {email} = payload
    let db = new DatabseConnection({
        ...config.db,
        database: (payload.headers || {}).app_id,
    })
    return db.execute(query || GET_PROFILE, [email])
    .then(response => {
        return new Promise(resolve => {
            resolve(response.rows.pop() || {name: ''})
        })
    })
}
function getRole(payload, user) {
    const app_id = (payload.headers || {}).app_id
    return getProfile({
        ...payload,
        email: user.email,
    }, `SELECT u.data FROM "users" u where u.email=$1`)
    .then(response => {
        let apps = ((response.data || {}).apps || []).filter(a => a.id == app_id)
        const app = apps.length > 0 ? apps[0] : null
        if(!app) return new Promise((resolve) => resolve(null))
        return new Promise((resolve) => resolve(app.role))
    })
}

function searchDefault(payload, query) {
    let {text} = payload
    if(!text) {
        return new Promise(resolve => {
            resolve({data: [], error: 'Search is empty'})
        })
    } else {
        let db = new DatabseConnection({
            ...config.db,
            database: (payload.headers || {}).app_id,
        })
        return db.execute(query, [`%${text.toLowerCase()}%`])
        .then(response => {
            return new Promise(resolve => {
                if(response.rows.length > 0) {
                    resolve({data: (response.rows || []).map(v => v.id)})
                } else {
                    resolve({data: [], error: 'No results for serch: '+text})
                }
            })
        })
    }
}

function getUsers(payload) {
    let {limit, offset} = payload
    limit = limit || 50
    offset = offset || 0
    let db = new DatabseConnection({
        ...config.db,
        database: (payload.headers || {}).app_id,
    })
    return db.execute(GET_USERS, [limit, offset])
    .then(response => {
        return new Promise(resolve => resolve({
            status: 1,
            data: response.rows.map(r => {
                r.data.apps = undefined
                let row = {
                    ...r,
                    ...r.data,
                }
                row.data = undefined
                return row
            }),
        }))
    })
}

async function sendResponse(response, analytics) {
    await analytics.sendReport(db)
    previousEvents = analytics.trackings
    return response
}

async function overrideUser(payload, user) {
    const {headers} = payload
    if(!user || !user.email || user.app_id != 'vecci' || !headers || headers.app_id != 'vecci') {
        return user
    }
    let app_override = headers.App_override || headers.app_override
    if(!app_override) return user
    const userDB = (await db.execute(`SELECT "data" FROM "users" WHERE email=$1`, [user.email])).rows.pop()
    if(!userDB || !userDB.data || !userDB.data.apps) return user
    const app = (userDB.data.apps || []).filter(a => a.id == 'vecci').pop()
    if(app && app.role == 'admin' || app.role == 'superadmin') {
        return {
            ...user,
            app_id: app_override,
            mock: true,
            role: 'admin'
        }
    }
    return user
}

class InternalExecuter {
    constructor(lambdaHandler, routerName) {
        this.handler = lambdaHandler
        this.router = routerName
    }
    get = async (resource, payload, user) => {
        return await this.handler(this.router, {
            method: 'get',
            resource,
            payload,
            headers: payload.headers || {},
            user,
        })
    }
    post = async (resource, payload, user) => {
        return await this.handler(this.router, {
            method: 'post',
            resource,
            payload,
            user,
        })
    }
    put = async (resource, payload, user) => {
        return await this.handler(this.router, {
            method: 'put',
            resource,
            payload,
            user,
        })
    }
    delete = async (resource, payload, user) => {
        return await this.handler(this.router, {
            method: 'delete',
            resource,
            payload,
            user,
        })
    }
}
