var db = require('../config/connection');
var collection = require('../config/collection');

module.exports={
    addStore:(storeData)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.STORE_COLLECTION).insertOne(storeData).then((data)=>{
                resolve(data.ops[0])
            })
        })
    },
    getAllstores:()=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.STORE_COLLECTION).find().toArray().then((data)=>{
                console.log(data)
                resolve(data)
            })
        })
    }
}