(function() {
  var waitForAutocomplete;

  waitForAutocomplete = require('./spec-helper').waitForAutocomplete;

  describe('Autocomplete Manager', function() {
    var autocompleteManager, completionDelay, editor, editorView, mainModule, _ref;
    _ref = [], completionDelay = _ref[0], editorView = _ref[1], editor = _ref[2], mainModule = _ref[3], autocompleteManager = _ref[4];
    beforeEach(function() {
      return runs(function() {
        var workspaceElement;
        atom.config.set('autocomplete-plus.enableAutoActivation', true);
        atom.config.set('editor.fontSize', '16');
        completionDelay = 100;
        atom.config.set('autocomplete-plus.autoActivationDelay', completionDelay);
        completionDelay += 100;
        workspaceElement = atom.views.getView(atom.workspace);
        return jasmine.attachToDOM(workspaceElement);
      });
    });
    return describe('Undo a completion', function() {
      beforeEach(function() {
        runs(function() {
          return atom.config.set('autocomplete-plus.enableAutoActivation', true);
        });
        waitsForPromise(function() {
          return atom.workspace.open('sample.js').then(function(e) {
            return editor = e;
          });
        });
        waitsForPromise(function() {
          return atom.packages.activatePackage('language-javascript');
        });
        waitsForPromise(function() {
          return atom.packages.activatePackage('autocomplete-plus').then(function(a) {
            return mainModule = a.mainModule;
          });
        });
        waitsFor(function() {
          var _ref1;
          return (_ref1 = mainModule.autocompleteManager) != null ? _ref1.ready : void 0;
        });
        return runs(function() {
          autocompleteManager = mainModule.autocompleteManager;
          return advanceClock(autocompleteManager.providerManager.defaultProvider.deferBuildWordListInterval);
        });
      });
      return it('restores the previous state', function() {
        editor.moveToBottom();
        editor.moveToBeginningOfLine();
        editor.insertText('f');
        waitForAutocomplete();
        return runs(function() {
          var suggestionListView;
          suggestionListView = atom.views.getView(autocompleteManager.suggestionList);
          atom.commands.dispatch(suggestionListView, 'autocomplete-plus:confirm');
          expect(editor.getBuffer().getLastLine()).toEqual('function');
          editor.undo();
          return expect(editor.getBuffer().getLastLine()).toEqual('f');
        });
      });
    });
  });

}).call(this);
