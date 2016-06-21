"use strict";

const Message = require("./Message");

module.exports = (request, response) => Message.movedPermanently("https://" + request.headers.host + request.url).send(response);