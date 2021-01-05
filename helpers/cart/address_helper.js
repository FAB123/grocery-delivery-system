const { Db, ObjectId } = require("mongodb");
const collection = require("../../config/collection");
const db = require("../../config/connection");
module.exports = {
  saveAddress: (address) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.USER_ADDRESS_COLLECTION)
        .insertOne(address)
        .then((data) => {
            resolve(data);
        });
    });
  },
  getAlladdressbyuser: (user) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.USER_ADDRESS_COLLECTION)
        .find({ user: user, deleted:{$ne:true} }).toArray()
        .then((data) => {
            resolve(data);
        });
    });
  },
  deleteAddress:(addressId)=>{
    return new Promise((resolve, reject)=>{
      db.get().collection(collection.USER_ADDRESS_COLLECTION).updateOne({_id:ObjectId(addressId)}, {$set:{
        deleted : true
      }}).then((data)=>{
        resolve()
      }).catch((err)=>{
        reject()
      })
    })
  }
};
