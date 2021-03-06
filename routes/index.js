var express = require("express");
var router = express.Router();
const imageHelpers = require("../helpers/image-helpers");
const productHelpers = require("../helpers/product-helpers");
const userHelpers = require("../helpers/user-helpers");
var otpGenerator = require("otp-generator");
var store_helper = require("../helpers/store-helper");
var sms_helper = require("../helpers/messaging_helper");
var geoHelper = require("../helpers/geo_helper");
var cartHelper = require("../helpers/cart/cart-helpers");
var addressHelpers = require("../helpers/cart/address_helper");
var paymentHelpers = require("../helpers/payment/payment-method");
const cartHelpers = require("../helpers/cart/cart-helpers");
const orderTransactions = require("../helpers/payment/order-transactions");
const IndexContoller = require('../helpers/index_controller');
const handlebarHelper = require("../helpers/handlebarHelper");
const siteUrl = "https://grocery.ahcjed.com/";

const company = "Balsam Laundary";

var userData;

/* GET home page. */
router.get("/", commonData(), IndexContoller.list, async (req, res, next) => {
  let carousel = await imageHelpers.carouselImages();
  productHelpers
    .getAllProductbyStore(req.session.defaultStore)
    .then((products) => {
      res.render("main/index", {
        products,
        admin: false,
        carousel,
        user: req.session.dataTouser,
      });
    });
});

/* render about page*/
router.get("/about", commonData(), (req, res) => {
  res.render("main/about", {
    admin: false,
    user: req.session.dataTouser,
  });
})

/* render contact page */
router.get("/contact", (req, res) => {
  res.render("main/contact", {
    admin: false,
    user: req.session.dataTouser,
  });
})

/*render individual product detailes */
router.get("/detailes/:id", commonData(), (req, res) => {
  productHelpers.getProductdetailes(req.params.id).then(async (data) => {
    let carouselImages = await imageHelpers.productcarouselImages(
      req.params.id
    );
    res.render("main/detailes", {
      data,
      admin: false,
      user: req.session.dataTouser,
      carouselImages,
    });
  });
});

/*render login page*/
router.get("/login", commonData(), function (req, res) {
  if (req.session.loggedIn) {
    userRoute = req.session.userRoute ? req.session.userRoute : "/";
    res.redirect(userRoute);
  } else {
    res.render("main/login", { admin: false, user: req.session.dataTouser });
  }
});

/*valdate login credentials*/

router.post("/login", function (req, res) {
  userHelpers.doLogin(req.body).then((response) => {
    if (response.status) {
      req.session.loggedIn = true;
      req.session.user = response.user;
      response.userRoute = req.session.userRoute ? req.session.userRoute : "/";
      res.json(response);
      req.session.userRoute = false;
    } else {
      res.json(response);
    }
  });
});

/*change store*/
router.post("/change_store", async (req, res) => {
  req.session.defaultStore = req.body.store;
  if (req.session.defaultStore == req.body.store) {
    req.session.dataTouser = { defaultStore: req.session.defaultStore };
    storeData = await store_helper.getStoreDetails(req.session.defaultStore);
    req.session.dataTouser = { storeData: storeData };
    res.json({ response: true });
  } else {
    res.json({ response: false });
  }
});

/*user signup form*/
router.get("/signup", commonData(), function (req, res) {
  res.render("main/signup", { admin: false, user: req.session.dataTouser });
});

/*submit user signup*/
router.post("/signup", (req, res) => {
  console.log(req.body);
  req.session.clientuserregisterdata = req.body;
  req.session.clientuserregotp = otpGenerator.generate(6, {
    upperCase: false,
    specialChars: false,
  });
  if (req.session.clientuserregotp) {
    res.json({ otp: true, data: req.session.clientuserregotp });
    // sms_helper.send_otp(req.session.clientuserregotp, req.body.mobile).then((message)=>{
    //   res.json({ otp: true, data: req.session.clientuserregotp });
    // })
  } else {
    res.json({ otp: false });
  }
});

/* Otp Validator*/
router.post("/validate_otp", (req, res) => {
  console.log(req.body.otp);
  if (req.body.otp == req.session.clientuserregotp) {
    userHelpers.doSignup(req.session.clientuserregisterdata).then((data) => {
      res.json({ data: true });
      req.session.clientuserregisterdata = null;
      req.session.clientuserregotp = null;
    });
  } else {
    res.json({ data: false });
  }
});

/*validate user priviesly registration data for disable same mobile / username*/
router.post("/validate_registration", (req, res) => {
  console.log(req.body);
  let input = req.body.username ? req.body.username : req.body.mobile;
  userHelpers.validateRegistration(input).then((data) => {
    data ? res.send("false") : res.send("true");
  });
});

