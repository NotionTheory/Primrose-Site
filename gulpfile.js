var gulp = require("gulp"),
  concat = require("gulp-concat"),
  cssmin = require("gulp-cssmin"),
  data = require("gulp-data"),
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
  "node_modules/primrose/doc/**/*",
  "node_modules/primrose/quickstart/**/*"], {base: "node_modules/primrose"})
    .pipe(gulp.dest("."));
});

gulp.task("zip:quickstart", ["copy:primrose"], function () {
  return gulp.src(["quickstart"])
    .pipe(zip("quickstart.zip"))
    .pipe(gulp.dest("."));
});

gulp.task("pug:site", ["copy:primrose"], function () {
  return gulp.src(["**/*.jade", "**/*.pug"], { base: "." })
    .pipe(rename(function (path) {
      path.extname = "";
      return path;
    }))
    .pipe(data(function (file, callback) {
      var name = file.path.replace(/\\/g, "/"),
        parts = name.split("/")
          .map(function () {
            return "../";
          }),
        shortName = name.match(/([^\/]+)\.html$/),
        scriptName = name.replace(/\.html$/, "/app.js");

      parts.pop();

      var exists = fs.existsSync(scriptName);
      txt = exists && fs.readFileSync(scriptName, "utf-8");

      callback(null, {
        version: primroseInfo.version,
        filePath: name,
        fileRoot: parts.join(""),
        fileName: shortName && shortName[1],
        fileSize: function fileSize(file) {
          return (fs.lstatSync(file).size / 1000).toFixed(1) + "KB";
        },
        docFiles: docFiles,
        frameworkFiles: defaultData.frameworkFiles,
        demoScriptName: scriptName,
        demoScript: exists && ("grammar(\"JavaScript\");\n" + txt)
      });
    }))
    .pipe(pug(options))
    .on("error", console.error.bind(console, "PUG ERROR"))
    .pipe(gulp.dest("."));
});
