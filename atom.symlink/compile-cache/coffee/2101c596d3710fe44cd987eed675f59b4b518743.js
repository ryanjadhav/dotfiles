(function() {
  var CompositeDisposable, Selector, SymbolProvider, SymbolStore, TextEditor, fuzzaldrin, _, _ref,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  _ = require('underscore-plus');

  fuzzaldrin = require('fuzzaldrin');

  _ref = require('atom'), TextEditor = _ref.TextEditor, CompositeDisposable = _ref.CompositeDisposable;

  Selector = require('selector-kit').Selector;

  SymbolStore = require('./symbol-store');

  module.exports = SymbolProvider = (function() {
    SymbolProvider.prototype.wordRegex = /\b\w*[a-zA-Z_-]+\w*\b/g;

    SymbolProvider.prototype.beginningOfLineWordRegex = /^\w*[a-zA-Z_-]+\w*\b/g;

    SymbolProvider.prototype.symbolStore = null;

    SymbolProvider.prototype.editor = null;

    SymbolProvider.prototype.buffer = null;

    SymbolProvider.prototype.changeUpdateDelay = 300;

    SymbolProvider.prototype.selector = '*';

    SymbolProvider.prototype.inclusionPriority = 0;

    SymbolProvider.prototype.suggestionPriority = 0;

    SymbolProvider.prototype.watchedBuffers = null;

    SymbolProvider.prototype.config = null;

    SymbolProvider.prototype.defaultConfig = {
      "class": {
        selector: '.class.name, .inherited-class, .instance.type',
        typePriority: 4
      },
      "function": {
        selector: '.function.name',
        typePriority: 3
      },
      variable: {
        selector: '.variable',
        typePriority: 2
      },
      '': {
        selector: '.source',
        typePriority: 1
      }
    };

    function SymbolProvider() {
      this.buildSymbolList = __bind(this.buildSymbolList, this);
      this.buildWordListOnNextTick = __bind(this.buildWordListOnNextTick, this);
      this.findSuggestionsForWord = __bind(this.findSuggestionsForWord, this);
      this.getSuggestions = __bind(this.getSuggestions, this);
      this.updateCurrentEditor = __bind(this.updateCurrentEditor, this);
      this.watchEditor = __bind(this.watchEditor, this);
      this.dispose = __bind(this.dispose, this);
      this.watchedBuffers = {};
      this.symbolStore = new SymbolStore(this.wordRegex);
      this.subscriptions = new CompositeDisposable;
      this.subscriptions.add(atom.config.observe('autocomplete-plus.minimumWordLength', (function(_this) {
        return function(minimumWordLength) {
          _this.minimumWordLength = minimumWordLength;
        };
      })(this)));
      this.subscriptions.add(atom.config.observe('autocomplete-plus.includeCompletionsFromAllBuffers', (function(_this) {
        return function(includeCompletionsFromAllBuffers) {
          _this.includeCompletionsFromAllBuffers = includeCompletionsFromAllBuffers;
        };
      })(this)));
      this.subscriptions.add(atom.workspace.observeActivePaneItem(this.updateCurrentEditor));
      this.subscriptions.add(atom.workspace.observeTextEditors(this.watchEditor));
    }

    SymbolProvider.prototype.dispose = function() {
      return this.subscriptions.dispose();
    };

    SymbolProvider.prototype.watchEditor = function(editor) {
      var buffer, bufferPath, bufferSubscriptions, editorSubscriptions;
      bufferPath = editor.getPath();
      editorSubscriptions = new CompositeDisposable;
      editorSubscriptions.add(editor.displayBuffer.onDidTokenize((function(_this) {
        return function() {
          return _this.buildWordListOnNextTick(editor);
        };
      })(this)));
      editorSubscriptions.add(editor.onDidDestroy((function(_this) {
        return function() {
          var editors, index, _ref1;
          index = _this.getWatchedEditorIndex(editor);
          editors = (_ref1 = _this.watchedBuffers[editor.getPath()]) != null ? _ref1.editors : void 0;
          if (index > -1) {
            editors.splice(index, 1);
          }
          return editorSubscriptions.dispose();
        };
      })(this)));
      if (this.watchedBuffers[bufferPath] != null) {
        return this.watchedBuffers[bufferPath].editors.push(editor);
      } else {
        buffer = editor.getBuffer();
        bufferSubscriptions = new CompositeDisposable;
        bufferSubscriptions.add(buffer.onWillChange((function(_this) {
          return function(_arg) {
            var newRange, oldRange;
            oldRange = _arg.oldRange, newRange = _arg.newRange;
            bufferPath = buffer.getPath();
            editor = _this.watchedBuffers[bufferPath].editors[0];
            _this.symbolStore.removeTokensInBufferRange(editor, oldRange);
            return _this.symbolStore.adjustBufferRows(editor, oldRange, newRange);
          };
        })(this)));
        bufferSubscriptions.add(buffer.onDidChange((function(_this) {
          return function(_arg) {
            var newRange;
            newRange = _arg.newRange;
            bufferPath = buffer.getPath();
            editor = _this.watchedBuffers[bufferPath].editors[0];
            return _this.symbolStore.addTokensInBufferRange(editor, newRange);
          };
        })(this)));
        bufferSubscriptions.add(buffer.onDidChangePath((function(_this) {
          return function() {
            var oldBufferPath;
            if (_this.watchedBuffers[bufferPath] == null) {
              return;
            }
            oldBufferPath = bufferPath;
            bufferPath = buffer.getPath();
            _this.watchedBuffers[bufferPath] = _this.watchedBuffers[oldBufferPath];
            _this.symbolStore.updateForPathChange(oldBufferPath, bufferPath);
            return delete _this.watchedBuffers[oldBufferPath];
          };
        })(this)));
        bufferSubscriptions.add(buffer.onDidDestroy((function(_this) {
          return function() {
            bufferPath = buffer.getPath();
            _this.symbolStore.clear(bufferPath);
            bufferSubscriptions.dispose();
            return delete _this.watchedBuffers[bufferPath];
          };
        })(this)));
        this.watchedBuffers[bufferPath] = {
          editors: [editor]
        };
        return this.buildWordListOnNextTick(editor);
      }
    };

    SymbolProvider.prototype.isWatchingEditor = function(editor) {
      return this.getWatchedEditorIndex(editor) > -1;
    };

    SymbolProvider.prototype.isWatchingBuffer = function(buffer) {
      return this.watchedBuffers[buffer.getPath()] != null;
    };

    SymbolProvider.prototype.getWatchedEditorIndex = function(editor) {
      var editors, _ref1;
      if (editors = (_ref1 = this.watchedBuffers[editor.getPath()]) != null ? _ref1.editors : void 0) {
        return editors.indexOf(editor);
      } else {
        return -1;
      }
    };

    SymbolProvider.prototype.updateCurrentEditor = function(currentPaneItem) {
      if (currentPaneItem == null) {
        return;
      }
      if (currentPaneItem === this.editor) {
        return;
      }
      this.editor = null;
      if (this.paneItemIsValid(currentPaneItem)) {
        return this.editor = currentPaneItem;
      }
    };

    SymbolProvider.prototype.buildConfigIfScopeChanged = function(_arg) {
      var editor, scopeDescriptor;
      editor = _arg.editor, scopeDescriptor = _arg.scopeDescriptor;
      if (!this.scopeDescriptorsEqual(this.configScopeDescriptor, scopeDescriptor)) {
        this.buildConfig(scopeDescriptor);
        return this.configScopeDescriptor = scopeDescriptor;
      }
    };

    SymbolProvider.prototype.buildConfig = function(scopeDescriptor) {
      var addedConfigEntry, allConfigEntries, value, _i, _len, _ref1;
      this.config = {};
      allConfigEntries = this.settingsForScopeDescriptor(scopeDescriptor, 'editor.completions');
      addedConfigEntry = false;
      for (_i = 0, _len = allConfigEntries.length; _i < _len; _i++) {
        value = allConfigEntries[_i].value;
        if (Array.isArray(value)) {
          if (value.length) {
            this.addLegacyConfigEntry(value);
          }
        } else if (typeof value === 'object') {
          this.addConfigEntry(value);
          addedConfigEntry = true;
        }
      }
      if (!addedConfigEntry) {
        this.addConfigEntry(this.defaultConfig);
      }
      if (((_ref1 = this.config.builtin) != null ? _ref1.suggestions : void 0) != null) {
        return this.config.builtin.suggestions = _.uniq(this.config.builtin.suggestions, this.uniqueFilter);
      }
    };

    SymbolProvider.prototype.addLegacyConfigEntry = function(suggestions) {
      var suggestion, _base;
      suggestions = (function() {
        var _i, _len, _results;
        _results = [];
        for (_i = 0, _len = suggestions.length; _i < _len; _i++) {
          suggestion = suggestions[_i];
          _results.push({
            text: suggestion,
            type: 'builtin'
          });
        }
        return _results;
      })();
      if ((_base = this.config).builtin == null) {
        _base.builtin = {
          suggestions: []
        };
      }
      return this.config.builtin.suggestions = this.config.builtin.suggestions.concat(suggestions);
    };

    SymbolProvider.prototype.addConfigEntry = function(config) {
      var options, suggestions, type, _base, _ref1;
      for (type in config) {
        options = config[type];
        if ((_base = this.config)[type] == null) {
          _base[type] = {};
        }
        if (options.selector != null) {
          this.config[type].selectors = Selector.create(options.selector);
        }
        this.config[type].typePriority = (_ref1 = options.typePriority) != null ? _ref1 : 1;
        this.config[type].wordRegex = this.wordRegex;
        suggestions = this.sanitizeSuggestionsFromConfig(options.suggestions, type);
        if ((suggestions != null) && suggestions.length) {
          this.config[type].suggestions = suggestions;
        }
      }
    };

    SymbolProvider.prototype.sanitizeSuggestionsFromConfig = function(suggestions, type) {
      var sanitizedSuggestions, suggestion, _i, _len;
      if ((suggestions != null) && Array.isArray(suggestions)) {
        sanitizedSuggestions = [];
        for (_i = 0, _len = suggestions.length; _i < _len; _i++) {
          suggestion = suggestions[_i];
          if (typeof suggestion === 'string') {
            sanitizedSuggestions.push({
              text: suggestion,
              type: type
            });
          } else if (typeof suggestions[0] === 'object' && ((suggestion.text != null) || (suggestion.snippet != null))) {
            suggestion = _.clone(suggestion);
            if (suggestion.type == null) {
              suggestion.type = type;
            }
            sanitizedSuggestions.push(suggestion);
          }
        }
        return sanitizedSuggestions;
      } else {
        return null;
      }
    };

    SymbolProvider.prototype.uniqueFilter = function(completion) {
      return completion.text;
    };

    SymbolProvider.prototype.paneItemIsValid = function(paneItem) {
      if (paneItem == null) {
        return false;
      }
      return paneItem instanceof TextEditor;
    };


    /*
    Section: Suggesting Completions
     */

    SymbolProvider.prototype.getSuggestions = function(options) {
      if (!options.prefix.trim().length) {
        return;
      }
      return this.findSuggestionsForWord(options);
    };

    SymbolProvider.prototype.findSuggestionsForWord = function(options) {
      var bufferPath, symbolList, word, wordUnderCursor, words, _i, _len;
      if (!this.symbolStore.getLength()) {
        return;
      }
      wordUnderCursor = this.wordAtBufferPosition(options);
      this.buildConfigIfScopeChanged(options);
      bufferPath = this.includeCompletionsFromAllBuffers ? null : this.editor.getPath();
      symbolList = this.symbolStore.symbolsForConfig(this.config, bufferPath, wordUnderCursor);
      words = atom.config.get("autocomplete-plus.strictMatching") ? symbolList.filter(function(match) {
        var _ref1;
        return ((_ref1 = match.text) != null ? _ref1.indexOf(options.prefix) : void 0) === 0;
      }) : this.fuzzyFilter(symbolList, this.editor.getPath(), options);
      for (_i = 0, _len = words.length; _i < _len; _i++) {
        word = words[_i];
        word.replacementPrefix = options.prefix;
      }
      return words;
    };

    SymbolProvider.prototype.wordAtBufferPosition = function(_arg) {
      var bufferPosition, editor, lineFromPosition, prefix, suffix, _ref1;
      editor = _arg.editor, prefix = _arg.prefix, bufferPosition = _arg.bufferPosition;
      lineFromPosition = editor.getTextInRange([bufferPosition, [bufferPosition.row, Infinity]]);
      suffix = ((_ref1 = lineFromPosition.match(this.beginningOfLineWordRegex)) != null ? _ref1[0] : void 0) || '';
      return prefix + suffix;
    };

    SymbolProvider.prototype.fuzzyFilter = function(symbolList, bufferPath, _arg) {
      var bufferPosition, candidates, index, locality, prefix, results, rowDifference, score, symbol, _i, _j, _len, _len1, _ref1;
      bufferPosition = _arg.bufferPosition, prefix = _arg.prefix;
      candidates = [];
      for (_i = 0, _len = symbolList.length; _i < _len; _i++) {
        symbol = symbolList[_i];
        if (prefix[0].toLowerCase() !== symbol.text[0].toLowerCase()) {
          continue;
        }
        score = fuzzaldrin.score(symbol.text, prefix);
        score *= this.getLocalityScore(bufferPosition, typeof symbol.bufferRowsForBufferPath === "function" ? symbol.bufferRowsForBufferPath(bufferPath) : void 0);
        if (score > 0) {
          candidates.push({
            symbol: symbol,
            score: score,
            locality: locality,
            rowDifference: rowDifference
          });
        }
      }
      candidates.sort(this.symbolSortReverseIterator);
      results = [];
      for (index = _j = 0, _len1 = candidates.length; _j < _len1; index = ++_j) {
        _ref1 = candidates[index], symbol = _ref1.symbol, score = _ref1.score, locality = _ref1.locality, rowDifference = _ref1.rowDifference;
        if (index === 20) {
          break;
        }
        results.push(symbol);
      }
      return results;
    };

    SymbolProvider.prototype.symbolSortReverseIterator = function(a, b) {
      return b.score - a.score;
    };

    SymbolProvider.prototype.getLocalityScore = function(bufferPosition, bufferRowsContainingSymbol) {
      var bufferRow, locality, rowDifference, _i, _len;
      if (bufferRowsContainingSymbol != null) {
        rowDifference = Number.MAX_VALUE;
        for (_i = 0, _len = bufferRowsContainingSymbol.length; _i < _len; _i++) {
          bufferRow = bufferRowsContainingSymbol[_i];
          rowDifference = Math.min(rowDifference, bufferRow - bufferPosition.row);
        }
        locality = this.computeLocalityModifier(rowDifference);
        return locality;
      } else {
        return 1;
      }
    };

    SymbolProvider.prototype.computeLocalityModifier = function(rowDifference) {
      rowDifference = Math.abs(rowDifference);
      return 1 + Math.max(-Math.pow(.2 * rowDifference - 3, 3) / 25 + .5, 0);
    };

    SymbolProvider.prototype.settingsForScopeDescriptor = function(scopeDescriptor, keyPath) {
      return atom.config.getAll(keyPath, {
        scope: scopeDescriptor
      });
    };


    /*
    Section: Word List Building
     */

    SymbolProvider.prototype.buildWordListOnNextTick = function(editor) {
      return _.defer((function(_this) {
        return function() {
          return _this.buildSymbolList(editor);
        };
      })(this));
    };

    SymbolProvider.prototype.buildSymbolList = function(editor) {
      if (editor == null) {
        return;
      }
      this.symbolStore.clear(editor.getPath());
      return this.cacheSymbolsFromEditor(editor);
    };

    SymbolProvider.prototype.cacheSymbolsFromEditor = function(editor, tokenizedLines) {
      var bufferPath, bufferRow, token, tokens, _i, _j, _len, _len1;
      if (tokenizedLines == null) {
        tokenizedLines = this.getTokenizedLines(editor);
      }
      bufferPath = editor.getPath();
      for (bufferRow = _i = 0, _len = tokenizedLines.length; _i < _len; bufferRow = ++_i) {
        tokens = tokenizedLines[bufferRow].tokens;
        for (_j = 0, _len1 = tokens.length; _j < _len1; _j++) {
          token = tokens[_j];
          this.symbolStore.addToken(token, bufferPath, bufferRow, this.minimumWordLength);
        }
      }
    };

    SymbolProvider.prototype.getTokenizedLines = function(editor) {
      return editor.displayBuffer.tokenizedBuffer.tokenizedLines;
    };

    SymbolProvider.prototype.scopeDescriptorsEqual = function(a, b) {
      var arrayA, arrayB, i, scope, _i, _len;
      if (a === b) {
        return true;
      }
      if (!((a != null) && (b != null))) {
        return false;
      }
      arrayA = a.getScopesArray();
      arrayB = b.getScopesArray();
      if (arrayA.length !== arrayB.length) {
        return false;
      }
      for (i = _i = 0, _len = arrayA.length; _i < _len; i = ++_i) {
        scope = arrayA[i];
        if (scope !== arrayB[i]) {
          return false;
        }
      }
      return true;
    };

    return SymbolProvider;

  })();

}).call(this);
