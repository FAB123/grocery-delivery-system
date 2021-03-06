var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var indexRouter = require('./routes/index');
var adminRouter = require('./routes/admin');
var hbs = require('express-handlebars');
var db= require('./config/connection');
var handlebarHelpers = require('./helpers/handlebarHelper')
var session = require('express-session');
var fileUpload = require('express-fileupload')
var app = express();

const i18next = require('i18next');
const i18nextMiddleware = require('i18next-express-middleware');
const Backend = require('i18next-node-fs-backend');


i18next
  .use(i18nextMiddleware.LanguageDetector)
  .use(Backend)
  .init({
    backend: {
      loadPath: __dirname + '/locales/{{lng}}/{{ns}}.json'
    },
    debug: false,
    detection: {
      order: ['querystring', 'cookie'],
      caches: ['cookie']
    },
    preload: ['en', 'ar'],
    saveMissing: true,
    fallBackLng: ['en']

  });
app.use(i18nextMiddleware.handle(i18next));
// var handlebarHelpers={eqIf:(arg1,arg2)=>{
//   return arg1 == arg2 ? true :false
// }}

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');
app.engine('hbs',hbs({partialsDir: __dirname+'/views/partials',layoutsDir: __dirname + '/views/layouts', extname: 'hbs', defaultLayout: 'layout', helpers:handlebarHelpers}))

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(fileUpload())
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({secret:"alsafab!@",  resave: false, saveUninitialized: true, cookie:{maxAge:6000000}}))

db.connect((err)=>{
  if(err){
    console.log("Error Connecting Database!!!  " + err)
  }
  else{
    console.log("Database Connected...")
  }
})

app.use('/', indexRouter);
app.use('/admin', adminRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
