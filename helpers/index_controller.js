var express = require('express');
var router = express.Router();
const i18next = require('i18next');


class IndexController {
   static list(req, res, next) {
    next()
  }
}

module.exports = IndexController;