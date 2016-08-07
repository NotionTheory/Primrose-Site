"use strict";

const User = require("./data/User"),
  userDB = require("./data/users"),
  activeUsers = {},
  options = require("./options").parse(process.argv),
  isDev = options.mode === "dev" || process.env.NODE_ENV === "dev";

function makeIdentKey(identity){
  return identity
    && identity.userName
    && identity.appKey
    && (identity.appKey.toLocaleUpperCase().trim()
      + ":"
      + identity.userName.toLocaleUpperCase().trim());
}

function broadcast(evt) {
  for (var key in activeUsers) {
    var toUser = activeUsers[key];
    if (toUser.appKey === evt.appKey) {
      toUser.emit
        .bind(toUser, (toUser.userName === evt.userName) ? evt.skipSocketIndex : -1)
        .apply(toUser, evt.args);
    }
  }
}

function peer(evt) {
  var fromUser = activeUsers[evt.fromUserName],
    toUser = activeUsers[evt.toUserName];

  if (fromUser && toUser && fromUser.appKey === toUser.appKey) {
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

function listUsers(evt){
  var fromUser = activeUsers[evt.fromUserName];
  if(fromUser){
    var fromIndex = evt.fromUserIndex || 0,
      fromSocket = fromUser.devices[fromIndex];
    if(fromSocket){
      var userList = [];
      for (var key in activeUsers) {
        var user = activeUsers[key];
        if (user.isConnected &&
          user.appKey === fromUser.appKey &&
          (user.userName !== fromUser.userName || fromIndex > 0)) {
          userList.push(user.getPackage());
        }
      }
      fromSocket.emit("userList", userList);
    }
  }
}

function setUser(socket, identity, key, user){
  if (!activeUsers[key]) {
    if(user) {
      user.appKey = identity.appKey;
    }
    activeUsers[key] = new User(user || identity);
    activeUsers[key].addEventListener("broadcast", broadcast);
    activeUsers[key].addEventListener("peer", peer);
    activeUsers[key].addEventListener("listUsers", listUsers);
  }

  activeUsers[key].addDevice(socket, identity.appKey);
}

function receiveHash(socket, verb, identity, key, user, hash) {
  Promise.resolve().then(() => {
    if (user.userName === key && (verb === "login" && user.hash === hash || verb === "signup" && user.hash === null && hash)) {
      setUser(socket, identity, key, user);
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
    var msg = exp.message || exp;
    console.error(msg);
    socket.emit("errorDetail", msg);
  });
}

function setup(socket, verb, thunk){
  return (identity) => {
    const key = makeIdentKey(identity);
    if(key){
      identity.appKey = identity.appKey.toLocaleUpperCase();
      identity.userName = identity.userName.toLocaleUpperCase();
      console.log("Trying to %s %s", verb, key);
      thunk(identity, key);
    }
    else {
      socket.emit(verb + "Failed", "no user name/appKey was received at the server.");
      if (isDev) {
        var msg = "have identity: " + !!identity +
          ", userName: " + (identity && identity.userName) +
          ", appKey: " + (identity && identity.appKey) +
          ", key: " + key;
        console.error(msg);
        socket.emit("errorDetail", msg);
      }
    }
  }
}

function userAuth(socket, verb) {
  return setup(socket, verb, (identity, key) => {
    userDB.search(identity.userName).then((users) => {
      if (verb === "login" && users.length > 0 || verb === "signup" && users.length === 0) {
        var user = users[0] || {
          userName: identity.userName,
          salt: userDB.newSalt(),
          hash: null,
          email: identity.email,
          lastLogin: null,
          appKey: null
        };
        socket.once("hash", receiveHash.bind(null, socket, verb, identity, key, user));
        socket.emit("salt", user.salt);
      }
      else if(verb === "login") {
        socket.emit("loginFailed", "the user '[USER]' does not exist.");
      }
      else {
        socket.emit("signupFailed", "the user name '[USER]' already exists.");
      }
    });
  });
}

function guestLogin(socket) {
  return setup(socket, "login", (identity, key) => {
    setUser(socket, identity, key);
  });
}

module.exports = function (socket) {
  console.log("New connection!");

  socket.on("login", userAuth(socket, "login"));
  socket.on("signup", userAuth(socket, "signup"));
  socket.on("guest", guestLogin(socket));
};
