"use strict";
// start the HTTP server
const options = require("./server/options").parse(process.argv),
  fs = require("fs"),
  http = require("http"),
  https = require("https"),
  path = options.path || ".",
  webServer = require("./server/webServer")(path),
  keys = {
    key: maybeGetFile("../primrosevr_com.key"),
    cert: maybeGetFile("../primrosevr_com.crt"),
    ca: maybeGetFile("../CACert.crt")
  };


console.log("Serving from directory " + path);

function maybeGetFile(file) {
  if (fs.existsSync(file)) {
    return fs.readFileSync(file);
  }
}

let appServer = null,
  isSecure = !!(keys.key && keys.cert);
if (isSecure) {
  console.log("starting secure server");
  isSecure = true;
  appServer = https.createServer(keys, webServer);
}
else {
  console.log("starting insecure server", keys);
  appServer = http.createServer(webServer)
}

const port = options.port || process.env.PORT || (isSecure ? 443 : 80);
console.log("Listening on port " + port);
appServer.listen(port);

// start the WebSocket server
if(process.env.NODE_ENV !== "dev" || options.mode !== "localOnly"){
  const webSocketServer = require("./server/webSocketServer"),
  socketio = require("socket.io"),
  io = socketio.listen(appServer);
  io.configure(function () {
    io.set("transports", ["websocket", "xhr-polling"]);
  });
  io.sockets.on("connection", webSocketServer);
}

// start the browser
if (process.env.NODE_ENV === "dev" && options.url) {
  require("./server/starter")(isSecure, port, options.url);
}