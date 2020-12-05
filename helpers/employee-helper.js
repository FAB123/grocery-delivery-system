var db = require("../config/connection");
var collection = require("../config/collection");
var bcrypt = require("bcrypt");
const { response } = require("express");

module.exports = {
  clearDb: () => {
    return new Promise(async (resolve, reject) => {
      pwd = await bcrypt.hash("123", 10);
      userData = {
        username: "admin",
        password: pwd,
        firstname: "Fysal",
        lastname: "KT",
        mobile: "530829178",
      };
      db.get()
        .collection(collection.EMPLOYEE_COLLECTION)
        .insertOne(userData)
        .then((data) => {
          resolve(data.ops[0]);
        });
    });
  },
  createEmployee: (employeeData) => {
    return new Promise(async (resolve, reject) => {
      delete employeeData.confirm_password;
      employeeData.mobile = employeeData.mobile.replace("-", "");
      employeeData.password = await bcrypt.hash(employeeData.password, 10);
      resolve();
      db.get()
        .collection(collection.EMPLOYEE_COLLECTION)
        .insertOne(employeeData)
        .then((data) => {
          resolve(data);
        });
    });
  },
  validateRegistration: (data) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.EMPLOYEE_COLLECTION)
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
  getAllemployee: () => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.EMPLOYEE_COLLECTION)
        .find()
        .toArray()
        .then((data) => {
          resolve(data);
        });
    });
  },
  doLogin: (userData) => {
    return new Promise(async (resolve, reject) => {
      let loginStatus = false;
      let response = {};
      let employee = await db
        .get()
        .collection(collection.EMPLOYEE_COLLECTION)
        .findOne({
          $or: [{ mobile: userData.mobile }, { username: userData.mobile }],
        });
      if (employee) {
        bcrypt.compare(userData.password, employee.password).then((status) => {
          if (status) {
            response.status = true;
            response.employee = employee;
            resolve(response);
          } else {
            response.status = false;
            response.message = "invalid Password";
            resolve(response);
          }
        });
      } else {
        response.status = false;
        response.message = "invalid Mobile Number";
        resolve(response);
      }
    });
  },
};
