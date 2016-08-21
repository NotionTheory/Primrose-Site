var gulp = require("gulp"),
  concat = require("gulp-concat"),
  exec = require("child_process").exec,
  zip = require("gulp-zip"),

  hasPrimrose = require("fs").existsSync("../Primrose"),
  primroseInfo = hasPrimrose && require("../Primrose/package.json");

var quickstartDependencies = [];

if(hasPrimrose){
  gulp.task("copy:primrose", function () {
    return gulp.src(primroseInfo.files.map(function (f) {
      f = "../Primrose/" + f;
      if (f[f.length - 1] === "/") {
        f += "**/*";
      }
      return f;
    }).concat(["!../Primrose/src/**/*", "!../Primrose/StartHere*"]),
    { base: "../Primrose" })
    .pipe(gulp.dest("."));
  });
  quickstartDependencies.push("copy:primrose");
}

function zipQuickstart() {
  return gulp.src(["quickstart/**/*"])
  .pipe(zip("PrimroseQuickstart.zip"))
  .pipe(gulp.dest("."));
}

gulp.task("zip:quickstart", quickstartDependencies, zipQuickstart);
gulp.task("default", ["zip:quickstart"]);