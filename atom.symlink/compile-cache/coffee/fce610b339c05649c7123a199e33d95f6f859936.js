(function() {
  var Conflict, NavigationView, util;

  NavigationView = require('../lib/navigation-view');

  Conflict = require('../lib/conflict');

  util = require('./util');

  describe('NavigationView', function() {
    var conflict, conflicts, editor, editorView, view, _ref;
    _ref = [], view = _ref[0], editorView = _ref[1], editor = _ref[2], conflicts = _ref[3], conflict = _ref[4];
    beforeEach(function() {
      return util.openPath("triple-2way-diff.txt", function(v) {
        editorView = v;
        editor = editorView.getModel();
        conflicts = Conflict.all({}, editor);
        conflict = conflicts[1];
        return view = new NavigationView(conflict.navigator, editor);
      });
    });
    it('deletes the separator line on resolution', function() {
      var c, text, _i, _len;
      for (_i = 0, _len = conflicts.length; _i < _len; _i++) {
        c = conflicts[_i];
        c.ours.resolve();
      }
      text = editor.getText();
      return expect(text).not.toContain("My middle changes\n=======\nYour middle changes");
    });
    it('scrolls to the next diff', function() {
      var p;
      spyOn(editor, "setCursorBufferPosition");
      view.down();
      p = conflicts[2].ours.marker.getTailBufferPosition();
      return expect(editor.setCursorBufferPosition).toHaveBeenCalledWith(p);
    });
    return it('scrolls to the previous diff', function() {
      var p;
      spyOn(editor, "setCursorBufferPosition");
      view.up();
      p = conflicts[0].ours.marker.getTailBufferPosition();
      return expect(editor.setCursorBufferPosition).toHaveBeenCalledWith(p);
    });
  });

}).call(this);
