(function() {
  var buildIMECompositionEvent, buildTextInputEvent, triggerAutocompletion, _, _ref;

  _ref = require('./spec-helper'), triggerAutocompletion = _ref.triggerAutocompletion, buildIMECompositionEvent = _ref.buildIMECompositionEvent, buildTextInputEvent = _ref.buildTextInputEvent;

  _ = require('underscore-plus');

  describe('Autocomplete', function() {
    var autocompleteManager, completionDelay, editor, editorView, mainModule, _ref1;
    _ref1 = [], completionDelay = _ref1[0], editorView = _ref1[1], editor = _ref1[2], mainModule = _ref1[3], autocompleteManager = _ref1[4];
    beforeEach(function() {
      runs(function() {
        atom.config.set('autocomplete-plus.enableAutoActivation', true);
        atom.config.set('autocomplete-plus.fileBlacklist', ['.*', '*.md']);
        completionDelay = 100;
        atom.config.set('autocomplete-plus.autoActivationDelay', completionDelay);
        return completionDelay += 100;
      });
      waitsForPromise(function() {
        return atom.workspace.open('blacklisted.md').then(function(e) {
          return editor = e;
        });
      });
      waitsForPromise(function() {
        return atom.packages.activatePackage('autocomplete-plus').then(function(a) {
          return mainModule = a.mainModule;
        });
      });
      waitsFor(function() {
        var _ref2;
        return (_ref2 = mainModule.autocompleteManager) != null ? _ref2.ready : void 0;
      });
      runs(function() {
        return autocompleteManager = mainModule.autocompleteManager;
      });
      return runs(function() {
        return editorView = atom.views.getView(editor);
      });
    });
    return describe('Autocomplete File Blacklist', function() {
      return it('should not show suggestions when working with files that match the blacklist', function() {
        editor.insertText('a');
        advanceClock(completionDelay);
        return expect(editorView.querySelector('.autocomplete-plus')).not.toExist();
      });
    });
  });

}).call(this);
