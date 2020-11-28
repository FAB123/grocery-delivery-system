var express = require('express');
var router = express.Router();
var employeeHelper = require('../helpers/employee-helper');

var company_data = {name:"Test Company"};
const varifyLogin=(req,res,next)=>{
  if(req.session.empLoggedin){
    next();
  }
  else
  {
    res.redirect('login');
  }
}

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.redirect('dashboard')
});
router.get('/dashboard',varifyLogin, function(req,res){
  res.render('admin/dashboard', {admin:true, company_data, employee:req.session.employee})
})
router.get('/login', function(req,res){
  res.render('admin/login', {admin:true, company_data})
})

router.post('/login', function(req, res){
  employeeHelper.doLogin(req.body).then((response)=>{
    if(response.status){
      req.session.empLoggedin=true;
      req.session.employee=response.employee;
      res.redirect('dashboard')
    }
    else{
      res.render('admin/login', {admin:true})
    }
  })
})
router.get('/clear',function(req,res){
   employeeHelper.clearDb().then((data)=>{
     console.log(data)
   })
})



module.exports = router;
