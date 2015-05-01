(function() {
  var buildIMECompositionEvent, buildTextInputEvent, triggerAutocompletion, _, _ref;

  _ref = require('./spec-helper'), triggerAutocompletion = _ref.triggerAutocompletion, buildIMECompositionEvent = _ref.buildIMECompositionEvent, buildTextInputEvent = _ref.buildTextInputEvent;

  _ = require('underscore-plus');

  describe('FuzzyProvider', function() {
    var autocompleteManager, completionDelay, editor, editorView, mainModule, _ref1;
    _ref1 = [], completionDelay = _ref1[0], editorView = _ref1[1], editor = _ref1[2], mainModule = _ref1[3], autocompleteManager = _ref1[4];
    beforeEach(function() {
      var workspaceElement;
      atom.config.set('autocomplete-plus.enableAutoActivation', true);
      completionDelay = 100;
      atom.config.set('autocomplete-plus.autoActivationDelay', completionDelay);
      completionDelay += 100;
      workspaceElement = atom.views.getView(atom.workspace);
      return jasmine.attachToDOM(workspaceElement);
    });
    return describe('when auto-activation is enabled', function() {
      beforeEach(function() {
        waitsForPromise(function() {
          return Promise.all([
            atom.packages.activatePackage("language-javascript"), atom.workspace.open('sample.js').then(function(e) {
              return editor = e;
            }), atom.packages.activatePackage('autocomplete-plus').then(function(a) {
              return mainModule = a.mainModule;
            })
          ]);
        });
        return runs(function() {
          autocompleteManager = mainModule.autocompleteManager;
          advanceClock(mainModule.autocompleteManager.providerManager.defaultProvider.deferBuildWordListInterval);
          return editorView = atom.views.getView(editor);
        });
      });
      it('adds words to the wordlist after they have been written', function() {
        var provider;
        editor.moveToBottom();
        editor.moveToBeginningOfLine();
        provider = autocompleteManager.providerManager.defaultProvider;
        expect(provider.tokenList.getToken('somethingNew')).toBeUndefined();
        editor.insertText('somethingNew');
        return expect(provider.tokenList.getToken('somethingNew')).toBe('somethingNew');
      });
      it('removes words that are no longer in the buffer', function() {
        var provider;
        editor.moveToBottom();
        editor.moveToBeginningOfLine();
        provider = autocompleteManager.providerManager.defaultProvider;
        expect(provider.tokenList.getToken('somethingNew')).toBeUndefined();
        editor.insertText('somethingNew');
        expect(provider.tokenList.getToken('somethingNew')).toBe('somethingNew');
        editor.backspace();
        expect(provider.tokenList.getToken('somethingNew')).toBe(void 0);
        return expect(provider.tokenList.getToken('somethingNe')).toBe('somethingNe');
      });
      it("adds completions from editor.completions", function() {
        var bufferPosition, prefix, provider, results, scopeDescriptor;
        provider = autocompleteManager.providerManager.defaultProvider;
        atom.config.set('editor.completions', ['abcd', 'abcde', 'abcdef'], {
          scopeSelector: '.source.js'
        });
        editor.moveToBottom();
        editor.insertText('ab');
        bufferPosition = editor.getLastCursor().getBufferPosition();
        scopeDescriptor = editor.getRootScopeDescriptor();
        prefix = 'ab';
        results = provider.getSuggestions({
          editor: editor,
          bufferPosition: bufferPosition,
          scopeDescriptor: scopeDescriptor,
          prefix: prefix
        });
        return expect(results[0].text).toBe('abcd');
      });
      it("adds completions from settings", function() {
        var bufferPosition, prefix, provider, results, scopeDescriptor;
        provider = autocompleteManager.providerManager.defaultProvider;
        atom.config.set('editor.completions', {
          builtin: {
            suggestions: ['nope']
          }
        }, {
          scopeSelector: '.source.js'
        });
        editor.moveToBottom();
        editor.insertText('ab');
        bufferPosition = editor.getLastCursor().getBufferPosition();
        scopeDescriptor = editor.getRootScopeDescriptor();
        prefix = 'ab';
        results = provider.getSuggestions({
          editor: editor,
          bufferPosition: bufferPosition,
          scopeDescriptor: scopeDescriptor,
          prefix: prefix
        });
        return expect(results).toBeUndefined();
      });
      xit('adds words to the wordlist with unicode characters', function() {
        var provider;
        provider = autocompleteManager.providerManager.defaultProvider;
        expect(provider.tokenList.indexOf('somēthingNew')).toEqual(-1);
        editor.insertText('somēthingNew');
        editor.insertText(' ');
        return expect(provider.tokenList.indexOf('somēthingNew')).not.toEqual(-1);
      });
      return xit('removes words from the wordlist when they no longer exist in any open buffers', function() {
        var provider, _i;
        provider = autocompleteManager.providerManager.defaultProvider;
        expect(provider.tokenList.indexOf('bogos')).toEqual(-1);
        editor.insertText('bogos = 1');
        editor.insertText(' ');
        expect(provider.tokenList.indexOf('bogos')).not.toEqual(-1);
        expect(provider.tokenList.indexOf('bogus')).toEqual(-1);
        for (_i = 1; _i <= 7; _i++) {
          editor.backspace();
        }
        editor.insertText('us = 1');
        editor.insertText(' ');
        expect(provider.tokenList.indexOf('bogus')).not.toEqual(-1);
        return expect(provider.tokenList.indexOf('bogos')).toEqual(-1);
      });
    });
  });

}).call(this);
