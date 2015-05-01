(function() {
  var BufferedProcess, GitBridge, path;

  GitBridge = require('../lib/git-bridge').GitBridge;

  BufferedProcess = require('atom').BufferedProcess;

  path = require('path');

  describe('GitBridge', function() {
    var repoBase;
    repoBase = function() {
      return atom.project.getRepositories()[0].getWorkingDirectory();
    };
    beforeEach(function() {
      var done;
      done = false;
      atom.config.set('merge-conflicts.gitPath', '/usr/bin/git');
      GitBridge.locateGitAnd(function(err) {
        if (err != null) {
          throw err;
        }
        return done = true;
      });
      return waitsFor(function() {
        return done;
      });
    });
    it('checks git status for merge conflicts', function() {
      var a, c, conflicts, o, _ref;
      _ref = [], c = _ref[0], a = _ref[1], o = _ref[2];
      GitBridge.process = function(_arg) {
        var args, command, exit, options, stderr, stdout, _ref1;
        command = _arg.command, args = _arg.args, options = _arg.options, stdout = _arg.stdout, stderr = _arg.stderr, exit = _arg.exit;
        _ref1 = [command, args, options], c = _ref1[0], a = _ref1[1], o = _ref1[2];
        stdout('UU lib/file0.rb');
        stdout('AA lib/file1.rb');
        stdout('M  lib/file2.rb');
        exit(0);
        return {
          process: {
            on: function(callback) {}
          }
        };
      };
      conflicts = [];
      GitBridge.withConflicts(function(err, cs) {
        if (err) {
          throw err;
        }
        return conflicts = cs;
      });
      expect(conflicts).toEqual([
        {
          path: 'lib/file0.rb',
          message: 'both modified'
        }, {
          path: 'lib/file1.rb',
          message: 'both added'
        }
      ]);
      expect(c).toBe('/usr/bin/git');
      expect(a).toEqual(['status', '--porcelain']);
      return expect(o).toEqual({
        cwd: repoBase()
      });
    });
    describe('isStaged', function() {
      var statusMeansStaged;
      statusMeansStaged = function(status, checkPath) {
        var staged;
        if (checkPath == null) {
          checkPath = 'lib/file2.txt';
        }
        GitBridge.process = function(_arg) {
          var exit, stdout;
          stdout = _arg.stdout, exit = _arg.exit;
          stdout("" + status + " lib/file2.txt");
          exit(0);
          return {
            process: {
              on: function(callback) {}
            }
          };
        };
        staged = null;
        GitBridge.isStaged(checkPath, function(err, b) {
          if (err) {
            throw err;
          }
          return staged = b;
        });
        return staged;
      };
      it('is true if already resolved', function() {
        return expect(statusMeansStaged('M ')).toBe(true);
      });
      it('is true if resolved as ours', function() {
        return expect(statusMeansStaged(' M', 'lib/file1.txt')).toBe(true);
      });
      it('is false if still in conflict', function() {
        return expect(statusMeansStaged('UU')).toBe(false);
      });
      return it('is false if resolved, but then modified', function() {
        return expect(statusMeansStaged('MM')).toBe(false);
      });
    });
    it('checks out "our" version of a file from the index', function() {
      var a, c, called, o, _ref;
      _ref = [], c = _ref[0], a = _ref[1], o = _ref[2];
      GitBridge.process = function(_arg) {
        var args, command, exit, options, _ref1;
        command = _arg.command, args = _arg.args, options = _arg.options, exit = _arg.exit;
        _ref1 = [command, args, options], c = _ref1[0], a = _ref1[1], o = _ref1[2];
        exit(0);
        return {
          process: {
            on: function(callback) {}
          }
        };
      };
      called = false;
      GitBridge.checkoutSide('ours', 'lib/file1.txt', function(err) {
        if (err) {
          throw err;
        }
        return called = true;
      });
      expect(called).toBe(true);
      expect(c).toBe('/usr/bin/git');
      expect(a).toEqual(['checkout', '--ours', 'lib/file1.txt']);
      return expect(o).toEqual({
        cwd: repoBase()
      });
    });
    it('stages changes to a file', function() {
      var a, c, called, o, _ref;
      _ref = [], c = _ref[0], a = _ref[1], o = _ref[2];
      GitBridge.process = function(_arg) {
        var args, command, exit, options, _ref1;
        command = _arg.command, args = _arg.args, options = _arg.options, exit = _arg.exit;
        _ref1 = [command, args, options], c = _ref1[0], a = _ref1[1], o = _ref1[2];
        return exit(0);
      };
      called = false;
      GitBridge.add('lib/file1.txt', function(err) {
        if (err) {
          throw err;
        }
        return called = true;
      });
      expect(called).toBe(true);
      expect(c).toBe('/usr/bin/git');
      expect(a).toEqual(['add', 'lib/file1.txt']);
      return expect(o).toEqual({
        cwd: repoBase()
      });
    });
    return describe('rebase detection', function() {
      var withRoot;
      withRoot = function(gitDir, callback) {
        var fullDir, saved;
        fullDir = path.join(atom.project.getDirectories()[0].getPath(), gitDir);
        saved = GitBridge._repoGitDir;
        GitBridge._repoGitDir = function() {
          return fullDir;
        };
        callback();
        return GitBridge._repoGitDir = saved;
      };
      it('recognizes a non-interactive rebase', function() {
        return withRoot('rebasing.git', function() {
          return expect(GitBridge.isRebasing()).toBe(true);
        });
      });
      it('recognizes an interactive rebase', function() {
        return withRoot('irebasing.git', function() {
          return expect(GitBridge.isRebasing()).toBe(true);
        });
      });
      return it('returns false if not rebasing', function() {
        return withRoot('merging.git', function() {
          return expect(GitBridge.isRebasing()).toBe(false);
        });
      });
    });
  });

}).call(this);
