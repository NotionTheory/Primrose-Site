"use strict";
const core = require("../core"),
log = core.log,
err = core.err,
User = require("../data/User"),
userDB = require("../data/Users"),
activeUsers = {};

function makeKey(identity) {
  return identity
  && identity.userName
  && identity.userName.toLocaleUpperCase().trim();
}

function broadcast(evt){
  for (var key in activeUsers) {
    var toUser = activeUsers[key];
    if (toUser.state.app === evt.app) {
      toUser.emit
      .bind(toUser, (toUser.state.userName === evt.userName) ? evt.skipSocketIndex : -1)
      .apply(toUser, evt.args);
    }
  }
}

module.exports = {
  handshake: "login",
  bindSocket: (socket) => {
    var key = null,
    identity = null;

    function receiveHash(name, hash) {
      userDB.authenticate(key, hash, identity.email)
      .then((user) => {
        if (!user) {
          throw new Error(err("[$1] > failed to authenticate.", key));
        }

        if(!activeUsers[key]){
          activeUsers[key] = new User(user, identity.app);
          activeUsers[key].addEventListener("broadcast", broadcast);
        }
        else if (activeUsers[key].state.app !== identity.app) {
          throw new Error(err("User [$1] tried to log into two apps: $2 and $3.", key, activeUsers[key].state.app, identity.app));
        }

        activeUsers[key].addDevice(socket, activeUsers);
      }).catch((exp) => socket.emit(name + "Failed", err(exp.message || exp)));
    }

    function userAuth(name, failOnMatch, getSalt) {
      return (ident) => {
        identity = ident;
        key = makeKey(identity);
        if (!key) {
          socket.emit(name + "Failed");
        }
        else {
          log("Trying to $1 $2", name, key);
          userDB.search(key).then((matches) => {
            if ((matches.length > 0) === failOnMatch) {
              socket.emit(name + "Failed");
            }
            else {
              socket.once("hash", receiveHash.bind(null, name));
              socket.emit("salt", getSalt(matches));
            }
          });
        }
      };
    }

    socket.on("login", userAuth("login", false, (matches) => matches[0].salt));
    socket.on("signup", userAuth("signup", true, (_) => userDB.newSalt()));
  }
};
