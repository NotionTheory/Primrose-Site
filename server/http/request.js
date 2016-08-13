﻿"use strict";
const requestors = {
    "http:": require("http"),
    "https:": require("https")
  },
  URL = require("url");

module.exports = (method, type, url, options) => {
  return new Promise(function (resolve, reject) {
    options = options || {};
    options.headers = options.headers || {};
    options.headers.Accept = options.headers.Accept || type;

    if (options.data) {
      if(!options.headers["Content-Type"]){
        options.headers["Content-Type"] = "application/json;charset=UTF-8";
      }
      else {
        options.headers["Content-Type"] = "text/plain;charset-UTF-8";
        if(typeof options.data !== "string" && !(options.data instanceof String)) {
          var output = Object.keys(options.data)
            .map((key) => key + "=" + options.data[key])
            .join("\n");
          console.log("Request body:");
          console.log(output);
          options.data = output;
        }
      }
    }

    var reqOptions = URL.parse(url);
    reqOptions.headers = {};
    for (var key in options.headers) {
      reqOptions.headers[key] = options.headers[key];
    }
    const req = requestors[reqOptions.protocol]
      .request(reqOptions);

    req.on("response", function (res) {
      res.setEncoding("utf8");
      var output = "";
      res.on("data", function (chunk) {
        output += chunk;
      });
      res.on("end", function () {
        res.body = output;
        resolve(res);
      });
    });

    req.on("error", reject);

    if (options.data) {
      req.end(JSON.stringify(options.data));
    }
    else {
      req.end();
    }
  });
};