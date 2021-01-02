var db = require("../config/connection");
var collections = require("../config/collection");
const bcrypt = require("bcrypt");
const { response } = require("express");

module.exports = {
  doSignup: (userData) => {
    return new Promise(async (resolve, reject) => {
      userData.password = await bcrypt.hash(userData.password, 10);
      db.get()
        .collection(collections.USER_COLLECTIONS)
        .insertOne(userData)
        .then((response) => {
          resolve(response.ops[0]);
        });
    });
  },
  doLogin: (userData) => {
    return new Promise(async (resolve, reject) => {
      db.get()
        .collection(collections.USER_COLLECTIONS)
        .findOne({
          $or: [{ mobile: userData.mobile }, { username: userData.mobile }],
        })
        .then((data) => {
          if (data) {
            bcrypt.compare(userData.password, data.password).then((result) => {
              if (result) {
                response.user = data;
                response.message = "login Success";
                response.status = true;
                resolve(response);
              } else {
                response.message = "Invalid Username / Password";
                response.status = false;
                resolve(response);
              }
            });
          } else {
            response.message = "Invalid Mobile / Password";
            response.status = false;
            resolve(response);
          }
        });
    });
  },
  validateRegistration: (data) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collections.USER_COLLECTIONS)
        .findOne({ $or: [{ mobile: data }, { username: data }] })
        .then((result) => {
          if (result) {
            resolve(true);
          } else {
            resolve(false);
          }
        });
    });
  },
};
