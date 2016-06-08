"use strict";

const log = require("../core").log;

class User {
  constructor(info) {

    this.devices = [];

    this.handlers = [];

    this.listeners = {
      broadcast: []
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

  peer(fromIndex, toIndex){
    // wire up the WebRTC handshaking
    const fromSocket = this.devices[fromIndex],
    toSocket = this.devices[toIndex];
    if(fromSocket && toSocket){
      const webrtc = ["offer", "answer", "ice"].map((evtName) =>{
        return {
          name: evtName,
          thunk: (obj) => toSocket.emit(evtName, obj)
        };
      });

      webrtc.forEach((evt) => {
        this.handlers[fromIndex][evt.name] = evt.thunk;
        fromSocket.on(evt.name, evt.thunk);
      });

      // notify all of the peers of the new socket
      this.emit(fromIndex, "user", fromIndex);
      for(var i = 0; i < this.devices.length; ++i){
        if(i !== fromIndex){
          fromSocket.emit("blah");
        }
      }
      this.devices
      .filter((skt) => skt && skt !== socket)
      .forEach((skt, i) => {
        skt.emit("user", i, index);
        socket.emit("user", index, i);
      });
    }
  }

  voice(index, toUser){

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
      peer: this.peer.bind(this, index),
      voice: this.voice.bind(this, index),
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
    socket.on("voice", handlers.voice);

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
      // notify all of the user's devices that a new device was connected,
      // then update them on the user's current state.
      //
      this.emit(index, "deviceAdded");
      socket.emit("userState", this.getPackage());
    }
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
      this.emit(index, "deviceLost");
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