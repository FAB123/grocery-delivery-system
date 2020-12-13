var express = require("express");
const { carouselImages } = require("../helpers/image-helpers");
var router = express.Router();
const imageHelpers = require("../helpers/image-helpers");
const productHelpers = require("../helpers/product-helpers");
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

  let carousel = await imageHelpers.carouselImages();
  productHelpers.getAllProduct().then((products) => {
    console.log(userData);
    res.render("main/index", {
      company: "Balsam Laundary",
      products,
      admin: false,
      carousel,
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
      carouselImages
    });
  });
});

router.get("/login", function (req, res) {
  res.render("main/login", { admin: false });
});

router.post("/login", function (req, res) {
  userHelpers.doLogin(req.body).then((response) => {
    if (response.status) {
      console.log(response.message);
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

router.post("/signup", function (req, res) {
  userHelpers.doSignup(req.body).then((response) => {
    console.log(response);
    if (response._id) {
      res.redirect("/");
    }
  });
});

router.get("/logout", function (req, res) {
  req.session.destroy();
  res.redirect("login");
});

function varifyLogin(route) {
  return function (req, res, next) {
    if (route) {
      req.session.route = route;
    }
    if (req.session.loggedIn) {
      next();
    } else {
      res.redirect("/login");
    }
  };
}

module.exports = router;
