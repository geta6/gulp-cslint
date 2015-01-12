(function() {
  'use strict';
  var CLIEngine, PluginError, coffee, cslint, formattable, ifthere, migrated, path, report, stream, through, util, writable,
    __hasProp = {}.hasOwnProperty;

  stream = require('map-stream');

  through = require('through2');

  PluginError = (util = require('gulp-util')).PluginError;

  path = require('path');

  coffee = require('coffee-script');

  CLIEngine = require('eslint').CLIEngine;

  module.exports = cslint = function(options) {
    var linter, verified;
    if (options == null) {
      options = {};
    }
    linter = new CLIEngine(migrated(options));
    verified = function(filePath, contents) {
      var compiled, result;
      compiled = coffee.compile(contents, {
        bare: true,
        sourceMap: true
      });
      result = linter.executeOnText(compiled.js).results[0];
      return {
        filePath: filePath,
        sourceMap: compiled.sourceMap,
        messages: (result != null ? result.messages : void 0) || []
      };
    };
    return stream(function(file, output) {
      if (linter.isPathIgnored(file.path) || file.isNull()) {
        return output(null, file);
      } else if (file.isStream()) {
        return file.contents = file.contents.pipe(function() {
          var content, flush, transform;
          content = new Buffer([]);
          transform = function(data) {
            content = Buffer.concat([content, data]);
            return this.queue(data);
          };
          flush = function() {
            file.eslint = verified(file.path, content.toString());
            output(null, file);
            return this.emit('end');
          };
          return through(transform, flush);
        });
      } else {
        file.eslint = verified(file.path, file.contents.toString('utf-8'));
        return output(null, file);
      }
    });
  };

  cslint.format = function(formatter, writer) {
    var results;
    results = [];
    formatter = formattable(formatter);
    writer = writable(writer);
    return stream(function(file, output) {
      if ((file != null ? file.eslint : void 0) != null) {
        file.eslint.messages = file.eslint.messages.map(function(message) {
          var locations;
          locations = file.eslint.sourceMap.sourceLocation([message.line - 1, message.column - 1]);
          locations = !locations ? [0, 0] : [locations[0] + 1, locations[1] + 1];
          message.line = locations[0];
          message.column = locations[1];
          return message;
        });
        results.push(file.eslint);
      }
      return output(null, file);
    }).once('end', function() {
      if (results.length) {
        report(results, formatter, writer);
      }
      return results = [];
    });
  };

  cslint.failOnError = function() {
    return stream(function(file, output) {
      var error, messages, _ref;
      messages = (file != null ? (_ref = file.eslint) != null ? _ref.messages : void 0 : void 0) || [];
      error = null;
      messages.some(function(message) {
        var level;
        level = message.fatal ? 2 : message.severity;
        if (Array.isArray(level)) {
          level = level[0];
        }
        if (level > 1) {
          error = new PluginError('gulp-cslint', {
            name: 'ESLintError',
            fileName: file.path,
            message: message.message,
            lineNumber: message.line
          });
          return true;
        }
      });
      return output(error, file);
    });
  };

  ifthere = function(name) {
    try {
      return require(name);
    } catch (_error) {}
    return null;
  };

  formattable = function(formatter) {
    if (formatter == null) {
      formatter = 'stylish';
    }
    if (typeof formatter === 'string') {
      formatter = ifthere(formatter) || ifthere(path.resolve(process.cwd(), formatter)) || ifthere("eslint/lib/formatters/" + formatter);
      if (typeof f === 'string') {
        formatter = ifthere(formatter);
      }
    }
    if (typeof formatter !== 'function') {
      if (arguments[0] != null) {
        return formattable('compact');
      } else {
        throw new TypeError('Invalid Formatter');
      }
    }
    return formatter;
  };

  writable = function(writer) {
    if (!writer) {
      writer = util.log;
    } else if (typeof writer.write === 'function') {
      writer = writer.write.bind(writer);
    }
    return writer;
  };

  report = function(results, formatter, writer) {
    var config, message;
    if (results == null) {
      results = [];
    }
    config = void 0;
    results.some(function(result) {
      return config = result != null ? result.config : void 0;
    });
    message = formatter(results, config || {});
    if (writable && message !== null && message !== '') {
      return writer(message);
    }
  };

  migrated = function(from, to) {
    var ckey, envs, globals;
    if (to == null) {
      to = {};
    }
    if (typeof from === 'string') {
      from = {
        configFile: from
      };
    }
    for (ckey in from) {
      if (!__hasProp.call(from, ckey)) continue;
      to[ckey] = from[ckey];
    }
    if ((globals = to.globals || to.global) === null) {
      if (Array.isArray(globals)) {
        to.globals = globals;
      } else {
        to.globals = Object.keys(globals).map(function(key) {
          if (globals[key]) {
            return key + ':true';
          } else {
            return key;
          }
        });
      }
    }
    if ((envs = to.envs || to.env)) {
      if (Array.isArray(envs)) {
        to.envs = envs;
      } else {
        to.envs = Object.keys(envs).filter(function(key) {
          return envs[key];
        });
      }
    }
    if (to.config != null) {
      to.configFile = to.config;
    }
    if (to.eslintrc != null) {
      to.useEslintrc = to.eslintrc;
    }
    return to;
  };

}).call(this);
