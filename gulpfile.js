var gulp = require("gulp"),
  build = require("notiontheory-basic-build"),
  fs = require("fs"),
  zip = require("gulp-zip"),
  nt = build.setup(gulp, require("./package.json"));

var primroseInfo = require("./node_modules/primrose/package.json"),
  primroseFiles = primroseInfo.files
    .map((f) => "node_modules/primrose/" + f.replace(/\/$/, "/**/*"))
    .concat([
      "!node_modules/primorse/**/*.pug",
      "!node_modules/primorse/**/*.styl",
      "!node_modules/primrose/src/**/*",
      "!node_modules/primrose/StartHere*"
    ]);

gulp.task("copy:primrose", () => gulp.src(primroseFiles, { base: "node_modules/Primrose" })
  .pipe(gulp.dest(".")));

gulp.task("zip:quickstart", ["copy:primrose"], () => gulp.src(["quickstart/**/*"])
  .pipe(zip("PrimroseQuickstart.zip"))
  .pipe(gulp.dest(".")));

gulp.task("default", ["zip:quickstart"]);
gulp.task("release", ["default"]);