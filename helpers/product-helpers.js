var db = require("../config/connection");
var collections = require("../config/collection");
const { ObjectID } = require("mongodb");

module.exports = {
  addProduct: (product, callback) => {
    db.get()
      .collection(collections.PRODUCT_COLLECTION)
      .insertOne(product)
      .then((data) => {
        callback(data.ops[0]._id);
      });
  },
  getAllProduct: () => {
    return new Promise(async (resolve, reject) => {
      let products = await db
        .get()
        .collection(collections.PRODUCT_COLLECTION)
        .find({ deleted: { $ne: "yes" } })
        .toArray();
      resolve(products);
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
  deleteProduct: (id) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collections.PRODUCT_COLLECTION)
        .updateOne(
          { _id: ObjectID(id) },
          {
            $set: {
              deleted: "yes",
            },
          }
        )
        .then((data) => {
          resolve(data);
        });
    });
  },
};
