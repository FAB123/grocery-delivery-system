var express = require("express");
var router = express.Router();
var employeeHelper = require("../helpers/employee-helper");
var store_helper = require("../helpers/store-helper");
var otpGenerator = require("otp-generator");
var productHelper = require("../helpers/product-helpers");
var imageHelper = require("../helpers/image-helpers");
var fileSaver = require("file-saver");
//var sharp = require("sharp");
var Jimp = require("jimp");
var fs = require("fs");
const { updateProduct } = require("../helpers/product-helpers");
const { handlebars } = require("hbs");

var company_data = { name: "Test Company" };

/* GET root router. */
router.get("/", function (req, res, next) {
  res.redirect("dashboard");
});
router.get("/dashboard", varifyLogin("/admin/dashboard"), function (req, res) {
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
      if (req.session.route) {
        res.redirect(req.session.route);
        req.session.route = false;
      } else {
        res.redirect("dashboard");
      }
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
        if (req.session.route) {
          res.redirect(req.session.route);
          req.session.route = false;
        } else {
          res.redirect("dashboard");
        }
      } else {
        req.session.adminLoginErr = true;
        req.session.adminLoginErrMessage = response.message;
        res.redirect("login");
      }
    });
  }
});

router.get(
  "/view_stores",
  varifyLogin("/admin/view_stores"),
  function (req, res) {
    req.session.lastExetime = Date.now();
    store_helper.getAllstores().then((data) => {
      res.render("admin/view_stores", {
        admin: true,
        store: true,
        employee_data: req.session.employee,
        stores: data,
      });
    });
  }
);

router.get("/add_store", varifyLogin("/admin/add_store"), function (req, res) {
  req.session.lastExetime = Date.now();
  res.render("admin/add_store", {
    admin: true,
    employee_data: req.session.employee,
    store: true,
  });
});

router.post("/add_store", varifyLogin("/admin/dashboard"), function (req, res) {
  req.session.lastExetime = Date.now();
  store_helper.addStore(req.body).then((data) => {
    console.log(data);
  });
  res.json({ message: "New Store Created or Updated" });
});

router.get(
  "/editStore/:storeId",
  varifyLogin("/admin/editStore/:storeId"),
  (req, res) => {
    req.session.lastExetime = Date.now();
    store_helper.getStoreDetails(req.params.storeId).then((storeData) => {
      res.render("admin/edit_store", {
        admin: true,
        store: true,
        employee_data: req.session.employee,
        storeData,
      });
    });
  }
);

router.post(
  "/editStore/:storeId",
  varifyLogin("/admin/dashboard"),
  (req, res) => {
    req.session.lastExetime = Date.now();
    store_helper
      .updateStoreDetailes(req.params.storeId, req.body)
      .then((data) => {
        res.redirect("/admin/view_stores");
      });
  }
);

router.get(
  "/view_blocked_stores",
  varifyLogin("/admin/view_blocked_stores"),
  (req, res) => {
    req.session.lastExetime = Date.now();
    store_helper.getBlockedstores().then((data) => {
      res.render("admin/view_stores", {
        admin: true,
        store: true,
        employee_data: req.session.employee,
        stores: data,
      });
    });
  }
);

router.post("/enable_store", (req, res) => {
  if (!req.session.empLoggedin) {
    res.json({ loginError: true });
  } else {
    store_helper.controlStore(req.body.storeId, req.body.state).then((data) => {
      res.json({ loginError: false, status: true });
    });
  }
});

router.get("/employees", varifyLogin("/admin/employees"), (req, res) => {
  req.session.lastExetime = Date.now();
  res.render("/admin/employees", {
    admin: true,
    employee: true,
    employee_data: req.session.employee,
  });
});

