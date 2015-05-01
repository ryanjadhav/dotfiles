(function() {
  var BufferedProcess, GitBridge, GitCmd, GitNotFoundError, fs, path,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  BufferedProcess = require('atom').BufferedProcess;

  fs = require('fs');

  path = require('path');

  GitNotFoundError = (function(_super) {
    __extends(GitNotFoundError, _super);

    function GitNotFoundError(message) {
      this.name = 'GitNotFoundError';
      GitNotFoundError.__super__.constructor.call(this, message);
    }

    return GitNotFoundError;

  })(Error);

  GitCmd = null;

  GitBridge = (function() {
    GitBridge.process = function(args) {
      return new BufferedProcess(args);
    };

    function GitBridge() {}

    GitBridge.locateGitAnd = function(callback) {
      var exitHandler, possiblePath, search;
      possiblePath = atom.config.get('merge-conflicts.gitPath');
      if (possiblePath) {
        GitCmd = possiblePath;
        callback(null);
        return;
      }
      search = ['git', '/usr/local/bin/git', '"%PROGRAMFILES%\\Git\\bin\\git"', '"%LOCALAPPDATA%\\Programs\\Git\\bin\\git"'];
      possiblePath = search.shift();
      exitHandler = (function(_this) {
        return function(code) {
          if (code === 0) {
            GitCmd = possiblePath;
            callback(null);
            return;
          }
          possiblePath = search.shift();
          if (possiblePath == null) {
            callback(new GitNotFoundError("Please set the 'Git Path' correctly in the Atom settings ", "for the Merge Conflicts package."));
            return;
          }
          return _this.process({
            command: possiblePath,
            args: ['--version'],
            exit: exitHandler
          });
        };
      })(this);
      return this.process({
        command: possiblePath,
        args: ['--version'],
        exit: exitHandler
      });
    };

    GitBridge._repoWorkDir = function() {
      return atom.project.getRepositories()[0].getWorkingDirectory();
    };

    GitBridge._repoGitDir = function() {
      return atom.project.getRepositories()[0].getPath();
    };

    GitBridge._statusCodesFrom = function(chunk, handler) {
      var indexCode, line, m, p, workCode, __, _i, _len, _ref, _results;
      _ref = chunk.split("\n");
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        line = _ref[_i];
        m = line.match(/^(.)(.) (.+)$/);
        if (m) {
          __ = m[0], indexCode = m[1], workCode = m[2], p = m[3];
          _results.push(handler(indexCode, workCode, p));
        } else {
          _results.push(void 0);
        }
      }
      return _results;
    };

    GitBridge.withConflicts = function(handler) {
      var conflicts, errMessage, exitHandler, proc, stderrHandler, stdoutHandler;
      conflicts = [];
      errMessage = [];
      stdoutHandler = (function(_this) {
        return function(chunk) {
          return _this._statusCodesFrom(chunk, function(index, work, p) {
            if (index === 'U' && work === 'U') {
              conflicts.push({
                path: p,
                message: 'both modified'
              });
            }
            if (index === 'A' && work === 'A') {
              return conflicts.push({
                path: p,
                message: 'both added'
              });
            }
          });
        };
      })(this);
      stderrHandler = function(line) {
        return errMessage.push(line);
      };
      exitHandler = function(code) {
        if (code === 0) {
          return handler(null, conflicts);
        } else {
          return handler(new Error(("abnormal git exit: " + code + "\n") + errMessage.join("\n")), null);
        }
      };
      proc = this.process({
        command: GitCmd,
        args: ['status', '--porcelain'],
        options: {
          cwd: this._repoWorkDir()
        },
        stdout: stdoutHandler,
        stderr: stderrHandler,
        exit: exitHandler
      });
      return proc.process.on('error', function(err) {
        return handler(new GitNotFoundError(errMessage.join("\n")), null);
      });
    };

    GitBridge.isStaged = function(filepath, handler) {
      var exitHandler, proc, staged, stderrHandler, stdoutHandler;
      staged = true;
      stdoutHandler = (function(_this) {
        return function(chunk) {
          return _this._statusCodesFrom(chunk, function(index, work, p) {
            if (p === filepath) {
              return staged = index === 'M' && work === ' ';
            }
          });
        };
      })(this);
      stderrHandler = function(chunk) {
        return console.log("git status error: " + chunk);
      };
      exitHandler = function(code) {
        if (code === 0) {
          return handler(null, staged);
        } else {
          return handler(new Error("git status exit: " + code), null);
        }
      };
      proc = this.process({
        command: GitCmd,
        args: ['status', '--porcelain', filepath],
        options: {
          cwd: this._repoWorkDir()
        },
        stdout: stdoutHandler,
        stderr: stderrHandler,
        exit: exitHandler
      });
      return proc.process.on('error', function(err) {
        return handler(new GitNotFoundError, null);
      });
    };

    GitBridge.checkoutSide = function(sideName, filepath, callback) {
      var proc;
      proc = this.process({
        command: GitCmd,
        args: ['checkout', "--" + sideName, filepath],
        options: {
          cwd: this._repoWorkDir()
        },
        stdout: function(line) {
          return console.log(line);
        },
        stderr: function(line) {
          return console.log(line);
        },
        exit: function(code) {
          if (code === 0) {
            return callback(null);
          } else {
            return callback(new Error("git checkout exit: " + code));
          }
        }
      });
      return proc.process.on('error', function(err) {
        return callback(new GitNotFoundError);
      });
    };

    GitBridge.add = function(filepath, callback) {
      return this.process({
        command: GitCmd,
        args: ['add', filepath],
        options: {
          cwd: this._repoWorkDir()
        },
        stdout: function(line) {
          return console.log(line);
        },
        stderr: function(line) {
          return console.log(line);
        },
        exit: function(code) {
          if (code === 0) {
            return callback();
          } else {
            return callback(new Error("git add failed: exit code " + code));
          }
        }
      });
    };

    GitBridge.isRebasing = function() {
      var irebaseDir, irebaseStat, rebaseDir, rebaseStat, root;
      root = this._repoGitDir();
      if (root == null) {
        return false;
      }
      rebaseDir = path.join(root, 'rebase-apply');
      rebaseStat = fs.statSyncNoException(rebaseDir);
      if (rebaseStat && rebaseStat.isDirectory()) {
        return true;
      }
      irebaseDir = path.join(root, 'rebase-merge');
      irebaseStat = fs.statSyncNoException(irebaseDir);
      return irebaseStat && irebaseStat.isDirectory();
    };

    return GitBridge;

  })();

  module.exports = {
    GitBridge: GitBridge,
    GitNotFoundError: GitNotFoundError
  };

}).call(this);
