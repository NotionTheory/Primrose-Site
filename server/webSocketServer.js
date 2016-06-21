"use strict";

const core = require("./core"),
  log = core.log,
  err = core.err,
  User = require("./data/User"),
  userDB = require("./data/Users"),
  activeUsers = {},
  DEBUG = process.env.NODE_ENV === "dev";

function broadcast(evt) {
  for (var key in activeUsers) {
    var toUser = activeUsers[key];
    if (toUser.app === evt.app) {
      toUser.emit
        .bind(toUser, (toUser.userName === evt.userName) ? evt.skipSocketIndex : -1)
        .apply(toUser, evt.args);
    }
  }
}

function peer(evt) {
  var fromUser = activeUsers[evt.fromUserName],
    toUser = activeUsers[evt.toUserName];

  if (fromUser && toUser && fromUser.app === toUser.app) {
    var fromIndex = evt.fromUserIndex || 0,
      toIndex = evt.toUserIndex || 0,
      fromSocket = fromUser.devices[fromIndex],
      toSocket = toUser.devices[toIndex];

    if (fromSocket && toSocket) {
      ["offer", "answer", "ice"].forEach((evtName) => {
        const thunk = (obj) => toSocket.emit(evtName, obj);
        fromUser.handlers[fromIndex][evtName] = thunk;
        fromSocket.on(evtName, thunk);
      });

      toSocket.emit("peer", evt);
    }
    else{
      console.error("peer error", evt);
    }
  }
}

module.exports = function (socket) {
  log("New connection!");
  var key = null,
    identity = null;

  function receiveHash(verb, user, hash) {
    Promise.resolve().then(() => {
      if (user.userName === key && (verb === "login" && user.hash === hash || verb === "signup" && user.hash === null && hash)) {
        if (!activeUsers[key]) {
          user.app = identity.app;
          activeUsers[key] = new User(user);
          activeUsers[key].addEventListener("broadcast", broadcast);
          activeUsers[key].addEventListener("peer", peer);
        }

        activeUsers[key].addDevice(socket, identity.app, activeUsers);
        user.hash = hash;
        user.lastLogin = new Date();
        return userDB.set(user);
      }
      else if(verb === "login") {
        throw new Error("user name and password do not match.");
      }
      else {
        throw new Error("no password was received at the server.");
      }
    }).catch((exp) => {
      socket.emit(verb + "Failed", exp.message);
      socket.emit("errorDetail", err(exp.message || exp));
    });
  }

  function userAuth(verb) {
    return (ident) => {
      identity = ident;
      key = identity
        && identity.userName
        && identity.userName.toLocaleUpperCase().trim();
      if (key) {
        log("Trying to $1 $2", verb, key);
        userDB.search(key).then((users) => {
          if (verb === "login" && users.length > 0 || verb === "signup" && users.length === 0) {
            var user = users[0] || {
              userName: key,
              salt: userDB.newSalt(),
              hash: null,
              email: identity.email,
              lastLogin: null,
              app: null
            };
            socket.once("hash", receiveHash.bind(null, verb, user));
            socket.emit("salt", user.salt);
          }
          else if(verb === "login") {
            socket.emit("loginFailed", "the user '[USER]' does not exist.");
          }
          else {
            socket.emit("signupFailed", "the user name '[USER]' already exists.");
          }
        });
      }
      else {
        socket.emit(verb + "Failed", "no user name was received at the server.");
        if (DEBUG) {
          socket.emit("errorDetail", err("have identity: $1, userName: $2, key: $3", !!identity, identity && identity.userName, key));
        }
      }
    };
  }

  socket.on("login", userAuth("login"));
  socket.on("signup", userAuth("signup"));
};
