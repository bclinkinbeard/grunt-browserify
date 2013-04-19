'use strict';

var fs = require('fs');
var path = require('path');
/*
 * grunt-browserify
 * https://github.com/jmreidy/grunt-browserify
 *
 * Copyright (c) 2013 Justin Reidy
 * Licensed under the MIT license.
 */
var browserify = require('browserify');

module.exports = function (grunt) {
  grunt.registerMultiTask('browserify', 'Grunt task for browserify.', function () {
    var done = this.async();
    var options = grunt.util._.extend(this.options(), this.data);

    var files = grunt.file.expandMapping(options.src, options.dest, {cwd: process.cwd()}).map(function (file) {
      return path.resolve(file.src[0]);
    });

    var b = browserify(files);
    b.on('error', function (err) {
      grunt.fail.warn(err);
    });

    if (options.ignore) {
      grunt.file.expand({filter: 'isFile'}, options.ignore)
        .forEach(function (file) {

          b.ignore(path.resolve(file));
        });
    }

    if (options.alias) {
      var aliases = options.alias;
      if (aliases.split) {
        aliases = aliases.split(',');
      }
      aliases.forEach(function (alias) {
        alias = alias.split(':');
        grunt.file.expand({filter: 'isFile'}, alias[0])
          .forEach(function (file) {
            b.require(path.resolve(file), {expose: alias[1]});
          });

      });
    }

    if (options.external) {
      grunt.file.expand({filter: 'isFile'}, options.external)
        .forEach(function (file) {
          b.external(path.resolve(file));
        });
    }

    if (options.transform) {
      options.transform.forEach(function (transform) {
        b.transform(transform);
      });
    }

    if (options.beforeHook) {
      options.beforeHook.call(this, b);
    }

    var bundle = b.bundle(options);
    bundle.on('error', function (err) {
      grunt.fail.warn(err);
    });

    var destPath = path.dirname(path.resolve(options.dest));
    if (!fs.existsSync(destPath)) {
      fs.mkdirSync(destPath);
    }

    bundle
      .pipe(fs.createWriteStream(options.dest))
      .on('finish', done);
  });
};
