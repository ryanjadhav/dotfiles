(function() {
  var Linter, LinterPuppetLint, linterPath,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  linterPath = atom.packages.getLoadedPackage("linter").path;

  Linter = require("" + linterPath + "/lib/linter");

  LinterPuppetLint = (function(_super) {
    __extends(LinterPuppetLint, _super);

    LinterPuppetLint.syntax = ['source.puppet'];

    LinterPuppetLint.prototype.cmd = 'puppet-lint';

    LinterPuppetLint.prototype.executablePath = null;

    LinterPuppetLint.prototype.linterName = 'puppet-lint';

    LinterPuppetLint.prototype.regex = '((?<warning>WARNING)|(?<error>ERROR)): (?<message>.+) on line (?<line>\\d+)';

    function LinterPuppetLint(editor) {
      LinterPuppetLint.__super__.constructor.call(this, editor);
      atom.config.observe('linter-puppet-lint.puppetLintArguments', (function(_this) {
        return function() {
          return _this.updateCmd();
        };
      })(this));
      atom.config.observe('linter-puppet-lint.puppetLintExecutablePath', (function(_this) {
        return function() {
          return _this.executablePath = atom.config.get('linter-puppet-lint.puppetLintExecutablePath');
        };
      })(this));
    }

    LinterPuppetLint.prototype.updateCmd = function() {
      var args, cmd;
      cmd = this.cmd.split(' ');
      args = atom.config.get('linter-puppet-lint.puppetLintArguments');
      if (args) {
        return this.cmd = "" + cmd[0] + " " + args;
      }
    };

    LinterPuppetLint.prototype.destroy = function() {
      return atom.config.unobserve('linter-puppet-lint.puppetLintExecutablePath');
    };

    return LinterPuppetLint;

  })(Linter);

  module.exports = LinterPuppetLint;

}).call(this);
