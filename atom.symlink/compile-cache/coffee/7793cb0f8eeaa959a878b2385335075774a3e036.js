(function() {
  var Conflict, util;

  Conflict = require('../lib/conflict');

  util = require('./util');

  describe("Conflict", function() {
    describe('a single two-way diff', function() {
      var conflict;
      conflict = [][0];
      beforeEach(function() {
        return util.openPath('single-2way-diff.txt', function(editorView) {
          return conflict = Conflict.all({
            isRebase: false
          }, editorView.getModel())[0];
        });
      });
      it('identifies the correct rows', function() {
        expect(util.rowRangeFrom(conflict.ours.marker)).toEqual([1, 2]);
        expect(conflict.ours.ref).toBe('HEAD');
        expect(util.rowRangeFrom(conflict.theirs.marker)).toEqual([3, 4]);
        return expect(conflict.theirs.ref).toBe('master');
      });
      it('finds the ref banners', function() {
        expect(util.rowRangeFrom(conflict.ours.refBannerMarker)).toEqual([0, 1]);
        return expect(util.rowRangeFrom(conflict.theirs.refBannerMarker)).toEqual([4, 5]);
      });
      it('finds the separator', function() {
        return expect(util.rowRangeFrom(conflict.navigator.separatorMarker)).toEqual([2, 3]);
      });
      it('marks "ours" as the top and "theirs" as the bottom', function() {
        expect(conflict.ours.position).toBe('top');
        return expect(conflict.theirs.position).toBe('bottom');
      });
      return it('links each side to the following marker', function() {
        expect(conflict.ours.followingMarker).toBe(conflict.navigator.separatorMarker);
        return expect(conflict.theirs.followingMarker).toBe(conflict.theirs.refBannerMarker);
      });
    });
    it("finds multiple conflict markings", function() {
      return util.openPath('multi-2way-diff.txt', function(editorView) {
        var cs;
        cs = Conflict.all({}, editorView.getModel());
        expect(cs.length).toBe(2);
        expect(util.rowRangeFrom(cs[0].ours.marker)).toEqual([5, 7]);
        expect(util.rowRangeFrom(cs[0].theirs.marker)).toEqual([8, 9]);
        expect(util.rowRangeFrom(cs[1].ours.marker)).toEqual([14, 15]);
        return expect(util.rowRangeFrom(cs[1].theirs.marker)).toEqual([16, 17]);
      });
    });
    describe('when rebasing', function() {
      var conflict;
      conflict = [][0];
      beforeEach(function() {
        return util.openPath('rebase-2way-diff.txt', function(editorView) {
          return conflict = Conflict.all({
            isRebase: true
          }, editorView.getModel())[0];
        });
      });
      it('swaps the lines for "ours" and "theirs"', function() {
        expect(util.rowRangeFrom(conflict.theirs.marker)).toEqual([3, 4]);
        return expect(util.rowRangeFrom(conflict.ours.marker)).toEqual([5, 6]);
      });
      it('recognizes banner lines with commit shortlog messages', function() {
        expect(util.rowRangeFrom(conflict.theirs.refBannerMarker)).toEqual([2, 3]);
        return expect(util.rowRangeFrom(conflict.ours.refBannerMarker)).toEqual([6, 7]);
      });
      it('marks "theirs" as the top and "ours" as the bottom', function() {
        expect(conflict.theirs.position).toBe('top');
        return expect(conflict.ours.position).toBe('bottom');
      });
      return it('links each side to the following marker', function() {
        expect(conflict.theirs.followingMarker).toBe(conflict.navigator.separatorMarker);
        return expect(conflict.ours.followingMarker).toBe(conflict.ours.refBannerMarker);
      });
    });
    describe('sides', function() {
      var conflict, editor, _ref;
      _ref = [], editor = _ref[0], conflict = _ref[1];
      beforeEach(function() {
        return util.openPath('single-2way-diff.txt', function(editorView) {
          var _ref1;
          editor = editorView.getModel();
          return _ref1 = Conflict.all({}, editor), conflict = _ref1[0], _ref1;
        });
      });
      it('retains a reference to conflict', function() {
        expect(conflict.ours.conflict).toBe(conflict);
        return expect(conflict.theirs.conflict).toBe(conflict);
      });
      it('remembers its initial text', function() {
        editor.setCursorBufferPosition([1, 0]);
        editor.insertText("I prefer this text! ");
        return expect(conflict.ours.originalText).toBe("These are my changes\n");
      });
      it('resolves as "ours"', function() {
        conflict.ours.resolve();
        expect(conflict.resolution).toBe(conflict.ours);
        expect(conflict.ours.wasChosen()).toBe(true);
        return expect(conflict.theirs.wasChosen()).toBe(false);
      });
      it('resolves as "theirs"', function() {
        conflict.theirs.resolve();
        expect(conflict.resolution).toBe(conflict.theirs);
        expect(conflict.ours.wasChosen()).toBe(false);
        return expect(conflict.theirs.wasChosen()).toBe(true);
      });
      return it('broadcasts an event on resolution', function() {
        var resolved;
        resolved = false;
        conflict.onDidResolveConflict(function() {
          return resolved = true;
        });
        conflict.ours.resolve();
        return expect(resolved).toBe(true);
      });
    });
    return describe('navigator', function() {
      var conflicts, navigator, _ref;
      _ref = [], conflicts = _ref[0], navigator = _ref[1];
      beforeEach(function() {
        return util.openPath('triple-2way-diff.txt', function(editorView) {
          conflicts = Conflict.all({}, editorView.getModel());
          return navigator = conflicts[1].navigator;
        });
      });
      it('knows its conflict', function() {
        return expect(navigator.conflict).toBe(conflicts[1]);
      });
      it('links to the previous conflict', function() {
        return expect(navigator.previous).toBe(conflicts[0]);
      });
      it('links to the next conflict', function() {
        return expect(navigator.next).toBe(conflicts[2]);
      });
      it('skips resolved conflicts', function() {
        var nav;
        nav = conflicts[0].navigator;
        conflicts[1].ours.resolve();
        return expect(nav.nextUnresolved()).toBe(conflicts[2]);
      });
      return it('returns null at the end', function() {
        var nav;
        nav = conflicts[2].navigator;
        expect(nav.next).toBeNull();
        return expect(nav.nextUnresolved()).toBeNull();
      });
    });
  });

}).call(this);
