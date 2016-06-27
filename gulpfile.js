var gulp = require("gulp"),
concat = require("gulp-concat"),
cssmin = require("gulp-cssmin"),
data = require("gulp-data"),
exec = require("child_process").exec,
fs = require("fs"),
pug = require("gulp-pug"),
recurseDirectory = require("./server/recurseDirectory"),
rename = require("gulp-rename"),
stylus = require("gulp-stylus"),
uglify = require("gulp-uglify"),
zip = require("gulp-zip"),

pathX = /.*\/(.*).js/,
hasPrimrose = fs.existsSync("../Primrose"),
primroseInfo = hasPrimrose && require("../Primrose/package.json"),
stylusFiles = ["stylesheets/**/*.styl"],
pugFiles = ["*.jade"];

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

X("run:primrose", "npm run dev");

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
}

function doStylus(){
  return gulp.src(stylusFiles, { base: "./" })
  .pipe(stylus())
  .pipe(gulp.dest("./"));
}

gulp.task("stylus", hasPrimrose ? ["copy:primrose"] : [], doStylus);
gulp.task("just:stylus", doStylus);
watchify("just:stylus", stylusFiles);

function cssMin() {
  return gulp.src(["stylesheets/**/*.css", not("stylesheets", ".min.css")])
  .pipe(rename({ suffix: ".min" }))
  .pipe(cssmin())
  .pipe(gulp.dest("stylesheets"));
}

gulp.task("cssmin", ["stylus"], cssMin);
gulp.task("just:cssmin", cssMin);

function zipQuickstart() {
  return gulp.src(["quickstart/**/*"])
  .pipe(zip("PrimroseQuickstart.zip"))
  .pipe(gulp.dest("."));
}

gulp.task("zip:quickstart", ["cssmin"], zipQuickstart);
gulp.task("just:zip:quickstart", zipQuickstart);

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
  return function(){

    var files = fs.readdirSync("archive"),
      maxMajor = 0,
      maxMinor = 0,
      maxRevis = 0;

    files.forEach(function(f){
      var match = f.match(/Primrose-(\d+)\.(\d+)\.(\d+)\.js/);
      if(match){
        var major = parseFloat(match[1]),
          minor = parseFloat(match[2]),
          revis = parseFloat(match[3]);
        if(major > maxMajor){
          maxMajor = major;
          maxMinor = 0;
          maxRevis = 0;
        }

        if(major === maxMajor){
          if(minor > maxMinor){
            maxMinor = minor;
            maxRevis = 0;
          }

          if(minor === maxMinor){
            maxRevis = Math.max(maxRevis, revis);
          }
        }
      }
    });

    var version = maxMajor + "." + maxMinor + "." + maxRevis;

    return gulp.src(pugFiles, { base: "." })
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
          version: version || "N/A",
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
watchify("just:pug:site", pugFiles);

gulp.task("debug", ["just:pug:site", "just:stylus"]);
gulp.task("release", ["pug:site", "cssmin"]);
gulp.task("watch", ["watch:just:pug:site", "watch:just:stylus"]);

gulp.task("default", ["debug", "watch", "run:primrose"]);
