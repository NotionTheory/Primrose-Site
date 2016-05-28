"use strict";
const log = require("../core").log,
 peerGroup = {};

module.exports = {
  handshake: "peer",
  bindSocket: (socket) => {
    socket.on("joinRequest", function (name) {
      
      // make some space for newly connected peerGroup
      if (peerGroup[name] === undefined) {
        peerGroup[name] = [];
      }
      
      // get the list of sockets for the current user
      var sockets = peerGroup[name];
      
      // find an empty slot
      var index;
      for (index = 0; index < sockets.length; ++index) {
        if (!sockets[index]) {
          break;
        }
      }
      
      // put the new socket in the empty slot
      sockets[index] = socket;
      
      // wire up the WebRTC handshaking
      const webrtc = ["offer", "answer", "ice"].map((o) => {
        const thunk = (obj) => {
          const skt = sockets[obj.toIndex];
          if (skt) {
            skt.emit(o, obj);
          }
        };
        socket.on(o, thunk);
        return {
          name: o,
          thunk: thunk
        };
      });

      // we only nullify, don't remove the sockets because
      // then we'd have to communicate the changes in index
      // to all the peers.
      function removeSocket() {
        let userDisconnected = true;
        for (let i = 0; i < sockets.length; ++i) {
          if (sockets[i] === socket) {
            socket.off("error", removeSocket);
            socket.off("disconnect", removeSocket);
            webrtc.forEach((handler) => socket.off(handler.name, handler.thunk));
            sockets[i] = null;
            break;
          }
          else if(sockets[i] !== null){
            userDisconnected = false;
          }
        }

        if(userDisconnected){
          delete peerGroup[name];
        }
      }
      
      socket.on("error", removeSocket);
      socket.on("disconnect", removeSocket);
      
      // notify all of the peers of the new socket
      sockets
      .filter((skt) => !!skt && skt !== socket)
      .forEach((skt, i) => {
        skt.emit("user", i, index);
        socket.emit("user", index, i);
      });
    });
  }
};
