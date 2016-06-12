"use strict";

const log = require("../core").log;

class User {
  constructor(info) {

    this.devices = [];

    this.handlers = [];

    this.listeners = {
      broadcast: [],
      peer: []
    };

    this.state = [0, 0, 0, 0, 0, 0, 0, 1];
    this.userName = info.userName;
    this.app = info.app;
  }

  addEventListener(evt, thunk) {
    if (this.listeners[evt]) {
      this.listeners[evt].push(thunk);
    }
  }

  peer(toUser) {
    const evt = {
      fromUser: this,
      toUserName: toUser
    };
    for (var i = 0; i < this.listeners.peer.length; ++i){
      this.listeners.peer[i](evt);
    }
  }

  addDevice(socket, users) {
    //
    // find a slot in which to put the socket
    //
    var index = 0;
    while (index < this.devices.length && this.devices[index]) {
      ++index;
    }

    log("Device added for $1", this.userName);
    this.devices[index] = socket;

    //
    // bind the events
    //
    var handlers = {
      userState: function (state) {
        this.state = state;
        this.broadcast(index, "userState", this.getPackage());
      }.bind(this),
      chat: this.chat.bind(this),
      logout: this.disconnect.bind(this, index),
      disconnect: this.disconnect.bind(this, index),
      peer: this.peer.bind(this),
      offer: null,
      answer: null,
      ice: null
    };

    this.handlers[index] = handlers;

    socket.on("userState", handlers.userState);
    socket.on("chat", handlers.chat);
    socket.on("logout", handlers.logout);
    socket.on("disconnect", handlers.disconnect);
    socket.on("peer", handlers.peer);

    //
    // notify the new client of all of the users currently logged in
    //
    var userList = [];
    for (var key in users) {
      var user = users[key];
      if (user.isConnected && user.userName !== this.userName) {
        userList.push(user.getPackage());
      }
    }
    socket.emit("userList", userList);

    if (index === 0) {
      //
      // notify all of the users of a new user
      //
      this.broadcast(index, "userJoin", this.getPackage());
    }
    else {
      //
      // notify all of the other devices of the new socket.
      //
      this.emit(index, "deviceAdded", index);
      //
      // notify the new socket of all of the other devices.
      //
      for(var i = 0; i < this.devices.length; ++i){
        if(i !== index){
          socket.emit("deviceAdded", i);
        }
      }

      //
      // notify the new socket of its user state.
      //
      socket.emit("userState", this.getPackage());
    }
    //
    // notify the device of its own socket index.
    //
    socket.emit("deviceIndex", index);
  }

  getPackage() {
    return [this.userName].concat(this.state);
  }

  broadcast(skipIndex) {
    var args = Array.prototype.slice.call(arguments, 1),
      evt = {
        app: this.app,
        userName: this.userName,
        skipSocketIndex: skipIndex,
        args: args
      };

    for (var i = 0; i < this.listeners.broadcast.length; ++i) {
      var thunk = this.listeners.broadcast[i];
      thunk(evt);
    }
  }

  emit(skipIndex) {
    var args = Array.prototype.slice.call(arguments, 1);
    for (var i = 0; i < this.devices.length; ++i) {
      if (i !== skipIndex && this.devices[i]) {
        this.devices[i].emit.apply(this.devices[i], args);
      }
    }
  }

  get isConnected() {
    var devicesLeft = 0;
    for (var i = 0; i < this.devices.length; ++i) {
      if (this.devices[i]) {
        ++devicesLeft;
      }
    }
    return devicesLeft > 0;
  }

  chat(text) {
    log("[$1]: $2", this.userName, text);
    this.broadcast(-1, "chat", {
      userName: this.userName,
      text: text
    });
  }

  disconnect(index) {
    const socket = this.devices[index],
      handlers = this.handlers[index];
    this.devices[index] = null;
    this.handlers[index] = null;

    for(let key in handlers){
      if(handlers[key]){
        socket.removeListener(key, handlers[key]);        
      }
    }

    if (this.isConnected) {
      log("Device #$1 lost for $2.", index, this.userName);
      this.emit(index, "deviceLost", index);
    }
    else {
      log("disconnect = $1.", this.userName);
      this.broadcast(-1, "userLeft", this.userName);
      this.devices.splice(0);
    }
    socket.emit("logoutComplete");
  }
}

module.exports = User;