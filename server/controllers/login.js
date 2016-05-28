"use strict";

const Message = require("../Message.js"),
  Users = require("../data/Users.js");

function time(n){
  return new Date(n).toGMTString();
}

module.exports = {
  URLPattern: /^\/(status|login|logout|hash)$/,
  GET: {
    "application/json": function (cmd, state) {
      if(cmd === "status"){
        return Message.json({
          loggedIn: !!Users.getLoggedInUser(state.cookies)
        });
      }
      else {
        return Message.MethodNotAllowed;
      }
    }
  },
  POST: {
    "application/json": function (cmd, state) {
      if (Users.getLoggedInUser(state.cookies) || cmd === "status") {
        return Message.MethodNotAllowed;
      }
      else if(cmd === "login"){
        return Users.getSalt(state.body.name)
        .then(Message.json);
      }
      else if (cmd === "hash"){
        return Users.authenticate(state.body.name, state.body.hash)
        .then((user) => {
          if (user) {
            return Message.noContent()
            .cookie({
              token: user.token,
              Expires: time(Date.now() + 60 * 60 * 1000)
            });
          }
          else {
            return Message.Unauthorized;
          }
        })
      } 
      else if (cmd === "logout") {
        return Users.logout(state.cookies)
        .then(() => Message.noContent()
          .cookie({ token: "", Expires: time(0) }));
      };
    }
  }
};
