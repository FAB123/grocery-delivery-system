var db = require('../config/connection');
var collection = require('../config/collection');
const { ObjectID } = require('mongodb');

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
                resolve(data)
            })
        })
    },
    getBlockedstores:()=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.STORE_COLLECTION).find({active:false}).toArray().then((data)=>{
                resolve(data)
            })
        })
    },
    getAllstorename:()=>{
        return new Promise(async(resolve,reject)=>{
            let stores = await db.get().collection(collection.STORE_COLLECTION).find({active:true},{projection:{ active: 0, vat_number: 0 }}).toArray()
            resolve(stores)         
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
            db.get().collection(collection.STORE_COLLECTION).updateOne({_id:ObjectID(storeId)},{
            $set:{
                storename:storeData.storename,
                companyname:storeData.companyname,
                address:storeData.address,
                mobile:storeData.mobile,
                vat_number:storeData.vat_number,
            }}).then((data)=>{
                resolve(data)
            })
        })
    },
    controlStore:(storeId, type)=>{
        return new Promise((resolve, reject)=>{
            type = type == "true" ? true : false;
           db.get().collection(collection.STORE_COLLECTION).updateOne({_id:ObjectID(storeId)},{
               $set:{
                   active:type
               }
           }).then((data)=>{
               resolve(data)
           })
        })
    },
    getAllstorenamebylocation:()=>{
        return new Promise(async(resolve,reject)=>{
            let stores = await db.get().collection(collection.STORE_COLLECTION).find({active:true},{projection: { active: 0, address: 0, mobile: 0,vat_number: 0 }}).toArray()
            resolve(stores)         
        })
    },
}