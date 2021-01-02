var db = require("../config/connection");
var collection = require("../config/collection");
var bcrypt = require("bcrypt");
const { response } = require("express");
const { ObjectID } = require("mongodb");

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
      employeeData.store = ObjectID(employeeData.store);
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
  // getAllemployee: () => {
  //   return new Promise((resolve, reject) => {
  //     db.get()
  //       .collection(collection.EMPLOYEE_COLLECTION)
  //       .find()
  //       .toArray()
  //       .then((data) => {
  //         resolve(data);
  //       });
  //   });
  // },
  getAllemployee:(storeId = null)=>{
    return new Promise((resolve,reject)=>{
      db.get().collection(collection.EMPLOYEE_COLLECTION).aggregate([
        { "$match": { store: checkStoreId(storeId)}},
        {
          $lookup:{
            from: collection.STORE_COLLECTION,
            localField:"store",
            foreignField:"_id",
            as:"store"
          }
        },
        {
          $project:{
            _id:1,
            username:1,
            firstname:1,
            lastname:1,
            mobile:1,
            supper_user:1,
            active:1,
            storename:"$store.storename",
            companyname:"$store.companyname"
          }
        }

      ]).toArray().then((data)=>{
        resolve(data)
      })
    })
  },
  doLogin: (userData) => {
    return new Promise(async (resolve, reject) => {
      let loginStatus = false;
      let response = {};
      let employee = await db
        .get()
        .collection(collection.EMPLOYEE_COLLECTION)
        .findOne({
          $or: [{ mobile: userData.mobile, active:true }, { username: userData.mobile, active:true }],
        });
      if (employee) {
        bcrypt.compare(userData.password, employee.password).then(async(status) => {
          if (status) {
            response.status = true;
            response.employee = employee;
            if(response.employee.store){
              storedata = await db.get().collection(collection.STORE_COLLECTION).findOne({_id:ObjectID(response.employee.store)})
              response.employee.storedata = storedata;
            }
            resolve(response);
          } else {
            response.status = false;
            response.message = "User Blocked or invalid Mobile Number/Username";
            resolve(response);
          }
        });
      } else {
        response.status = false;
        response.message = "User Blocked or invalid Mobile Number/Username";
        resolve(response);
      }
    });
  },

  getEmployeeDetails: (employeeId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.EMPLOYEE_COLLECTION)
        .findOne({ _id: ObjectID(employeeId) })
        .then((data) => {
          resolve(data);
        });
    });
  },
  updateEmployeeDetailes: (employeeId, employeeData) => {
    return new Promise(async(resolve, reject) => {
      employeeData.password = await bcrypt.hash(employeeData.password, 10);
      // if (!employeeData.active) {
      //   employeeData.active = false;
      // }
      // else
      // {
      //   employeeData.active = true;
      // }
      //employeeData.active = employeeData.active == "on" ? true : false;
      employeeData.store = ObjectID(employeeData.store);
      db.get()
        .collection(collection.EMPLOYEE_COLLECTION)
        .updateOne(
          { _id: ObjectID(employeeId) },
          {
            $set: {
              username: employeeData.username,
              password: employeeData.password,
              firstname: employeeData.firstname,
              lastname: employeeData.lastname,
              mobile: employeeData.mobile,
              store: employeeData.store,
            },
          }
        )
        .then((data) => {
          resolve(data);
        });
    });
  },
  controlEmployee: (employeeId, type) => {
    return new Promise((resolve, reject) => {
      type = type == "true" ? true : false;
      db.get()
        .collection(collection.EMPLOYEE_COLLECTION)
        .updateOne(
          { _id: ObjectID(employeeId) },
          {
            $set: {
              active: type,
            },
          }
        )
        .then((data) => {
          resolve(data);
        });
    });
  },
};

function checkStoreId(storeId){
  return storeId ? ObjectID(storeId) : {$ne:'nothing'}
}