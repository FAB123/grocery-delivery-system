var express = require("express");
var router = express.Router();
var employeeHelper = require("../helpers/employee-helper");
var store_helper = require("../helpers/store-helper");
var otpGenerator = require("otp-generator");
var productHelper = require("../helpers/product-helpers");
var imageHelper = require("../helpers/image-helpers");
var sharp = require("sharp");
const e = require("express");

var company_data = { name: "Test Company" };

const varifyLogin = (req, res, next) => {
  if (req.session.empLoggedin) {
    let currentTime = Date.now();
    // activate lock screen while inactive 5 minutes
    if (currentTime - req.session.lastExetime > 300000) {
      res.redirect("/admin/lockscreen");
    } else {
      next();
    }
  } else {
    res.redirect("/admin/login");
  }
};

/* GET root router. */
router.get("/", function (req, res, next) {
  res.redirect("dashboard");
});
router.get("/dashboard", varifyLogin, function (req, res) {
  res.render("admin/dashboard", {
    admin: true,
    company_data,
    dashboard: true,
    employee_data: req.session.employee,
  });
});

/* Login router */
router.get("/login", function (req, res) {
  if (req.session.empLoggedin) {
    res.redirect("/admin");
  } else {
    let loginStatus = {
      error: req.session.adminLoginErr,
      message: req.session.adminLoginErrMessage,
    };
    res.render("admin/login", {
      admin: true,
      login: true,
      company_data,
      loginStatus,
    });
  }
});

/* lock screen router */
router.get("/lockscreen", (req, res) => {
  if (req.session.empLoggedin) {
    req.session.lastExetime = Date.now();
    let employee_data = req.session.employee;
    let name = employee_data.firstname + " " + employee_data.lastname;
    let data = { name, mobile: employee_data.mobile };
    let loginStatus = {
      error: req.session.adminLoginErr,
      message: req.session.adminLoginErrMessage,
    };
    res.render("admin/lockscreen", {
      admin: true,
      login: true,
      loginStatus,
      data,
    });
  } else {
    res.redirect("login");
  }
});

router.post("/lockscreen", function (req, res) {
  employeeHelper.doLogin(req.body).then((response) => {
    if (response.status) {
      req.session.empLoggedin = true;
      req.session.employee = response.employee;
      req.session.adminLoginErr = false;
      req.session.lastExetime = Date.now();
      res.redirect("dashboard");
    } else {
      req.session.adminLoginErr = true;
      req.session.adminLoginErrMessage = response.message;
      res.redirect("lockscreen");
    }
  });
});

router.post("/login", function (req, res) {
  if (req.session.empLoggedin) {
    req.session.lastExetime = Date.now();
    res.redirect("/");
  } else {
    employeeHelper.doLogin(req.body).then((response) => {
      if (response.status) {
        req.session.empLoggedin = true;
        req.session.employee = response.employee;
        req.session.adminLoginErr = false;
        req.session.lastExetime = Date.now();
        res.redirect("dashboard");
      } else {
        req.session.adminLoginErr = true;
        req.session.adminLoginErrMessage = response.message;
        res.redirect("login");
      }
    });
  }
});

router.get("/view_stores", varifyLogin, function (req, res) {
  req.session.lastExetime = Date.now();
  store_helper.getAllstores().then((data) => {
    res.render("admin/view_stores", {
      admin: true,
      store: true,
      employee_data: req.session.employee,
      stores: data,
    });
  });
});

router.get("/add_store", varifyLogin, function (req, res) {
  req.session.lastExetime = Date.now();
  res.render("admin/add_store", {
    admin: true,
    employee_data: req.session.employee,
    store: true,
  });
});

router.post("/add_store", varifyLogin, function (req, res) {
  req.session.lastExetime = Date.now();
  store_helper.addStore(req.body).then((data) => {
    console.log(data);
  });
  res.json({ message: "hello" });
});

router.get("/editStore/:storeId", varifyLogin, (req, res) => {
  req.session.lastExetime = Date.now();
  store_helper.getStoreDetails(req.params.storeId).then((storeData) => {
    res.render("admin/edit_store", {
      admin: true,
      store: true,
      employee_data: req.session.employee,
      storeData,
    });
  });
});

router.post("/editStore/:storeId", varifyLogin, (req, res) => {
  req.session.lastExetime = Date.now();
  store_helper
    .updateStoreDetailes(req.params.storeId, req.body)
    .then((data) => {
      res.redirect("/admin/view_stores");
    });
});

router.get("/view_blocked_stores", varifyLogin, (req, res) => {
  req.session.lastExetime = Date.now();
  store_helper.getBlockedstores().then((data) => {
    res.render("admin/view_stores", {
      admin: true,
      store: true,
      employee_data: req.session.employee,
      stores: data,
    });
  });
});

router.get("/employees", varifyLogin, (req, res) => {
  res.render("/admin/employees", {
    admin: true,
    employee: true,
    employee_data: req.session.employee,
  });
});

router.get("/add_employee", varifyLogin, (req, res) => {
  store_helper.getAllstorename().then((data) => {
    res.render("admin/add_employee", {
      admin: true,
      employee: true,
      employee_data: req.session.employee,
      data,
    });
  });
});

