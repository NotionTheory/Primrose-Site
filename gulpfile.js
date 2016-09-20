var gulp = require("gulp"),
  zip = require("gulp-zip"),
  rename = require("gulp-rename"),

  // if we have a local copy of the library, use it.
  fs = require("fs"),
  root = fs.existsSync("../Primrose/") ?
    "../Primrose/" :
    "./node_modules/primrose/",

  primroseInfo = require(root + "package.json"),
  primroseFiles = primroseInfo.files
    .map((f) => root + f.replace(/\/$/, "/**/*"))
    .concat([
      "!" + root + "**/*.pug",
      "!" + root + "**/*.styl",
      "!" + root + "src/**/*",
      "!" + root + "StartHere*"
    ]);

gulp.task("copy:primrose", () => gulp.src(primroseFiles, { base: root })
  .pipe(gulp.dest(".")));

gulp.task("archive", ["copy:primrose"], () => gulp.src(["Primrose*.js"])
  .pipe(rename(function (file) {
    if (file.basename.indexOf(".min") > -1) {
      file.extname = ".min.js";
      file.basename = file.basename.substring(0, file.basename.length - 4);
    }
    file.basename += "-" + primroseInfo.version;
    return file;
  }))
  .pipe(gulp.dest("archive")));


gulp.task("zip:quickstart", ["copy:primrose"], () => gulp.src(["quickstart/**/*"])
  .pipe(zip("PrimroseQuickstart.zip"))
  .pipe(gulp.dest(".")));

gulp.task("default", ["zip:quickstart", "archive"]);
gulp.task("release", ["default"]);