var db = require("../config/connection");
var collections = require("../config/collection");
const { ObjectID } = require("mongodb");
const { response } = require("express");
const { getStoreDetails } = require("./store-helper");

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

  getAllProductbyStore: (storeId) => {
    console.log(storeId);
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collections.PRODUCT_COLLECTION_BY_STORE)
        .aggregate([
          {
            $match: {
              deleted: { $ne: true },
              price: { $ne: null },
              qty: { $ne: null },
              store: ObjectID(storeId),
              active: true,
            },
          },
          {
            $project: {
              _id: "$_id",
              store: 1,
              prodID: 1,
              price: 1,
              qty: 1,
              vat: 1,
              ribbon: 1,
              ribbonstyle: 1,
            },
          },
          {
            $lookup: {
              from: collections.PRODUCT_COLLECTION,
              let: { prodID: "$prodID" },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $and: [{ $eq: ["$_id", "$$prodID"] }],
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
              _id: "$details._id",
              category: "$details.category",
              shortdescription: "$details.shortdescription",
              product_name: "$details.product_name",
              store: 1,
              prodID: 1,
              price: 1,
              qty: 1,
              vat: 1,
              ribbon: 1,
              ribbonstyle: 1,
            },
          },
        ])
        .toArray()
        .then((data) => {
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

  getAllProduct20: (current_storeId, superUser) => {
    return new Promise(async (resolve, reject) => {
      db.get()
        .collection(collections.PRODUCT_COLLECTION)
        .aggregate([
          {
            //$match: { deleted: { $ne: true }, dealerId: getStoreDetailsbyuser(superUser, current_storeId)},
            $match: { deleted: { $ne: true }},
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
              _id: "$_id",
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
          console.log(data);
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
  getProductdetailesbyStore: (prodId, storeId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collections.PRODUCT_COLLECTION_BY_STORE)
        .findOne({ prodID: ObjectID(prodId), store: ObjectID(storeId) })
        .then((data) => {
          resolve(data);
        });
    });
  },
  addCategory: (category, user) => {
    catObj = {
      category: category,
      store: addCustomer(user),
    };
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collections.CATEGORY_COLLECTION)
        .insertOne(catObj)
        .then((data) => {
          resolve(data);
        });
    });
  },
  getAllCategory: (store) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collections.CATEGORY_COLLECTION)
        .find({ store: checkCustomer(store) })
        .toArray()
        .then((category) => {
          resolve(category);
        });
    });
  },
};

function checkCustomer(store) {
  return store == "null" ? { $ne: "null" } : ObjectID(store);
}

function addCustomer(customer){
  return customer == "null" ? false : ObjectID(customer);
}

function getStoreDetailsbyuser(superUser, dealerId){
  return superUser == 'yes' ? { $ne: "null" } : dealerId;
}