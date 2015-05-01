(function() {
  var path, temp, waitForAutocomplete;

  waitForAutocomplete = require('../spec-helper').waitForAutocomplete;

  path = require('path');

  temp = require('temp').track();

  describe('Autocomplete', function() {
    var autocompleteManager, completionDelay, directory, editor, editorView, mainModule, _ref;
    _ref = [], mainModule = _ref[0], autocompleteManager = _ref[1], directory = _ref[2], editorView = _ref[3], editor = _ref[4], completionDelay = _ref[5];
    return describe('Issue 15', function() {
      beforeEach(function() {
        runs(function() {
          var workspaceElement;
          directory = temp.mkdirSync();
          atom.config.set('autocomplete-plus.enableAutoActivation', true);
          completionDelay = 100;
          atom.config.set('autocomplete-plus.autoActivationDelay', completionDelay);
          completionDelay += 100;
          workspaceElement = atom.views.getView(atom.workspace);
          return jasmine.attachToDOM(workspaceElement);
        });
        waitsForPromise(function() {
          return atom.workspace.open('issues/11.js').then(function(e) {
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
          advanceClock(mainModule.autocompleteManager.providerManager.defaultProvider.deferBuildWordListInterval);
          return editorView = atom.views.getView(editor);
        });
      });
      return it('closes the suggestion list when saving', function() {
        return runs(function() {
          expect(editorView.querySelector('.autocomplete-plus')).not.toExist();
          editor.moveToBottom();
          editor.insertText('r');
          waitForAutocomplete();
          return runs(function() {
            expect(editorView.querySelector('.autocomplete-plus')).toExist();
            editor.saveAs(path.join(directory, 'spec', 'tmp', 'issue-11.js'));
            return expect(editorView.querySelector('.autocomplete-plus')).not.toExist();
          });
        });
      });
    });
  });

}).call(this);
