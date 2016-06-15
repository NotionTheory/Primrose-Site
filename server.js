"use strict";
var err = require("./server/core").err;

try{  
  // start the HTTP server
  var options = require("./server/options").parse(process.argv),
    http = require("http"),
    socketio = require("socket.io"),
    path = options.path || ".",
    port = options.port || process.env.PORT,
    webServer = require("./server/webServer")(path),
    webSocketServer = require("./server/webSocketServer"),
    appServer = http.createServer(webServer),
    io = socketio.listen(appServer);
  
  
  console.log("Serving from directory " + path);
  console.log("Listening on port " + port);
  
  appServer.listen(port);
  io.sockets.on("connection", webSocketServer);
}
catch(exp){
  err(exp.message);
}