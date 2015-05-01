(function() {
  var waitForAutocomplete;

  waitForAutocomplete = require('./spec-helper').waitForAutocomplete;

  describe('CSS Language Support', function() {
    var autocompleteManager, completionDelay, css, editor, editorView, mainModule, _ref;
    _ref = [], completionDelay = _ref[0], editorView = _ref[1], editor = _ref[2], autocompleteManager = _ref[3], mainModule = _ref[4], css = _ref[5];
    beforeEach(function() {
      runs(function() {
        var workspaceElement;
        atom.config.set('autocomplete-plus.enableAutoActivation', true);
        atom.config.set('editor.fontSize', '16');
        completionDelay = 100;
        atom.config.set('autocomplete-plus.autoActivationDelay', completionDelay);
        completionDelay += 100;
        workspaceElement = atom.views.getView(atom.workspace);
        jasmine.attachToDOM(workspaceElement);
        return atom.config.set('autocomplete-plus.enableAutoActivation', true);
      });
      waitsForPromise(function() {
        return atom.workspace.open('css.css').then(function(e) {
          return editor = e;
        });
      });
      waitsForPromise(function() {
        return atom.packages.activatePackage('language-css').then(function(c) {
          return css = c;
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
      return runs(function() {
        autocompleteManager = mainModule.autocompleteManager;
        return advanceClock(mainModule.autocompleteManager.providerManager.defaultProvider.deferBuildWordListInterval);
      });
    });
    return it('includes completions for the scopes completion preferences', function() {
      return runs(function() {
        editor.moveToEndOfLine();
        editor.insertText('o');
        editor.insertText('u');
        editor.insertText('t');
        waitForAutocomplete();
        return runs(function() {
          var items, suggestionListView;
          editorView = atom.views.getView(editor);
          suggestionListView = atom.views.getView(autocompleteManager.suggestionList);
          items = suggestionListView.querySelectorAll('li');
          expect(editorView.querySelector('.autocomplete-plus')).toExist();
          expect(items.length).toBe(5);
          expect(items[0].textContent).toContain('outline');
          expect(items[1].textContent).toContain('outline-width');
          expect(items[2].textContent).toContain('outline-style');
          return expect(items[3].textContent).toContain('outline-color');
        });
      });
    });
  });

}).call(this);
