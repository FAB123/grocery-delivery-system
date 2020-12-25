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
var addressHelpers = require('../helpers/cart/address_helper');
var paymentHelpers = require("../helpers/payment/payment-method")

const company = "Balsam Laundary";

var userData;

/* GET home page. */
router.get("/", async function (req, res, next) {
  if (req.session.loggedIn) {
    userData = {
      userName: req.session.user.first_name + " " + req.session.user.last_name,
      id: req.session.user._id,
      status: true,
    };
  }

  let storeNames = await store_helper.getAllstorename();
  if (storeNames.length > 0) {
    if (!req.session.defaultStore) {
      req.session.defaultStore = storeNames[0]._id;
    }
  }

  let carousel = await imageHelpers.carouselImages();
  productHelpers
    .getAllProductbyStore(req.session.defaultStore)
    .then((products) => {
      res.render("main/index", {
        company: "Balsam Laundary",
        products,
        admin: false,
        carousel,
        storeNames,
        defaultStore: req.session.defaultStore,
        user: userData,
      });
    });
});

router.get("/detailes/:id", (req, res) => {
  productHelpers.getProductdetailes(req.params.id).then(async (data) => {
    let carouselImages = await imageHelpers.productcarouselImages(
      req.params.id
    );
    res.render("main/detailes", {
      company: "Balsam Laundary",
      data,
      admin: false,
      user: userData,
      carouselImages,
    });
  });
});

router.get("/login", function (req, res) {
  if (req.session.loggedIn) {
    route = req.session.route ? req.session.route : "/";
    res.redirect(route);
  } else {
    res.render("main/login", { admin: false });
  }
});

router.post("/login", function (req, res) {
  userHelpers.doLogin(req.body).then((response) => {
    if (response.status) {
      req.session.loggedIn = true;
      req.session.user = response.user;
      response.route = req.session.route ? req.session.route : "/";
      res.json(response);
      req.session.route = false;
    } else {
      res.json(response);
    }
  });
});

router.get("/signup", function (req, res) {
  res.render("main/signup", { admin: false });
});

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

//validate user pre registration data
router.post("/validate_registration", (req, res) => {
  console.log(req.body);
  let input = req.body.username ? req.body.username : req.body.mobile;
  userHelpers.validateRegistration(input).then((data) => {
    data ? res.send("false") : res.send("true");
  });
});

router.post("/change_store", (req, res) => {
  req.session.defaultStore = req.body.store;
  console.log(req.session.defaultStore);
  if (req.session.defaultStore == req.body.store) {
    res.json({ response: true });
  } else {
    res.json({ response: false });
  }
});

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
  console.log(storeNames);
  res.json({ stores: storeNames });
});

router.get("/logout", function (req, res) {
  req.session.destroy();
  res.redirect("login");
});

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

router.get("/cart", varifyLogin("/cart"), (req, res) => {
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
      user: userData,
    });
  });
});

router.get("/place_order/:id", varifyLogin("/place_order"), (req, res) => {
  cartHelper.calculateCarttotalbycartID(req.params.id).then(async(cartTotal) => {
    console.log(cartTotal)
    let paymentMethods = await paymentHelpers.getPaymentmethods()
    console.log(paymentMethods)
    let address = await addressHelpers.getAlladdressbyuser(req.session.user._id);
    res.render("main/place_order", {
      company,
      address,
      admin: false,
      paymentMethods,
      cartTotal,
      user: userData,
    });
  });
});

//save user address to database
router.post("/save_address", (req,res)=>{
  if(!req.session.loggedIn){
    res.json({login:false})
  }
  else{
    console.log(req.body)
    req.body.user = req.session.user._id
    addressHelpers.saveAddress(req.body).then((data)=>{
      data ? res.json({login:true, success:true, message:"New Address Saved Successfully"}) : res.json({login:true, success:false, message:"Unknown Error"})
    })   
  }
})

router.post("/do-payment",(req,res)=>{
  console.log(req.body)
})

function varifyLogin(route) {
  return function (req, res, next) {
    if (route) {
      req.params.id
        ? (req.session.route = route + "/" + req.params.id)
        : (req.session.route = route);
    }
    if (req.session.loggedIn) {
      next();
    } else {
      res.redirect("/login");
    }
  };
}

module.exports = router;
