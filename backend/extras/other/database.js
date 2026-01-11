var pg = require('pg')

class DatabseConnection {
    constructor(config) {
        this.pool = null
        this.dbError = null
        this.dbConfig = {
            user: config.user,
            database: config.database,
            password: config.password,
            host: config.host,
            port: 5432,
            max: 10,
            idleTimeoutMillis: 20000,
            ssl: {
                rejectUnauthorized: false
            }
        }
        this.analytics = null
        this.queryTime = 0
    }

    connect(done) {
        if(this.pool == null) {
            this.pool = new pg.Pool(this.dbConfig)
        }
        done()
    }

    ready() {
        return new Promise((resolve, _) => {
            this.connect(() => {
                resolve(this)
            })
        })
    }

    query(mode, query, params) {
        this.dbError = null
        return new Promise((resolve, reject) => {
            this.pool.connect(function(err, client, done) {
                if(err) {
                    console.error('error fetching client from pool', err)
                    reject(err)
                }
                try {
                    client.query(query, params, function(err1, result) {
                        // Release connection
                        if(mode) {
                            client.release(true)
                        } else {
                            done()
                        }
                        if(err1) {
                            reject(err1)
                        } else {
                            resolve(result)
                        }
                    })
                } catch(exception) {
                    reject(exception)
                }
            })
        })
    }

    execute(query, params) {
        return new Promise((resolve, reject) => {
            this.connect(() => {
                this.queryTime = new Date().getTime()
                this.query(true, query, params)
                .then(result => {
                    if(!result) {
                        console.log('[DB Error] database='+((this.dbConfig || {}).database || '(empty)'))
                        this._sendError()
                    }
                    resolve(result || {rowCount: 0, rows: []})
                })
                .catch(error => {
                    console.log('[DB Error]', error)
                    this.dbError = error
                    this._sendError()
                    resolve({rows: [], rowCount: 0})
                })
            })
        })
    }

    getQueryTime = () => {
        if(!this.queryTime) return 0
        return new Date().getTime() - this.queryTime
    }

    _sendError = () => {
        try {
            this.analytics.trackError(null, {subcategory: 'postgres'})
        } catch(_) {}
    }
}

module.exports = {
    DatabseConnection: DatabseConnection
}
