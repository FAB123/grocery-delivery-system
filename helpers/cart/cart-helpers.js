const { response } = require("express");
const collection = require("../../config/collection");
const db = require("../../config/connection");
var objectId = require("mongodb").ObjectID;

module.exports = {
  addTocart: (prodID, dealerID, userId) => {
    proObj = {
      item: objectId(prodID),
      quantity: 1,
    };
    return new Promise(async (resolve, reject) => {
      let cartExist = await db
        .get()
        .collection(collection.CART_COLLECTIONS)
        .findOne({
          user: objectId(userId),
          dealerID: objectId(dealerID),
          deleted: { $ne: true },
        });
      if (cartExist) {
        let prodExist = cartExist.products.findIndex(
          (product) => product.item == prodID
        );
        if (prodExist != -1) {
          db.get()
            .collection(collection.CART_COLLECTIONS)
            .updateOne(
              {
                "products.item": objectId(prodID),
                user: objectId(userId),
                dealerID: objectId(dealerID),
                deleted: { $ne: true },
              },
              {
                $inc: { "products.$.quantity": 1 },
              }
            )
            .then(() => {
              resolve();
            });
        } else {
          db.get()
            .collection(collection.CART_COLLECTIONS)
            .updateOne(
              {
                user: objectId(userId),
                dealerID: objectId(dealerID),
                deleted: { $ne: true },
              },
              {
                $push: { products: proObj },
              }
            )
            .then((response) => {
              resolve(response);
            });
        }
      } else {
        let cartObj = {
          user: objectId(userId),
          dealerID: objectId(dealerID),
          products: [proObj],
        };
        db.get()
          .collection(collection.CART_COLLECTIONS)
          .insertOne(cartObj)
          .then((response) => {
            resolve(response);
          });
      }
    });
  },

  editCart: (data) => {
    return new Promise(async (resolve, reject) => {
      let cartExist = await db
        .get()
        .collection(collection.CART_COLLECTIONS)
        .findOne({
          _id: objectId(data.cartID),
        });
      if (cartExist) {
        let prodExist = cartExist.products.findIndex(
          (product) => product.item == data.prodID
        );
        if (prodExist != -1) {
          db.get()
            .collection(collection.CART_COLLECTIONS)
            .updateOne(
              {
                "products.item": objectId(data.prodID),
              },
              {
                $set: { "products.$.quantity": parseInt(data.qty) },
              }
            )
            .then(() => {
              resolve({ status: true });
            });
        } else {
          reject();
        }
      } else {
        reject();
      }
    });
  },
  clearAllcartItem: (userId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.CART_COLLECTIONS)
        .deleteMany({ user: objectId(userId) })
        .then((data) => {
          resolve(data);
        });
    });
  },

  getAllitems: (userId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.CART_COLLECTIONS)
        .aggregate([
          {
            $match: { user: objectId(userId) },
          },
          {
            $unwind: "$products",
          },
          {
            $project: {
              item: "$products.item",
              quantity: "$products.quantity",
            },
          },
          {
            $lookup: {
              from: collection.PRODUCT_COLLECTION,
              localField: "item",
              foreignField: "_id",
              as: "product",
            },
          },
          {
            $project: {
              item: 1,
              quantity: 1,
              products: 1,
              product: "$product",
            },
          },
          {
            $lookup: {
              from: collection.PRODUCT_COLLECTION_BY_STORE,
              localField: "item",
              foreignField: "prodID",
              as: "cartItems1",
            },
          },
          {
            $project: {
              item: 1,
              quantity: 1,
              cartItems: {
                $arrayElemAt: ["$cartItems1", 0],
              },
              product: {
                $arrayElemAt: ["$product", 0],
              },
            },
          },
        ])
        .toArray()
        .then((cartItems) => {
          resolve(cartItems);
        });
    });
  },

  getAllcartItem: (userId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.CART_COLLECTIONS)
        .aggregate([
          {
            $match: { user: objectId(userId), deleted: { $ne: true } },
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
              from: collection.PRODUCT_COLLECTION,
              localField: "item",
              foreignField: "_id",
              as: "product",
            },
          },
          {
            $project: {
              cartID: "$_id",
              dealerID: 1,
              quantity: 1,
              item: 1,
              product_name: "$product.product_name",
              product_description: "$product.description",
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
              cartID: 1,
              dealerID: 1,
              quantity: 1,
              item: 1,
              product_name: 1,
              product_description: 1,
              storename: "$stores.storename",
              storecompany: "$stores.companyname",
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
              cartID: 1,
              dealerID: 1,
              storename: { $arrayElemAt: ["$storename", 0] },
              storecompany: { $arrayElemAt: ["$storecompany", 0] },
              product: {
                item: "$item",
                product_description: {
                  $arrayElemAt: ["$product_description", 0],
                },
                quantity: "$quantity",
                product_name: { $arrayElemAt: ["$product_name", 0] },
                price: "$details.price",
                vat: "$details.vat",
                total: { $multiply: ["$quantity", "$details.price"] },
              },
            },
          },
          {
            $group: {
              _id: "$dealerID",
              cartItems: {
                $push: {
                  dealerID: "$dealerID",
                  cartID: "$cartID",
                  storename: "$storename",
                  storecompany: "$storecompany",
                  product: "$product",
                },
              },
            },
          },
        ])
        .toArray()
        .then((data) => {
          console.log(data);
          resolve(data);
        });
    });
  },
  getCarttotal: (userId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.CART_COLLECTIONS)
        .aggregate([
          {
            $match: { user: objectId(userId) },
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
  calculateCarttotalbystore: (userId, store) => {
    return new Promise((resolve, reject) => {
      console.log(userId + " store " + store);
      db.get()
        .collection(collection.CART_COLLECTIONS)
        .aggregate([
          {
            $match: {
              user: objectId(userId),
              dealerID: objectId(store),
              deleted: { $ne: true },
            },
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
          if (cartTotal.length > 0) {
            resolve(cartTotal[0].total);
          } else {
            resolve(0);
          }
        });
    });
  },
  calculateCarttotalbycartID: (cartID) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.CART_COLLECTIONS)
        .aggregate([
          {
            $match: { _id: objectId(cartID) },
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
  getProductfromCart: (cartID) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.CART_COLLECTIONS)
        .findOne({ _id: objectId(cartID) })
        .then((data) => {
          resolve(data);
        });
    });
  },
};
