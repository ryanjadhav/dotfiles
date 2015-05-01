(function() {
  var waitForAutocomplete;

  waitForAutocomplete = require('./spec-helper').waitForAutocomplete;

  describe('Autocomplete', function() {
    var autocompleteManager, completionDelay, editor, editorView, mainModule, _ref;
    _ref = [], completionDelay = _ref[0], editorView = _ref[1], editor = _ref[2], autocompleteManager = _ref[3], mainModule = _ref[4];
    beforeEach(function() {
      runs(function() {
        var workspaceElement;
        atom.config.set('autocomplete-plus.enableAutoActivation', true);
        atom.config.set('autocomplete-plus.fileBlacklist', ['.*', '*.md']);
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
      runs(function() {
        return autocompleteManager = mainModule.autocompleteManager;
      });
      return runs(function() {
        editorView = atom.views.getView(editor);
        return advanceClock(mainModule.autocompleteManager.providerManager.defaultProvider.deferBuildWordListInterval);
      });
    });
    describe('@activate()', function() {
      return it('activates autocomplete and initializes AutocompleteManager', function() {
        return runs(function() {
          expect(autocompleteManager).toBeDefined();
          return expect(editorView.querySelector('.autocomplete-plus')).not.toExist();
        });
      });
    });
    return describe('@deactivate()', function() {
      return it('removes all autocomplete views', function() {
        return runs(function() {
          var buffer;
          buffer = editor.getBuffer();
          editor.moveToBottom();
          editor.insertText('A');
          waitForAutocomplete();
          return runs(function() {
            editorView = editorView;
            expect(editorView.querySelector('.autocomplete-plus')).toExist();
            atom.packages.deactivatePackage('autocomplete-plus');
            return expect(editorView.querySelector('.autocomplete-plus')).not.toExist();
          });
        });
      });
    });
  });

}).call(this);
