"use strict";

const core = require("./core.js"),
  fs = require("fs"),
  http = require("http"),
  mime = require("mime"),
  stream = require("stream"),
  headerTranslation = {
    length: "content-length",
    mime: "content-type"
  };

class Message {
  constructor(httpStatusCode, httpBody, httpHeaders) {
    this.statusCode = httpStatusCode;

    this.headers = {};
    if (httpHeaders !== undefined && httpHeaders !== null) {
      for (var k in httpHeaders) {
        var key = k.toLowerCase();
        key = headerTranslation[key] || key;
        this.headers[key] = httpHeaders[k];
      }
    }

    this.cookies = [];

    if (this.statusCode < 400 && this.headers["connection"] === undefined) {
      this.headers["connection"] = "keep-alive";
    }

    this.body = httpBody;
  }

  cookie(c) {
    this.cookies.push(c);
    return this;
  }

  get body() {
    return this._body;
  }

  set body(httpBody) {

    this._body = httpBody || "";

    if (typeof this._body !== "string" && !(this._body instanceof stream.Readable)) {
      var type = typeof this._body;
      if (type !== "object") {
        this._body = {
          type: type,
          value: this._body
        };
      }
      this._body = JSON.stringify(this._body);
      this.headers["content-type"] = "application/json";
    }

    if (typeof this._body === "string") {
      this.headers["content-length"] = this._body.length;
    }
    else if (this.length === undefined || this.length === null) {
      throw new Error("You must provide a content-length header when using Readable streams for content bodies.");
    }
    else if (this.length > 0 && (this.mime === undefined || this.mime === null)) {
      throw new Error("You must provide a content-type for the responses that have length greater than 0.");
    }
  }

  get length() {
    return this.headers["content-length"];
  }

  get mime() {
    return this.headers["content-type"];
  }

  send(response) {
    if (response.finished) {
      console.trace("Can't send a message over a finished response object.");
    }
    else {

      this.headers["set-cookie"] = this.cookies.map((cookie) => Object.keys(cookie)
        .filter((key) => cookie[key] !== false)
        .map((key) => {
          return cookie[key] === true ? key : key + "=" + cookie[key];
        })
        .join("; "));


      var header = [];
      for (var key in this.headers) {
        var values = this.headers[key];
        if (!(values instanceof Array)) {
          values = [values];
        }
        values.forEach((v) => header.push([key, v]));
      }
      response.writeHead(this.statusCode, header);
      if (this.length === 0) {
        response.end();
      }
      else if (typeof this.body === "string") {
        response.end(this.body);
      }
      else if (this._body instanceof stream.Readable) {
        this.body.pipe(response);
      }
      else {
        // eeeh, what?
        throw new Error("INCONSISTENT STATE!!!");
      }
    }
  }


  static json(obj) {
    return new Message(200, obj, {
      mime: "application/json"
    });
  }

   static text(txt) {
    return new Message(200, txt, {
      mime: "text/plain"
    });
  }

  static html(html) {
    return new Message(200, html, {
      mime: "text/html"
    });
  }

  static noContent(){ 
    return new Message(204);
  }

  static file(fileName) {
    return new Promise((resolve, reject) => {
      fs.lstat(fileName, (err, stat) => {
        if (err) {
          resolve(Message.NotFound);
        }
        else if (stat.isDirectory()) {
          resolve(Message.redirect(fileName + "/"));
        }
        else {
          resolve(new Message(200, fs.createReadStream(fileName), {
            mime: mime.lookup(fileName) || "application/octet-stream",
            length: stat.size
          }));
        }
      });
    });
  }

  static redirect(url) {
    return new Message(307, null, {
      "location": url
    });
  }
}

Message.BadRequest = new Message(400);
Message.Unauthorized = new Message(401);
Message.PaymentRequired = new Message(402);
Message.Forbidden = new Message(403);
Message.NotFound = new Message(404);
Message.MethodNotAllowed = new Message(405);
Message.NotAcceptable = new Message(406);
Message.ProxyAuthenticationRequired = new Message(407);
Message.RequestTimeout = new Message(408);
Message.Conflict = new Message(409);
Message.Gone = new Message(410);
Message.LengthRequired = new Message(411);
Message.PreconditionFailed = new Message(412);
Message.PayloadTooLarge = new Message(413);
Message.URITooLong = new Message(414);
Message.UnsupportedMediaType = new Message(415);
Message.RangeNotSatisfiable = new Message(416);
Message.ExpectationFailed = new Message(417);
Message.IAmATeapot = new Message(418);
Message.MisdirectedRequest = new Message(421);
Message.UnprocessableEntity = new Message(422);
Message.Locked = new Message(423);
Message.FailedDependency = new Message(424);
Message.UpgradeRequired = new Message(426);
Message.PreconditionRequired = new Message(428);
Message.TooManyRequests = new Message(429);
Message.RequestHeaderFieldsTooLarge = new Message(431);
Message.UnavailableForLegalReasons = new Message(451);

Message.InternalServerError = new Message(500);
Message.NotImplemented = new Message(501);

module.exports = Message;