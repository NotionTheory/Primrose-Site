var gulp = require("gulp"),
  zip = require("gulp-zip"),
  rename = require("gulp-rename"),
  fs = require("fs"),
  primroseInfo = require("../Primrose/package.json"),
  pkg = require("./package.json"),

  primroseFiles = primroseInfo.files
    .map((f) => "../Primrose/" + f.replace(/\/$/, "/**/*"))
    .concat([
      "!../Primrose/**/*.pug",
      "!../Primrose/**/*.styl",
      "!../Primrose/src/**/*"
    ]);

primroseFiles.push("../Primrose/index.html");

pkg.version = primroseInfo.version;

fs.writeFileSync("package.json", JSON.stringify(pkg, null, 2));

gulp.task("copy:primrose", () =>
  gulp.src(primroseFiles, { base: "../Primrose/" })
    .pipe(gulp.dest(".")));

gulp.task("archive", ["copy:primrose"], () =>
  gulp.src(["Primrose*.js"])
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
