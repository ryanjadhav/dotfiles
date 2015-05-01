(function() {
  var AutocompleteManager, waitForAutocomplete;

  waitForAutocomplete = require('../spec-helper').waitForAutocomplete;

  AutocompleteManager = require('../../lib/autocomplete-manager');

  describe('Autocomplete', function() {
    var autocompleteManager, completionDelay, editor, editorView, mainModule, _ref;
    _ref = [], mainModule = _ref[0], autocompleteManager = _ref[1], editorView = _ref[2], editor = _ref[3], completionDelay = _ref[4], autocompleteManager = _ref[5];
    return describe('Issue 67', function() {
      var autocomplete;
      autocomplete = [][0];
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
          return atom.workspace.open('issues/50.js').then(function(e) {
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
      afterEach(function() {
        return autocomplete != null ? autocomplete.dispose() : void 0;
      });
      return it('autocomplete should only show for the editor that currently has focus', function() {
        return runs(function() {
          var editor2, editorView2;
          editor2 = atom.workspace.paneForItem(editor).splitRight({
            copyActiveItem: true
          }).getActiveItem();
          editorView2 = atom.views.getView(editor2);
          editorView.focus();
          expect(editorView).toHaveFocus();
          expect(editorView.querySelector('.autocomplete-plus')).not.toExist();
          expect(editorView2).not.toHaveFocus();
          expect(editorView2.querySelector('.autocomplete-plus')).not.toExist();
          editor.insertText('r');
          expect(editorView).toHaveFocus();
          expect(editorView2).not.toHaveFocus();
          waitForAutocomplete();
          return runs(function() {
            expect(editorView).toHaveFocus();
            expect(editorView2).not.toHaveFocus();
            expect(editorView.querySelector('.autocomplete-plus')).toExist();
            expect(editorView2.querySelector('.autocomplete-plus')).not.toExist();
            atom.commands.dispatch(editorView, 'autocomplete-plus:confirm');
            expect(editorView).toHaveFocus();
            expect(editorView2).not.toHaveFocus();
            expect(editorView.querySelector('.autocomplete-plus')).not.toExist();
            return expect(editorView2.querySelector('.autocomplete-plus')).not.toExist();
          });
        });
      });
    });
  });

}).call(this);
