(function() {
  var $, Conflict, SideView, util;

  $ = require('space-pen').$;

  SideView = require('../lib/side-view');

  Conflict = require('../lib/conflict');

  util = require('./util');

  describe('SideView', function() {
    var editorView, ours, text, theirs, view, _ref;
    _ref = [], view = _ref[0], editorView = _ref[1], ours = _ref[2], theirs = _ref[3];
    text = function() {
      return editorView.getModel().getText();
    };
    beforeEach(function() {
      return util.openPath("single-2way-diff.txt", function(v) {
        var conflict, editor, _ref1;
        editor = v.getModel();
        editorView = v;
        conflict = Conflict.all({
          isRebase: false
        }, editor)[0];
        _ref1 = [conflict.ours, conflict.theirs], ours = _ref1[0], theirs = _ref1[1];
        return view = new SideView(ours, editor);
      });
    });
    it('applies its position as a CSS class', function() {
      expect(view.hasClass('top')).toBe(true);
      return expect(view.hasClass('bottom')).toBe(false);
    });
    it('knows if its text is unaltered', function() {
      expect(ours.isDirty).toBe(false);
      return expect(theirs.isDirty).toBe(false);
    });
    describe('when its text has been edited', function() {
      var editor;
      editor = [][0];
      beforeEach(function() {
        editor = editorView.getModel();
        editor.setCursorBufferPosition([1, 0]);
        editor.insertText("I won't keep them, but ");
        return view.detectDirty();
      });
      it('detects that its text has been edited', function() {
        return expect(ours.isDirty).toBe(true);
      });
      it('adds a .dirty class to the view', function() {
        return expect(view.hasClass('dirty')).toBe(true);
      });
      return it('reverts its text back to the original on request', function() {
        var t;
        view.revert();
        view.detectDirty();
        t = editor.getTextInBufferRange(ours.marker.getBufferRange());
        expect(t).toBe("These are my changes\n");
        return expect(ours.isDirty).toBe(false);
      });
    });
    it('triggers conflict resolution', function() {
      spyOn(ours, "resolve");
      view.useMe();
      return expect(ours.resolve).toHaveBeenCalled();
    });
    describe('when chosen as the resolution', function() {
      beforeEach(function() {
        return ours.resolve();
      });
      return it('deletes the marker line', function() {
        return expect(text()).not.toContain("<<<<<<< HEAD");
      });
    });
    return describe('when not chosen as the resolution', function() {
      beforeEach(function() {
        return theirs.resolve();
      });
      it('deletes its lines', function() {
        return expect(text()).not.toContain("These are my changes");
      });
      return it('deletes the marker line', function() {
        return expect(text()).not.toContain("<<<<<<< HEAD");
      });
    });
  });

}).call(this);
