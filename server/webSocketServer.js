"use strict";

const socketControllers = require("./socketControllers"),
  log = require("./core").log;

module.exports = function (socket) {
  log("New connection!");
  socket.on("handshake", function (controllerName) {
    console.log("handshaking", controllerName);
    var controller = socketControllers[controllerName];
    if (controller) {
      controller(socket);
      socket.emit("handshakeComplete", controllerName);
    }
    else {
      log("unknown web socket controller type [$1]", controllerName);
      socket.emit("handshakeFailed", Object.keys(socketControllers));
    }
  });
};