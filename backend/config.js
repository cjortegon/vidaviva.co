'use strict'

module.exports = {
    defaultClient: {
        app_id: 'velavida',
        gateway: 'gq3ykajn8g',
    },
    db: {
        host: process.env.DATABASE_APPS1_ENDPOINT,
        user: "mountainreacher",
        password: process.env.DATABASE_APPS1_PASSWORD,
        database: 'kobapp'
    },
    ai: {
        dataOwner: 'cjortegon@gmail.com',
        openAI: process.env.OPENAI_KEY,
        chatGPTModel: 'gpt-4o',
    },
    velavida: {
        bases: {
            images: 'https://s3.amazonaws.com/velavida-images/'
        }
    }
}
