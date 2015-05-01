(function() {
  var AutocompleteManager, CompositeDisposable, Disposable, ProviderManager, Range, SuggestionList, SuggestionListElement, TextEditor, grim, minimatch, path, semver, _, _ref,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  _ref = require('atom'), Range = _ref.Range, TextEditor = _ref.TextEditor, CompositeDisposable = _ref.CompositeDisposable, Disposable = _ref.Disposable;

  _ = require('underscore-plus');

  path = require('path');

  semver = require('semver');

  ProviderManager = require('./provider-manager');

  SuggestionList = require('./suggestion-list');

  SuggestionListElement = require('./suggestion-list-element');

  minimatch = null;

  grim = null;

  module.exports = AutocompleteManager = (function() {
    AutocompleteManager.prototype.autosaveEnabled = false;

    AutocompleteManager.prototype.backspaceTriggersAutocomplete = true;

    AutocompleteManager.prototype.bracketMatcherPairs = ['()', '[]', '{}', '""', "''", '``', "“”", '‘’', "«»", "‹›"];

    AutocompleteManager.prototype.buffer = null;

    AutocompleteManager.prototype.compositionInProgress = false;

    AutocompleteManager.prototype.disposed = false;

    AutocompleteManager.prototype.editor = null;

    AutocompleteManager.prototype.editorSubscriptions = null;

    AutocompleteManager.prototype.editorView = null;

    AutocompleteManager.prototype.providerManager = null;

    AutocompleteManager.prototype.ready = false;

    AutocompleteManager.prototype.subscriptions = null;

    AutocompleteManager.prototype.suggestionDelay = 50;

    AutocompleteManager.prototype.suggestionList = null;

    AutocompleteManager.prototype.suppressForClasses = [];

    AutocompleteManager.prototype.shouldDisplaySuggestions = false;

    AutocompleteManager.prototype.manualActivationStrictPrefixes = null;

    AutocompleteManager.prototype.prefixRegex = /(\b|['"~`!@#\$%^&*\(\)\{\}\[\]=\+,/\?>])((\w+[\w-]*)|([.:;[{(< ]+))$/;

    AutocompleteManager.prototype.wordPrefixRegex = /^\w+[\w-]*$/;

    function AutocompleteManager() {
      this.dispose = __bind(this.dispose, this);
      this.bufferChanged = __bind(this.bufferChanged, this);
      this.bufferSaved = __bind(this.bufferSaved, this);
      this.cursorMoved = __bind(this.cursorMoved, this);
      this.requestNewSuggestions = __bind(this.requestNewSuggestions, this);
      this.isCurrentFileBlackListed = __bind(this.isCurrentFileBlackListed, this);
      this.replaceTextWithMatch = __bind(this.replaceTextWithMatch, this);
      this.hideSuggestionList = __bind(this.hideSuggestionList, this);
      this.confirm = __bind(this.confirm, this);
      this.displaySuggestions = __bind(this.displaySuggestions, this);
      this.getSuggestionsFromProviders = __bind(this.getSuggestionsFromProviders, this);
      this.findSuggestions = __bind(this.findSuggestions, this);
      this.handleCommands = __bind(this.handleCommands, this);
      this.handleEvents = __bind(this.handleEvents, this);
      this.updateCurrentEditor = __bind(this.updateCurrentEditor, this);
      this.subscriptions = new CompositeDisposable;
      this.providerManager = new ProviderManager;
      this.suggestionList = new SuggestionList;
      this.subscriptions.add(this.providerManager);
      this.subscriptions.add(atom.views.addViewProvider(SuggestionList, function(model) {
        return new SuggestionListElement().initialize(model);
      }));
      this.handleEvents();
      this.handleCommands();
      this.subscriptions.add(this.suggestionList);
      this.ready = true;
    }

    AutocompleteManager.prototype.setSnippetsManager = function(snippetsManager) {
      this.snippetsManager = snippetsManager;
    };

    AutocompleteManager.prototype.updateCurrentEditor = function(currentPaneItem) {
      var compositionEnd, compositionStart, _ref1;
      if ((currentPaneItem == null) || currentPaneItem === this.editor) {
        return;
      }
      if ((_ref1 = this.editorSubscriptions) != null) {
        _ref1.dispose();
      }
      this.editorSubscriptions = null;
      this.editor = null;
      this.editorView = null;
      this.buffer = null;
      if (!this.paneItemIsValid(currentPaneItem)) {
        return;
      }
      this.editor = currentPaneItem;
      this.editorView = atom.views.getView(this.editor);
      this.buffer = this.editor.getBuffer();
      this.editorSubscriptions = new CompositeDisposable;
      this.editorSubscriptions.add(this.buffer.onDidSave(this.bufferSaved));
      this.editorSubscriptions.add(this.buffer.onDidChange(this.bufferChanged));
      compositionStart = (function(_this) {
        return function() {
          return _this.compositionInProgress = true;
        };
      })(this);
      compositionEnd = (function(_this) {
        return function() {
          return _this.compositionInProgress = false;
        };
      })(this);
      this.editorView.addEventListener('compositionstart', compositionStart);
      this.editorView.addEventListener('compositionend', compositionEnd);
      this.editorSubscriptions.add(new Disposable(function() {
        var _ref2, _ref3;
        if ((_ref2 = this.editorView) != null) {
          _ref2.removeEventListener('compositionstart', compositionStart);
        }
        return (_ref3 = this.editorView) != null ? _ref3.removeEventListener('compositionend', compositionEnd) : void 0;
      }));
      return this.editorSubscriptions.add(this.editor.onDidChangeCursorPosition(this.cursorMoved));
    };

    AutocompleteManager.prototype.paneItemIsValid = function(paneItem) {
      if (paneItem == null) {
        return false;
      }
      return paneItem instanceof TextEditor;
    };

    AutocompleteManager.prototype.handleEvents = function() {
      this.subscriptions.add(atom.workspace.observeActivePaneItem(this.updateCurrentEditor));
      this.subscriptions.add(atom.config.observe('autosave.enabled', (function(_this) {
        return function(value) {
          return _this.autosaveEnabled = value;
        };
      })(this)));
      this.subscriptions.add(atom.config.observe('autocomplete-plus.backspaceTriggersAutocomplete', (function(_this) {
        return function(value) {
          return _this.backspaceTriggersAutocomplete = value;
        };
      })(this)));
      this.subscriptions.add(atom.config.observe('autocomplete-plus.enableAutoActivation', (function(_this) {
        return function(value) {
          return _this.autoActivationEnabled = value;
        };
      })(this)));
      this.subscriptions.add(atom.config.observe('autocomplete-plus.suppressActivationForEditorClasses', (function(_this) {
        return function(value) {
          return _this.suppressForClasses = _.chain(value).map(function(classNames) {
            return classNames != null ? classNames.trim().split('.').map(function(className) {
              return className != null ? className.trim() : void 0;
            }) : void 0;
          }).compact().value();
        };
      })(this)));
      this.subscriptions.add(this.suggestionList.onDidConfirm(this.confirm));
      return this.subscriptions.add(this.suggestionList.onDidCancel(this.hideSuggestionList));
    };

    AutocompleteManager.prototype.handleCommands = function() {
      return this.subscriptions.add(atom.commands.add('atom-text-editor', {
        'autocomplete-plus:activate': (function(_this) {
          return function() {
            _this.shouldDisplaySuggestions = true;
            return _this.findSuggestions(true);
          };
        })(this)
      }));
    };

    AutocompleteManager.prototype.findSuggestions = function(activatedManually) {
      var bufferPosition, cursor, prefix, scopeDescriptor;
      if (this.disposed) {
        return;
      }
      if (!((this.providerManager != null) && (this.editor != null) && (this.buffer != null))) {
        return;
      }
      if (this.isCurrentFileBlackListed()) {
        return;
      }
      cursor = this.editor.getLastCursor();
      if (cursor == null) {
        return;
      }
      bufferPosition = cursor.getBufferPosition();
      scopeDescriptor = cursor.getScopeDescriptor();
      prefix = this.getPrefix(this.editor, bufferPosition);
      return this.getSuggestionsFromProviders({
        editor: this.editor,
        bufferPosition: bufferPosition,
        scopeDescriptor: scopeDescriptor,
        prefix: prefix
      }, activatedManually);
    };

    AutocompleteManager.prototype.getSuggestionsFromProviders = function(options, activatedManually) {
      var providerPromises, providers, suggestionsPromise;
      providers = this.providerManager.providersForScopeDescriptor(options.scopeDescriptor);
      providerPromises = [];
      providers.forEach((function(_this) {
        return function(provider) {
          var apiIs20, apiVersion, getSuggestions, upgradedOptions;
          apiVersion = _this.providerManager.apiVersionForProvider(provider);
          apiIs20 = semver.satisfies(apiVersion, '>=2.0.0');
          if (apiIs20) {
            getSuggestions = provider.getSuggestions.bind(provider);
            upgradedOptions = options;
          } else {
            getSuggestions = provider.requestHandler.bind(provider);
            upgradedOptions = _.extend({}, options, {
              position: options.bufferPosition,
              scope: options.scopeDescriptor,
              scopeChain: options.scopeDescriptor.getScopeChain(),
              buffer: options.editor.getBuffer(),
              cursor: options.editor.getLastCursor()
            });
          }
          return providerPromises.push(Promise.resolve(getSuggestions(upgradedOptions)).then(function(providerSuggestions) {
            var hasDeprecations, suggestion, _i, _len;
            if (providerSuggestions == null) {
              return;
            }
            hasDeprecations = false;
            if (apiIs20 && providerSuggestions.length) {
              hasDeprecations = _this.deprecateForSuggestion(provider, providerSuggestions[0]);
            }
            if (hasDeprecations || !apiIs20) {
              providerSuggestions = providerSuggestions.map(function(suggestion) {
                var newSuggestion, _ref1, _ref2;
                newSuggestion = {
                  text: (_ref1 = suggestion.text) != null ? _ref1 : suggestion.word,
                  snippet: suggestion.snippet,
                  replacementPrefix: (_ref2 = suggestion.replacementPrefix) != null ? _ref2 : suggestion.prefix,
                  className: suggestion.className,
                  type: suggestion.type
                };
                if ((newSuggestion.rightLabelHTML == null) && suggestion.renderLabelAsHtml) {
                  newSuggestion.rightLabelHTML = suggestion.label;
                }
                if ((newSuggestion.rightLabel == null) && !suggestion.renderLabelAsHtml) {
                  newSuggestion.rightLabel = suggestion.label;
                }
                return newSuggestion;
              });
            }
            for (_i = 0, _len = providerSuggestions.length; _i < _len; _i++) {
              suggestion = providerSuggestions[_i];
              if (suggestion.replacementPrefix == null) {
                suggestion.replacementPrefix = _this.getDefaultReplacementPrefix(options.prefix);
              }
              suggestion.provider = provider;
              if (activatedManually) {
                _this.addManualActivationStrictPrefix(provider, suggestion.replacementPrefix);
              }
            }
            return providerSuggestions;
          }));
        };
      })(this));
      if (!(providerPromises != null ? providerPromises.length : void 0)) {
        return;
      }
      return this.currentSuggestionsPromise = suggestionsPromise = Promise.all(providerPromises).then(this.mergeSuggestionsFromProviders).then((function(_this) {
        return function(suggestions) {
          if (_this.currentSuggestionsPromise !== suggestionsPromise) {
            return;
          }
          suggestions = _this.filterForManualActivationStrictPrefix(suggestions);
          if (activatedManually && _this.shouldDisplaySuggestions && suggestions.length === 1) {
            return _this.confirm(suggestions[0]);
          } else {
            return _this.displaySuggestions(suggestions, options);
          }
        };
      })(this));
    };

    AutocompleteManager.prototype.mergeSuggestionsFromProviders = function(providerSuggestions) {
      return providerSuggestions.reduce(function(suggestions, providerSuggestions) {
        if (providerSuggestions != null ? providerSuggestions.length : void 0) {
          suggestions = suggestions.concat(providerSuggestions);
        }
        return suggestions;
      }, []);
    };

    AutocompleteManager.prototype.deprecateForSuggestion = function(provider, suggestion) {
      var hasDeprecations;
      hasDeprecations = false;
      if (suggestion.word != null) {
        hasDeprecations = true;
        if (grim == null) {
          grim = require('grim');
        }
        grim.deprecate("Autocomplete provider '" + provider.constructor.name + "(" + provider.id + ")'\nreturns suggestions with a `word` attribute.\nThe `word` attribute is now `text`.\nSee https://github.com/atom-community/autocomplete-plus/wiki/Provider-API");
      }
      if (suggestion.prefix != null) {
        hasDeprecations = true;
        if (grim == null) {
          grim = require('grim');
        }
        grim.deprecate("Autocomplete provider '" + provider.constructor.name + "(" + provider.id + ")'\nreturns suggestions with a `prefix` attribute.\nThe `prefix` attribute is now `replacementPrefix` and is optional.\nSee https://github.com/atom-community/autocomplete-plus/wiki/Provider-API");
      }
      if (suggestion.label != null) {
        hasDeprecations = true;
        if (grim == null) {
          grim = require('grim');
        }
        grim.deprecate("Autocomplete provider '" + provider.constructor.name + "(" + provider.id + ")'\nreturns suggestions with a `label` attribute.\nThe `label` attribute is now `rightLabel` or `rightLabelHTML`.\nSee https://github.com/atom-community/autocomplete-plus/wiki/Provider-API");
      }
      if (suggestion.onWillConfirm != null) {
        hasDeprecations = true;
        if (grim == null) {
          grim = require('grim');
        }
        grim.deprecate("Autocomplete provider '" + provider.constructor.name + "(" + provider.id + ")'\nreturns suggestions with a `onWillConfirm` callback.\nThe `onWillConfirm` callback is no longer supported.\nSee https://github.com/atom-community/autocomplete-plus/wiki/Provider-API");
      }
      if (suggestion.onDidConfirm != null) {
        hasDeprecations = true;
        if (grim == null) {
          grim = require('grim');
        }
        grim.deprecate("Autocomplete provider '" + provider.constructor.name + "(" + provider.id + ")'\nreturns suggestions with a `onDidConfirm` callback.\nThe `onDidConfirm` callback is now a `onDidInsertSuggestion` callback on the provider itself.\nSee https://github.com/atom-community/autocomplete-plus/wiki/Provider-API");
      }
      return hasDeprecations;
    };

    AutocompleteManager.prototype.displaySuggestions = function(suggestions, options) {
      suggestions = _.uniq(suggestions, function(s) {
        return s.text + s.snippet;
      });
      if (this.shouldDisplaySuggestions && suggestions.length) {
        return this.showSuggestionList(suggestions, options);
      } else {
        return this.hideSuggestionList();
      }
    };

    AutocompleteManager.prototype.getPrefix = function(editor, bufferPosition) {
      var line, _ref1;
      line = editor.getTextInRange([[bufferPosition.row, 0], bufferPosition]);
      return ((_ref1 = this.prefixRegex.exec(line)) != null ? _ref1[2] : void 0) || '';
    };

    AutocompleteManager.prototype.getDefaultReplacementPrefix = function(prefix) {
      if (this.wordPrefixRegex.test(prefix)) {
        return prefix;
      } else {
        return '';
      }
    };

    AutocompleteManager.prototype.confirm = function(suggestion) {
      var apiIs20, apiVersion, triggerPosition, _base, _ref1;
      if (!((this.editor != null) && (suggestion != null) && !this.disposed)) {
        return;
      }
      apiVersion = this.providerManager.apiVersionForProvider(suggestion.provider);
      apiIs20 = semver.satisfies(apiVersion, '>=2.0.0');
      triggerPosition = this.editor.getLastCursor().getBufferPosition();
      if (typeof suggestion.onWillConfirm === "function") {
        suggestion.onWillConfirm();
      }
      if ((_ref1 = this.editor.getSelections()) != null) {
        _ref1.forEach(function(selection) {
          return selection != null ? selection.clear() : void 0;
        });
      }
      this.hideSuggestionList();
      this.replaceTextWithMatch(suggestion);
      if (apiIs20) {
        return typeof (_base = suggestion.provider).onDidInsertSuggestion === "function" ? _base.onDidInsertSuggestion({
          editor: this.editor,
          suggestion: suggestion,
          triggerPosition: triggerPosition
        }) : void 0;
      } else {
        return typeof suggestion.onDidConfirm === "function" ? suggestion.onDidConfirm() : void 0;
      }
    };

    AutocompleteManager.prototype.showSuggestionList = function(suggestions, options) {
      if (this.disposed) {
        return;
      }
      this.suggestionList.changeItems(suggestions);
      return this.suggestionList.show(this.editor, options);
    };

    AutocompleteManager.prototype.hideSuggestionList = function() {
      if (this.disposed) {
        return;
      }
      this.clearManualActivationStrictPrefixes();
      this.suggestionList.hide();
      return this.shouldDisplaySuggestions = false;
    };

    AutocompleteManager.prototype.requestHideSuggestionList = function(command) {
      this.hideTimeout = setTimeout(this.hideSuggestionList, 0);
      return this.shouldDisplaySuggestions = false;
    };

    AutocompleteManager.prototype.cancelHideSuggestionListRequest = function() {
      return clearTimeout(this.hideTimeout);
    };

    AutocompleteManager.prototype.replaceTextWithMatch = function(suggestion) {
      var cursors, newSelectedBufferRanges;
      if (this.editor == null) {
        return;
      }
      newSelectedBufferRanges = [];
      cursors = this.editor.getCursors();
      if (cursors == null) {
        return;
      }
      return this.editor.transact((function(_this) {
        return function() {
          var beginningPosition, cursor, endPosition, suffix, _i, _len, _ref1;
          for (_i = 0, _len = cursors.length; _i < _len; _i++) {
            cursor = cursors[_i];
            endPosition = cursor.getBufferPosition();
            beginningPosition = [endPosition.row, endPosition.column - suggestion.replacementPrefix.length];
            if (_this.editor.getTextInBufferRange([beginningPosition, endPosition]) === suggestion.replacementPrefix) {
              suffix = _this.getSuffix(_this.editor, endPosition, suggestion);
              if (suffix.length) {
                cursor.moveRight(suffix.length);
              }
              cursor.selection.selectLeft(suggestion.replacementPrefix.length + suffix.length);
              if ((suggestion.snippet != null) && (_this.snippetsManager != null)) {
                _this.snippetsManager.insertSnippet(suggestion.snippet, _this.editor, cursor);
              } else {
                cursor.selection.insertText((_ref1 = suggestion.text) != null ? _ref1 : suggestion.snippet);
              }
            }
          }
        };
      })(this));
    };

    AutocompleteManager.prototype.getSuffix = function(editor, bufferPosition, suggestion) {
      var endOfLineText, endPosition, suffix, _ref1;
      suffix = (_ref1 = suggestion.snippet) != null ? _ref1 : suggestion.text;
      endPosition = [bufferPosition.row, bufferPosition.column + suffix.length];
      endOfLineText = editor.getTextInBufferRange([bufferPosition, endPosition]);
      while (suffix) {
        if (endOfLineText.startsWith(suffix)) {
          return suffix;
        }
        suffix = suffix.slice(1);
      }
      return '';
    };

    AutocompleteManager.prototype.isCurrentFileBlackListed = function() {
      var blacklist, blacklistGlob, fileName, _i, _len, _ref1;
      blacklist = (_ref1 = atom.config.get('autocomplete-plus.fileBlacklist')) != null ? _ref1.map(function(s) {
        return s.trim();
      }) : void 0;
      if (!((blacklist != null ? blacklist.length : void 0) > 0)) {
        return false;
      }
      if (minimatch == null) {
        minimatch = require('minimatch');
      }
      fileName = path.basename(this.buffer.getPath());
      for (_i = 0, _len = blacklist.length; _i < _len; _i++) {
        blacklistGlob = blacklist[_i];
        if (minimatch(fileName, blacklistGlob)) {
          return true;
        }
      }
      return false;
    };

    AutocompleteManager.prototype.requestNewSuggestions = function() {
      var delay;
      delay = atom.config.get('autocomplete-plus.autoActivationDelay');
      clearTimeout(this.delayTimeout);
      if (this.suggestionList.isActive()) {
        delay = this.suggestionDelay;
      }
      this.delayTimeout = setTimeout(this.findSuggestions, delay);
      return this.shouldDisplaySuggestions = true;
    };

    AutocompleteManager.prototype.cancelNewSuggestionsRequest = function() {
      clearTimeout(this.delayTimeout);
      return this.shouldDisplaySuggestions = false;
    };

    AutocompleteManager.prototype.cursorMoved = function(_arg) {
      var textChanged;
      textChanged = _arg.textChanged;
      if (!textChanged) {
        return this.requestHideSuggestionList();
      }
    };

    AutocompleteManager.prototype.bufferSaved = function() {
      if (!this.autosaveEnabled) {
        return this.hideSuggestionList();
      }
    };

    AutocompleteManager.prototype.bufferChanged = function(_arg) {
      var classNames, cursorBufferPosition, newRange, newText, oldRange, oldText, shouldActivate, _i, _len, _ref1, _ref2;
      newText = _arg.newText, newRange = _arg.newRange, oldText = _arg.oldText, oldRange = _arg.oldRange;
      if (this.disposed) {
        return;
      }
      if (this.compositionInProgress) {
        return this.hideSuggestionList();
      }
      shouldActivate = false;
      cursorBufferPosition = this.editor.getLastCursor().getBufferPosition();
      if (this.autoActivationEnabled || this.suggestionList.isActive()) {
        if ((newText != null ? newText.length : void 0) && newRange.containsPoint(cursorBufferPosition)) {
          shouldActivate = newText === ' ' || newText.trim().length === 1 || __indexOf.call(this.bracketMatcherPairs, newText) >= 0;
        } else if ((oldText != null ? oldText.length : void 0) && (this.backspaceTriggersAutocomplete || this.suggestionList.isActive()) && oldRange.containsPoint(cursorBufferPosition)) {
          shouldActivate = oldText === ' ' || oldText.trim().length === 1 || __indexOf.call(this.bracketMatcherPairs, oldText) >= 0;
        }
        if (shouldActivate) {
          _ref1 = this.suppressForClasses;
          for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
            classNames = _ref1[_i];
            if (((_ref2 = _.intersection(this.editorView.classList, classNames)) != null ? _ref2.length : void 0) === classNames.length) {
              shouldActivate = false;
            }
          }
        }
      }
      if (shouldActivate) {
        this.cancelHideSuggestionListRequest();
        return this.requestNewSuggestions();
      } else {
        this.cancelNewSuggestionsRequest();
        return this.hideSuggestionList();
      }
    };

    AutocompleteManager.prototype.dispose = function() {
      var _ref1, _ref2;
      this.hideSuggestionList();
      this.disposed = true;
      this.ready = false;
      if ((_ref1 = this.editorSubscriptions) != null) {
        _ref1.dispose();
      }
      this.editorSubscriptions = null;
      if ((_ref2 = this.subscriptions) != null) {
        _ref2.dispose();
      }
      this.subscriptions = null;
      this.suggestionList = null;
      return this.providerManager = null;
    };

    AutocompleteManager.prototype.clearManualActivationStrictPrefixes = function() {
      return this.manualActivationStrictPrefixes = null;
    };

    AutocompleteManager.prototype.addManualActivationStrictPrefix = function(provider, prefix) {
      var _ref1;
      if (((_ref1 = this.manualActivationStrictPrefixes) != null ? _ref1.has(provider) : void 0) || (prefix == null)) {
        return;
      }
      if (this.manualActivationStrictPrefixes == null) {
        this.manualActivationStrictPrefixes = new WeakMap;
      }
      return this.manualActivationStrictPrefixes.set(provider, prefix.toLowerCase());
    };

    AutocompleteManager.prototype.filterForManualActivationStrictPrefix = function(suggestions) {
      var lowercaseText, results, strictPrefix, suggestion, _i, _len, _ref1;
      if (this.manualActivationStrictPrefixes == null) {
        return suggestions;
      }
      results = [];
      for (_i = 0, _len = suggestions.length; _i < _len; _i++) {
        suggestion = suggestions[_i];
        lowercaseText = ((_ref1 = suggestion.snippet) != null ? _ref1 : suggestion.text).toLowerCase();
        if (lowercaseText[0] === suggestion.replacementPrefix.toLowerCase()[0]) {
          strictPrefix = this.manualActivationStrictPrefixes.get(suggestion.provider);
          if ((strictPrefix != null) && lowercaseText.startsWith(strictPrefix)) {
            results.push(suggestion);
          }
        } else {
          results.push(suggestion);
        }
      }
      return results;
    };

    return AutocompleteManager;

  })();

}).call(this);