//validate user pre registration data
router.post("/validate_registration", (req, res) => {
  console.log(req.body);
  let input = req.body.username ? req.body.username : req.body.mobile;
  employeeHelper.validateRegistration(input).then((data) => {
    data ? res.send("false") : res.send("true");
  });
});

router.post("/add_employee", (req, res) => {
  console.log(req.body);
  req.session.userregisterdata = req.body;
  req.session.userregotp = otpGenerator.generate(6, {
    upperCase: false,
    specialChars: false,
  });
  if (req.session.userregotp) {
    res.json({ otp: true, data: req.session.userregotp });
  } else {
    res.json({ otp: false });
  }
});

router.post("/validate_otp", (req, res) => {
  if (req.body.otp == req.session.userregotp) {
    employeeHelper.createEmployee(req.session.userregisterdata).then((data) => {
      res.json({ data: true });
      req.session.userregisterdata = null;
      req.session.userregotp = null;
    });
  } else {
    res.json({ data: false });
  }
});

router.get("/view_employee", varifyLogin, (req, res) => {
  let employee_data = req.session.employee;
  if (employee_data.supper_user) {
    employeeHelper.getAllemployee().then((data) => {
      res.render("admin/view_employee", {
        admin: true,
        employee: true,
        employee_data,
        users: data,
      });
    });
  } else {
    res.render("admin/no_access", { employee_data, admin: true });
  }
});

router.get("/add_product", varifyLogin, (req, res) => {
  let employee_data = req.session.employee;
  res.render("admin/add_product", { employee_data, admin: true, edit: false });
});

router.post("/add_product", varifyLogin, (req, res, next) => {
  let employee_data = req.session.employee;
  if (req.body.id) {
    //console.log("updating")
    let id = req.body.id;
    productHelper.updateProduct(req.body).then((data) => {
      res.redirect("/admin/edit_product/" + id);
    });
  } else {
    productHelper.addProduct(req.body, (id) => {
      let image = req.files.image;
      image.mv("./public/product-images/" + id + ".jpg", (err, done) => {
        if (!err) {
          let product = req.body;
          res.render("admin/add_product", {
            employee_data,
            product,
            id,
            admin: true,
            edit: true,
          });
          sharp("./public/product-images/" + id + ".jpg")
            .resize({ width: 200, height: 200, fit: "inside" })
            .toFormat("jpeg")
            .toFile(
              "./public/product-images/thumbnails/" + id + ".jpg",
              (err, newfile) => {
                if (err) console.log(err);
                else console.log(newfile);
              }
            );
        } else {
          console.log(err);
        }
      });
    });
  }
});

router.post("/deleteProduct", (req, res) => {
  if (req.session.empLoggedin) {
    productHelper.deleteProduct(req.body.id).then((data) => {
      console.log("test");
      res.json({ loginError: false, result: true });
    });
  } else {
    res.json({ loginError: true, result: true });
  }
});

router.get("/view_products", varifyLogin, (req, res) => {
  productHelper.getAllProduct().then((data) => {
    let employee_data = req.session.employee;
    res.render("admin/view_products", { data, employee_data, admin: true });
  });
});

router.get("/edit_product/:id", varifyLogin, (req, res) => {
  let employee_data = req.session.employee;
  let id = req.params.id;
  productHelper.getProductdetailes(id).then(async (product) => {
    let productCarouselimages = await imageHelper.productcarouselImages(id);
    res.render("admin/add_product", {
      employee_data,
      product,
      files: productCarouselimages,
      id,
      admin: true,
      edit: true,
    });
  });
});

router.post("/upload_product_carousel", (req, res) => {
  let image = req.files.cimage;
  let id = req.body.id;
  if (req.session.empLoggedin) {
    res.json({ loginError: true });
  } else {
    image.mv(
      "./public/product-carousel-images/" + image.name + "." + id,
      (err, done) => {
        if (!err) {
          sharp("./public/product-carousel-images/" + image.name + "." + id)
            .resize({ width: 200, height: 200, fit: "inside" })
            .toFormat("jpeg")
            .toFile(
              "./public/product-carousel-images/thumbnails/" +
                image.name +
                "." +
                id,
              (err, newfile) => {
                if (err) {
                  res.json({ loginError: false, result: false });
                } else {
                  res.json({ loginError: false, result: true });
                }
              }
            );
        } else {
          res.json({ loginError: false, result: false });
        }
      }
    );
  }
});

router.post("/remove-product-carousel", (req, res) => {
  let image = req.body.image;
  if (req.session.empLoggedin) {
    res.json({ loginError: true });
  } else {
    if (imageHelper.removeProductCarousel(image)) {
      res.json({ loginError: false, result: true });
    } else {
      res.json({ loginError: false, result: false });
    }
  }
});

router.get("/logout", function (req, res) {
  req.session.destroy();
  res.redirect("/admin/dashboard");
});
router.get("/clear", function (req, res) {
  employeeHelper.clearDb().then((data) => {
    console.log(data);
  });
});

module.exports = router;
