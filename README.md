# gulp-cslint

> A [Gulp](https://github.com/wearefractal/gulp) plugin for your [CoffeeScript](http://coffeescript.org) source through [eslint](https://github.com/wearefractal/gulp).

inspired by [adametry/gulp-eslint](https://github.com/adametry/gulp-eslint) and [Clever/coffee-jshint](https://github.com/Clever/coffee-jshint).

## usage

First, install `gulp-cslint` as a dependency:

```shell
npm i --save-dev gulp-cslint
```

Then, add it to your *Gulpfile.js*:

```javascript
var gulp = require('gulp'),
    cslint = require('gulp-cslint');

gulp.task('lint', function () {
    return gulp.src(['app/assets/**/*.coffee'])
        .pipe(cslint())
        .pipe(cslint.format())
        .pipe(cslint.failOnError());
});

gulp.task('default', ['lint'], function () {
});
```

