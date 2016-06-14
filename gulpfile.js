var gulp = require("gulp"),
concat = require("gulp-concat"),
cssmin = require("gulp-cssmin"),
data = require("gulp-data"),
exec = require("child_process").exec,
fs = require("fs"),
primroseInfo = require("../Primrose/package.json"),
pug = require("gulp-pug"),
recurseDirectory = require("./server/recurseDirectory"),
rename = require("gulp-rename"),
uglify = require("gulp-uglify"),
zip = require("gulp-zip"),
pathX = /.*\/(.*).js/;

function X(name, cmd, deps){
  gulp.task(name, deps || [], function(cb){
    exec(cmd, function (err, stdout, stderr) {
      console.log(stdout);
      console.log(stderr);
      cb(err);
    });
  });
}

X("build:primrose", "cd ../Primrose && gulp release");

function doCopy () {
  return gulp.src(primroseInfo.files.map(function (f) {
    f = "../Primrose/" + f;
    if (f[f.length - 1] === "/") {
      f += "**/*";
    }
    return f;
  }).concat(["!../Primrose/src/**/*", "!../Primrose/StartHere*", "../Primrose/meeting/**/*"]), 
  { base: "../Primrose" })
  .pipe(gulp.dest("."));
}

gulp.task("copy:primrose", ["build:primrose"], doCopy);

gulp.task("just:copy:primrose", doCopy);

X("build:primrose-debug", "cd ../Primrose && gulp debug", ["copy:primrose"]);

gulp.task("cssmin", ["copy:primrose"], function () {
  return gulp.src(["stylesheets/*.css", "!stylesheets/*.min.css"])
  .pipe(rename({ suffix: ".min" }))
  .pipe(cssmin())
  .pipe(gulp.dest("stylesheets"));
});

gulp.task("zip:quickstart", ["cssmin"], function () {
  return gulp.src(["quickstart/**/*"])
  .pipe(zip("PrimroseQuickstart.zip"))
  .pipe(gulp.dest("."));
});

function fileSize(file) {
  var size = fs.lstatSync(file).size,
  labelIndex = 0,
  sizeLabels = ["B", "KB", "MB", "GB", "TB"];
  while (size > 1000 && labelIndex < sizeLabels.length) {
    size /= 1000;
    ++labelIndex;
  }
  return size.toFixed(1) + sizeLabels[labelIndex];
}

function pugSite(pretty) {
  return function(){gulp.src(["*.jade"], { base: "." })
  .pipe(rename(function (path) {
    path.extname = "";
    return path;
  }))
  .pipe(data(function (file, callback) {
    var name = file.path.replace(/\\/g, "/"),
    parts = name.split("/")
    .map(function () {
      return "../";
    });

    parts.pop();

    callback(null, {
      version: primroseInfo.version,
      filePath: name,
      cssExt: ".css",
      jsExt: ".js",
      fileRoot: parts.join(""),
      fileSize: fileSize
    });
  }))
  .pipe(pug({ pretty: pretty }))
  .on("error", console.error.bind(console, "PUG ERROR"))
  .pipe(gulp.dest("."));
}
}

gulp.task("pug:site", ["zip:quickstart"], pugSite(false));
gulp.task("just:pug:site", pugSite(true));

gulp.task("default", ["pug:site", "cssmin"]);
