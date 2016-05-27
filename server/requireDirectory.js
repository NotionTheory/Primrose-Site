var fs = require("fs");

module.exports = function requireDirectory(path) {
  var root = "./server/",
    output = [],
    directories = [path];
  while (directories.length > 0) {
    var dir = directories.shift(),
      files = fs.readdirSync(root + dir);
    files.forEach((file) => {
      var subpath = dir + "/" + file
        stat = fs.lstatSync(root + subpath);
      if (stat.isDirectory()) {
        directories.push(root + subpath);
      }
      else if (/\.js(on)?$/.test(file)) {
        output.push(require("./" + subpath));
      }
    });
  }
  return output;
};