"use strict";

const core = require("./core"),
  log = core.log,
  err = core.err,
  User = require("./data/User"),
  userDB = require("./data/Users"),
  activeUsers = {},
  DEBUG = process.env.ENV === "dev",
  ERROR_MESSAGE = "Invalid userName/password.";

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

function peer(evt){
  var fromUser = evt.fromUser,
    toUser = activeUsers[evt.toUserName];
  if(fromUser && toUser && fromUser.app === toUser.app){
    var fromIndex = evt.fromIndex || 0,
      toIndex = evt.toIndex || 0,
      fromSocket = fromUser.devices[fromIndex],
      toSocket = toUser.devices[toIndex];
    if(fromSocket && toSocket){
      ["offer", "answer", "ice"].forEach((evtName) =>{
        const thunk = (obj) => toSocket.emit(evtName, obj);
        fromUser.handlers[fromIndex][evtName] = thunk;
        fromSocket.on(evtName, thunk);
      });
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
        else if (activeUsers[key].app !== identity.app) {
          throw new Error(err("User [$1] tried to log into two apps: $2 and $3.", key, activeUsers[key].app, identity.app));
        }

        activeUsers[key].addDevice(socket, activeUsers);
        user.hash = hash;
        user.lastLogin = new Date();
        return userDB.set(user);
      }
      else if (DEBUG) {
        throw new Error(err("verb: $1, user.userName: $2, key: $3, user.hash: $4, hash: $5", verb, user.userName, key, user.hash, hash));
      }
      else {
        throw new Error(ERROR_MESSAGE);
      }
    }).catch((exp) => socket.emit(verb + "Failed", err(exp.message || exp)));
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
          else if (DEBUG) {
            socket.emit(verb + "Failed", err("verb: $1, #users: $2", verb, users.length));
          }
          else {
            socket.emit(verb + "Failed", ERROR_MESSAGE);
          }
        });
      }
      else if (DEBUG) {
        socket.emit(verb + "Failed", err("have identity: $1, userName: $2, key: $3", !!identity, identity && identity.userName, key));
      }
      else {
        socket.emit(verb + "Failed", ERROR_MESSAGE);
      }
    };
  }

  socket.on("login", userAuth("login"));
  socket.on("signup", userAuth("signup"));
};
