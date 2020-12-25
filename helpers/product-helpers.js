var db = require("../config/connection");
var collections = require("../config/collection");
const { ObjectID } = require("mongodb");
const { response } = require("express");

module.exports = {
  addProduct: (product, callback) => {
    product.deleted = false;
    db.get()
      .collection(collections.PRODUCT_COLLECTION)
      .insertOne(product)
      .then((data) => {
        callback(data.ops[0]._id);
      });
  },
  // getAllProduct1: () => {
  //   return new Promise(async (resolve, reject) => {
  //     let products = await db
  //       .get()
  //       .collection(collections.PRODUCT_COLLECTION)
  //       .find({ deleted: { $ne: "yes" } })
  //       .toArray();
  //     resolve(products);
  //   });
  // },
  getAllProductbyStore: (store_id) => {
    console.log(store_id)
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collections.PRODUCT_COLLECTION)
        .aggregate([
          {
            $match: { deleted: { $ne: "yes" } },
          },
          {
            $project: {
              category: 1,
              shortdescription: 1,
              product_name: 1,
              description: 1,
              ribbon: 1,
              active: 1,
              _id: "$_id",
            },
          },
          {
            $lookup: {
              from: collections.PRODUCT_COLLECTION_BY_STORE,
              localField: "_id",
              foreignField: "prodID",
              as: "details",
            },
          },
          {
            $unwind: "$details",
          },
          {
            $project: {
              _id: 1,
              category: 1,
              shortdescription: 1,
              product_name: 1,
              active: "$details.active",
              store: "$details.store",
              price: "$details.price",
              qty: "$details.qty",
              ribbon: "$details.ribbon",
              ribbonstyle: "$details.ribbonstyle",
            },
          },
          {
            $match: { store: ObjectID(store_id), active: true },
          },
        ])
        .toArray()
        .then((data) => {
          console.log(data);
          resolve(data);
        });
    });
  },
  // getAllProduct: (current_storeId) => {
  //   return new Promise(async (resolve, reject) => {
  //     db.get()
  //       .collection(collections.PRODUCT_COLLECTION)
  //       .aggregate([
  //         {
  //           $match: { deleted: { $ne: "yes" } },
  //         },
  //         {
  //           $unwind: { path: "$products", preserveNullAndEmptyArrays: true },
  //         },
  //         {
  //           $project: {
  //             category: "$category",
  //             shortdescription: "$shortdescription",
  //             product_name: "$product_name",
  //             description: "$description",
  //             _id: {
  //               $toString: "$_id",
  //             },
  //           },
  //         },
  //         {
  //           $lookup: {
  //             from: collections.PRODUCT_COLLECTION_BY_STORE,
  //             localField: "_id",
  //             foreignField: "prodID",
  //             as: "details",
  //           },
  //         },
  //         {
  //           $unwind: "$details",
  //         },
  //         {
  //           $match: { "details.store": current_storeId },
  //         },
  //         {
  //           $project: {
  //             _id: "$_id",
  //             category: 1,
  //             shortdescription: 1,
  //             //description: "$description",
  //             product_name: 1,
  //             active: "$details.active",
  //             store: "$details.store",
  //           },
  //         },
  //       ])
  //       .toArray()
  //       .then((data) => {
  //         console.log(data);
  //         resolve(data);
  //       });
  //   });
  // },

  getAllProduct20: (current_storeId) => {
    return new Promise(async (resolve, reject) => {
      db.get()
        .collection(collections.PRODUCT_COLLECTION)
        .aggregate([
          {
            $match: { deleted: { $ne: true } },
          },
          {
            $unwind: { path: "$products", preserveNullAndEmptyArrays: true },
          },
          {
            $project: {
              category: "$category",
              shortdescription: "$shortdescription",
              product_name: "$product_name",
              description: "$description",
              _id: "$_id"
            },
          },
          {
            $lookup: {
              from: collections.PRODUCT_COLLECTION_BY_STORE,
              let: { id: "$_id", stores_id: ObjectID(current_storeId) },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $and: [
                        { $eq: ["$prodID", "$$id"] },
                        { $eq: ['$store', "$$stores_id"] }
                      ]
                    },
                  },
                },
              ],
              as: "details",
            },
          },
          {
            $unwind: { path: "$details", preserveNullAndEmptyArrays: true },
            //$unwind: "$details",
          },
          {
            $project: {
              _id: "$_id",
              category: 1,
              shortdescription: 1,
              description: "$description",
              product_name: 1,
              active: "$details.active",
              store: "$details.store",
              price: "$details.price",
            },
          },
        ])
        .toArray()
        .then((data) => {
          console.log(data)
          resolve(data);
        });
    });
  },

  updatePrice: (body, prodId) => {
    return new Promise(async (resolve, reject) => {
      let product = await db
        .get()
        .collection(collections.PRODUCT_COLLECTION_BY_STORE)
        .findOne({ prodID: ObjectID(prodId), store: ObjectID(body.storeId) });
      if (product) {
        db.get()
          .collection(collections.PRODUCT_COLLECTION_BY_STORE)
          .updateOne(
            { prodID: ObjectID(prodId), store: ObjectID(body.storeId) },
            {
              $set: {
                price: parseInt(body.price),
                qty: parseInt(body.qty),
                vat: parseInt(body.vat),
                ribbon: body.ribbon,
                ribbonstyle: body.ribbonstyle,
              },
            }
          )
          .then((data) => {
            resolve(data);
          });
      } else {
        db.get()
          .collection(collections.PRODUCT_COLLECTION_BY_STORE)
          .insertOne({
            store: ObjectID(body.storeId),
            prodID: ObjectID(prodId),
            price: body.price,
            qty: body.qty,
            vat: body.vat,
          })
          .then((data) => {
            resolve(data);
          });
      }
    });
  },
  getProductdetailes: (prodId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collections.PRODUCT_COLLECTION)
        .findOne(
          { _id: ObjectID(prodId) },
          { description: 1, shortdescription: 0 }
        )
        .then((data) => {
          resolve(data);
        });
    });
  },
  updateProduct: (productData) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collections.PRODUCT_COLLECTION)
        .updateOne(
          { _id: ObjectID(productData.id) },
          {
            $set: {
              product_name: productData.product_name,
              category: productData.category,
              shortdescription: productData.shortdescription,
              description: productData.description,
            },
          }
        )
        .then((data) => {
          resolve(data);
        });
    });
  },
  updateProdStatus: (data) => {
    return new Promise(async (resolve, reject) => {
      let state = data.state == "true" ? true : false;
      let product = await db
        .get()
        .collection(collections.PRODUCT_COLLECTION_BY_STORE)
        .findOne({ prodID: ObjectID(data.prodId), store: data.store });
      if (product) {
        db.get()
          .collection(collections.PRODUCT_COLLECTION_BY_STORE)
          .updateOne(
            { store: data.store, prodID: ObjectID(data.prodId) },
            {
              $set: {
                active: state,
              },
            }
          )
          .then((data) => resolve(data));
      } else {
        db.get()
          .collection(collections.PRODUCT_COLLECTION_BY_STORE)
          .insertOne({
            store: ObjectID(data.store),
            prodID: ObjectID(data.prodId),
            active: state,
          })
          .then((data) => resolve(data));
      }
    });
  },
  deleteProduct: (id) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collections.PRODUCT_COLLECTION)
        .updateOne(
          { _id: ObjectID(id) },
          {
            $set: {
              deleted: true,
            },
          }
        )
        .then((data) => {
          resolve(data);
        });
    });
  },
  getProductdetailesbyStore:(prodId, storeId)=>{
    return new Promise((resolve, reject)=>{
      db.get().collection(collections.PRODUCT_COLLECTION_BY_STORE).findOne({prodID:ObjectID(prodId), store:ObjectID(storeId)}).then((data)=>{
        resolve(data)
      })
    })
  }
};
