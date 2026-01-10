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
    velavida: {
        bases: {
            images: 'https://s3.amazonaws.com/velavida-images/'
        }
    }
}
