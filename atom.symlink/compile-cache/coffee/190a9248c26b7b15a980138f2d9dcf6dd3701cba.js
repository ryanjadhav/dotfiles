(function() {
  var RefCountedTokenList, Symbol, SymbolStore, binaryIndexOf, getObjectLength, selectorsMatchScopeChain,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  RefCountedTokenList = require('./ref-counted-token-list');

  selectorsMatchScopeChain = require('./scope-helpers').selectorsMatchScopeChain;

  Symbol = (function() {
    Symbol.prototype.count = 0;

    Symbol.prototype.metadataByPath = null;

    Symbol.prototype.cachedConfig = null;

    Symbol.prototype.type = null;

    function Symbol(text) {
      this.text = text;
      this.metadataByPath = {};
    }

    Symbol.prototype.getCount = function() {
      return this.count;
    };

    Symbol.prototype.bufferRowsForBufferPath = function(bufferPath) {
      var _ref;
      return (_ref = this.metadataByPath[bufferPath]) != null ? _ref.bufferRows : void 0;
    };

    Symbol.prototype.countForBufferPath = function(bufferPath) {
      var bufferPathCount, metadata, scopeChain, scopeCount, _ref;
      metadata = this.metadataByPath[bufferPath];
      bufferPathCount = 0;
      if (metadata != null) {
        _ref = metadata.scopeChains;
        for (scopeChain in _ref) {
          scopeCount = _ref[scopeChain];
          bufferPathCount += scopeCount;
        }
      }
      return bufferPathCount;
    };

    Symbol.prototype.clearForBufferPath = function(bufferPath) {
      var bufferPathCount;
      bufferPathCount = this.countForBufferPath(bufferPath);
      if (bufferPathCount > 0) {
        this.count -= bufferPathCount;
        return delete this.metadataByPath[bufferPath];
      }
    };

    Symbol.prototype.updateForPathChange = function(oldPath, newPath) {
      if (this.metadataByPath[oldPath] != null) {
        this.metadataByPath[newPath] = this.metadataByPath[oldPath];
      }
      return delete this.metadataByPath[oldPath];
    };

    Symbol.prototype.adjustBufferRows = function(bufferPath, adjustmentStartRow, adjustmentDelta) {
      var bufferRows, index, length, _ref;
      bufferRows = (_ref = this.metadataByPath[bufferPath]) != null ? _ref.bufferRows : void 0;
      if (bufferRows == null) {
        return;
      }
      index = binaryIndexOf(bufferRows, adjustmentStartRow);
      length = bufferRows.length;
      while (index < length) {
        bufferRows[index] += adjustmentDelta;
        index++;
      }
    };

    Symbol.prototype.addInstance = function(bufferPath, bufferRow, scopeChain) {
      var _base, _base1;
      if ((_base = this.metadataByPath)[bufferPath] == null) {
        _base[bufferPath] = {};
      }
      this.addBufferRow(bufferPath, bufferRow);
      if ((_base1 = this.metadataByPath[bufferPath]).scopeChains == null) {
        _base1.scopeChains = {};
      }
      if (this.metadataByPath[bufferPath].scopeChains[scopeChain] == null) {
        this.type = null;
        this.metadataByPath[bufferPath].scopeChains[scopeChain] = 0;
      }
      this.metadataByPath[bufferPath].scopeChains[scopeChain] += 1;
      return this.count += 1;
    };

    Symbol.prototype.removeInstance = function(bufferPath, bufferRow, scopeChain) {
      if (this.metadataByPath[bufferPath] == null) {
        return;
      }
      this.removeBufferRow(bufferPath, bufferRow);
      if (this.metadataByPath[bufferPath].scopeChains[scopeChain] != null) {
        this.count -= 1;
        this.metadataByPath[bufferPath].scopeChains[scopeChain] -= 1;
        if (this.metadataByPath[bufferPath].scopeChains[scopeChain] === 0) {
          delete this.metadataByPath[bufferPath].scopeChains[scopeChain];
          this.type = null;
        }
        if (getObjectLength(this.metadataByPath[bufferPath].scopeChains) === 0) {
          return delete this.metadataByPath[bufferPath];
        }
      }
    };

    Symbol.prototype.addBufferRow = function(bufferPath, row) {
      var bufferRows, index, _base;
      if ((_base = this.metadataByPath[bufferPath]).bufferRows == null) {
        _base.bufferRows = [];
      }
      bufferRows = this.metadataByPath[bufferPath].bufferRows;
      index = binaryIndexOf(bufferRows, row);
      return bufferRows.splice(index, 0, row);
    };

    Symbol.prototype.removeBufferRow = function(bufferPath, row) {
      var bufferRows, index;
      bufferRows = this.metadataByPath[bufferPath].bufferRows;
      if (!bufferRows) {
        return;
      }
      index = binaryIndexOf(bufferRows, row);
      if (bufferRows[index] === row) {
        return bufferRows.splice(index, 1);
      }
    };

    Symbol.prototype.isSingleInstanceOf = function(word) {
      return this.text === word && this.count === 1;
    };

    Symbol.prototype.appliesToConfig = function(config, bufferPath) {
      var filePath, options, scopeChain, scopeChains, type, typePriority, __, _ref;
      if (this.cachedConfig !== config) {
        this.type = null;
      }
      if (this.type == null) {
        typePriority = 0;
        for (type in config) {
          options = config[type];
          if (options.selectors == null) {
            continue;
          }
          _ref = this.metadataByPath;
          for (filePath in _ref) {
            scopeChains = _ref[filePath].scopeChains;
            for (scopeChain in scopeChains) {
              __ = scopeChains[scopeChain];
              if ((!this.type || options.typePriority > typePriority) && selectorsMatchScopeChain(options.selectors, scopeChain)) {
                this.type = type;
                typePriority = options.typePriority;
              }
            }
          }
        }
        this.cachedConfig = config;
      }
      if (bufferPath != null) {
        return (this.type != null) && this.countForBufferPath(bufferPath) > 0;
      } else {
        return this.type != null;
      }
    };

    return Symbol;

  })();

  module.exports = SymbolStore = (function() {
    SymbolStore.prototype.count = 0;

    function SymbolStore(wordRegex) {
      this.wordRegex = wordRegex;
      this.removeSymbol = __bind(this.removeSymbol, this);
      this.removeToken = __bind(this.removeToken, this);
      this.addToken = __bind(this.addToken, this);
      this.clear();
    }

    SymbolStore.prototype.clear = function(bufferPath) {
      var symbol, symbolKey, _ref;
      if (bufferPath != null) {
        _ref = this.symbolMap;
        for (symbolKey in _ref) {
          symbol = _ref[symbolKey];
          symbol.clearForBufferPath(bufferPath);
          if (symbol.getCount() === 0) {
            delete this.symbolMap[symbolKey];
          }
        }
      } else {
        this.symbolMap = {};
      }
    };

    SymbolStore.prototype.getLength = function() {
      return this.count;
    };

    SymbolStore.prototype.getSymbol = function(symbolKey) {
      symbolKey = this.getKey(symbolKey);
      return this.symbolMap[symbolKey];
    };

    SymbolStore.prototype.symbolsForConfig = function(config, bufferPath, wordUnderCursor) {
      var options, symbol, symbolKey, symbols, type, _ref;
      symbols = [];
      _ref = this.symbolMap;
      for (symbolKey in _ref) {
        symbol = _ref[symbolKey];
        if (symbol.appliesToConfig(config, bufferPath) && !symbol.isSingleInstanceOf(wordUnderCursor)) {
          symbols.push(symbol);
        }
      }
      for (type in config) {
        options = config[type];
        if (options.suggestions) {
          symbols = symbols.concat(options.suggestions);
        }
      }
      return symbols;
    };

    SymbolStore.prototype.adjustBufferRows = function(editor, oldRange, newRange) {
      var adjustmentDelta, adjustmentStartRow, key, symbol, _ref;
      adjustmentStartRow = oldRange.end.row + 1;
      adjustmentDelta = newRange.getRowCount() - oldRange.getRowCount();
      _ref = this.symbolMap;
      for (key in _ref) {
        symbol = _ref[key];
        symbol.adjustBufferRows(editor.getPath(), adjustmentStartRow, adjustmentDelta);
      }
    };

    SymbolStore.prototype.updateForPathChange = function(oldPath, newPath) {
      var key, symbol, _ref;
      _ref = this.symbolMap;
      for (key in _ref) {
        symbol = _ref[key];
        symbol.updateForPathChange(oldPath, newPath);
      }
    };

    SymbolStore.prototype.addToken = function(token, bufferPath, bufferRow) {
      var matches, scopeChain, symbolText, text, _i, _len;
      text = this.getTokenText(token);
      scopeChain = this.getTokenScopeChain(token);
      matches = text.match(this.wordRegex);
      if (matches != null) {
        for (_i = 0, _len = matches.length; _i < _len; _i++) {
          symbolText = matches[_i];
          this.addSymbol(symbolText, bufferPath, bufferRow, scopeChain);
        }
      }
    };

    SymbolStore.prototype.removeToken = function(token, bufferPath, bufferRow) {
      var matches, scopeChain, symbolText, text, _i, _len;
      text = this.getTokenText(token);
      scopeChain = this.getTokenScopeChain(token);
      matches = text.match(this.wordRegex);
      if (matches != null) {
        for (_i = 0, _len = matches.length; _i < _len; _i++) {
          symbolText = matches[_i];
          this.removeSymbol(symbolText, bufferPath, bufferRow, scopeChain);
        }
      }
    };

    SymbolStore.prototype.addTokensInBufferRange = function(editor, bufferRange) {
      return this.operateOnTokensInBufferRange(editor, bufferRange, this.addToken);
    };

    SymbolStore.prototype.removeTokensInBufferRange = function(editor, bufferRange) {
      return this.operateOnTokensInBufferRange(editor, bufferRange, this.removeToken);
    };

    SymbolStore.prototype.operateOnTokensInBufferRange = function(editor, bufferRange, operatorFunc) {
      var bufferRow, bufferRowBase, bufferRowIndex, token, tokenizedLines, tokens, _i, _j, _len, _len1;
      tokenizedLines = this.getTokenizedLines(editor).slice(bufferRange.start.row, +bufferRange.end.row + 1 || 9e9);
      bufferRowBase = bufferRange.start.row;
      for (bufferRowIndex = _i = 0, _len = tokenizedLines.length; _i < _len; bufferRowIndex = ++_i) {
        tokens = tokenizedLines[bufferRowIndex].tokens;
        bufferRow = bufferRowBase + bufferRowIndex;
        for (_j = 0, _len1 = tokens.length; _j < _len1; _j++) {
          token = tokens[_j];
          operatorFunc(token, editor.getPath(), bufferRow);
        }
      }
    };


    /*
    Private Methods
     */

    SymbolStore.prototype.addSymbol = function(symbolText, bufferPath, bufferRow, scopeChain) {
      var symbol, symbolKey;
      symbolKey = this.getKey(symbolText);
      symbol = this.symbolMap[symbolKey];
      if (symbol == null) {
        this.symbolMap[symbolKey] = symbol = new Symbol(symbolText);
        this.count += 1;
      }
      return symbol.addInstance(bufferPath, bufferRow, scopeChain);
    };

    SymbolStore.prototype.removeSymbol = function(symbolText, bufferPath, bufferRow, scopeChain) {
      var symbol, symbolKey;
      symbolKey = this.getKey(symbolText);
      symbol = this.symbolMap[symbolKey];
      if (symbol != null) {
        symbol.removeInstance(bufferPath, bufferRow, scopeChain);
        if (symbol.getCount() === 0) {
          delete this.symbolMap[symbolKey];
          return this.count -= 1;
        }
      }
    };

    SymbolStore.prototype.getTokenizedLines = function(editor) {
      return editor.displayBuffer.tokenizedBuffer.tokenizedLines;
    };

    SymbolStore.prototype.getTokenText = function(token) {
      return token.value;
    };

    SymbolStore.prototype.getTokenScopeChain = function(token) {
      var scope, scopeChain, _i, _len, _ref;
      scopeChain = '';
      _ref = token.scopes;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        scope = _ref[_i];
        scopeChain += ' .' + scope;
      }
      return scopeChain;
    };

    SymbolStore.prototype.getKey = function(value) {
      return value + '$$';
    };

    return SymbolStore;

  })();

  getObjectLength = function(object) {
    var count, k, v;
    count = 0;
    for (k in object) {
      v = object[k];
      count += 1;
    }
    return count;
  };

  binaryIndexOf = function(array, searchElement) {
    var currentElement, currentIndex, maxIndex, minIndex;
    minIndex = 0;
    maxIndex = array.length - 1;
    while (minIndex <= maxIndex) {
      currentIndex = (minIndex + maxIndex) / 2 | 0;
      currentElement = array[currentIndex];
      if (currentElement < searchElement) {
        minIndex = currentIndex + 1;
      } else if (currentElement > searchElement) {
        maxIndex = currentIndex - 1;
      } else {
        return currentIndex;
      }
    }
    return minIndex;
  };

}).call(this);
