'use strict'

module.exports = {
    defaultClient: {
        app_id: 'vecci',
        gateway: '449gwidd80',
    },
    db: {
        host: process.env.DATABASE_APPS1_ENDPOINT,
        user: "mountainreacher",
        password: process.env.DATABASE_APPS1_PASSWORD,
        database: 'kobapp'
    },
    aws: {
        region: 'us-east-1',
        bucket: 'kobapp.clients',
        sqs_queue: 'https://sqs.us-east-1.amazonaws.com/487401175418/kobapp_queue'
    },
    ai: {
        dataOwner: 'cjortegon@gmail.com',
        openAI: process.env.OPENAI_KEY,
        chatGPTModel: 'gpt-4o', //'gpt-4o-mini', 'o3-mini',
    },
    telegram: {
        token: process.env.KOBAPP_TELEGRAM_TOKEN,
    },
    resend: {
        vecciToken: process.env.RESEND_VECCI,
    },
    vecci: {
        topics: {
            admin: 'vecci-vadmin',
            frontdesk: 'vecci-vfrontdesk'
        },
        db_model: 'pruebasvecci',
        chat_id: '326763992',
        authorizedEmail: 'cjortegon@gmail.com',
        infoEmail: 'info@vecci.co',
        secret: process.env.VECCI_SECRET,
        enableQRHashGeneration: true, // Feature flag for QR hash generation
        whatsapp: {
            accountSid: process.env.VECCI_WHATSAPP_SID,
            authToken: process.env.VECCI_WHATSAPP_TOKEN,
            sender: process.env.VECCI_WHATSAPP_SENDER,
        },
        firebaseServiceAccount: JSON.parse(Buffer.from(process.env.VECCI_FIREBASE, 'base64').toString()),
    },
    velavida: {
        bases: {
            images: 'https://s3.amazonaws.com/velavida-images/'
        }
    }
}
