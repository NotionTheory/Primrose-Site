"use strict";

const log = require("../core").log;

class User{
  constructor(info, app) {

    this.devices = [];

    this.handlers = [];

    this.listeners = {
      broadcast: []
    };

    this.state = {
      x: 0,
      y: 0,
      z: 0,
      dx: 0,
      dy: 0,
      dz: 0,
      heading: 0,
      dHeading: 0,
      isRunning: false,
      userName: info.userName,
      app: app
    };

    this.salt = info.salt;
    this.hash = info.hash;
    this.email = info.email;
  }

  addEventListener(evt, thunk){
    if(this.listeners[evt]){
      this.listeners[evt].push(thunk);
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

    log("Device added for $1", this.state.userName);
    this.devices[index] = socket;
    
    //
    // bind the events
    //
    var handlers = {
      onUserState: function (state) {
        this.state.x = state.x;
        this.state.y = state.y;
        this.state.z = state.z;
        this.state.heading = state.heading;
        this.state.isRunning = state.isRunning;
        this.state.app = state.app;
        this.broadcast(index, "userState", this.state);
      }.bind(this),
      onChat: User.prototype.chat.bind(this),
      onDisconnect: User.prototype.disconnect.bind(this, index)
    };
    socket.on("userState", handlers.onUserState);
    socket.on("chat", handlers.onChat);
    socket.on("logout", handlers.onDisconnect);
    socket.on("disconnect", handlers.onDisconnect);
    this.handlers[index] = handlers;
    
    //
    // notify the new client of all of the users currently logged in
    //
    var userList = [];
    for (var key in users) {
      var user = users[key];
      if (user.isConnected) {
        userList.push(user.state);
      }
    }
    socket.emit("userList", userList);

    if (index === 0) {
      //
      // notify all of the users of a new user
      //
      this.broadcast(index, "userJoin", this.state);
    }
    else {
      //
      // notify all of the user's devices that a new device was connected,
      // then update them on the user's current state.
      //
      this.emit(index, "deviceAdded");
      socket.emit("userState", this.state);
    }
  }

  broadcast(skipIndex) {
    var args = Array.prototype.slice.call(arguments, 1),
      evt = {
        app: this.state.app,
        userName: this.state.userName,
        skipSocketIndex: skipIndex,
        args: args
      };

    for(var i = 0; i < this.listeners.broadcast.length; ++i){
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
    log("[$1]: $2", this.state.userName, text);
    this.broadcast(-1, "chat", {
      userName: this.state.userName,
      text: text
    });
  }

  disconnect(index) {
    var socket = this.devices[index];
    this.devices[index].removeListener("userState", this.handlers[index].onUserState);
    this.devices[index].removeListener("chat", this.handlers[index].onChat);
    this.devices[index].removeListener("logout", this.handlers[index].onDisconnect);
    this.devices[index].removeListener("disconnect", this.handlers[index].onDisconnect);
    this.devices[index] = null;
    this.handlers[index] = null;
    if (this.isConnected) {
      log("Device #$1 lost for $2.", index, this.state.userName);
      this.emit(index, "deviceLost");
    }
    else {
      log("disconnect = $1.", this.state.userName);
      this.broadcast(-1, "userLeft", this.state.userName);
      this.devices.splice(0);
    }
    socket.emit("logoutComplete");
  }
}

module.exports = User;