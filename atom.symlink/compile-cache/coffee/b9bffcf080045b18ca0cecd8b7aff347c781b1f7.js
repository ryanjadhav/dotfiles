(function() {
  var Linter, LinterScssLint, findFile, linterPath,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  linterPath = atom.packages.getLoadedPackage("linter").path;

  Linter = require("" + linterPath + "/lib/linter");

  findFile = require("" + linterPath + "/lib/util");

  LinterScssLint = (function(_super) {
    __extends(LinterScssLint, _super);

    LinterScssLint.syntax = 'source.css.scss';

    LinterScssLint.prototype.cmd = 'scss-lint --format=XML';

    LinterScssLint.prototype.executablePath = null;

    LinterScssLint.prototype.linterName = 'scss-lint';

    LinterScssLint.prototype.regex = 'line="(?<line>\\d+)" column="(?<col>\\d+)" .*? severity="((?<error>error)|(?<warning>warning))" reason="(?<message>.*?)"';

    function LinterScssLint(editor) {
      LinterScssLint.__super__.constructor.call(this, editor);
      atom.config.observe('linter-scss-lint.scssLintExecutablePath', (function(_this) {
        return function() {
          return _this.executablePath = atom.config.get('linter-scss-lint.scssLintExecutablePath');
        };
      })(this));
      atom.config.observe('linter-scss-lint.scssLintExcludedLinters', (function(_this) {
        return function() {
          return _this.updateCommand();
        };
      })(this));
    }

    LinterScssLint.prototype.destroy = function() {
      atom.config.unobserve('linter-scss-lint.scssLintExecutablePath');
      return atom.config.unobserve('linter-scss-lint.scssLintExcludedLinters');
    };

    LinterScssLint.prototype.updateCommand = function() {
      var config, excludedLinters;
      excludedLinters = atom.config.get('linter-scss-lint.scssLintExcludedLinters');
      if (excludedLinters && excludedLinters.length > 0) {
        this.cmd = "scss-lint --format=XML --exclude-linter=" + (excludedLinters.toString());
      } else {
        this.cmd = 'scss-lint --format=XML';
      }
      config = findFile(this.cwd, ['.scss-lint.yml']);
      if (config) {
        return this.cmd += " -c " + config;
      }
    };

    LinterScssLint.prototype.formatMessage = function(match) {
      var key, map, message, regex, value;
      map = {
        quot: '"',
        amp: '&',
        lt: '<',
        gt: '>'
      };
      message = match.message;
      for (key in map) {
        value = map[key];
        regex = new RegExp('&' + key + ';', 'g');
        message = message.replace(regex, value);
      }
      return message;
    };

    return LinterScssLint;

  })(Linter);

  module.exports = LinterScssLint;

}).call(this);
