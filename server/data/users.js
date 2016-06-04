"use strict";

const crypto = require("crypto"),
  db = require("./db.js");

db.define("users", [
  ["userName", "PartitionKey", "String"]
]);

function makeNewSalt() {
  var bytes = crypto.randomBytes(256);
  var salt = "";
  for (var i = 0; i < bytes.length; ++i) {
    salt += bytes[i].toString(16);
  }
  return salt;
}

function getUser(userName) {
  return db.get("users", userName, "");
}

function searchUsers() {
  return db.search("users");
}

function getSalt(userName){
  return getUser(userName).catch((err) => {
    if (process.env.NODE_ENV === "dev" && err.statusCode === 404) {
      var salt = makeNewSalt(),
        user = {
          name: userName,
          RowKey: "",
          salt: salt
        };
      return setUser(user).then(() => user);
    }
    else {
      console.error("Error getting user salt value", err);
      throw err;
    }
  }).then((user) => user.salt);
}

function getLoggedInUser(cookies) {
  var token = getCookie(cookies, "token");
  if (token !== null && token !== undefined) {
    return searchUsers().then((users) => users.filter((u) => u.token === token)[0]);
  }
}

function logout(cookies){
  return getLoggedInUser(cookies).then((user) => {
    if (user) {
      user.token = "logged-out";
      return setUser(user);
    }
  });
}

function setUser(user) {
  return db.set("users", user);
}

function getCookie(cookies, name) {
  var vals = cookies.map((c) => c[name]).filter((s) => s);
  return vals[0];
}

function deleteUser (obj) {
  return db.delete("users", obj.name, "");
}

function authenticate(userName, hash){
  return getUser(userName).then((user) => {
    if (hash) {
      if (user.hash !== hash && process.env.NODE_ENV === "dev") {
        user.hash = hash;
      }

      if (user.hash === hash) {
        user.token = makeNewSalt();
        return setUser(user).then(() => user);
      }
    }
  });
}

module.exports = {
  getLoggedInUser: getLoggedInUser,
  logout: logout,
  get: getUser,
  search: searchUsers,
  getSalt: getSalt,
  delete: deleteUser,
  authenticate: authenticate
};