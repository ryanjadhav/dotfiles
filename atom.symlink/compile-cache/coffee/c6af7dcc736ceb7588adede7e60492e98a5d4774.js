(function() {
  var GitBridge, ResolverView, util,
    __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  ResolverView = require('../lib/resolver-view');

  GitBridge = require('../lib/git-bridge').GitBridge;

  util = require('./util');

  describe('ResolverView', function() {
    var fakeEditor, pkg, view, _ref;
    _ref = [], view = _ref[0], fakeEditor = _ref[1], pkg = _ref[2];
    beforeEach(function() {
      var done;
      pkg = util.pkgEmitter();
      fakeEditor = {
        isModified: function() {
          return true;
        },
        getURI: function() {
          return 'lib/file1.txt';
        },
        save: function() {},
        onDidSave: function() {}
      };
      view = new ResolverView(fakeEditor, pkg);
      atom.config.set('merge-conflicts.gitPath', 'git');
      done = false;
      GitBridge.locateGitAnd(function(err) {
        if (err != null) {
          throw err;
        }
        return done = true;
      });
      waitsFor(function() {
        return done;
      });
      return GitBridge.process = function(_arg) {
        var exit, stdout;
        stdout = _arg.stdout, exit = _arg.exit;
        stdout('UU lib/file1.txt');
        exit(0);
        return {
          process: {
            on: function(err) {}
          }
        };
      };
    });
    it('begins needing both saving and staging', function() {
      view.refresh();
      return expect(view.actionText.text()).toBe('Save and stage');
    });
    it('shows if the file only needs staged', function() {
      fakeEditor.isModified = function() {
        return false;
      };
      view.refresh();
      return expect(view.actionText.text()).toBe('Stage');
    });
    return it('saves and stages the file', function() {
      var a, c, o, _ref1;
      _ref1 = [], c = _ref1[0], a = _ref1[1], o = _ref1[2];
      GitBridge.process = function(_arg) {
        var args, command, exit, options, stdout, _ref2;
        command = _arg.command, args = _arg.args, options = _arg.options, stdout = _arg.stdout, exit = _arg.exit;
        if (__indexOf.call(args, 'add') >= 0) {
          _ref2 = [command, args, options], c = _ref2[0], a = _ref2[1], o = _ref2[2];
          exit(0);
        }
        if (__indexOf.call(args, 'status') >= 0) {
          stdout('M  lib/file1.txt');
          exit(0);
        }
        return {
          process: {
            on: function(err) {}
          }
        };
      };
      spyOn(fakeEditor, 'save');
      view.resolve();
      expect(fakeEditor.save).toHaveBeenCalled();
      expect(c).toBe('git');
      expect(a).toEqual(['add', 'lib/file1.txt']);
      return expect(o).toEqual({
        cwd: atom.project.getRepositories()[0].getWorkingDirectory()
      });
    });
  });

}).call(this);
