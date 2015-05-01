(function() {
  var Linter, LinterESLint, allowUnsafeNewFunction, findFile, fs, linterPath, path, resolve,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  linterPath = atom.packages.getLoadedPackage('linter').path;

  Linter = require("" + linterPath + "/lib/linter");

  findFile = require("" + linterPath + "/lib/util");

  resolve = require('resolve').sync;

  allowUnsafeNewFunction = require('loophole').allowUnsafeNewFunction;

  path = require("path");

  fs = require("fs");

  LinterESLint = (function(_super) {
    __extends(LinterESLint, _super);

    LinterESLint.syntax = ['source.js', 'source.js.jsx'];

    LinterESLint.disableWhenNoEslintrcFileInPath = false;

    LinterESLint.prototype.linterName = 'eslint';

    LinterESLint.prototype._requireEsLint = function(filePath) {
      var eslint, eslintPath;
      this.localEslint = false;
      try {
        eslintPath = resolve('eslint', {
          basedir: path.dirname(filePath)
        });
        eslint = require(eslintPath);
        this.localEslint = true;
        return eslint;
      } catch (_error) {}
      return require('eslint');
    };

    LinterESLint.prototype.lintFile = function(filePath, callback) {
      var CLIEngine, config, engine, eslintrc, filename, isPluginRule, linter, messages, options, origPath, ralativeToIgnorePath, result, rulesDir, _ref, _ref1, _ref2;
      filename = path.basename(filePath);
      origPath = path.join(this.cwd, filename);
      options = {};
      _ref = this._requireEsLint(origPath), linter = _ref.linter, CLIEngine = _ref.CLIEngine;
      eslintrc = findFile(origPath, '.eslintrc');
      if (!eslintrc && this.disableWhenNoEslintrcFileInPath) {
        return;
      }
      if (this.rulesDir) {
        rulesDir = findFile(this.cwd, [this.rulesDir], false, 0);
      }
      options.ignorePath = findFile(origPath, '.eslintignore');
      if (options.ignorePath) {
        ralativeToIgnorePath = origPath.replace(path.dirname(options.ignorePath) + path.sep, '');
      }
      if (rulesDir && fs.existsSync(rulesDir)) {
        options.rulePaths = [rulesDir];
      }
      engine = new CLIEngine(options);
      if (options.ignorePath && engine.isPathIgnored(ralativeToIgnorePath)) {
        return callback([]);
      }
      config = engine.getConfigForFile(origPath);
      if ((_ref1 = config.plugins) != null ? _ref1.length : void 0) {
        if (this.localEslint) {
          options.plugins = config.plugins;
          engine = new CLIEngine(options);
        } else {
          isPluginRule = new RegExp("^(" + (config.plugins.join('|')) + ")/");
          Object.keys(config.rules).forEach(function(key) {
            if (isPluginRule.test(key)) {
              return delete config.rules[key];
            }
          });
        }
      }
      result = null;
      allowUnsafeNewFunction((function(_this) {
        return function() {
          return result = linter.verify(_this.editor.getText(), config);
        };
      })(this));
      if (((_ref2 = config.plugins) != null ? _ref2.length : void 0) && !this.localEslint) {
        result.push({
          line: 1,
          column: 0,
          severity: 1,
          message: "`npm install eslint` in your project to enable plugins: " + (config.plugins.join(', ')) + " (linter-eslint)"
        });
      }
      messages = result.map((function(_this) {
        return function(m) {
          var message;
          message = m.message;
          if (m.ruleId != null) {
            message += " (" + m.ruleId + ")";
          }
          return _this.createMessage({
            line: m.line,
            col: m.column,
            error: m.severity === 2,
            warning: m.severity === 1,
            message: message
          });
        };
      })(this));
      return callback(messages);
    };

    function LinterESLint(editor) {
      LinterESLint.__super__.constructor.call(this, editor);
      this.rulesDirListener = atom.config.observe('linter-eslint.eslintRulesDir', (function(_this) {
        return function(newDir) {
          return _this.rulesDir = newDir;
        };
      })(this));
      atom.config.observe('linter-eslint.disableWhenNoEslintrcFileInPath', (function(_this) {
        return function(skipNonEslint) {
          return _this.disableWhenNoEslintrcFileInPath = skipNonEslint;
        };
      })(this));
    }

    LinterESLint.prototype.destroy = function() {
      return this.rulesDirListener.dispose();
    };

    return LinterESLint;

  })(Linter);

  module.exports = LinterESLint;

}).call(this);
