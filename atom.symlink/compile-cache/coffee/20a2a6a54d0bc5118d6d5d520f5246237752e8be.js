(function() {
  var Conflict, GitBridge, MergeConflictsView, MergeState, path, util, _;

  path = require('path');

  _ = require('underscore-plus');

  MergeConflictsView = require('../lib/merge-conflicts-view').MergeConflictsView;

  MergeState = require('../lib/merge-state');

  Conflict = require('../lib/conflict');

  GitBridge = require('../lib/git-bridge').GitBridge;

  util = require('./util');

  describe('MergeConflictsView', function() {
    var fullPath, pkg, repoPath, state, view, _ref;
    _ref = [], view = _ref[0], state = _ref[1], pkg = _ref[2];
    fullPath = function(fname) {
      return path.join(atom.project.getPaths()[0], 'path', fname);
    };
    repoPath = function(fname) {
      return atom.project.getRepositories()[0].relativize(fullPath(fname));
    };
    beforeEach(function() {
      var conflicts;
      pkg = util.pkgEmitter();
      conflicts = _.map(['file1.txt', 'file2.txt'], function(fname) {
        return {
          path: repoPath(fname),
          message: 'both modified'
        };
      });
      return util.openPath('triple-2way-diff.txt', function(editorView) {
        state = new MergeState(conflicts, false);
        conflicts = Conflict.all(state, editorView.getModel());
        return view = new MergeConflictsView(state, pkg);
      });
    });
    afterEach(function() {
      return pkg.dispose();
    });
    describe('conflict resolution progress', function() {
      var progressFor;
      progressFor = function(filename) {
        return view.pathList.find("li[data-path='" + (repoPath(filename)) + "'] progress")[0];
      };
      it('starts at zero', function() {
        expect(progressFor('file1.txt').value).toBe(0);
        return expect(progressFor('file2.txt').value).toBe(0);
      });
      return it('advances when requested', function() {
        var progress1;
        pkg.didResolveConflict({
          file: fullPath('file1.txt'),
          total: 3,
          resolved: 2
        });
        progress1 = progressFor('file1.txt');
        expect(progress1.value).toBe(2);
        return expect(progress1.max).toBe(3);
      });
    });
    describe('tracking the progress of staging', function() {
      var isMarkedWith;
      isMarkedWith = function(filename, icon) {
        var rs;
        rs = view.pathList.find("li[data-path='" + (repoPath(filename)) + "'] span.icon-" + icon);
        return rs.length !== 0;
      };
      it('starts without files marked as staged', function() {
        expect(isMarkedWith('file1.txt', 'dash')).toBe(true);
        return expect(isMarkedWith('file2.txt', 'dash')).toBe(true);
      });
      return it('marks files as staged on events', function() {
        GitBridge.process = function(_arg) {
          var exit, stdout;
          stdout = _arg.stdout, exit = _arg.exit;
          stdout("UU " + (repoPath('file2.txt')));
          exit(0);
          return {
            process: {
              on: function(err) {}
            }
          };
        };
        pkg.didStageFile({
          file: fullPath('file1.txt')
        });
        expect(isMarkedWith('file1.txt', 'check')).toBe(true);
        return expect(isMarkedWith('file2.txt', 'dash')).toBe(true);
      });
    });
    return it('minimizes and restores the view on request', function() {
      expect(view.hasClass('minimized')).toBe(false);
      view.minimize();
      expect(view.hasClass('minimized')).toBe(true);
      view.restore();
      return expect(view.hasClass('minimized')).toBe(false);
    });
  });

}).call(this);
