const superagent = require('superagent')
const config = require("../../config")

const TELEGRAM_USERS = [
    '326763992',    //Camilo
    '991505045',    //Santiago
    '1076505082',   //Duvan
    '6052812706',   //Harold
]

// Modules
const modules = {
}

let execute = null
let executeLambda = null
let executeInternal = null
exports.init = (executeFunction, lambdaFunction, internalFunction) => {
    execute = executeFunction
    executeLambda = lambdaFunction
    executeInternal = internalFunction
    Object.keys(modules).forEach(key => {
        modules[key].init(executeFunction, lambdaFunction, internalFunction, sendTelegramMessage)
    })
}

exports.post = async (resource, payload, user) => {
    switch(resource) {
        case 'telegram/send':
            return await sendTelegramMessage(user, payload)
    }
    const parts = resource.split('/')
    if(parts.length > 1) {
        const telegramToken = parts[1]
        if(telegramToken == `bot${config.telegram.token}`) {
            try {
                await executeTelegram(payload)
            } catch(error) {
                console.log(error)
            }
            return true
        } else {
            return false
        }
    }
    return {}
}

exports.sendMessage = (chat_id, text) => {
    try {
        const authorizedUser = {
            email: config.kobapp.authorizedEmail,
            chat_id,
        }
        return sendTelegramMessage(authorizedUser, {chat_id, text})
    } catch {
        return {status: 0}
    }
}

async function sendTelegramMessage(user, payload) {
    let {chat_id, text} = payload
    if(!chat_id || !text) {
        return {status: 0, error: "Missing information"}
    }
    if(!user || !user.email || user.email != config.kobapp.authorizedEmail) {
        return {status: 0, error: "Unauthorized"}
    }
    const url = `https://api.telegram.org/bot${config.telegram.token}/sendMessage`
    if(typeof chat_id === 'string') {
        const parts = chat_id.trim().split(',').filter(p => p)
        if(parts.length > 1) {
            chat_id = parts
        }
    }
    if(Array.isArray(chat_id)) {
        for(let i = 0; i < chat_id.length; i++) {
            await fetchPost(url, {
                chat_id: chat_id[i],
                parse_mode: 'HTML',
                text,
            })
        }
    } else {
        await fetchPost(url, {
            chat_id,
            parse_mode: 'HTML',
            text,
        })
    }
    return {status: 1}
}

function fetchPost(url, body) {
    return new Promise((resolve, _) => {
        superagent
        .post(url)
        .send(body)
        .set('Content-Type', 'application/json')
        .then(response => {
            resolve(response.body)
        })
        .catch(error => {
            resolve(null)
            console.error(error)
        })
    })
}

async function executeTelegram(payload) {
    const {text, from} = payload.message
    const parts = text.toLowerCase().split(' ')
    console.log(parts)
    if(from && from.id && TELEGRAM_USERS.indexOf(from.id) != -1) {
        const mod = modules[parts[0]]
        if(mod) {
            await mod.executeMessage(parts, from)
        } else {
            await sendTelegramMessage(from.id, "Unknown action: "+text)
        }
    } else {
        switch(parts[0]) {
            case "/start":
                await noticeAboutTelegramAdmin(from)
                break
        }
    }
}

async function noticeAboutTelegramAdmin(user) {
    if(TELEGRAM_USERS.indexOf(user.id) != -1) return
    const result = await executeLambda('VelaVida_Firebase', {
        method: 'post',
        ref: 'telegram',
        payload: {
            user,
            timestamp: (new Date()).getTime(),
        },
    })
    console.log(result)
}
