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

function searchUsers(key) {
  return db.search("users", key);
}

function getSalt(userName){
  return getUser(userName).catch((err) => {
    if (process.env.NODE_ENV === "dev" && err.statusCode === 404) {
      var salt = makeNewSalt(),
        user = {
          userName: userName,
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

function setUser(user) {
  return db.set("users", user);
}

function deleteUser (obj) {
  return db.delete("users", obj.userName, "");
}

function authenticate(userName, hash, email) {
  return searchUsers(userName).then((users) => {
    var user = users.length > 0 ? users[0] : {
      userName: userName,
      hash: null,
      email: null,
      token: null
    };

    if (hash) {
      if (user.hash !== hash && process.env.NODE_ENV === "dev") {
        user.hash = hash;
      }

      if (user.hash === hash) {
        user.token = makeNewSalt();

        if (email) {
          user.email = email;
        }
        return setUser(user).then(() => user);
      }
    }
  });
}

module.exports = {
  get: getUser,
  set: setUser,
  search: searchUsers,
  newSalt: makeNewSalt,
  getSalt: getSalt,
  delete: deleteUser,
  authenticate: authenticate
};