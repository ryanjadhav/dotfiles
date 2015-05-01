(function() {
  var $, ConflictMarker, GitBridge, util, _;

  $ = require('space-pen').$;

  _ = require('underscore-plus');

  ConflictMarker = require('../lib/conflict-marker');

  GitBridge = require('../lib/git-bridge').GitBridge;

  util = require('./util');

  describe('ConflictMarker', function() {
    var cursors, detectDirty, editor, editorView, linesForMarker, m, pkg, state, _ref;
    _ref = [], editorView = _ref[0], editor = _ref[1], state = _ref[2], m = _ref[3], pkg = _ref[4];
    cursors = function() {
      var c, _i, _len, _ref1, _results;
      _ref1 = editor.getCursors();
      _results = [];
      for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
        c = _ref1[_i];
        _results.push(c.getBufferPosition().toArray());
      }
      return _results;
    };
    detectDirty = function() {
      var sv, _i, _len, _ref1, _results;
      _ref1 = m.coveringViews;
      _results = [];
      for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
        sv = _ref1[_i];
        if ('detectDirty' in sv) {
          _results.push(sv.detectDirty());
        } else {
          _results.push(void 0);
        }
      }
      return _results;
    };
    linesForMarker = function(marker) {
      var fromBuffer, fromScreen, result, row, toBuffer, toScreen, _i, _len, _ref1;
      fromBuffer = marker.getTailBufferPosition();
      fromScreen = editor.screenPositionForBufferPosition(fromBuffer);
      toBuffer = marker.getHeadBufferPosition();
      toScreen = editor.screenPositionForBufferPosition(toBuffer);
      result = $();
      _ref1 = _.range(fromScreen.row, toScreen.row);
      for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
        row = _ref1[_i];
        result = result.add(editorView.component.lineNodeForScreenRow(row));
      }
      return result;
    };
    beforeEach(function() {
      var done;
      pkg = util.pkgEmitter();
      done = false;
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
    afterEach(function() {
      pkg.dispose();
      return m != null ? m.shutdown() : void 0;
    });
    describe('with a merge conflict', function() {
      beforeEach(function() {
        return util.openPath("triple-2way-diff.txt", function(v) {
          editorView = v;
          editorView.getFirstVisibleScreenRow = function() {
            return 0;
          };
          editorView.getLastVisibleScreenRow = function() {
            return 999;
          };
          editor = editorView.getModel();
          state = {
            isRebase: false
          };
          return m = new ConflictMarker(state, editor, pkg);
        });
      });
      it('attaches two SideViews and a NavigationView for each conflict', function() {
        expect($(editorView).find('.side').length).toBe(6);
        return expect($(editorView).find('.navigation').length).toBe(3);
      });
      it('locates the correct lines', function() {
        var lines;
        lines = linesForMarker(m.conflicts[1].ours.marker);
        return expect(lines.text()).toBe("My middle changes");
      });
      it('applies the "ours" class to our sides of conflicts', function() {
        var lines;
        lines = linesForMarker(m.conflicts[0].ours.marker);
        return expect(lines.hasClass('conflict-ours')).toBe(true);
      });
      it('applies the "theirs" class to their sides of conflicts', function() {
        var lines;
        lines = linesForMarker(m.conflicts[0].theirs.marker);
        return expect(lines.hasClass('conflict-theirs')).toBe(true);
      });
      it('applies the "dirty" class to modified sides', function() {
        var lines;
        editor.setCursorBufferPosition([14, 0]);
        editor.insertText("Make conflict 1 dirty");
        detectDirty();
        lines = linesForMarker(m.conflicts[1].ours.marker);
        expect(lines.hasClass('conflict-dirty')).toBe(true);
        return expect(lines.hasClass('conflict-ours')).toBe(false);
      });
      it('broadcasts the onDidResolveConflict event', function() {
        var event;
        event = null;
        pkg.onDidResolveConflict(function(e) {
          return event = e;
        });
        m.conflicts[2].theirs.resolve();
        expect(event.file).toBe(editor.getPath());
        expect(event.total).toBe(3);
        expect(event.resolved).toBe(1);
        return expect(event.source).toBe(m);
      });
      it('tracks the active conflict side', function() {
        editor.setCursorBufferPosition([11, 0]);
        expect(m.active()).toEqual([]);
        editor.setCursorBufferPosition([14, 5]);
        return expect(m.active()).toEqual([m.conflicts[1].ours]);
      });
      describe('with an active merge conflict', function() {
        var active;
        active = [][0];
        beforeEach(function() {
          editor.setCursorBufferPosition([14, 5]);
          return active = m.conflicts[1];
        });
        it('accepts the current side with merge-conflicts:accept-current', function() {
          atom.commands.dispatch(editorView, 'merge-conflicts:accept-current');
          return expect(active.resolution).toBe(active.ours);
        });
        it("does nothing if you have cursors in both sides", function() {
          editor.addCursorAtBufferPosition([16, 2]);
          atom.commands.dispatch(editorView, 'merge-conflicts:accept-current');
          return expect(active.resolution).toBeNull();
        });
        it('accepts "ours" on merge-conflicts:accept-ours', function() {
          atom.commands.dispatch(editorView, 'merge-conflicts:accept-current');
          return expect(active.resolution).toBe(active.ours);
        });
        it('accepts "theirs" on merge-conflicts:accept-theirs', function() {
          atom.commands.dispatch(editorView, 'merge-conflicts:accept-theirs');
          return expect(active.resolution).toBe(active.theirs);
        });
        it('jumps to the next unresolved on merge-conflicts:next-unresolved', function() {
          atom.commands.dispatch(editorView, 'merge-conflicts:next-unresolved');
          return expect(cursors()).toEqual([[22, 0]]);
        });
        it('jumps to the previous unresolved on merge-conflicts:previous-unresolved', function() {
          atom.commands.dispatch(editorView, 'merge-conflicts:previous-unresolved');
          return expect(cursors()).toEqual([[5, 0]]);
        });
        it('reverts a dirty hunk on merge-conflicts:revert-current', function() {
          editor.insertText('this is a change');
          detectDirty();
          expect(active.ours.isDirty).toBe(true);
          atom.commands.dispatch(editorView, 'merge-conflicts:revert-current');
          detectDirty();
          return expect(active.ours.isDirty).toBe(false);
        });
        it('accepts ours-then-theirs on merge-conflicts:ours-then-theirs', function() {
          var t;
          atom.commands.dispatch(editorView, 'merge-conflicts:ours-then-theirs');
          expect(active.resolution).toBe(active.ours);
          t = editor.getTextInBufferRange(active.resolution.marker.getBufferRange());
          return expect(t).toBe("My middle changes\nYour middle changes\n");
        });
        return it('accepts theirs-then-ours on merge-conflicts:theirs-then-ours', function() {
          var t;
          atom.commands.dispatch(editorView, 'merge-conflicts:theirs-then-ours');
          expect(active.resolution).toBe(active.theirs);
          t = editor.getTextInBufferRange(active.resolution.marker.getBufferRange());
          return expect(t).toBe("Your middle changes\nMy middle changes\n");
        });
      });
      describe('without an active conflict', function() {
        beforeEach(function() {
          return editor.setCursorBufferPosition([11, 6]);
        });
        it('no-ops the resolution commands', function() {
          var c, e, _i, _len, _ref1, _results;
          _ref1 = ['accept-current', 'accept-ours', 'accept-theirs', 'revert-current'];
          _results = [];
          for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
            e = _ref1[_i];
            atom.commands.dispatch(editorView, "merge-conflicts:" + e);
            expect(m.active()).toEqual([]);
            _results.push((function() {
              var _j, _len1, _ref2, _results1;
              _ref2 = m.conflicts;
              _results1 = [];
              for (_j = 0, _len1 = _ref2.length; _j < _len1; _j++) {
                c = _ref2[_j];
                _results1.push(expect(c.isResolved()).toBe(false));
              }
              return _results1;
            })());
          }
          return _results;
        });
        it('jumps to the next unresolved on merge-conflicts:next-unresolved', function() {
          expect(m.active()).toEqual([]);
          atom.commands.dispatch(editorView, 'merge-conflicts:next-unresolved');
          return expect(cursors()).toEqual([[14, 0]]);
        });
        return it('jumps to the previous unresolved on merge-conflicts:next-unresolved', function() {
          atom.commands.dispatch(editorView, 'merge-conflicts:previous-unresolved');
          return expect(cursors()).toEqual([[5, 0]]);
        });
      });
      describe('when the resolution is complete', function() {
        beforeEach(function() {
          var c, _i, _len, _ref1, _results;
          _ref1 = m.conflicts;
          _results = [];
          for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
            c = _ref1[_i];
            _results.push(c.ours.resolve());
          }
          return _results;
        });
        it('removes all of the CoveringViews', function() {
          expect($(editorView).find('.overlayer .side').length).toBe(0);
          return expect($(editorView).find('.overlayer .navigation').length).toBe(0);
        });
        it('removes the .conflicted class', function() {
          return expect($(editorView).hasClass('conflicted')).toBe(false);
        });
        return it('appends a ResolverView to the workspace', function() {
          var workspaceView;
          workspaceView = atom.views.getView(atom.workspace);
          return expect($(workspaceView).find('.resolver').length).toBe(1);
        });
      });
      return describe('when all resolutions are complete', function() {
        beforeEach(function() {
          var c, _i, _len, _ref1;
          _ref1 = m.conflicts;
          for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
            c = _ref1[_i];
            c.theirs.resolve();
          }
          return pkg.didCompleteConflictResolution();
        });
        return it('destroys all Conflict markers', function() {
          var c, marker, _i, _len, _ref1, _results;
          _ref1 = m.conflicts;
          _results = [];
          for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
            c = _ref1[_i];
            _results.push((function() {
              var _j, _len1, _ref2, _results1;
              _ref2 = c.markers();
              _results1 = [];
              for (_j = 0, _len1 = _ref2.length; _j < _len1; _j++) {
                marker = _ref2[_j];
                _results1.push(expect(marker.isDestroyed()).toBe(true));
              }
              return _results1;
            })());
          }
          return _results;
        });
      });
    });
    return describe('with a rebase conflict', function() {
      var active;
      active = [][0];
      beforeEach(function() {
        return util.openPath("rebase-2way-diff.txt", function(v) {
          editorView = v;
          editorView.getFirstVisibleScreenRow = function() {
            return 0;
          };
          editorView.getLastVisibleScreenRow = function() {
            return 999;
          };
          editor = editorView.getModel();
          state = {
            isRebase: true
          };
          m = new ConflictMarker(state, editor, pkg);
          editor.setCursorBufferPosition([3, 14]);
          return active = m.conflicts[0];
        });
      });
      it('accepts theirs-then-ours on merge-conflicts:theirs-then-ours', function() {
        var t;
        atom.commands.dispatch(editorView, 'merge-conflicts:theirs-then-ours');
        expect(active.resolution).toBe(active.theirs);
        t = editor.getTextInBufferRange(active.resolution.marker.getBufferRange());
        return expect(t).toBe("These are your changes\nThese are my changes\n");
      });
      return it('accepts ours-then-theirs on merge-conflicts:ours-then-theirs', function() {
        var t;
        atom.commands.dispatch(editorView, 'merge-conflicts:ours-then-theirs');
        expect(active.resolution).toBe(active.ours);
        t = editor.getTextInBufferRange(active.resolution.marker.getBufferRange());
        return expect(t).toBe("These are my changes\nThese are your changes\n");
      });
    });
  });

}).call(this);
