var gulp = require("gulp"),
  fs = require("fs"),
  zip = require("gulp-zip");

if(fs.existsSync("../Primrose")){
  var primroseInfo = require("../Primrose/package.json"),
    primroseFiles = primroseInfo.files
      .map((f) => "../Primrose/" + f.replace(/\/$/, "/**/*"))
      .concat([
        "!../Primorse/**/*.pug",
        "!../Primorse/**/*.styl",
        "!../Primrose/src/**/*",
        "!../Primrose/StartHere*"
      ]);

  gulp.task("copy:primrose", () => gulp.src(primroseFiles, { base: "../Primrose" })
    .pipe(gulp.dest(".")));

  gulp.task("zip:quickstart", ["copy:primrose"], () => gulp.src(["quickstart/**/*"])
    .pipe(zip("PrimroseQuickstart.zip"))
    .pipe(gulp.dest(".")));

  gulp.task("default", ["zip:quickstart"]);
}