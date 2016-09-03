var gulp = require("gulp"),
  build = require("notiontheory-basic-build"),
  fs = require("fs"),
  zip = require("gulp-zip"),
  nt = build.setup(gulp, require("./package.json")),
  root = true ? "../Primrose/" : "./node_modules/primrose/";

var primroseInfo = require(root + "package.json"),
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

gulp.task("zip:quickstart", ["copy:primrose"], () => gulp.src(["quickstart/**/*"])
  .pipe(zip("PrimroseQuickstart.zip"))
  .pipe(gulp.dest(".")));

gulp.task("default", ["zip:quickstart"]);
gulp.task("release", ["default"]);