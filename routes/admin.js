var express = require("express");
var router = express.Router();
var employeeHelper = require("../helpers/employee-helper");
var store_helper = require("../helpers/store-helper");
//var otpGenerator = require("otp-generator");
var productHelper = require("../helpers/product-helpers");
var imageHelper = require("../helpers/image-helpers");
var fileSaver = require("file-saver");
//var sharp = require("sharp");
var Jimp = require("jimp");
var fs = require("fs");
var orderTransactions = require("../helpers/payment/order-transactions");
const dashboardHelper = require("../helpers/dashboard-helper")

var company_data = { name: "Grocery Delivery System" };

/* GET root router. */
router.get("/", function (req, res, next) {
  res.redirect("dashboard");
});
router.get("/dashboard", varifyLogin("/admin/dashboard"), async function (req, res) {
  let employee_data = req.session.employee;
  if (employee_data.supper_user != "yes") {
    var dashboardData = await dashboardHelper.getStoresdashboards(employee_data.store)
  }
  res.render("admin/dashboard", {
    admin: true,
    company_data,
    dashboardData,
    dashboard: true,
    employee_data,
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

router.post("/add_store", function (req, res) {
  req.session.lastExetime = Date.now();
  if (req.session.empLoggedin) {
    let storeData = {
      storename: req.body.storename,
      companyname: req.body.companyname,
      address: req.body.address,
      mobile: req.body.telephone,
      vat_number: req.body.vat_number,
      latitude: req.body.latitude,
      longitude: req.body.longitude,
      contactpage: req.body.contactpage,
      opening_time: req.body.opening_time,
      closingtime: req.body.closing_time,
    };
    let loginData = {
      firstname: req.body.firstname,
      lastname: req.body.lastname,
      mobile: req.body.mobile,
      username: req.body.username,
      password: req.body.pwd,
      active: true,
    };
    store_helper.addStore(storeData).then((storeId) => {
      loginData.store = storeId._id;
      console.log(storeId);
      employeeHelper.createEmployee(loginData).then((data) => {
        res.json({ login: true, message: "New Store Created or Updated" });
      });
    });
  } else {
    res.json({ login: false });
  }
});

router.get(
  "/editStore/:storeId",
  varifyLogin("/admin/editStore/"),
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
  let input = req.body.username ? req.body.username : req.body.mobile;
  employeeHelper.validateRegistration(input).then((data) => {
    data ? res.send("false") : res.send("true");
  });
});

router.post("/add_employee", (req, res) => {
  if (req.session.empLoggedin) {
    let loginData = {
      firstname: req.body.firstname,
      lastname: req.body.lastname,
      store: req.body.store,
      mobile: req.body.mobile,
      username: req.body.username,
      password: req.body.password,
      active: req.body.activate_employee == "on" ? true : false,
    };
    employeeHelper.createEmployee(loginData).then((data) => {
      res.json({ status: true, data: true });
    });
  } else {
    res.json({ status: false, data: false });
  }
});

router.get(
  "/view_employee",
  varifyLogin("/admin/view_employee"),
  (req, res) => {
    let employee_data = req.session.employee;
    employeeHelper.getAllemployee(employee_data.store).then((data) => {
      res.render("admin/view_employee", {
        admin: true,
        employee: true,
        employee_data,
        users: data,
      });
    });
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
    console.log(req.body);
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
  let customer =
    employee_data.supper_user == "yes" ? "null" : employee_data._id;
  productHelper.getAllCategory(customer).then((category) => {
    res.render("admin/add_product", {
      employee_data,
      admin: true,
      edit: false,
      category,
    });
  });
});

router.get(
  "/view_category",
  varifyLogin("/admin/view_category"),
  (req, res) => {
    let employee_data = req.session.employee;
    let customer =
      employee_data.supper_user == "yes" ? "null" : employee_data._id;
    let statusMsg = req.session.statusMsg ? req.session.statusMsg : false;
    req.session.statusMsg = false;
    productHelper.getAllCategory(customer).then((category) => {
      res.render("admin/view_category", {
        employee_data,
        admin: true,
        category,
        statusMsg,
      });
    });
  }
);

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
      if (employee_data.supper_user != "yes") {
        req.body.dealerId = employee_data._id;
      }

      productHelper.addProduct(req.body, async (id) => {
        if (image) {
          var base64Data = image.replace(/^data:image\/png;base64,/, "");
          let filename = "./public/product-images/" + id + ".png";

          await fs.writeFile(filename, base64Data, "base64", function (err, data) {
            if (err) {
              return console.log(err);
            }
            Jimp.read("./public/product-images/" + id + ".png", (err, lenna) => {
              if (err) console.log(err);
              lenna
                .resize(200, 200) // resize
                .quality(60) // set JPEG quality
                .write("./public/product-images/thumbnails/" + id + ".jpg"); // save
            });
          });
        }
        req.session.statusMsg =
          "New Product Added Successfully, To edit or add carousel images select edit product";

        res.redirect("/admin/view_products");
      });
    }
  }
);

