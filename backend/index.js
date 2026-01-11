var config = require('./config')
var vecciClient = require('./vidavivamain.js')

var AWS = null
var lambda = null
function getLambda() {
    if(lambda) return lambda
    if(!AWS) {
        AWS = require('aws-sdk')
        AWS.config.region = config.aws.region
    }
    lambda = new AWS.Lambda({
        signatureVersion: 'v4'
    })
    return lambda
}

const allowedPaths = [
    'client/vidaviva',
    'webhooks/vidaviva',
]
const moduleProxies = ['client', 'webhooks', 'auth', 'apps']
vecciClient.init(executeLambda)

// Lambda handler
exports.handler = async (event, context) => {
    const {method, resource} = event
    const splits = resource.split('/')
    const module = allowedPaths.indexOf(resource) != -1 ? resource
        : splits.length > 2 && moduleProxies.indexOf(splits[0]) != -1
        ? `${splits[0]}/${splits[1]}` : splits[0]
    let {payload, user, headers} = event
    headers = headers || {}
    const app_id = getAppId({headers, user, module})
    if(!app_id) {
        return {
            status: 0,
            httpStatus: 401,
            error: "Wrong host name or not related with an app_id from a valid Vecci client",
        }
    }
    return await vecciClient[method](resource, {
        ...payload,
        headers: {
            ...headers,
            app_id,
        },
    }, user)
}

function getAppId({headers, user, module}) {
    if(user) {
        if(user.app_id) return user.app_id
        if(user.is_webhook) {
            const p = module.split('/')
            if(p.length > 1) {
                return p[1]
            }
            return null
        }
    }
    const {Host, Authorization} = headers
    const arn = Host ? Host.split('.') : []
    const gateway = arn.length > 0 ? arn[0] : null
    if(gateway == config.defaultClient.gateway) {
        return config.defaultClient.app_id
    } else if(Authorization) {
        return Authorization.split(':').shift()
    } else {
        return null
    }
}

function executeLambda(FunctionName, payload) {
    return new Promise((resolve, reject) => {
        var params = {
            FunctionName,
            Payload: JSON.stringify(payload)
        }
        getLambda().invoke(params, function(err, data) {
            if (err) {
                resolve(null)
            } else {
                const {StatusCode, Payload} = data
                if(StatusCode == 200 && Payload) {
                    resolve(JSON.parse(Payload))
                }
            }
        })
    })
}
