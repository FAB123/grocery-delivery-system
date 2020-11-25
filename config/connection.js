const mongoClient=require('mongodb').MongoClient

module.exports.connect=function(done){
    const url='mongodb://localhost:27017'
    const dbname='grocery_delivery_system'
    const state={
        db:null
    }
    mongoClient.connect(url,(err,data)=>{
        if(err){
            return done(err)
        }
        else{
            state.db=data.db(dbname)
            done()
        }
    })
}

module.exports.get=function(){
    return state.db
}