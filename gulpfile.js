var gulp = require("gulp"),
  concat = require("gulp-concat"),
  exec = require("child_process").exec,
  zip = require("gulp-zip"),

  hasPrimrose = require("fs").existsSync("../Primrose"),
  primroseInfo = hasPrimrose && require("../Primrose/package.json");

function X(name, cmd, deps){
  gulp.task(name, deps || [], function(cb){
    exec(cmd, function (err, stdout, stderr) {
      console.log(stdout);
      console.log(stderr);
      cb(err);
    });
  });
}

function not(dir, ext) {
  return "!" + ((dir && dir + "/") || "") + "**/*" + (ext || "");
}

function watchify(task, files, deps) {
  gulp.task("watch:" + task, deps || [], function () {
    return gulp.watch(files, [task]);
  });
}

var quickstartDependencies = [];

if(hasPrimrose){
  X("build:primrose", "cd ../Primrose && gulp release");

  function doCopy () {
    return gulp.src(primroseInfo.files.map(function (f) {
      f = "../Primrose/" + f;
      if (f[f.length - 1] === "/") {
        f += "**/*";
      }
      return f;
    }).concat([not("../Primrose/src"), "!../Primrose/StartHere*"]),
    { base: "../Primrose" })
    .pipe(gulp.dest("."));
  }

  gulp.task("copy:primrose", ["build:primrose"], doCopy);
  gulp.task("just:copy:primrose", doCopy);
  quickstartDependencies.push("copy:primrose");
}

function zipQuickstart() {
  return gulp.src(["quickstart/**/*"])
  .pipe(zip("PrimroseQuickstart.zip"))
  .pipe(gulp.dest("."));
}

gulp.task("zip:quickstart", quickstartDependencies, zipQuickstart);
gulp.task("just:zip:quickstart", zipQuickstart);
gulp.task("release", ["zip:quickstart"]);

X("default", "npm run dev");
