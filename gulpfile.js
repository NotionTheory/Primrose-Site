var gulp = require("gulp"),
  zip = require("gulp-zip"),
  rename = require("gulp-rename"),
  fs = require("fs"),
  primroseInfo = require("../fx/package.json"),
  pkg = require("./package.json"),

  primroseFiles = primroseInfo.files
    .map((f) => "../fx/" + f.replace(/\/$/, "/**/*"))
    .concat([
      "!../fx/**/*.pug",
      "!../fx/**/*.styl",
      "!../fx/src/**/*"
    ]);

primroseFiles.push("../fx/index.html");

pkg.version = primroseInfo.version;

fs.writeFileSync("package.json", JSON.stringify(pkg, null, 2));

gulp.task("copy:primrose", () =>
  gulp.src(primroseFiles, { base: "../fx/" })
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
