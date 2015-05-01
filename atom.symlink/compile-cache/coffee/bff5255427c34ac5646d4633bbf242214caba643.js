(function() {
  var Linter, LinterCsslint, linterPath,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  linterPath = atom.packages.getLoadedPackage("linter").path;

  Linter = require("" + linterPath + "/lib/linter");

  LinterCsslint = (function(_super) {
    __extends(LinterCsslint, _super);

    LinterCsslint.syntax = ['source.css', 'source.html'];

    LinterCsslint.prototype.cmd = 'csslint --format=compact';

    LinterCsslint.prototype.linterName = 'csslint';

    LinterCsslint.prototype.regex = '.+:\\s*' + '(line (?<line>\\d+), col (?<col>\\d+), )?' + '((?<error>Error)|(?<warning>Warning)) - (?<message>.*)';

    LinterCsslint.prototype.isNodeExecutable = true;

    function LinterCsslint(editor) {
      LinterCsslint.__super__.constructor.call(this, editor);
      atom.config.observe('linter-csslint.csslintExecutablePath', (function(_this) {
        return function() {
          return _this.executablePath = atom.config.get('linter-csslint.csslintExecutablePath');
        };
      })(this));
    }

    LinterCsslint.prototype.destroy = function() {
      return atom.config.unobserve('linter-csslint.csslintExecutablePath');
    };

    return LinterCsslint;

  })(Linter);

  module.exports = LinterCsslint;

}).call(this);
