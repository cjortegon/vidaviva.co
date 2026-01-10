var config = require('../../config')

var AWS = require('aws-sdk')
AWS.config.region = config.aws.region
var sqs = new AWS.SQS({apiVersion: '2012-11-05'})

exports.sendToSQS = (messages, delayed) => {
    delayed = delayed || 0
    return new Promise((resolve) => {
        const params = {
            Entries: messages.map(m => {
                return {
                    Id: createHash(),
                    DelaySeconds: delayed,
                    MessageAttributes: {},
                    MessageBody: typeof m === "string" ? m : JSON.stringify(m),
                }
            }),
            QueueUrl: config.aws.sqs_queue,
        }
        sqs.sendMessageBatch(params, (error, data) => {
            if(error) {
                console.log('error', error)
                resolve(false)
            } else {
                resolve(true)
            }
        })
    })
}
const createHash = () => {
    var dt = new Date().getTime();
    var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = (dt + Math.random()*16)%16 | 0;
        dt = Math.floor(dt/16);
        return (c=='x' ? r :(r&0x3|0x8)).toString(16);
    });
    return uuid;
}
