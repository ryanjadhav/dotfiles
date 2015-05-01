(function() {
  var Point, buildIMECompositionEvent, buildTextInputEvent, suggestionForWord, suggestionsForPrefix, triggerAutocompletion, _, _ref;

  Point = require('atom').Point;

  _ref = require('./spec-helper'), triggerAutocompletion = _ref.triggerAutocompletion, buildIMECompositionEvent = _ref.buildIMECompositionEvent, buildTextInputEvent = _ref.buildTextInputEvent;

  _ = require('underscore-plus');

  suggestionForWord = function(suggestionList, word) {
    return suggestionList.getSymbol(word);
  };

  suggestionsForPrefix = function(provider, editor, prefix, options) {
    var bufferPosition, scopeDescriptor, sug, suggestions, _i, _len, _results;
    bufferPosition = editor.getCursorBufferPosition();
    scopeDescriptor = editor.getLastCursor().getScopeDescriptor();
    suggestions = provider.findSuggestionsForWord({
      editor: editor,
      bufferPosition: bufferPosition,
      prefix: prefix,
      scopeDescriptor: scopeDescriptor
    });
    if (options != null ? options.raw : void 0) {
      return suggestions;
    } else {
      _results = [];
      for (_i = 0, _len = suggestions.length; _i < _len; _i++) {
        sug = suggestions[_i];
        _results.push(sug.text);
      }
      return _results;
    }
  };

  describe('SymbolProvider', function() {
    var autocompleteManager, completionDelay, editor, editorView, mainModule, provider, _ref1;
    _ref1 = [], completionDelay = _ref1[0], editorView = _ref1[1], editor = _ref1[2], mainModule = _ref1[3], autocompleteManager = _ref1[4], provider = _ref1[5];
    beforeEach(function() {
      var workspaceElement;
      atom.config.set('autocomplete-plus.enableAutoActivation', true);
      atom.config.set('autocomplete-plus.defaultProvider', 'Symbol');
      completionDelay = 100;
      atom.config.set('autocomplete-plus.autoActivationDelay', completionDelay);
      completionDelay += 100;
      workspaceElement = atom.views.getView(atom.workspace);
      jasmine.attachToDOM(workspaceElement);
      waitsForPromise(function() {
        return Promise.all([
          atom.workspace.open("sample.js").then(function(e) {
            return editor = e;
          }), atom.packages.activatePackage("language-javascript"), atom.packages.activatePackage("autocomplete-plus").then(function(a) {
            return mainModule = a.mainModule;
          })
        ]);
      });
      return runs(function() {
        autocompleteManager = mainModule.autocompleteManager;
        advanceClock(1);
        editorView = atom.views.getView(editor);
        return provider = autocompleteManager.providerManager.defaultProvider;
      });
    });
    it("runs a completion ", function() {
      return expect(suggestionForWord(provider.symbolStore, 'quicksort')).toBeTruthy();
    });
    it("adds words to the symbol list after they have been written", function() {
      expect(suggestionsForPrefix(provider, editor, 'anew')).not.toContain('aNewFunction');
      editor.insertText('function aNewFunction(){};');
      editor.insertText(' ');
      advanceClock(provider.changeUpdateDelay);
      return expect(suggestionsForPrefix(provider, editor, 'anew')).toContain('aNewFunction');
    });
    it("adds words after they have been added to a scope that is not a direct match for the selector", function() {
      expect(suggestionsForPrefix(provider, editor, 'some')).not.toContain('somestring');
      editor.insertText('abc = "somestring"');
      editor.insertText(' ');
      advanceClock(provider.changeUpdateDelay);
      return expect(suggestionsForPrefix(provider, editor, 'some')).toContain('somestring');
    });
    it("removes words from the symbol list when they do not exist in the buffer", function() {
      editor.moveToBottom();
      editor.moveToBeginningOfLine();
      expect(suggestionsForPrefix(provider, editor, 'anew')).not.toContain('aNewFunction');
      editor.insertText('function aNewFunction(){};');
      advanceClock(provider.changeUpdateDelay);
      expect(suggestionsForPrefix(provider, editor, 'anew')).toContain('aNewFunction');
      editor.setCursorBufferPosition([13, 21]);
      editor.backspace();
      advanceClock(provider.changeUpdateDelay);
      expect(suggestionsForPrefix(provider, editor, 'anew')).toContain('aNewFunctio');
      return expect(suggestionsForPrefix(provider, editor, 'anew')).not.toContain('aNewFunction');
    });
    it("does not return the word under the cursor when there is only a prefix", function() {
      editor.moveToBottom();
      editor.insertText('qu');
      expect(suggestionsForPrefix(provider, editor, 'qu')).not.toContain('qu');
      editor.insertText(' qu');
      return expect(suggestionsForPrefix(provider, editor, 'qu')).toContain('qu');
    });
    it("does not return the word under the cursor when there is a suffix only one instance of the word", function() {
      editor.moveToBottom();
      editor.insertText('catscats');
      editor.moveToBeginningOfLine();
      editor.insertText('omg');
      expect(suggestionsForPrefix(provider, editor, 'omg')).not.toContain('omg');
      return expect(suggestionsForPrefix(provider, editor, 'omg')).not.toContain('omgcatscats');
    });
    it("returns the word under the cursor when there is a suffix and there are multiple instances of the word", function() {
      editor.moveToBottom();
      editor.insertText('icksort');
      editor.moveToBeginningOfLine();
      editor.insertText('qu');
      expect(suggestionsForPrefix(provider, editor, 'qu')).not.toContain('qu');
      return expect(suggestionsForPrefix(provider, editor, 'qu')).toContain('quicksort');
    });
    it("correctly tracks the buffer row associated with symbols as they change", function() {
      var suggestion;
      editor.setText('');
      advanceClock(provider.changeUpdateDelay);
      editor.setText('function abc(){}\nfunction abc(){}');
      advanceClock(provider.changeUpdateDelay);
      suggestion = suggestionForWord(provider.symbolStore, 'abc');
      expect(suggestion.bufferRowsForBufferPath(editor.getPath())).toEqual([0, 1]);
      editor.setCursorBufferPosition([2, 100]);
      editor.insertText('\n\nfunction omg(){}; function omg(){}');
      advanceClock(provider.changeUpdateDelay);
      suggestion = suggestionForWord(provider.symbolStore, 'omg');
      expect(suggestion.bufferRowsForBufferPath(editor.getPath())).toEqual([3, 3]);
      editor.selectLeft(16);
      editor.backspace();
      advanceClock(provider.changeUpdateDelay);
      suggestion = suggestionForWord(provider.symbolStore, 'omg');
      expect(suggestion.bufferRowsForBufferPath(editor.getPath())).toEqual([3]);
      editor.insertText('\nfunction omg(){}');
      advanceClock(provider.changeUpdateDelay);
      suggestion = suggestionForWord(provider.symbolStore, 'omg');
      expect(suggestion.bufferRowsForBufferPath(editor.getPath())).toEqual([3, 4]);
      editor.setText('');
      advanceClock(provider.changeUpdateDelay);
      expect(suggestionForWord(provider.symbolStore, 'abc')).toBeUndefined();
      expect(suggestionForWord(provider.symbolStore, 'omg')).toBeUndefined();
      editor.setText('function abc(){}\nfunction abc(){}');
      editor.setCursorBufferPosition([0, 0]);
      editor.insertText('\n');
      editor.setCursorBufferPosition([2, 100]);
      editor.insertText('\nfunction abc(){}');
      advanceClock(provider.changeUpdateDelay);
      suggestion = suggestionForWord(provider.symbolStore, 'abc');
      return expect(suggestion.bufferRowsForBufferPath(editor.getPath())).toContain(3);
    });
    it("does not output suggestions from the other buffer", function() {
      var coffeeEditor, results, _ref2;
      _ref2 = [], results = _ref2[0], coffeeEditor = _ref2[1];
      waitsForPromise(function() {
        return Promise.all([
          atom.packages.activatePackage("language-coffee-script"), atom.workspace.open("sample.coffee").then(function(e) {
            return coffeeEditor = e;
          })
        ]);
      });
      return runs(function() {
        advanceClock(1);
        return expect(suggestionsForPrefix(provider, coffeeEditor, 'item')).toHaveLength(0);
      });
    });
    describe("when the editor's path changes", function() {
      return it("continues to track changes on the new path", function() {
        var buffer;
        buffer = editor.getBuffer();
        expect(provider.isWatchingEditor(editor)).toBe(true);
        expect(provider.isWatchingBuffer(buffer)).toBe(true);
        expect(suggestionsForPrefix(provider, editor, 'qu')).toContain('quicksort');
        buffer.setPath('cats.js');
        expect(provider.isWatchingEditor(editor)).toBe(true);
        expect(provider.isWatchingBuffer(buffer)).toBe(true);
        editor.moveToBottom();
        editor.moveToBeginningOfLine();
        expect(suggestionsForPrefix(provider, editor, 'qu')).toContain('quicksort');
        expect(suggestionsForPrefix(provider, editor, 'anew')).not.toContain('aNewFunction');
        editor.insertText('function aNewFunction(){};');
        return expect(suggestionsForPrefix(provider, editor, 'anew')).toContain('aNewFunction');
      });
    });
    describe("when multiple editors track the same buffer", function() {
      var leftPane, rightEditor, rightPane, _ref2;
      _ref2 = [], leftPane = _ref2[0], rightPane = _ref2[1], rightEditor = _ref2[2];
      beforeEach(function() {
        var pane;
        pane = atom.workspace.paneForItem(editor);
        rightPane = pane.splitRight({
          copyActiveItem: true
        });
        rightEditor = rightPane.getItems()[0];
        expect(provider.isWatchingEditor(editor)).toBe(true);
        return expect(provider.isWatchingEditor(rightEditor)).toBe(true);
      });
      it("watches the both the old and new editor for changes", function() {
        rightEditor.moveToBottom();
        rightEditor.moveToBeginningOfLine();
        expect(suggestionsForPrefix(provider, rightEditor, 'anew')).not.toContain('aNewFunction');
        rightEditor.insertText('function aNewFunction(){};');
        expect(suggestionsForPrefix(provider, rightEditor, 'anew')).toContain('aNewFunction');
        editor.moveToBottom();
        editor.moveToBeginningOfLine();
        expect(suggestionsForPrefix(provider, editor, 'somenew')).not.toContain('someNewFunction');
        editor.insertText('function someNewFunction(){};');
        return expect(suggestionsForPrefix(provider, editor, 'somenew')).toContain('someNewFunction');
      });
      return it("stops watching editors and removes content from symbol store as they are destroyed", function() {
        var buffer;
        expect(suggestionForWord(provider.symbolStore, 'quicksort')).toBeTruthy();
        buffer = editor.getBuffer();
        editor.destroy();
        expect(provider.isWatchingBuffer(buffer)).toBe(true);
        expect(provider.isWatchingEditor(editor)).toBe(false);
        expect(provider.isWatchingEditor(rightEditor)).toBe(true);
        expect(suggestionForWord(provider.symbolStore, 'quicksort')).toBeTruthy();
        expect(suggestionForWord(provider.symbolStore, 'aNewFunction')).toBeFalsy();
        rightEditor.insertText('function aNewFunction(){};');
        expect(suggestionForWord(provider.symbolStore, 'aNewFunction')).toBeTruthy();
        rightPane.destroy();
        expect(provider.isWatchingBuffer(buffer)).toBe(false);
        expect(provider.isWatchingEditor(editor)).toBe(false);
        expect(provider.isWatchingEditor(rightEditor)).toBe(false);
        expect(suggestionForWord(provider.symbolStore, 'quicksort')).toBeFalsy();
        return expect(suggestionForWord(provider.symbolStore, 'aNewFunction')).toBeFalsy();
      });
    });
    describe("when includeCompletionsFromAllBuffers is enabled", function() {
      beforeEach(function() {
        atom.config.set('autocomplete-plus.includeCompletionsFromAllBuffers', true);
        waitsForPromise(function() {
          return Promise.all([
            atom.packages.activatePackage("language-coffee-script"), atom.workspace.open("sample.coffee").then(function(e) {
              return editor = e;
            })
          ]);
        });
        return runs(function() {
          return advanceClock(1);
        });
      });
      afterEach(function() {
        return atom.config.set('autocomplete-plus.includeCompletionsFromAllBuffers', false);
      });
      it("outputs unique suggestions", function() {
        var results;
        editor.setCursorBufferPosition([7, 0]);
        results = suggestionsForPrefix(provider, editor, 'qu');
        return expect(results).toHaveLength(1);
      });
      return it("outputs suggestions from the other buffer", function() {
        var results;
        editor.setCursorBufferPosition([7, 0]);
        results = suggestionsForPrefix(provider, editor, 'item');
        return expect(results[0]).toBe('items');
      });
    });
    describe("when the completions changes between scopes", function() {
      beforeEach(function() {
        var commentConfig, stringConfig;
        editor.setText('// in-a-comment\ninvar = "in-a-string"');
        commentConfig = {
          incomment: {
            selector: '.comment'
          }
        };
        stringConfig = {
          instring: {
            selector: '.string'
          }
        };
        atom.config.set('editor.completions', commentConfig, {
          scopeSelector: '.source.js .comment'
        });
        return atom.config.set('editor.completions', stringConfig, {
          scopeSelector: '.source.js .string'
        });
      });
      return it("uses the config for the scope under the cursor", function() {
        var suggestions;
        editor.setCursorBufferPosition([0, 2]);
        suggestions = suggestionsForPrefix(provider, editor, 'in', {
          raw: true
        });
        expect(suggestions).toHaveLength(1);
        expect(suggestions[0].text).toBe('in-a-comment');
        expect(suggestions[0].type).toBe('incomment');
        editor.setCursorBufferPosition([1, 20]);
        suggestions = suggestionsForPrefix(provider, editor, 'in', {
          raw: true
        });
        expect(suggestions).toHaveLength(1);
        expect(suggestions[0].text).toBe('in-a-string');
        expect(suggestions[0].type).toBe('instring');
        editor.setCursorBufferPosition([1, 5]);
        suggestions = suggestionsForPrefix(provider, editor, 'in', {
          raw: true
        });
        expect(suggestions).toHaveLength(3);
        expect(suggestions[0].text).toBe('invar');
        return expect(suggestions[0].type).toBe('');
      });
    });
    describe("when the completions contains a list of suggestion strings", function() {
      beforeEach(function() {
        var commentConfig;
        editor.setText('// abcomment');
        commentConfig = {
          comment: {
            selector: '.comment'
          },
          builtin: {
            suggestions: ['abcd', 'abcde', 'abcdef']
          }
        };
        return atom.config.set('editor.completions', commentConfig, {
          scopeSelector: '.source.js .comment'
        });
      });
      return it("adds the suggestions to the results", function() {
        var suggestions;
        editor.setCursorBufferPosition([0, 2]);
        suggestions = suggestionsForPrefix(provider, editor, 'ab', {
          raw: true
        });
        expect(suggestions).toHaveLength(4);
        expect(suggestions[0].text).toBe('abcomment');
        expect(suggestions[0].type).toBe('comment');
        expect(suggestions[1].text).toBe('abcd');
        return expect(suggestions[1].type).toBe('builtin');
      });
    });
    describe("when the completions contains a list of suggestion objects", function() {
      beforeEach(function() {
        var commentConfig;
        editor.setText('// abcomment');
        commentConfig = {
          comment: {
            selector: '.comment'
          },
          builtin: {
            suggestions: [
              {
                nope: 'nope1',
                rightLabel: 'will not be added to the suggestions'
              }, {
                text: 'abcd',
                rightLabel: 'one',
                type: 'function'
              }, []
            ]
          }
        };
        return atom.config.set('editor.completions', commentConfig, {
          scopeSelector: '.source.js .comment'
        });
      });
      return it("adds the suggestion objects to the results", function() {
        var suggestions;
        editor.setCursorBufferPosition([0, 2]);
        suggestions = suggestionsForPrefix(provider, editor, 'ab', {
          raw: true
        });
        expect(suggestions).toHaveLength(2);
        expect(suggestions[0].text).toBe('abcomment');
        expect(suggestions[0].type).toBe('comment');
        expect(suggestions[1].text).toBe('abcd');
        expect(suggestions[1].type).toBe('function');
        return expect(suggestions[1].rightLabel).toBe('one');
      });
    });
    describe("when the legacy completions array is used", function() {
      beforeEach(function() {
        editor.setText('// abcomment');
        return atom.config.set('editor.completions', ['abcd', 'abcde', 'abcdef'], {
          scopeSelector: '.source.js .comment'
        });
      });
      return it("uses the config for the scope under the cursor", function() {
        var suggestions;
        editor.setCursorBufferPosition([0, 2]);
        suggestions = suggestionsForPrefix(provider, editor, 'ab', {
          raw: true
        });
        expect(suggestions).toHaveLength(4);
        expect(suggestions[0].text).toBe('abcomment');
        expect(suggestions[0].type).toBe('');
        expect(suggestions[1].text).toBe('abcd');
        return expect(suggestions[1].type).toBe('builtin');
      });
    });
    return xit('adds words to the wordlist with unicode characters', function() {
      expect(provider.symbolStore.indexOf('somēthingNew')).toBeFalsy();
      editor.insertText('somēthingNew');
      editor.insertText(' ');
      return expect(provider.symbolStore.indexOf('somēthingNew')).toBeTruthy();
    });
  });

}).call(this);
