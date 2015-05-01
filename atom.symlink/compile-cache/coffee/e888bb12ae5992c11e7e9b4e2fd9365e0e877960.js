(function() {
  var CompositeDisposable, FuzzyProvider, RefCountedTokenList, TextEditor, fuzzaldrin, _, _ref,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  _ = require('underscore-plus');

  fuzzaldrin = require('fuzzaldrin');

  _ref = require('atom'), TextEditor = _ref.TextEditor, CompositeDisposable = _ref.CompositeDisposable;

  RefCountedTokenList = require('./ref-counted-token-list');

  module.exports = FuzzyProvider = (function() {
    FuzzyProvider.prototype.deferBuildWordListInterval = 300;

    FuzzyProvider.prototype.updateBuildWordListTimeout = null;

    FuzzyProvider.prototype.updateCurrentEditorTimeout = null;

    FuzzyProvider.prototype.wordRegex = /\b\w+[\w-]*\b/g;

    FuzzyProvider.prototype.tokenList = new RefCountedTokenList();

    FuzzyProvider.prototype.currentEditorSubscriptions = null;

    FuzzyProvider.prototype.editor = null;

    FuzzyProvider.prototype.buffer = null;

    FuzzyProvider.prototype.selector = '*';

    FuzzyProvider.prototype.inclusionPriority = 0;

    FuzzyProvider.prototype.suggestionPriority = 0;

    function FuzzyProvider() {
      this.dispose = __bind(this.dispose, this);
      this.findSuggestionsForWord = __bind(this.findSuggestionsForWord, this);
      this.buildWordList = __bind(this.buildWordList, this);
      this.bufferDidChange = __bind(this.bufferDidChange, this);
      this.bufferWillChange = __bind(this.bufferWillChange, this);
      this.bufferSaved = __bind(this.bufferSaved, this);
      this.getSuggestions = __bind(this.getSuggestions, this);
      this.updateCurrentEditor = __bind(this.updateCurrentEditor, this);
      this.debouncedUpdateCurrentEditor = __bind(this.debouncedUpdateCurrentEditor, this);
      var builtinProviderBlacklist;
      this.debouncedBuildWordList();
      this.subscriptions = new CompositeDisposable;
      this.subscriptions.add(atom.workspace.observeActivePaneItem(this.debouncedUpdateCurrentEditor));
      builtinProviderBlacklist = atom.config.get('autocomplete-plus.builtinProviderBlacklist');
      if ((builtinProviderBlacklist != null) && builtinProviderBlacklist.length) {
        this.disableForSelector = builtinProviderBlacklist;
      }
    }

    FuzzyProvider.prototype.debouncedUpdateCurrentEditor = function(currentPaneItem) {
      clearTimeout(this.updateBuildWordListTimeout);
      clearTimeout(this.updateCurrentEditorTimeout);
      return this.updateCurrentEditorTimeout = setTimeout((function(_this) {
        return function() {
          return _this.updateCurrentEditor(currentPaneItem);
        };
      })(this), this.deferBuildWordListInterval);
    };

    FuzzyProvider.prototype.updateCurrentEditor = function(currentPaneItem) {
      var _ref1;
      if (currentPaneItem == null) {
        return;
      }
      if (currentPaneItem === this.editor) {
        return;
      }
      if ((_ref1 = this.currentEditorSubscriptions) != null) {
        _ref1.dispose();
      }
      this.editor = null;
      this.buffer = null;
      if (!this.paneItemIsValid(currentPaneItem)) {
        return;
      }
      this.editor = currentPaneItem;
      this.buffer = this.editor.getBuffer();
      this.currentEditorSubscriptions = new CompositeDisposable;
      this.currentEditorSubscriptions.add(this.buffer.onDidSave(this.bufferSaved));
      this.currentEditorSubscriptions.add(this.buffer.onWillChange(this.bufferWillChange));
      this.currentEditorSubscriptions.add(this.buffer.onDidChange(this.bufferDidChange));
      return this.buildWordList();
    };

    FuzzyProvider.prototype.paneItemIsValid = function(paneItem) {
      if (paneItem == null) {
        return false;
      }
      return paneItem instanceof TextEditor;
    };

    FuzzyProvider.prototype.getSuggestions = function(_arg) {
      var editor, prefix, scopeDescriptor, suggestions;
      editor = _arg.editor, prefix = _arg.prefix, scopeDescriptor = _arg.scopeDescriptor;
      if (editor == null) {
        return;
      }
      if (!prefix.trim().length) {
        return;
      }
      suggestions = this.findSuggestionsForWord(prefix, scopeDescriptor);
      if (!(suggestions != null ? suggestions.length : void 0)) {
        return;
      }
      return suggestions;
    };

    FuzzyProvider.prototype.bufferSaved = function() {
      return this.buildWordList();
    };

    FuzzyProvider.prototype.bufferWillChange = function(_arg) {
      var oldLines, oldRange;
      oldRange = _arg.oldRange;
      oldLines = this.editor.getTextInBufferRange([[oldRange.start.row, 0], [oldRange.end.row, Infinity]]);
      return this.removeWordsForText(oldLines);
    };

    FuzzyProvider.prototype.bufferDidChange = function(_arg) {
      var newLines, newRange;
      newRange = _arg.newRange;
      newLines = this.editor.getTextInBufferRange([[newRange.start.row, 0], [newRange.end.row, Infinity]]);
      return this.addWordsForText(newLines);
    };

    FuzzyProvider.prototype.debouncedBuildWordList = function() {
      clearTimeout(this.updateBuildWordListTimeout);
      return this.updateBuildWordListTimeout = setTimeout((function(_this) {
        return function() {
          return _this.buildWordList();
        };
      })(this), this.deferBuildWordListInterval);
    };

    FuzzyProvider.prototype.buildWordList = function() {
      var editor, editors, _i, _len, _results;
      if (this.editor == null) {
        return;
      }
      this.tokenList.clear();
      if (atom.config.get('autocomplete-plus.includeCompletionsFromAllBuffers')) {
        editors = atom.workspace.getTextEditors();
      } else {
        editors = [this.editor];
      }
      _results = [];
      for (_i = 0, _len = editors.length; _i < _len; _i++) {
        editor = editors[_i];
        _results.push(this.addWordsForText(editor.getText()));
      }
      return _results;
    };

    FuzzyProvider.prototype.addWordsForText = function(text) {
      var match, matches, minimumWordLength, _i, _len, _results;
      minimumWordLength = atom.config.get('autocomplete-plus.minimumWordLength');
      matches = text.match(this.wordRegex);
      if (matches == null) {
        return;
      }
      _results = [];
      for (_i = 0, _len = matches.length; _i < _len; _i++) {
        match = matches[_i];
        if ((minimumWordLength && match.length >= minimumWordLength) || !minimumWordLength) {
          _results.push(this.tokenList.addToken(match));
        } else {
          _results.push(void 0);
        }
      }
      return _results;
    };

    FuzzyProvider.prototype.removeWordsForText = function(text) {
      var match, matches, _i, _len, _results;
      matches = text.match(this.wordRegex);
      if (matches == null) {
        return;
      }
      _results = [];
      for (_i = 0, _len = matches.length; _i < _len; _i++) {
        match = matches[_i];
        _results.push(this.tokenList.removeToken(match));
      }
      return _results;
    };

    FuzzyProvider.prototype.findSuggestionsForWord = function(prefix, scopeDescriptor) {
      var results, tokens, word, words, _i, _len;
      if (!(this.tokenList.getLength() && (this.editor != null))) {
        return;
      }
      tokens = this.tokenList.getTokens();
      tokens = tokens.concat(this.getCompletionsForCursorScope(scopeDescriptor));
      words = atom.config.get('autocomplete-plus.strictMatching') ? tokens.filter(function(word) {
        return (word != null ? word.indexOf(prefix) : void 0) === 0;
      }) : fuzzaldrin.filter(tokens, prefix);
      results = [];
      for (_i = 0, _len = words.length; _i < _len; _i++) {
        word = words[_i];
        if (!(word !== prefix)) {
          continue;
        }
        if (prefix[0].toLowerCase() !== word[0].toLowerCase()) {
          continue;
        }
        results.push({
          text: word,
          replacementPrefix: prefix
        });
      }
      return results;
    };

    FuzzyProvider.prototype.settingsForScopeDescriptor = function(scopeDescriptor, keyPath) {
      return atom.config.getAll(keyPath, {
        scope: scopeDescriptor
      });
    };

    FuzzyProvider.prototype.getCompletionsForCursorScope = function(scopeDescriptor) {
      var completions, resultCompletions, value, _i, _len;
      completions = this.settingsForScopeDescriptor(scopeDescriptor, 'editor.completions');
      resultCompletions = [];
      for (_i = 0, _len = completions.length; _i < _len; _i++) {
        value = completions[_i].value;
        if (Array.isArray(value)) {
          resultCompletions = resultCompletions.concat(value);
        }
      }
      return _.uniq(resultCompletions);
    };

    FuzzyProvider.prototype.dispose = function() {
      var _ref1;
      clearTimeout(this.updateBuildWordListTimeout);
      clearTimeout(this.updateCurrentEditorTimeout);
      if ((_ref1 = this.currentEditorSubscriptions) != null) {
        _ref1.dispose();
      }
      return this.subscriptions.dispose();
    };

    return FuzzyProvider;

  })();

}).call(this);
