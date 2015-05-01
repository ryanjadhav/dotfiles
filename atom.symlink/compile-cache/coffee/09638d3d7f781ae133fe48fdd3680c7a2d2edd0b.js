(function() {
  var waitForAutocomplete;

  waitForAutocomplete = require('./spec-helper').waitForAutocomplete;

  describe('Async providers', function() {
    var autocompleteManager, completionDelay, editor, editorView, mainModule, registration, _ref;
    _ref = [], completionDelay = _ref[0], editorView = _ref[1], editor = _ref[2], mainModule = _ref[3], autocompleteManager = _ref[4], registration = _ref[5];
    beforeEach(function() {
      runs(function() {
        var workspaceElement;
        atom.config.set('autocomplete-plus.enableAutoActivation', true);
        atom.config.set('editor.fontSize', '16');
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
      return runs(function() {
        return autocompleteManager = mainModule.autocompleteManager;
      });
    });
    afterEach(function() {
      return registration != null ? registration.dispose() : void 0;
    });
    describe('when an async provider is registered', function() {
      beforeEach(function() {
        var testAsyncProvider;
        testAsyncProvider = {
          getSuggestions: function(options) {
            return new Promise(function(resolve) {
              return setTimeout(function() {
                return resolve([
                  {
                    text: 'asyncProvided',
                    replacementPrefix: 'asyncProvided',
                    rightLabel: 'asyncProvided'
                  }
                ]);
              }, 10);
            });
          },
          selector: '.source.js'
        };
        return registration = atom.packages.serviceHub.provide('autocomplete.provider', '2.0.0', testAsyncProvider);
      });
      return it('should provide completions when a provider returns a promise that results in an array of suggestions', function() {
        editor.moveToBottom();
        editor.insertText('o');
        waitForAutocomplete();
        return runs(function() {
          var suggestionListView;
          suggestionListView = atom.views.getView(autocompleteManager.suggestionList);
          return expect(suggestionListView.querySelector('li .right-label')).toHaveText('asyncProvided');
        });
      });
    });
    return describe('when a provider takes a long time to provide suggestions', function() {
      beforeEach(function() {
        var testAsyncProvider;
        testAsyncProvider = {
          selector: '.source.js',
          getSuggestions: function(options) {
            return new Promise(function(resolve) {
              return setTimeout(function() {
                return resolve([
                  {
                    text: 'asyncProvided',
                    replacementPrefix: 'asyncProvided',
                    rightLabel: 'asyncProvided'
                  }
                ]);
              }, 1000);
            });
          }
        };
        return registration = atom.packages.serviceHub.provide('autocomplete.provider', '2.0.0', testAsyncProvider);
      });
      return it('does not show the suggestion list when it is triggered then no longer needed', function() {
        runs(function() {
          editorView = atom.views.getView(editor);
          editor.moveToBottom();
          editor.insertText('o');
          return advanceClock(autocompleteManager.suggestionDelay * 2);
        });
        waits(0);
        runs(function() {
          editor.insertText('\r');
          waitForAutocomplete();
          expect(editorView.querySelector('.autocomplete-plus')).not.toExist();
          return advanceClock(1000);
        });
        waits(0);
        return runs(function() {
          return expect(editorView.querySelector('.autocomplete-plus')).not.toExist();
        });
      });
    });
  });

}).call(this);
