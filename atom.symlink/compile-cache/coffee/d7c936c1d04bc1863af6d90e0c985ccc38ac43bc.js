(function() {
  var CompositeDisposable, Linter, LinterStylint, findFile, linterPath, warn, _ref,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  CompositeDisposable = require('atom').CompositeDisposable;

  linterPath = atom.packages.getLoadedPackage("linter").path;

  Linter = require("" + linterPath + "/lib/linter");

  _ref = require("" + linterPath + "/lib/utils"), findFile = _ref.findFile, warn = _ref.warn;

  LinterStylint = (function(_super) {
    __extends(LinterStylint, _super);

    LinterStylint.syntax = ['source.stylus'];

    LinterStylint.prototype.cmd = ['stylint'];

    LinterStylint.prototype.executablePath = null;

    LinterStylint.prototype.linterName = 'stylint';

    LinterStylint.prototype.regex = '((?P<warning>Warning)|(?P<error>Error)):\\s*(?P<message>.+)\\s*' + 'File:\\s(?P<file>.+)\\s*' + 'Line:\\s(?P<line>\\d+):\\s*(?P<near>.+\\S)';

    LinterStylint.prototype.regexFlags = 'im';

    LinterStylint.prototype.isNodeExecutable = true;

    function LinterStylint(editor) {
      var config, file, filePath, item;
      LinterStylint.__super__.constructor.call(this, editor);
      this.disposables = new CompositeDisposable;
      item = atom.workspace.getActivePaneItem();
      file = editor != null ? editor.buffer.file : void 0;
      filePath = file != null ? file.path : void 0;
      if (filePath) {
        this.cmd = this.cmd.concat([filePath]);
      }
      config = findFile(this.cwd, ['.stylintrc']);
      if (config) {
        this.cmd = this.cmd.concat(['-c', config]);
      }
      this.disposables.add(atom.config.observe('linter-stylint.stylintExecutablePath', (function(_this) {
        return function() {
          var executablePath;
          executablePath = atom.config.get('linter-stylint.stylintExecutablePath');
          if (executablePath) {
            return _this.executablePath = executablePath.length > 0 ? executablePath : null;
          }
        };
      })(this)));
    }

    LinterStylint.prototype.formatMessage = function(match) {
      var type;
      type = match.error ? "Error" : match.warning ? "Warning" : (warn("Regex does not match lint output", match), "");
      return "" + match.message + " (" + type + ": " + match.line + " " + match.near + ")";
    };

    LinterStylint.prototype.destroy = function() {
      return this.disposables.dispose();
    };

    return LinterStylint;

  })(Linter);

  module.exports = LinterStylint;

}).call(this);
