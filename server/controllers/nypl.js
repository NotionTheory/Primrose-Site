"use strict";

const getObject = require("../http/getObject");

//http://api.repo.nypl.org/

module.exports = {
  URLPattern: /^\/nypl\/?(?:\?(q=[^&]+))?/,
  GET: (state) => {
    return getObject("http://api.repo.nypl.org/api/v1/items/search?q=stereo&publicDomainOnly=true", {
      headers: {
        Authorization: "Token token=" + process.env.NYPL_TOKEN
      }
    }).then((output) => Message.json(output))
    .catch(serverError);
  }
};