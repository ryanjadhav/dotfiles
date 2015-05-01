(function() {
  var buildIMECompositionEvent, buildTextInputEvent, triggerAutocompletion, waitForAutocomplete, _ref;

  _ref = require('../spec-helper'), waitForAutocomplete = _ref.waitForAutocomplete, triggerAutocompletion = _ref.triggerAutocompletion, buildIMECompositionEvent = _ref.buildIMECompositionEvent, buildTextInputEvent = _ref.buildTextInputEvent;

  describe('Autocomplete', function() {
    var autocompleteManager, completionDelay, editor, editorView, mainModule, _ref1;
    _ref1 = [], mainModule = _ref1[0], autocompleteManager = _ref1[1], editorView = _ref1[2], editor = _ref1[3], completionDelay = _ref1[4], mainModule = _ref1[5];
    return describe('Issue 57 - Multiple selection completion', function() {
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
          return atom.workspace.open('issues/57.js').then(function(e) {
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
          advanceClock(mainModule.autocompleteManager.providerManager.defaultProvider.deferBuildWordListInterval);
          return editorView = atom.views.getView(editor);
        });
      });
      return describe('where many cursors are defined', function() {
        it('autocompletes word when there is only a prefix', function() {
          editor.getBuffer().insert([10, 0], 's:extra:s');
          editor.setSelectedBufferRanges([[[10, 1], [10, 1]], [[10, 9], [10, 9]]]);
          runs(function() {
            return triggerAutocompletion(editor, false, 'h');
          });
          waits(completionDelay);
          return runs(function() {
            editorView = atom.views.getView(editor);
            autocompleteManager = mainModule.autocompleteManager;
            expect(editorView.querySelector('.autocomplete-plus')).toExist();
            atom.commands.dispatch(editorView, 'autocomplete-plus:confirm');
            expect(editor.lineTextForBufferRow(10)).toBe('shift:extra:shift');
            expect(editor.getCursorBufferPosition()).toEqual([10, 17]);
            expect(editor.getLastSelection().getBufferRange()).toEqual({
              start: {
                row: 10,
                column: 17
              },
              end: {
                row: 10,
                column: 17
              }
            });
            return expect(editor.getSelections().length).toEqual(2);
          });
        });
        return describe('where text differs between cursors', function() {
          return it('cancels the autocomplete', function() {
            editor.getBuffer().insert([10, 0], 's:extra:a');
            editor.setCursorBufferPosition([10, 1]);
            editor.addCursorAtBufferPosition([10, 9]);
            runs(function() {
              return triggerAutocompletion(editor, false, 'h');
            });
            waits(completionDelay);
            return runs(function() {
              autocompleteManager = mainModule.autocompleteManager;
              editorView = atom.views.getView(editor);
              atom.commands.dispatch(editorView, 'autocomplete-plus:confirm');
              expect(editor.lineTextForBufferRow(10)).toBe('sh:extra:ah');
              expect(editor.getSelections().length).toEqual(2);
              expect(editor.getSelections()[0].getBufferRange()).toEqual([[10, 2], [10, 2]]);
              expect(editor.getSelections()[1].getBufferRange()).toEqual([[10, 11], [10, 11]]);
              return expect(editorView.querySelector('.autocomplete-plus')).not.toExist();
            });
          });
        });
      });
    });
  });

}).call(this);
