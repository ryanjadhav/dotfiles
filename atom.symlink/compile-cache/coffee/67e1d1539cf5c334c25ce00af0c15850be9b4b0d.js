(function() {
  var Linter, LinterLess, Range, fs, less, linterPath, path,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  linterPath = atom.packages.getLoadedPackage("linter").path;

  Linter = require("" + linterPath + "/lib/linter");

  fs = require("fs");

  path = require("path");

  less = require('less');

  Range = require('atom').Range;

  LinterLess = (function(_super) {
    __extends(LinterLess, _super);

    function LinterLess() {
      return LinterLess.__super__.constructor.apply(this, arguments);
    }

    LinterLess.syntax = 'source.css.less';

    LinterLess.prototype.linterName = 'less';

    LinterLess.prototype.parseLessFile = function(data, filePath, callback) {
      var parser;
      parser = new less.Parser({
        verbose: false,
        silent: true,
        paths: [this.cwd],
        filename: filePath
      });
      return parser.parse(data, (function(_this) {
        return function(err, tree) {
          var lineIdx, toCssErr;
          if (!err) {
            try {
              tree.toCSS({
                ieCompat: _this.config('ieCompatibilityChecks'),
                strictUnits: _this.config('strictUnits'),
                strictMath: _this.config('strictMath')
              });
            } catch (_error) {
              toCssErr = _error;
              err = toCssErr;
            }
          }
          if (!err || err.filename !== filePath) {
            return callback([]);
          }
          lineIdx = Math.max(0, err.line - 1);
          return callback([
            {
              line: err.line,
              col: err.column,
              level: 'error',
              message: err.message,
              linter: _this.linterName,
              range: new Range([lineIdx, err.column], [lineIdx, _this.lineLengthForRow(lineIdx)])
            }
          ]);
        };
      })(this));
    };

    LinterLess.prototype.lintFile = function(filePath, callback) {
      return fs.readFile(filePath, 'utf8', (function(_this) {
        return function(err, data) {
          if (err) {
            return callback([]);
          }
          return _this.parseLessFile(data, filePath, callback);
        };
      })(this));
    };

    LinterLess.prototype.config = function(key) {
      return atom.config.get("linter-less." + key);
    };

    return LinterLess;

  })(Linter);

  module.exports = LinterLess;

}).call(this);