/*calcualte nearest store*/
router.post("/geo_locator", async (req, res) => {
  let storeNames = await store_helper.getAllstorenamebylocation();
  for (i = 0; i < storeNames.length; i++) {
    let distence = await geoHelper.calcDistance(
      req.body.latitude,
      req.body.longitude,
      storeNames[i].latitude,
      storeNames[i].longitude
    );
    storeNames[i].distence = distence;
  }
  storeNames.sort((a, b) => (a.distence > b.distence ? 1 : -1));
  res.json({ stores: storeNames });
});

router.get("/logout", function (req, res) {
  req.session.destroy();
  res.redirect("login");
});

router.post("/new-product-review", (req, res) => {
  if (req.session.loggedIn) {
    data = req.body;
    data.dealerId = req.session.defaultStore;
    data.userId = req.session.user._id;
    productHelpers.writeReview(data).then((status) => {
      res.json({ login: true, status: true })
    }).catch((err) => {
      res.json({ login: true, status: false })
    })
  }
  else {
    res.json({ login: false })
  }
})

//add to cart
router.post("/add-to-cart", (req, res) => {
  if (req.session.loggedIn) {
    cartHelper
      .addTocart(req.body.id, req.session.defaultStore, req.session.user._id)
      .then(async (resolve) => {
        total = await cartHelper.calculateCarttotalbystore(
          req.session.user._id,
          req.session.defaultStore
        );
        res.json({ result: true, total: total });
      });
  } else {
    //console.log(req.body.id)
    // prodID = req.body.id
    // req.session.cartItems = req.session.cartItems ? req.session.cartItems : {}
    // var proExist = req.session.cartItems[prodID]
    // if (proExist) {
    //   req.session.cartItems[prodID] = { qty: proExist.qty + 1 }
    // }
    // else {
    //   req.session.cartItems[prodID] = { qty: 1 }
    // }
    res.json({ status: 401 });
  }
});

router.post("/edit-cart", (req, res) => {
  if (req.session.loggedIn) {
    cartHelper
      .editCart(req.body, req.session.defaultStore)
      .then(async (response) => {
        if (response.status) {
          total = await cartHelper.getCarttotal(req.session.user._id);
          res.json({ status: true, total: total });
        } else {
          res.json({ status: false });
        }
      });
  } else {
    res.json({ status: 401 });
  }
});

router.get("/cart", commonData(), varifyLogin("/cart"), (req, res) => {
  if (req.session.loggedIn) {
    userData = {
      userName: req.session.user.first_name + " " + req.session.user.last_name,
      id: req.session.user._id,
      status: true,
    };
  }
  cartHelper.getAllcartItem(req.session.user._id).then((cartItems) => {
    console.log(cartItems);
    res.render("main/cart", {
      company,
      admin: false,
      cartItems,
      user: req.session.dataTouser,
    });
  });
});

router.post("/clear_cart", (req, res) => {
  if (req.session.loggedIn) {
    cartHelper.clearAllcartItem(req.session.user._id).then((data) => {
      res.json({ login: true, result: true });
    });
  } else {
    res.json({ login: false });
  }
});

router.get(
  "/place_order/:id",
  commonData(),
  varifyLogin("/place_order"),
  (req, res) => {
    cartHelper
      .calculateCarttotalbycartID(req.params.id)
      .then(async (cartTotal) => {
        let paymentMethods = await paymentHelpers.getPaymentmethods();
        console.log(paymentMethods);
        let address = await addressHelpers.getAlladdressbyuser(
          req.session.user._id
        );
        res.render("main/place_order", {
          company,
          address,
          cartID: req.params.id,
          admin: false,
          paymentMethods,
          cartTotal,
          user: req.session.dataTouser,
        });
      });
  }
);

router.get(
  "/re-payment/:id",
  commonData(),
  varifyLogin("/re-payment"),
  async (req, res) => {
    let products = await orderTransactions.getProductfromOrder(req.params.id);
    let lastStatus = getLaststatus(products.orderStatus);
    if (lastStatus == "Pending" || lastStatus == "Payment Failed") {
      orderTransactions
        .calculateOrdertotalbyorderID(req.params.id)
        .then(async (orderTotal) => {
          let paymentMethods = await paymentHelpers.getPaymentmethods();
          await orderTransactions.getProductdetailes(req.params.id, (orderdItems) => {
            res.render("main/re-payment", {
              orderId: req.params.id,
              admin: false,
              paymentMethods,
              orderdItems,
              orderTotal,
              user: req.session.dataTouser,
            });
          });
        });
    }
    else{
      req.session.orderStatus = "Payment Already Done.";
       res.redirect("/orders");
    }
  }
);

