gulp = require 'gulp'
mocha = require 'gulp-mocha'
coffee = require 'gulp-coffee'
cslint = require './'
coffeelint = require 'gulp-coffeelint'

sequence = require 'run-sequence'

gulp.task 'default', (done) ->
  sequence 'syntax', ['style', 'mocha'], 'build', done

gulp.task 'mocha', ->
  gulp.src ['test/**/*.spec.coffee']
    .pipe mocha reporter: 'nyan'

gulp.task 'style', ->
  gulp.src ['**/*.coffee', '!node_modules/**/*.coffee']
    .pipe coffeelint '.coffeelintrc'
    .pipe coffeelint.reporter 'default'

gulp.task 'syntax', ->
  gulp.src ['src/**/*.coffee']
    .pipe cslint()
    .pipe cslint.format()
    .pipe cslint.failOnError()

gulp.task 'build', ->
  gulp.src ['src/**/*.coffee']
    .pipe coffee base: true
    .pipe gulp.dest 'lib'

