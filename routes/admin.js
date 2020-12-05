var express = require("express");
var router = express.Router();
var employeeHelper = require("../helpers/employee-helper");
var store_helper = require("../helpers/store-helper");
var otpGenerator = require("otp-generator");

var company_data = { name: "Test Company" };

const varifyLogin = (req, res, next) => {
  if (req.session.empLoggedin) {
    let currentTime = Date.now();
    // activate lock screen while inactive 5 minutes
    if (currentTime - req.session.lastExetime > 300000) {
      res.redirect("lockscreen");
    } else {
      next();
    }
  } else {
    res.redirect("login");
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
      res.render("admin/view_stores", {
        admin: true,
        store: true,
        stores: data,
      });
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
router.post('/validate_registration',(req,res)=>{
  console.log(req.body)
  let input = req.body.username ? req.body.username : req.body.mobile
  employeeHelper.validateRegistration(input).then((data)=>{
    data ? res.send("false") : res.send("true")
  })
})

router.post("/add_employee", (req, res) => {
  console.log(req.body);
  req.session.userregisterdata = req.body;
  req.session.userregotp = otpGenerator.generate(6, { upperCase: false, specialChars: false })
  if(req.session.userregotp){
    res.json({'otp' : true, data:req.session.userregotp});
  }
  else{
    res.json({'otp' : false})
  }
});

router.post('/validate_otp',(req,res)=>{
  if(req.body.otp == req.session.userregotp){
    employeeHelper.createEmployee(req.session.userregisterdata).then((data)=>{
      res.json({data:true});
      req.session.userregisterdata = null;
      req.session.userregotp = null;

    })
  }
  else{
    res.json({data:false})
  }
})

router.get('/view_employee',varifyLogin,(req,res)=>{
  employeeHelper.getAllemployee().then((data)=>{
        res.render("admin/view_employee", {
          admin: true,
          employee: true,
          employee_data: req.session.employee,
          users: data,
        });
  })
})
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