router.get("/add_category", (req, res) => {
  res.render("admin/add_category", {});
});

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
    productHelper
      .getAllProduct20(
        req.session.employee.store,
        req.session.employee.supper_user
      )
      .then((data) => {
        //console.log(data)
        let employee_data = req.session.employee;
        let statusMsg = req.session.statusMsg ? req.session.statusMsg : false;
        req.session.statusMsg = false;
        let dealerUser = employee_data.supper_user == "yes" ? false : true;
        res.render("admin/view_products", {
          data,
          employee_data,
          statusMsg,
          admin: true,
          dealerUser,
        });
      });
  }
);

router.post("/add-category", (req, res) => {
  let employee_data = req.session.employee;
  let customer =
    employee_data.supper_user == "yes" ? "null" : employee_data._id;
  productHelper.addCategory(req.body.category, customer).then((data) => {
    req.session.statusMsg = "New Category Added Successfully";
    res.redirect("/admin/view_category");
  });
});

router.get("/edit_price/:id", varifyLogin("/edit_price/:id"), (req, res) => {
  let prodId = req.params.id;
  let employee_data = req.session.employee;
  if (employee_data.supper_user) {
    res.redirect("/admin/view_product");
  } else {
    productHelper
      .getProductdetailesbyStore(prodId, employee_data.store)
      .then((product) => {
        console.log(product);
        res.render("admin/edit_price", {
          admin: true,
          prodId,
          employee_data,
          product,
        });
      });
  }
});

router.post("/edit_price/:id", (req, res) => {
  let prodId = req.params.id;
  let body = req.body;
  let employee_data = req.session.employee;
  body.storeId = employee_data.store;
  productHelper.updatePrice(body, prodId).then(() => {
    //res.redirect("/admin/edit_price/" + prodId);
    req.session.statusMsg = "Product Price Edited Successfully " + prodId;
    // res.render("admin/edit_price", {
    //   admin: true,
    //   prodId,
    //   employee_data,
    //   product,
    // });
    res.redirect("/admin/view_products");
  });
});

router.get(
  "/edit_product/:id",
  varifyLogin("/admin/edit_product/:id"),
  (req, res) => {
    let employee_data = req.session.employee;
    let id = req.params.id;
    let customer =
      employee_data.supper_user == "yes" ? "null" : employee_data._id;

    productHelper.getProductdetailes(id).then(async (product) => {
      let productCarouselimages = await imageHelper.productcarouselImages(id);
      productHelper.getAllCategory(customer).then((category) => {
        console.log("test cat" + category);
        res.render("admin/add_product", {
          employee_data,
          product,
          files: productCarouselimages,
          id,
          category,
          admin: true,
          edit: true,
        });
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

router.get(
  "/pending_orders",
  varifyLogin("/admin/pending_orders"),
  (req, res) => {
    let employee_data = req.session.employee;
    if (!employee_data.supper_user) {
      orderTransactions
        .getAllorderItembystore(employee_data.store, "Pending")
        .then(async (orderItems) => {
          let status = await orderTransactions.selectStatus();
          console.log(orderItems);
          res.render("admin/view_orders", {
            employee_data,
            admin: true,
            edit: false,
            orderItems,
            status,
          });
        });
    } else {
      res.render("admin/no_access", { admin: true });
    }
  }
);

router.get(
  "/completed_orders",
  varifyLogin("/admin/pending_orders"),
  (req, res) => {
    let employee_data = req.session.employee;
    if (!employee_data.supper_user) {
      orderTransactions
        .getAllorderItembystore(employee_data.store, "Finished")
        .then((orderItems) => {
          res.render("admin/view_orders", {
            employee_data,
            admin: true,
            edit: false,
            orderItems,
          });
        });
    } else {
      res.render("admin/no_access", { admin: true });
    }
  }
);

router.post("/get_ordered_products", async (req, res) => {
  if (req.session.empLoggedin) {
    orderTransactions.getProductdetailes(req.body.orederId, (items) => {
      console.log(items);
      res.json({ login: true, items: items });
    });
  } else {
    res.json({ login: false });
  }
});

router.post("/change_order_status", (req, res) => {
  orderTransactions
    .updateOrderstatus(req.body.orederId, req.body.status)
    .then((data) => {
      res.json({ status: data });
    });
});

router.get("/get_ordered_status/:id", async (req, res) => {
  if (req.session.empLoggedin) {
    orderTransactions.getOrderedProductStatus(req.params.id, (tracks) => {
      console.log(tracks);
      res.render("admin/order_shipping_status", { tracks, layout: false });
    });
  } else {
    res.json({ login: false });
  }
});

router.post("/mark_as_finished", (req, res) => {
  if (req.session.empLoggedin) {
    orderTransactions.getOrderedasFinished(req.body.orederId).then((tracks) => {
      res.json({ login: true, tracks });
    });
  } else {
    res.json({ login: false });
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

// router.get("/clear", function (req, res) {
//   employeeHelper.clearDb().then((data) => {
//     console.log(data);
//   });
// });

function varifyLogin(route) {
  return function (req, res, next) {
    if (route) {
      //req.session.route = route;
      req.params.id
      ? (req.session.route = route + "/" + req.params.id)
      : (req.session.route = route);
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
