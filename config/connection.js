const mongoClient = require('mongodb').MongoClient
const state = {
    db: null
}

const onlineUrl = 'mongodb+srv://fysalkt:Faika123.@cluster0.yqgca.mongodb.net/grocery_delivery_system?retryWrites=true&w=majority'

module.exports.connect = function (done) {
    const url = 'mongodb://localhost:27017'
    const dbname = 'grocery_delivery_system'

    mongoClient.connect(url,{useUnifiedTopology: true},(err,data)=>{
    //mongoClient.connect(onlineUrl, { useUnifiedTopology: true }, (err, data) => {
        if (err) {
            return done(err)
        }
        else {
            state.db = data.db(dbname)
            done()
        }
    })
}

module.exports.get = function () {
    return state.db
}