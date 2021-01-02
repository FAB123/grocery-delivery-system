const db = require("../../config/connection");
const collection = require("../../config/collection");
var ObjectID = require("mongodb").ObjectID;
const { ObjectId } = require("mongodb");
const { response } = require("express");

module.exports = {
  placeOrder: (order, cartData, total) => {
    return new Promise((resolve, reject) => {
      let status = order.paymentMethod === "cod" ? "Order Placed" : "Pending";
      newOrder = {
        addressID: ObjectID(order.address),
        dealerID: ObjectID(cartData.dealerID),
        userID: ObjectID(cartData.user),
        orderDate: new Date(),
        paymentMethod: order.paymentMethod,
        orderStatus: [{time:new Date(), "status":status}],
        totalAmount: total,
        products: cartData.products,
      };
      db.get()
        .collection(collection.ORDER_COLLECTION)
        .insertOne(newOrder)
        .then((data) => {
          db.get()
            .collection(collection.CART_COLLECTIONS)
            .updateOne({ _id: cartData._id }, { $set: { deleted: true } });
          resolve(data.ops[0]._id.toString());
        });
    });
  },
  updateOrderstatus: (orderID, status) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.ORDER_COLLECTION)
        .updateOne(
          { _id: ObjectId(orderID) },
          { $push: { orderStatus: {time:new Date(), "status":status} } }
        )
        .then(() => {
          resolve();
        });
    });
  },
  getAllorderItem: (userId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.ORDER_COLLECTION)
        .aggregate([
          {
            $match: { userID: ObjectID(userId) },
          },
          {
            $project: {
              _id: 1,
              orderDate: 1,
              addressID: 1,
              paymentMethod: 1,
              orderStatus: 1,
              lastStatus: { $arrayElemAt: [ "$orderStatus", -1 ] },
              totalAmount: 1,
              dealerID: 1,
            },
          },
          {
            $lookup: {
              from: collection.STORE_COLLECTION,
              localField: "dealerID",
              foreignField: "_id",
              as: "stores",
            },
          },
          {
            $project: {
              _id: 1,
              orderDate: 1,
              addressID: 1,
              paymentMethod: 1,
              orderStatus: 1,
              totalAmount: 1,
              lastStatus: 1,
              dealerID: 1,
              storename: "$stores.storename",
              storecompany: "$stores.companyname",
            },
          },
        ])
        .toArray()
        .then((data) => {
          resolve(data);
        });
    });
  },
  getAllorderItembystore: (storeId, method) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.ORDER_COLLECTION)
        .aggregate([
          {
            $match: {
              dealerID: ObjectID(storeId),
              Finished: orderFinished(method),
            },
          },
          {
            $project: {
              _id: 1,
              orderDate: 1,
              addressID: 1,
              paymentMethod: 1,
              orderStatus: 1,
              lastStatus: { $arrayElemAt: [ "$orderStatus", -1 ] },
              totalAmount: 1,
              Finished: 1,
              dealerID: 1,
            },
          },
          {
            $lookup: {
              from: collection.STORE_COLLECTION,
              localField: "dealerID",
              foreignField: "_id",
              as: "stores",
            },
          },
          {
            $project: {
              _id: 1,
              orderDate: 1,
              addressID: 1,
              paymentMethod: 1,
              orderStatus: 1,
              lastStatus: 1,
              totalAmount: 1,
              Finished: 1,
              dealerID: 1,
              storename: "$stores.storename",
              storecompany: "$stores.companyname",
            },
          },
        ])
        .toArray()
        .then((data) => {
          resolve(data);
        });
    });
  },
  selectStatus: () => {
    return ["Out For Delivery", "Return", "Deliverd"];
  },
  getProductdetailes: (orderId, callback) => {
    // db.get().collection(collection.ORDER_COLLECTION).findOne({_id:ObjectID(orderId)}).then((data)=>{
    //   callback(data.products)
    // })
    db.get()
      .collection(collection.ORDER_COLLECTION)
      .aggregate([
        {
          $match: { _id: ObjectId(orderId) },
        },
        {
          $unwind: "$products",
        },
        {
          $project: {
            _id: 1,
            dealerID: 1,
            item: "$products.item",
            quantity: "$products.quantity",
          },
        },
        {
          $lookup: {
            from: collection.PRODUCT_COLLECTION_BY_STORE,
            let: { item: "$item", stores_id: "$dealerID" },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ["$prodID", "$$item"] },
                      { $eq: ["$store", "$$stores_id"] },
                    ],
                  },
                },
              },
            ],
            as: "details",
          },
        },
        {
          $unwind: "$details",
        },
        {
          $project: {
            _id: 1,
            dealerID: 1,
            item: 1,
            quantity: 1,
            price: "$details.price",
            vat: "$details.vat",
          },
        },
        {
          $lookup: {
            from: collection.PRODUCT_COLLECTION,
            localField: "item",
            foreignField: "_id",
            as: "basic",
          },
        },
        {
          $project: {
            _id: 1,
            dealerID: 1,
            item: "$basic.product_name",
            quantity: 1,
            price: 1,
            vat: 1,
          },
        },
      ])
      .toArray()
      .then((data) => {
        callback(data);
      });
  },
  getOrderedProductStatus:(orderId, callback)=>{
     db.get().collection(collection.ORDER_COLLECTION).aggregate([
       {
         $match:{_id: ObjectID(orderId)}
       },
       {
         $project:{
           addressID:1,
           orderStatus:1,
           lastStatus: { $arrayElemAt: [ "$orderStatus", -1 ] },
         }
       },
       {
         $lookup:{
           from:collection.USER_ADDRESS_COLLECTION,
           localField:"addressID",
           foreignField:"_id",
           as:"address"
         }
       },
       {
         $project:{
           addressID:1,
           orderStatus:1,
           lastStatus: 1,
           address:"$address",
         }
       }
     ]).toArray().then((orderStatus)=>{
       //console.log(orderStatus);
       callback(orderStatus[0]);
     })
  },
  getOrderedasFinished:(orderId)=>{
    console.log(orderId)
      return new Promise((reslove, reject)=>{
        db.get().collection(collection.ORDER_COLLECTION).updateOne({_id:ObjectID(orderId)}, {$set:{Finished:true}, $push: { orderStatus: {time:new Date(), "status":"Order Finished"} }}).then((result)=>{
          reslove(result)
        })
      })
  },
  calculateOrdertotalbyorderID: (orderId) => {
    console.log(orderId)
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.ORDER_COLLECTION)
        .aggregate([
          {
            $match: { _id: ObjectID(orderId) },
          },
          {
            $unwind: "$products",
          },
          {
            $project: {
              _id: 1,
              dealerID: 1,
              item: "$products.item",
              quantity: "$products.quantity",
            },
          },
          {
            $lookup: {
              from: collection.PRODUCT_COLLECTION_BY_STORE,
              let: { item: "$item", stores_id: "$dealerID" },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $and: [
                        { $eq: ["$prodID", "$$item"] },
                        { $eq: ["$store", "$$stores_id"] },
                      ],
                    },
                  },
                },
              ],
              as: "details",
            },
          },
          {
            $unwind: "$details",
          },
          {
            $group: {
              _id: null,
              total: { $sum: { $multiply: ["$quantity", "$details.price"] } },
            },
          },
        ])
        .toArray()
        .then((cartTotal) => {
          resolve(cartTotal[0].total);
        });
    });
  },
};

function orderFinished(method) {
  return method == "Finished" ? true : { $ne: true };
}
