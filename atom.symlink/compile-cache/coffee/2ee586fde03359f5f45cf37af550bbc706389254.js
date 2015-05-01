(function() {
  var waitForAutocomplete;

  waitForAutocomplete = require('../spec-helper').waitForAutocomplete;

  describe('Autocomplete', function() {
    var autocompleteManager, completionDelay, editor, editorView, mainModule, _ref;
    _ref = [], mainModule = _ref[0], autocompleteManager = _ref[1], editorView = _ref[2], editor = _ref[3], completionDelay = _ref[4];
    return describe('Issue 65 - Stop autocomplete after you pass the autocomplete suggestion', function() {
      beforeEach(function() {
        runs(function() {
          var workspaceElement;
          atom.config.set('autocomplete-plus.enableAutoActivation', true);
          completionDelay = 100;
          atom.config.set('autocomplete-plus.autoActivationDelay', completionDelay);
          completionDelay += 100;
          workspaceElement = atom.views.getView(atom.workspace);
          return jasmine.attachToDOM(workspaceElement);
        });
        waitsForPromise(function() {
          return atom.workspace.open('sample.js').then(function(e) {
            return editor = e;
          });
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
        runs(function() {
          return autocompleteManager = mainModule.autocompleteManager;
        });
        return runs(function() {
          editorView = atom.views.getView(editor);
          return advanceClock(mainModule.autocompleteManager.providerManager.defaultProvider.deferBuildWordListInterval);
        });
      });
      return describe('when autocomplete is triggered', function() {
        return it('it hides the suggestion list when the user keeps typing', function() {
          return runs(function() {
            expect(editorView.querySelector('.autocomplete-plus')).not.toExist();
            editor.moveToBottom();
            editor.insertText('s');
            waitForAutocomplete();
            runs(function() {
              expect(editorView.querySelector('.autocomplete-plus')).toExist();
              editor.insertText('b');
              return waitForAutocomplete();
            });
            return runs(function() {
              return expect(editorView.querySelector('.autocomplete-plus')).not.toExist();
            });
          });
        });
      });
    });
  });

}).call(this);