router.get("/add_employee", varifyLogin("/admin/add_employee"), (req, res) => {
  req.session.lastExetime = Date.now();
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

router.get(
  "/view_employee",
  varifyLogin("/admin/view_employee"),
  (req, res) => {
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
  }
);

router.get(
  "/editEmployee/:employeeId",
  varifyLogin("/admin/editEmployee/:employeeId"),
  async (req, res) => {
    req.session.lastExetime = Date.now();
    let stores = await store_helper.getAllstorename();
    employeeHelper
      .getEmployeeDetails(req.params.employeeId)
      .then((employee) => {
        res.render("admin/edit_employee", {
          admin: true,
          employee: true,
          employee_data: req.session.employee,
          employee,
          stores,
        });
      });
  }
);

router.post(
  "/editEmployee/:employeeId",
  varifyLogin("/admin/dashboard"),
  (req, res) => {
    req.session.lastExetime = Date.now();
    employeeHelper
      .updateEmployeeDetailes(req.params.employeeId, req.body)
      .then((data) => {
        res.redirect("/admin/view_employee");
      });
  }
);

router.post("/enable_employee", (req, res) => {
  if (!req.session.empLoggedin) {
    res.json({ loginError: true });
  } else {
    employeeHelper
      .controlEmployee(req.body.employeeId, req.body.state)
      .then((data) => {
        res.json({ loginError: false, status: true });
      });
  }
});

router.get("/add_product", varifyLogin("/admin/add_product"), (req, res) => {
  let employee_data = req.session.employee;
  res.render("admin/add_product", { employee_data, admin: true, edit: false });
});

router.post(
  "/add_product",
  varifyLogin("/admin/add_product"),
  (req, res, next) => {
    let employee_data = req.session.employee;
    if (req.body.id) {
      //console.log("updating")
      let id = req.body.id;
      productHelper.updateProduct(req.body).then((data) => {
        res.redirect("/admin/edit_product/" + id);
      });
    } else {
      let image = req.body.prodIm;
      delete req.body.id;
      delete req.body.prodIm;

      productHelper.addProduct(req.body, (id) => {
        if (image) {
          var base64Data = image.replace(/^data:image\/png;base64,/, "");
          let filename = "./public/product-images/" + id + ".png";

          fs.writeFile(filename, base64Data, "base64", function (err) {
            console.log(err);
          });
        }

        let product = req.body;
        res.render("admin/add_product", {
          employee_data,
          product,
          id,
          admin: true,
          edit: false,
        });
        if (image) {
          Jimp.read("./public/product-images/" + id + ".png", (err, lenna) => {
            if (err) throw err;
            lenna
              .resize(200, 200) // resize
              .quality(60) // set JPEG quality
              .write("./public/product-images/thumbnails/" + id + ".jpg"); // save
          });
        }

        // sharp("./public/product-images/" + id + ".png")
        //   .resize({ width: 200, height: 200, fit: "inside" })
        //   .toFormat("jpeg")
        //   .toFile(
        //     "./public/product-images/thumbnails/" + id + ".jpg",
        //     (err, newfile) => {
        //       if (err) console.log(err);
        //       else console.log(newfile);
        //     }
        //   );
      });
    }
  }
);

router.post("/deleteProduct", (req, res) => {
  req.session.lastExetime = Date.now();
  if (req.session.empLoggedin) {
    productHelper.deleteProduct(req.body.id).then((data) => {
      res.json({ loginError: false, result: true });
    });
  } else {
    res.json({ loginError: true, result: true });
  }
});

router.get(
  "/view_products",
  varifyLogin("/admin/view_products"),
  (req, res) => {
    storeid =
      req.session.employee.supper_user == "yes"
        ? "none"
        : req.session.employee.store;
    productHelper.getAllProduct20(req.session.employee.store).then((data) => {
      //console.log(data)
      let employee_data = req.session.employee;
      let dealerUser = employee_data.supper_user == "yes" ? false : true;
      res.render("admin/view_products", {
        data,
        employee_data,
        admin: true,
        dealerUser,
      });
    });
  }
);

router.get("/edit_price/:id", varifyLogin("/edit_price/:id"), (req, res) => {
  let prodId = req.params.id;
  let employee_data = req.session.employee;
  if(employee_data.supper_user){
    res.redirect("/admin/view_product")
  }
  else{
    productHelper.getProductdetailesbyStore(prodId, employee_data.store).then((product)=>{
      console.log(product)
      res.render("admin/edit_price", { admin: true, prodId, employee_data, product });
    })
  }
});

router.post("/edit_price/:id", (req, res) => {
  let prodId = req.params.id;
  let body = req.body;
  let employee_data = req.session.employee;
  body.storeId = employee_data.store;
  productHelper.updatePrice(body, prodId).then(() => {
    res.redirect("/admin/edit_price/" + prodId);
  });
});

router.get(
  "/edit_product/:id",
  varifyLogin("/admin/edit_product/:id"),
  (req, res) => {
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
  }
);

router.post("/upload_product_carousel", (req, res) => {
  req.session.lastExetime = Date.now();
  let image = req.files.cimage;
  let id = req.body.id;
  if (!req.session.empLoggedin) {
    res.json({ loginError: true });
  } else {
    image.mv(
      "./public/product-carousel-images/" + image.name + "." + id,
      (err, done) => {
        if (!err) {
          Jimp.read(
            "./public/product-carousel-images/" + image.name + "." + id,
            (err, lenna) => {
              if (err) res.json({ loginError: false, result: false });
              else {
                lenna
                  .resize(200, 200) // resize
                  .quality(60) // set JPEG quality
                  .write(
                    "./public/product-carousel-images/thumbnails/" +
                      image.name +
                      "." +
                      id
                  ); // save
              }
              res.json({ loginError: false, result: true });
            }
          );

          // sharp("./public/product-carousel-images/" + image.name + "." + id)
          //   .resize({ width: 200, height: 200, fit: "inside" })
          //   .toFormat("jpeg")
          //   .toFile(
          //     "./public/product-carousel-images/thumbnails/" +
          //       image.name +
          //       "." +
          //       id,
          //     (err, newfile) => {
          //       if (err) {
          //         res.json({ loginError: false, result: false });
          //       } else {
          //         res.json({ loginError: false, result: true });
          //       }
          //     }
          //   );
        } else {
          res.json({ loginError: false, result: false });
        }
      }
    );
  }
});

router.post("/remove-product-carousel", (req, res) => {
  req.session.lastExetime = Date.now();
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

router.post("/enable_product", (req, res) => {
  if (!req.session.empLoggedin) {
    res.json({ loginError: true });
  } else {
    updateData = {
      store: req.session.employee.store,
      prodId: req.body.prodId,
      state: req.body.state,
    };
    productHelper.updateProdStatus(updateData).then((data) => {
      res.json({ loginError: false, status: true });
    });
  }
});

router.get("/settings", varifyLogin("/admin/settings"), (req, res) => {
  let employee_data = req.session.employee;
  res.render("admin/settings", { employee_data, admin: true, edit: false });
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

function varifyLogin(route) {
  return function (req, res, next) {
    if (route) {
      req.session.route = route;
    }
    // if (req.session.empLoggedin) {
    //   let currentTime = Date.now();
    //   next()
    // }
    // else {
    //   res.redirect('/login')
    // }
    if (req.session.empLoggedin) {
      let currentTime = Date.now();
      // activate lock screen while inactive 5 minutes
      if (currentTime - req.session.lastExetime > 300000) {
        res.redirect("/admin/lockscreen");
      } else {
        req.session.lastExetime = Date.now();
        next();
      }
    } else {
      res.redirect("/admin/login");
    }
  };
}

module.exports = router;
