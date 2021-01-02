const { response } = require("express");
const Razorpay = require("razorpay");
const userHelpers = require("../user-helpers");
const instance = new Razorpay({
  key_id: "rzp_test_zt63z5Weu5i5fx",
  key_secret: "MzS5F2YDMhbXnGPWNc3AsoF4",
});

const Moyasar = require('moyasar');
const moyasar = new Moyasar('sk_test_uwTgVzDyCMFGN2GtHucKqWj6LNeq8PEyLqFBzrJV');

const key_id = "rzp_test_zt63z5Weu5i5fx";
const key_secret = "MzS5F2YDMhbXnGPWNc3AsoF4";

module.exports = {
  getPaymentmethods: () => {
    methods = {
      cod: "Cash On Delivery",
      razorpay: "Online Transaction(Razorpay)",
      moyasar: "Online Transaction(Moyasar)",
    };
    return methods;
  },
  generateRazorpay: (orderID, amount) => {
    return new Promise((reslove, reject) => {
      var options = {
        amount: amount,
        currency: "INR",
        receipt: orderID,
      };
      instance.orders.create(options, function (err, order) {
        if (err) {
          reject();
        } else {
          reslove(order);
        }
      });
    });
  },
  razorpayVarifypayment:(data) => {
    return new Promise((reslove, reject)=>{
      const crypto = require("crypto");
      const hash = crypto
        .createHmac("sha256", key_secret)
        .update(data["payment[razorpay_order_id]"] + "|" + data["payment[razorpay_payment_id]"])
        .digest("hex");
      if (hash == data["payment[razorpay_signature]"]) {
        reslove();
      } else {
        console.log("error")
        reject();
      }
    })
  },
  varifyMoyasar:(uniqeId)=>{
    return new Promise((resolve, reject)=>{
      moyasar.payment.fetch(uniqeId).then(function (payment) {
        resolve(payment)
      });
    })
  }
};
