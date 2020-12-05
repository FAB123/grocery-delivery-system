var db = require('../config/connection');
var collection = require('../config/collection');
const { ObjectID } = require('mongodb');

module.exports={
    addStore:(storeData)=>{
        return new Promise((resolve,reject)=>{
            if(!storeData.active){
                storeData.active='off'; 
            }
            db.get().collection(collection.STORE_COLLECTION).insertOne(storeData).then((data)=>{
                resolve(data.ops[0])
            })
        })
    },
    getAllstores:()=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.STORE_COLLECTION).find({active:'on'}).toArray().then((data)=>{
                resolve(data)
            })
        })
    },
    getBlockedstores:()=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.STORE_COLLECTION).find({active:'off'}).toArray().then((data)=>{
                resolve(data)
            })
        })
    },
    getAllstorename:()=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.STORE_COLLECTION).find({},{storename: 1 , address: 0}).toArray().then((data)=>{
                resolve(data)
            })
        })
    },
    getStoreDetails:(storeId)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.STORE_COLLECTION).findOne({_id:ObjectID(storeId)}).then((data)=>{
                resolve(data)
            })
        })
    },
    updateStoreDetailes:(storeId, storeData)=>{
        return new Promise((resolve,reject)=>{
            if(!storeData.active){
                storeData.active='off'; 
            }
            db.get().collection(collection.STORE_COLLECTION).updateOne({_id:ObjectID(storeId)},{
            $set:{
                storename:storeData.storename,
                companyname:storeData.companyname,
                address:storeData.address,
                mobile:storeData.mobile,
                vat_number:storeData.vat_number,
                active:storeData.active,
            }}).then((data)=>{
                resolve(data)
            })
        })
    },
    controlStore:(storeId, type)=>{
        return new Promise((resolve, reject)=>{
           db.get().collection(collection.STORE_COLLECTION).updateOne({_id:ObjectID(storeId)},{
               $set:{
                   active:type
               }
           }).then((data)=>{
               resolve(data)
           })
        })
    }
}