//post repayment form
router.post("/re-payment", async (req, res) => {

  if (req.session.loggedIn) {
    let orderId = req.body.orderId;
    let total = await orderTransactions.calculateOrdertotalbyorderID(orderId);
    let products = await orderTransactions.getProductfromOrder(orderId);

    console.log(products)
    if (req.body.paymentMethod === "cod") {
      productHelpers.updateProductqty(products.products, products.dealerID).then(async (data) => {
        await orderTransactions.updateOrderstatus(orderId, "Order Placed")
        req.session.orderStatus = "New Order Placed Successfully";
        res.json({ login: true, method: "cod" });
      });
    } else {
      if (req.body.paymentMethod === "razorpay") {
        let razamount = total * 100;
        req.session.razpayOrderId = orderId;
        paymentHelpers.generateRazorpay(orderId, razamount).then((data) => {
          //let options = paymentHelpers.razorpayClientoption(razamount, data.id, req.session.user);
          let options = {
            razamount: razamount,
            orderid: data.id,
            user: req.session.user,
            key_id: "rzp_test_zt63z5Weu5i5fx",
          };
          res.json({ login: true, method: "razorPay", options: options });
        });
      } else if (req.body.paymentMethod === "moyasar") {
        req.session.OrderId = orderId;
        console.log("order is setted " + req.session.OrderId);
        res.json({ login: true, method: "moyasar" });
      }
    }
  }
  else {
    res.json({ login: false });
  }
});

router.get(
  "/moyasar_payment",
  commonData(),
  varifyLogin("/moyasar_payment"),
  async (req, res) => {
    if (req.session.OrderId) {
      let total = await orderTransactions.calculateOrdertotalbyorderID(
        req.session.OrderId
      );
      total = total * 100;
      let orderId = req.session.OrderId;
      res.render("main/moyasar_form", {
        admin: false,
        siteUrl,
        total,
        orderId,
        user: req.session.dataTouser,
      });
    } else {
      res.redirect("/orders");
    }
  }
);

router.get(
  "/moyasar_payments_redirect",
  commonData(),
  varifyLogin("/orders"),
  (req, res) => {
    let data = req.query;
    if (data.status === "paid") {
      paymentHelpers.varifyMoyasar(data.id).then((response) => {
        console.log(response);
        if (response.status === "paid") {
          orderTransactions
            .updateOrderstatus(req.session.OrderId, "Payment Success")
            .then(async () => {
              let products = await orderTransactions.getProductfromOrder(req.session.OrderId);
              await productHelpers.updateProductqty(products.products, products.dealerID);
              req.session.orderStatus =
                "Moyasar Payment Compleeted Successfuly";
              res.redirect("/orders");
            });
        } else {
          req.session.orderStatus = "Moyasar Payment Failed";
          res.redirect("/orders");
        }
      });
    } else {
      orderTransactions
        .updateOrderstatus(req.session.OrderId, "Payment Failed")
        .then(() => {
          req.session.orderStatus = "Moyasar Payment Failed";
          res.redirect("/orders");
        });
    }
  }
);

//save user address to database
router.post("/save_address", (req, res) => {
  if (!req.session.loggedIn) {
    res.json({ login: false });
  } else {
    console.log(req.body);
    req.body.user = req.session.user._id;
    addressHelpers.saveAddress(req.body).then((data) => {
      data
        ? res.json({
          login: true,
          success: true,
          message: "New Address Saved Successfully",
        })
        : res.json({ login: true, success: false, message: "Unknown Error" });
    });
  }
});

//delete address
router.post("/deleteAddress", (req, res) => {
  if (req.session.loggedIn) {
    addressHelpers.deleteAddress(req.body.id).then((data) => {
      res.json({ login: true, status: true })
    }).catch((err) => {
      res.json({ login: true, status: false })
    })
  }
  else {
    res.json({ login: false })
  }
})

