"use strict";

var Message = require("../Message");

module.exports = {
  URLPattern: /^\/test\/?$/,
  GET: {
  	"*/*" : (state) => Message.text("Hello, world: " + JSON.stringify(state))
  }
};