var express = require("express");
var router = express.Router();
var employeeHelper = require("../helpers/employee-helper");
var store_helper = require('../helpers/store-helper')

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
    employee: req.session.employee,
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
router.get('/lockscreen',(req,res)=>{
  if(req.session.empLoggedin){
    req.session.lastExetime =Date.now();
    let employee = req.session.employee;
    let name = employee.firstname+' '+employee.lastname
    let data ={name, mobile:employee.mobile};
    let loginStatus = {
      error: req.session.adminLoginErr,
      message: req.session.adminLoginErrMessage,
    };
    res.render('admin/lockscreen', {admin:true, login:true, loginStatus, data})
  }
  else{
    res.redirect('login')
  }
})

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
  store_helper.getAllstores().then((data)=>{
    res.render("admin/view_stores", { admin: true, store: true, stores:data});
  })
});

router.get("/add_store", varifyLogin, function (req, res) {
  req.session.lastExetime = Date.now();
  res.render("admin/add_store", { admin: true, store: true });
});

router.post("/add_store", varifyLogin, function (req, res) {
  req.session.lastExetime = Date.now();
  store_helper.addStore(req.body).then((data)=>{
    console.log(data)
  })
  res.json({ message: "hello" });
});

router.get("/logout", function (req, res) {
  req.session.destroy();
  res.redirect("dashboard");
});
router.get("/clear", function (req, res) {
  employeeHelper.clearDb().then((data) => {
    console.log(data);
  });
});

module.exports = router;
