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
var shim = require('browserify-shim');

module.exports = function (grunt) {
  grunt.registerMultiTask('browserify', 'Grunt task for browserify.', function () {
    var done = this.async();
    var opts = this.options();

    if (opts.entry.split) opts.entry = [opts.entry];
    var files = opts.entry.map(function (file) {
      return path.resolve(file);
    });

    var b = browserify(files);
    b.on('error', function (err) {
      grunt.fail.warn(err);
    });

    if (opts.shim) {
      Object.keys(opts.shim)
        .forEach(function(alias) {
          var shim = opts.shim[alias];
          shim.path = path.resolve(shim.path);
        });
      b = shim(b, opts.shim);
    }

    if (opts.ignore) {
      grunt.file.expand({filter: 'isFile'}, opts.ignore)
        .forEach(function (file) {
          b.ignore(path.resolve(file));
        });
    }

    if (opts.alias) {
      var aliases = opts.alias;
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

    if (opts.external) {
      grunt.file.expand({filter: 'isFile'}, opts.external)
        .forEach(function (file) {
          b.external(path.resolve(file));
        });
    }

    if (opts.transform) {
      opts.transform.forEach(function (transform) {
        b.transform(transform);
      });
    }

    var bundle = b.bundle(opts);
    bundle.on('error', function (err) {
      grunt.fail.warn(err);
    });

    var destPath = path.dirname(path.resolve(opts.outfile));
    if (!fs.existsSync(destPath)) {
      fs.mkdirSync(destPath);
    }

    bundle
      .pipe(fs.createWriteStream(opts.outfile))
      .on('finish', function () {
        grunt.log.writeln('Bundle ' + opts.outfile.cyan + ' created.');
        done();
      });
  });
};
