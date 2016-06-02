"use strict";

module.exports = require("./requireDirectory")("socketControllers").reduce((obj, ctrl) => {
  obj[ctrl.handshake] = ctrl.bindSocket;
  return obj;
}, {});