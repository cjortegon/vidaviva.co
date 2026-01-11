const AWS = require('aws-sdk')
AWS.config.region = 'us-east-1'
const lambda = new AWS.Lambda({
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
})

function executeLambda(FunctionName, payload) {
    return new Promise((resolve, reject) => {
        var params = {
            FunctionName,
            Payload: JSON.stringify(payload)
        }
        lambda.invoke(params, function(err, data) {
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

function getPayload(method, event) {
    switch(method) {
        case 'GET':
            return event.queryStringParameters || {}
        default:
            return JSON.parse(event.body || "{}")
    }
}

exports.handler = async (event) => {
    const {httpMethod, path} = event
    const payload = {
        method: httpMethod.toLowerCase(),
        resource: (path || '//').substring(1),
        payload: getPayload(httpMethod, event),
    }
    const response = await executeLambda('VelaVida_Router', payload)
    return {
        statusCode: 200,
        body: JSON.stringify(response),
    }
}
