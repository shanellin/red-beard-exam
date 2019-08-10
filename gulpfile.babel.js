import gulp from "gulp";
import nodemon from "nodemon";
import browserSync from "browser-sync";
import plumber from "gulp-plumber";
import gulpLoad from "gulp-load-plugins";
import sass from "gulp-sass";
import useref from "gulp-useref";
import uglify from "gulp-uglify";
import gulpif from "gulp-if";

const $ = gulpLoad();

const errorHandler = () =>
  plumber({
    errorHandler: function(err) {
      console.log(err);
      this.emit("end");
    }
  });

gulp.task("nodemon", cb => {
  let started = false;
  return nodemon({
    script: "server.js",
    watch: ["routes/*.js", "server.js"],
    ignore: ["app/scripts/*.js"]
  }).on("start", e => {
    if (!started) {
      started = true;
      cb();
    }
    started = true;
  });
});

gulp.task(
  "browserSync",
  gulp.series("nodemon", () => {
    browserSync.init(null, {
      proxy: "http://localhost:3000",
      files: ["templates/**"],
      browser: ["chrome"],
      port: 5000,
      reloadDelay: 3000
    });
  })
);

gulp.task("clean", require("del").bind(null, ["dist"]));

gulp.task("ScriptsLocal", cb => {
  gulp
    .src(["app/scripts/*/*.js"])
    .pipe(errorHandler())
    .pipe($.babel())
    .pipe(plumber.stop())
    .pipe(gulp.dest("dist/scripts"));
  return cb();
});
gulp.task("VueLocal", cb => {
  gulp
    .src(["app/scripts/*/*.vue"])
    .pipe(gulp.dest("dist/scripts"));
  return cb();
});
gulp.task('cpnImages', cb => {
  gulp
    .src(["app/images/*/**"])
    .pipe(gulp.dest("dist/images"));
  return cb();
});

gulp.task("sass", cb => {
  gulp
    .src("app/styles/*/*.sass")
    .pipe(sass({ outputStyle: "compressed" }).on("error", sass.logError))
    .pipe(gulp.dest("dist/styles"));
  return cb();
});

gulp.task("build:watch", cb => {
  gulp.watch("app/scripts/*/*.js", gulp.series("ScriptsLocal"));
  gulp.watch("app/scripts/*/*.vue", gulp.series("VueLocal"));
  gulp.watch("app/styles/*/*.sass", gulp.series("sass")); 
  cb();
});

gulp.task("bower", cb => {
  const wiredep = require("wiredep").stream;
  return gulp
    .src("app/templates/header.ejs")
    .pipe(
      wiredep({
        ignorePath: /^(\.\.\/)*\.\./
      })
    )
    .pipe(gulp.dest("templates"));
});

gulp.task("vendor", cb => {
  return (
    gulp
      .src("templates/header.ejs")
      .pipe(useref())
      .pipe(gulpif("*.ejs", gulp.dest("templates")))
      .pipe(gulpif("*.js", uglify()))      
      .pipe(gulp.dest("dist"))
  );
});

gulp.task("bowerComponents", gulp.series("bower", "vendor"));

gulp.task(
  "local",
  gulp.series(
    "clean",
    gulp.parallel("ScriptsLocal", "VueLocal", "cpnImages", "sass"),
    "bowerComponents",
    "build:watch",
    "browserSync"
  )
);
