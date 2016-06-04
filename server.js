"use strict";
// start the HTTP server
const options = require("./server/options").parse(process.argv),
  http = require("http"),
  path = options.path || ".",
  webServer = require("./server/webServer")(path),
  appServer = http.createServer(webServer),
  port = options.port || process.env.PORT || 80;

console.log("Listening on port " + port);
console.log("Serving from directory " + path);
appServer.listen(port);

// start the WebSocket server
if(options.mode !== "localOnly"){
  const webSocketServer = require("./server/webSocketServer"),
  socketio = require("socket.io"),
  io = socketio.listen(appServer);
  io.sockets.on("connection", webSocketServer);
}

// start the browser
if (options.url) {
  require("./server/starter")(false, port, options.url);
}