router.post("/place_order", async (req, res) => {
  if (req.session.loggedIn) {
    let cartID = req.body.cartID;
    let products = await cartHelpers.getProductfromCart(cartID);
    let dealer = await store_helper.getStoreDetails(products.dealerID)
    if (handlebarHelper.getStorestatus(dealer.opening_time, dealer.closingtime) === " [CLOSED]") {
      res.json({ login: true, storeclosed: true });
    }
    else {
      let total = await cartHelper.calculateCarttotalbycartID(cartID);
      orderTransactions.placeOrder(req.body, products, total).then(async (data) => {
        if (req.body.paymentMethod === "cod") {
          productHelpers.updateProductqty(products.products, products.dealerID).then((data) => {
            req.session.orderStatus = "New Order Placed Successfully";
            res.json({ login: true, method: "cod" });
          });
        } else {
          if (req.body.paymentMethod === "razorpay") {
            let razamount = total * 100;
            req.session.razpayOrderId = data;
            paymentHelpers.generateRazorpay(data, razamount).then((data) => {
              //let options = paymentHelpers.razorpayClientoption(razamount, data.id, req.session.user);
              let options = {
                razamount: razamount,
                orderid: data.id,
                user: req.session.user,
                key_id: "rzp_test_zt63z5Weu5i5fx",
              };
              res.json({ login: true, method: "razorPay", options: options });
            });
          } else if (req.body.paymentMethod === "moyasar") {
            req.session.OrderId = data;
            console.log("order is setted " + req.session.OrderId);
            res.json({ login: true, method: "moyasar" });
          }
        }
      });
    }
  } else {
    res.json({ login: false });
  }
});

router.post("/varify-razorpay", (req, res) => {
  if (req.session.loggedIn) {
    paymentHelpers
      .razorpayVarifypayment(req.body)
      .then(() => {
        orderTransactions
          .updateOrderstatus(req.session.razpayOrderId, "Payment Success")
          .then(async () => {
            let products = await orderTransactions.getProductfromOrder(req.session.razpayOrderId);
            await productHelpers.updateProductqty(products.products, products.dealerID);
            res.json({ login: true, payment: true });
          });
      })
      .catch((err) => {
        orderTransactions
          .updateOrderstatus(req.session.razpayOrderId, "Payment Failed")
          .then(() => {
            res.json({ login: true, payment: false });
          });
      });
  } else {
    res.json({ login: false });
  }
});

router.get("/orders", commonData(), varifyLogin("/orders"), (req, res) => {
  orderTransactions.getAllorderItem(req.session.user._id).then((orderItems) => {
    let orderStatus = req.session.orderStatus ? req.session.orderStatus : false;
    req.session.orderStatus = false;
    res.render("main/orders", {
      company,
      orderStatus,
      admin: false,
      orderItems,
      user: req.session.dataTouser,
    });
  });
});

router.post("/get_ordered_products", (req, res) => {
  console.log(req.body.orederId);
  if (req.session.loggedIn) {
    orderTransactions.getProductdetailes(req.body.orederId, (items) => {
      console.log(items);
      res.json({ login: true, items: items });
    });
  } else {
    res.json({ login: false });
  }
});

router.get("/get_ordered_status/:id", async (req, res) => {
  if (req.session.loggedIn) {
    orderTransactions.getOrderedProductStatus(req.params.id, (tracks) => {
      res.render("main/order_shipping_status", { tracks, layout: false });
    });
  } else {
    res.json({ login: false });
  }
});

router.post("/change_password", (req, res) => {
  if (req.session.loggedIn) {
    pasword = req.body.Password;
    user = req.session.user._id;
    userHelpers.changePassword(pasword, user).then((data) => {
      res.json({ login: true, status: true })
    })
  }
  else {
    res.json({ login: false })
  }
});

function varifyLogin(userRoute) {
  return function (req, res, next) {
    if (userRoute) {
      req.params.id
        ? (req.session.userRoute = userRoute + "/" + req.params.id)
        : (req.session.userRoute = userRoute);
    }
    if (req.session.loggedIn) {
      next();
    } else {
      res.redirect("/login");
    }
  };
}

function getLaststatus(status){
  let index = status.length - 1;
  return status[index].status;
}

function commonData() {
  return async function (req, res, next) {
    let storeNames = await store_helper.getAllstorename();
    if (storeNames.length > 0) {
      if (!req.session.defaultStore) {
        req.session.defaultStore = storeNames[0]._id;
        if (req.session.defaultStore) {
          storeData = await store_helper.getStoreDetails(
            req.session.defaultStore
          );
        } else {
          storeData = [];
        }
      }
    }
    else {
      storeData = [];
    }
    if (req.session.loggedIn) {
      total = await cartHelper.calculateCarttotalbystore(
        req.session.user._id,
        req.session.defaultStore
      );
      var userData = {
        userName:
          req.session.user.first_name + " " + req.session.user.last_name,
        id: req.session.user._id,
        status: true,
        totalCart: total,
      };
    }

    req.session.dataTouser = {
      defaultStore: req.session.defaultStore,
      storeNames: storeNames,
      userData: userData,
      storeData: storeData,
    };
    //console.log(req.session.dataTouser.storeData)
    next();
  };
}
module.exports = router;
