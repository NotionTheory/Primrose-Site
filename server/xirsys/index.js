const secure = 1,
  root = "https://service.xirsys.com/",
  domain = "www.primrosevr.com",
  Message = require("../Message"),
  get = require("../http/getObject"),
  post = require("../http/postObject"),
  del = require("../http/delObject");

function req(thunk, path, params = {}){
  params.ident = "seanmcbeth";
  params.secret = process.env.XIRSYS_SECRET || require("../data/secrets.json").xirsysSecret;

  if(params.secret) {
    let sep = "?";
    for(var key in params){
      path += sep + key + "=" + params[key];
      sep = "&";
    }

    return thunk(root + path, {
      headers: {
        Accept: "*/*"
      }
    })
      .then((res) => res.body);
  }
  else {
    return Promise.resolve(null);
  }
}

module.exports = {
  signal: {
    token: (application = "default", room = "default") => req(get, "signal/token", {
      domain,
      application,
      room,
      secure
    }),
    list: () => req(get, "signal/list")
  },
  ice: (application = "default", room = "default") => req(get, "ice", {
    domain,
    application,
    room,
    secure
  }).then((obj) => obj && obj.d),
  domain: {
    get: () => req(get, "domain"),
    post: (domain) => req(post, "domain", { domain }),
    del: (domain) => req(del, "domain", { domain })
  },
  application: {
    get: (domain) => req(get, "application", { domain }, get),
    post: (domain, application) => req(post, "application", { domain, application }),
    del: (domain, application) => req(del, "application", { domain, application })
  },
  room: {
    get: (domain, application) => req(get, "room", { domain, application }),
    post: (domain, application, room) => req(post, "room", { domain, application, room }),
    del: (domain, application, room) => req(del, "room", { domain, application, room })
  }
};