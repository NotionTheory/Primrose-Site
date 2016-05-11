var gulp = require("gulp"),
  concat = require("gulp-concat"),
  cssmin = require("gulp-cssmin"),
  data = require("gulp-data"),
  fs = require("fs"),
  primroseInfo = require("primrose/package.json"),
  pug = require("gulp-pug"),
  recurseDirectory = require("./server/recurseDirectory"),
  rename = require("gulp-rename"),
  uglify = require("gulp-uglify"),
  zip = require("gulp-zip"),
  pathX = /.*\/(.*).js/;

gulp.task("copy:primrose", function () {
  return gulp.src([
    "node_modules/primrose/*",
    "!node_modules/primrose/package.json",
    "node_modules/primrose/doc/**/*",
    "node_modules/primrose/quickstart/**/*"], { base: "node_modules/primrose" })
    .pipe(gulp.dest("."));
});

gulp.task("cssmin", function () {
  return gulp.src(["stylesheets/*.css", "!stylesheets/*.min.css"])
    .pipe(data(console.log.bind(console)))
    .pipe(rename({ suffix: ".min" }))
    .pipe(cssmin())
    .pipe(gulp.dest("stylesheets"));
});

gulp.task("zip:quickstart", ["copy:primrose"], function () {
  return gulp.src(["quickstart"])
    .pipe(zip("quickstart.zip"))
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

gulp.task("pug:site", function () {
  return gulp.src(["*.jade"], { base: "." })
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
    .pipe(pug({
      pretty: true
    }))
    .on("error", console.error.bind(console, "PUG ERROR"))
    .pipe(gulp.dest("."));
});

gulp.task("default", ["zip:quickstart", "pug:site", "cssmin"]);