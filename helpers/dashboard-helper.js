const db = require("../config/connection");
const collection = require("../config/collection");
const { ObjectID } = require("mongodb");

module.exports = {
  getStoresdashboards: (storeID) => {
    return new Promise((resolve, reject) => {
      let getAllusers = new Promise((resolve, reject) => {
        db.get()
          .collection(collection.EMPLOYEE_COLLECTION)
          .aggregate([
            {
              $match: {
                store: ObjectID(storeID),
              },
            },
            {
              $count: "TotalUsers",
            },
          ])
          .toArray()
          .then((users) => {
            resolve(users[0]);
          })
          .catch((e) => {
            reject(e);
          });
      });

      let productReviews = new Promise((resolve, reject) => {
        db.get()
          .collection(collection.PRODUCT_REVIEW)
          .aggregate([
            {
              $match: {
                dealerId: ObjectID(storeID),
              },
            },
            {
              $lookup: {
                from: collection.PRODUCT_COLLECTION,
                localField: "prodId",
                foreignField: "_id",
                as: "products",
              },
            },
            {
              $project: {
                rating: 1,
                comment: 1,
                prodId: 1,
                productName: "$products.product_name",
              },
            },
            {
              $group: {
                _id: null,
                count: { $sum: 1 },
                items: {
                  $push: {
                    rating: "$rating",
                    comment: "$comment",
                    prodId: "$prodId",
                    productName: "$productName",
                  },
                },
              },
            },
          ])
          .toArray()
          .then((data) => {
            resolve(data[0]);
          })
          .catch((e) => {
            reject(e);
          });
      });

      let getAllproducts = new Promise((resolve, reject) => {
        db.get()
          .collection(collection.PRODUCT_COLLECTION_BY_STORE)
          .aggregate([
            {
              $match: {
                store: ObjectID(storeID),
              },
            },
            {
              $lookup: {
                from: collection.PRODUCT_COLLECTION,
                localField: "prodID",
                foreignField: "_id",
                as: "products",
              },
            },
            {
              $project: {
                products: { $arrayElemAt: ["$products", 0] },
                price: 1,
                qty: 1,
                prodID: 1,
              },
            },
            {
              $group: {
                _id: null,
                count: { $sum: 1 },
                items: {
                  $push: {
                    product_name: "$products.product_name",
                    price: "$price",
                    qty: "$qty",
                    prodID: "$prodID",
                  },
                },
              },
            },
          ])
          .toArray()
          .then((data) => {
            resolve(data[0]);
          })
          .catch((e) => {
            reject(e);
          });
      });

      let getAllOrders = new Promise((resolve, reject) => {
        db.get()
          .collection(collection.ORDER_COLLECTION)
          .aggregate([
            {
              $match: {
                dealerID: ObjectID(storeID),
              },
            },
            {
              $facet: {
                total: [{ $count: "total" }],
                pending: [
                  { $match: { Finished: {$ne: true} } },
                  { $count: "pending" },
                ],
                active: [
                  { $match: { Finished: true } }, 
                  { $count: "active" }],
              },
            },
            {
              $project: {
                active: { $arrayElemAt: ["$active.active", 0] },
                pending: { $arrayElemAt: ["$pending.pending", 0] },
                total: { $arrayElemAt: ["$total.total", 0] },
              },
            },
          ])
          .toArray()
          .then((data) => {
            resolve(data[0]);
          })
          .catch((e) => {
            reject(e);
          });
      });

      Promise.all([
        getAllusers,
        productReviews,
        getAllproducts,
        getAllOrders,
      ]).then((data) => {
        resolve({
          totalUsers: data[0],
          allFeedbacks: data[1],
          allProducts: data[2],
          allorders: data[3],
        });
      });
    });
  },
};
