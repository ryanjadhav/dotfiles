(function() {
  var CompositeDisposable, DefaultSuggestionTypeIconHTML, IconTemplate, ItemTemplate, ListTemplate, SnippetEnd, SnippetParser, SnippetStart, SnippetStartAndEnd, SuggestionListElement, _,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  CompositeDisposable = require('atom').CompositeDisposable;

  _ = require('underscore-plus');

  SnippetParser = require('./snippet-parser');

  ItemTemplate = "<span class=\"icon-container\"></span>\n<span class=\"left-label\"></span>\n<span class=\"word-container\">\n  <span class=\"word\"></span>\n  <span class=\"right-label\"></span>\n</span>";

  ListTemplate = "<div class=\"suggestion-list-scroller\">\n  <ol class=\"list-group\"></ol>\n</div>\n<div class=\"suggestion-description\">\n  <span class=\"suggestion-description-content\"></span>\n  <a class=\"suggestion-description-more-link\" href=\"#\">More..</a>\n</div>";

  IconTemplate = '<i class="icon"></i>';

  DefaultSuggestionTypeIconHTML = {
    'snippet': '<i class="icon-move-right"></i>',
    'import': '<i class="icon-package"></i>',
    'require': '<i class="icon-package"></i>',
    'module': '<i class="icon-package"></i>',
    'package': '<i class="icon-package"></i>',
    'tag': '<i class="icon-code"></i>',
    'attribute': '<i class="icon-tag"></i>'
  };

  SnippetStart = 1;

  SnippetEnd = 2;

  SnippetStartAndEnd = 3;

  SuggestionListElement = (function(_super) {
    __extends(SuggestionListElement, _super);

    function SuggestionListElement() {
      return SuggestionListElement.__super__.constructor.apply(this, arguments);
    }

    SuggestionListElement.prototype.maxItems = 200;

    SuggestionListElement.prototype.emptySnippetGroupRegex = /(\$\{\d+\:\})|(\$\{\d+\})|(\$\d+)/ig;

    SuggestionListElement.prototype.createdCallback = function() {
      this.subscriptions = new CompositeDisposable;
      this.classList.add('popover-list', 'select-list', 'autocomplete-suggestion-list');
      this.registerMouseHandling();
      return this.snippetParser = new SnippetParser;
    };

    SuggestionListElement.prototype.attachedCallback = function() {
      this.parentElement.classList.add('autocomplete-plus');
      this.addActiveClassToEditor();
      if (!this.ol) {
        this.renderList();
      }
      return this.itemsChanged();
    };

    SuggestionListElement.prototype.detachedCallback = function() {
      return this.removeActiveClassFromEditor();
    };

    SuggestionListElement.prototype.initialize = function(model) {
      this.model = model;
      if (model == null) {
        return;
      }
      this.subscriptions.add(this.model.onDidChangeItems(this.itemsChanged.bind(this)));
      this.subscriptions.add(this.model.onDidSelectNext(this.moveSelectionDown.bind(this)));
      this.subscriptions.add(this.model.onDidSelectPrevious(this.moveSelectionUp.bind(this)));
      this.subscriptions.add(this.model.onDidConfirmSelection(this.confirmSelection.bind(this)));
      this.subscriptions.add(this.model.onDidDispose(this.dispose.bind(this)));
      this.subscriptions.add(atom.config.observe('autocomplete-plus.suggestionListFollows', (function(_this) {
        return function(suggestionListFollows) {
          _this.suggestionListFollows = suggestionListFollows;
        };
      })(this)));
      this.subscriptions.add(atom.config.observe('autocomplete-plus.maxVisibleSuggestions', (function(_this) {
        return function(maxVisibleSuggestions) {
          _this.maxVisibleSuggestions = maxVisibleSuggestions;
        };
      })(this)));
      return this;
    };

    SuggestionListElement.prototype.registerMouseHandling = function() {
      this.onmousewheel = function(event) {
        return event.stopPropagation();
      };
      this.onmousedown = function(event) {
        var item;
        item = this.findItem(event);
        if ((item != null ? item.dataset.index : void 0) != null) {
          this.selectedIndex = item.dataset.index;
          return event.stopPropagation();
        }
      };
      return this.onmouseup = function(event) {
        var item;
        item = this.findItem(event);
        if ((item != null ? item.dataset.index : void 0) != null) {
          event.stopPropagation();
          return this.confirmSelection();
        }
      };
    };

    SuggestionListElement.prototype.findItem = function(event) {
      var item;
      item = event.target;
      while (item.tagName !== 'LI' && item !== this) {
        item = item.parentNode;
      }
      if (item.tagName === 'LI') {
        return item;
      }
    };

    SuggestionListElement.prototype.updateDescription = function() {
      var item;
      item = this.visibleItems()[this.selectedIndex];
      if ((item.description != null) && item.description.length > 0) {
        this.descriptionContainer.style.display = 'block';
        this.descriptionContent.textContent = item.description;
        if ((item.descriptionMoreURL != null) && (item.descriptionMoreURL.length != null)) {
          this.descriptionMoreLink.style.display = 'inline';
          return this.descriptionMoreLink.setAttribute('href', item.descriptionMoreURL);
        } else {
          this.descriptionMoreLink.style.display = 'none';
          return this.descriptionMoreLink.setAttribute('href', '#');
        }
      } else {
        return this.descriptionContainer.style.display = 'none';
      }
    };

    SuggestionListElement.prototype.itemsChanged = function() {
      return this.render();
    };

    SuggestionListElement.prototype.render = function() {
      var _base;
      this.selectedIndex = 0;
      if (typeof (_base = atom.views).pollAfterNextUpdate === "function") {
        _base.pollAfterNextUpdate();
      }
      atom.views.updateDocument(this.renderItems.bind(this));
      return atom.views.readDocument(this.readUIPropsFromDOM.bind(this));
    };

    SuggestionListElement.prototype.addActiveClassToEditor = function() {
      var editorElement, _ref;
      editorElement = atom.views.getView(atom.workspace.getActiveTextEditor());
      return editorElement != null ? (_ref = editorElement.classList) != null ? _ref.add('autocomplete-active') : void 0 : void 0;
    };

    SuggestionListElement.prototype.removeActiveClassFromEditor = function() {
      var editorElement, _ref;
      editorElement = atom.views.getView(atom.workspace.getActiveTextEditor());
      return editorElement != null ? (_ref = editorElement.classList) != null ? _ref.remove('autocomplete-active') : void 0 : void 0;
    };

    SuggestionListElement.prototype.moveSelectionUp = function() {
      if (!(this.selectedIndex <= 0)) {
        return this.setSelectedIndex(this.selectedIndex - 1);
      } else {
        return this.setSelectedIndex(this.visibleItems().length - 1);
      }
    };

    SuggestionListElement.prototype.moveSelectionDown = function() {
      if (!(this.selectedIndex >= (this.visibleItems().length - 1))) {
        return this.setSelectedIndex(this.selectedIndex + 1);
      } else {
        return this.setSelectedIndex(0);
      }
    };

    SuggestionListElement.prototype.setSelectedIndex = function(index) {
      this.selectedIndex = index;
      atom.views.updateDocument(this.renderSelectedItem.bind(this));
      return atom.views.readDocument(this.readUIPropsFromDOM.bind(this));
    };

    SuggestionListElement.prototype.visibleItems = function() {
      var _ref, _ref1;
      return (_ref = this.model) != null ? (_ref1 = _ref.items) != null ? _ref1.slice(0, this.maxItems) : void 0 : void 0;
    };

    SuggestionListElement.prototype.getSelectedItem = function() {
      var _ref, _ref1;
      return (_ref = this.model) != null ? (_ref1 = _ref.items) != null ? _ref1[this.selectedIndex] : void 0 : void 0;
    };

    SuggestionListElement.prototype.confirmSelection = function() {
      var item;
      if (!this.model.isActive()) {
        return;
      }
      item = this.getSelectedItem();
      if (item != null) {
        return this.model.confirm(item);
      } else {
        return this.model.cancel();
      }
    };

    SuggestionListElement.prototype.renderList = function() {
      this.innerHTML = ListTemplate;
      this.ol = this.querySelector('.list-group');
      this.scroller = this.querySelector('.suggestion-list-scroller');
      this.descriptionContainer = this.querySelector('.suggestion-description');
      this.descriptionContent = this.querySelector('.suggestion-description-content');
      return this.descriptionMoreLink = this.querySelector('.suggestion-description-more-link');
    };

    SuggestionListElement.prototype.renderItems = function() {
      var index, item, items, li, _i, _len, _ref;
      items = (_ref = this.visibleItems()) != null ? _ref : [];
      for (index = _i = 0, _len = items.length; _i < _len; index = ++_i) {
        item = items[index];
        this.renderItem(item, index);
      }
      while (li = this.ol.childNodes[items.length]) {
        li.remove();
      }
      return this.updateDescription();
    };

    SuggestionListElement.prototype.renderSelectedItem = function() {
      this.selectedLi.classList.remove('selected');
      this.selectedLi = this.ol.childNodes[this.selectedIndex];
      this.selectedLi.classList.add('selected');
      this.scrollSelectedItemIntoView();
      return this.updateDescription();
    };

    SuggestionListElement.prototype.scrollSelectedItemIntoView = function() {
      var itemHeight, scrollTop, scrollerHeight, selectedItemTop;
      scrollTop = this.scroller.scrollTop;
      selectedItemTop = this.selectedLi.offsetTop;
      itemHeight = this.uiProps.itemHeight;
      scrollerHeight = this.maxVisibleSuggestions * itemHeight + this.uiProps.paddingHeight;
      if (selectedItemTop < scrollTop || selectedItemTop + itemHeight > scrollTop + scrollerHeight) {
        return this.selectedLi.scrollIntoView(false);
      }
    };

    SuggestionListElement.prototype.readUIPropsFromDOM = function() {
      var wordContainer, _base, _base1, _ref, _ref1, _ref2;
      wordContainer = (_ref = this.selectedLi) != null ? _ref.querySelector('.word-container') : void 0;
      if (this.uiProps == null) {
        this.uiProps = {};
      }
      this.uiProps.marginLeft = -((_ref1 = wordContainer != null ? wordContainer.offsetLeft : void 0) != null ? _ref1 : 0);
      if ((_base = this.uiProps).itemHeight == null) {
        _base.itemHeight = this.selectedLi.offsetHeight;
      }
      if ((_base1 = this.uiProps).paddingHeight == null) {
        _base1.paddingHeight = (_ref2 = parseInt(getComputedStyle(this)['padding-top']) + parseInt(getComputedStyle(this)['padding-bottom'])) != null ? _ref2 : 0;
      }
      if (atom.views.documentReadInProgress != null) {
        return atom.views.updateDocument(this.updateUIForChangedProps.bind(this));
      } else {
        return this.updateUIForChangedProps();
      }
    };

    SuggestionListElement.prototype.updateUIForChangedProps = function() {
      this.scroller.style['max-height'] = "" + (this.maxVisibleSuggestions * this.uiProps.itemHeight + this.uiProps.paddingHeight) + "px";
      if (this.suggestionListFollows === 'Word') {
        return this.style['margin-left'] = "" + this.uiProps.marginLeft + "px";
      }
    };

    SuggestionListElement.prototype.renderItem = function(_arg, index) {
      var className, defaultIconHTML, defaultLetterIconHTML, displayText, iconHTML, leftLabel, leftLabelHTML, leftLabelSpan, li, replacementPrefix, rightLabel, rightLabelHTML, rightLabelSpan, sanitizedIconHTML, sanitizedType, snippet, text, type, typeIcon, typeIconContainer, wordSpan, _ref;
      iconHTML = _arg.iconHTML, type = _arg.type, snippet = _arg.snippet, text = _arg.text, displayText = _arg.displayText, className = _arg.className, replacementPrefix = _arg.replacementPrefix, leftLabel = _arg.leftLabel, leftLabelHTML = _arg.leftLabelHTML, rightLabel = _arg.rightLabel, rightLabelHTML = _arg.rightLabelHTML;
      li = this.ol.childNodes[index];
      if (!li) {
        li = document.createElement('li');
        li.innerHTML = ItemTemplate;
        li.dataset.index = index;
        this.ol.appendChild(li);
      }
      li.className = '';
      if (className) {
        li.classList.add(className);
      }
      if (index === this.selectedIndex) {
        li.classList.add('selected');
      }
      if (index === this.selectedIndex) {
        this.selectedLi = li;
      }
      typeIconContainer = li.querySelector('.icon-container');
      typeIconContainer.innerHTML = '';
      sanitizedType = _.isString(type) ? type : '';
      sanitizedIconHTML = _.isString(iconHTML) ? iconHTML : void 0;
      defaultLetterIconHTML = sanitizedType ? "<span class=\"icon-letter\">" + sanitizedType[0] + "</span>" : '';
      defaultIconHTML = (_ref = DefaultSuggestionTypeIconHTML[sanitizedType]) != null ? _ref : defaultLetterIconHTML;
      if ((sanitizedIconHTML || defaultIconHTML) && iconHTML !== false) {
        typeIconContainer.innerHTML = IconTemplate;
        typeIcon = typeIconContainer.childNodes[0];
        typeIcon.innerHTML = sanitizedIconHTML != null ? sanitizedIconHTML : defaultIconHTML;
        if (type) {
          typeIcon.classList.add(type);
        }
      }
      wordSpan = li.querySelector('.word');
      wordSpan.innerHTML = this.getDisplayHTML(text, snippet, displayText, replacementPrefix);
      leftLabelSpan = li.querySelector('.left-label');
      if (leftLabelHTML != null) {
        leftLabelSpan.innerHTML = leftLabelHTML;
      } else if (leftLabel != null) {
        leftLabelSpan.textContent = leftLabel;
      } else {
        leftLabelSpan.textContent = '';
      }
      rightLabelSpan = li.querySelector('.right-label');
      if (rightLabelHTML != null) {
        return rightLabelSpan.innerHTML = rightLabelHTML;
      } else if (rightLabel != null) {
        return rightLabelSpan.textContent = rightLabel;
      } else {
        return rightLabelSpan.textContent = '';
      }
    };

    SuggestionListElement.prototype.getDisplayHTML = function(text, snippet, displayText, replacementPrefix) {
      var character, characterMatchIndices, displayHTML, index, replacementText, snippetIndices, snippets, _i, _len, _ref, _ref1;
      replacementText = text;
      if (typeof displayText === 'string') {
        replacementText = displayText;
      } else if (typeof snippet === 'string') {
        replacementText = this.removeEmptySnippets(snippet);
        snippets = this.snippetParser.findSnippets(replacementText);
        replacementText = this.removeSnippetsFromText(snippets, replacementText);
        snippetIndices = this.findSnippetIndices(snippets);
      }
      characterMatchIndices = this.findCharacterMatchIndices(replacementText, replacementPrefix);
      displayHTML = '';
      for (index = _i = 0, _len = replacementText.length; _i < _len; index = ++_i) {
        character = replacementText[index];
        if ((_ref = snippetIndices != null ? snippetIndices[index] : void 0) === SnippetStart || _ref === SnippetStartAndEnd) {
          displayHTML += '<span class="snippet-completion">';
        }
        if (characterMatchIndices != null ? characterMatchIndices[index] : void 0) {
          displayHTML += '<span class="character-match">' + replacementText[index] + '</span>';
        } else {
          displayHTML += replacementText[index];
        }
        if ((_ref1 = snippetIndices != null ? snippetIndices[index] : void 0) === SnippetEnd || _ref1 === SnippetStartAndEnd) {
          displayHTML += '</span>';
        }
      }
      return displayHTML;
    };

    SuggestionListElement.prototype.removeEmptySnippets = function(text) {
      if (!((text != null ? text.length : void 0) && text.indexOf('$') !== -1)) {
        return text;
      }
      return text.replace(this.emptySnippetGroupRegex, '');
    };

    SuggestionListElement.prototype.removeSnippetsFromText = function(snippets, text) {
      var body, index, result, snippetEnd, snippetStart, _i, _len, _ref;
      if (!(text.length && (snippets != null ? snippets.length : void 0))) {
        return text;
      }
      index = 0;
      result = '';
      for (_i = 0, _len = snippets.length; _i < _len; _i++) {
        _ref = snippets[_i], snippetStart = _ref.snippetStart, snippetEnd = _ref.snippetEnd, body = _ref.body;
        result += text.slice(index, snippetStart) + body;
        index = snippetEnd + 1;
      }
      if (index !== text.length) {
        result += text.slice(index, text.length);
      }
      return result;
    };

    SuggestionListElement.prototype.findSnippetIndices = function(snippets) {
      var body, bodyLength, endIndex, indices, offsetAccumulator, snippetEnd, snippetLength, snippetStart, startIndex, _i, _len, _ref;
      if (snippets == null) {
        return;
      }
      indices = {};
      offsetAccumulator = 0;
      for (_i = 0, _len = snippets.length; _i < _len; _i++) {
        _ref = snippets[_i], snippetStart = _ref.snippetStart, snippetEnd = _ref.snippetEnd, body = _ref.body;
        bodyLength = body.length;
        snippetLength = snippetEnd - snippetStart + 1;
        startIndex = snippetStart - offsetAccumulator;
        endIndex = startIndex + bodyLength - 1;
        offsetAccumulator += snippetLength - bodyLength;
        if (startIndex === endIndex) {
          indices[startIndex] = SnippetStartAndEnd;
        } else {
          indices[startIndex] = SnippetStart;
          indices[endIndex] = SnippetEnd;
        }
      }
      return indices;
    };

    SuggestionListElement.prototype.findCharacterMatchIndices = function(text, replacementPrefix) {
      var ch, i, matches, wordIndex, _i, _len;
      if (!((text != null ? text.length : void 0) && (replacementPrefix != null ? replacementPrefix.length : void 0))) {
        return;
      }
      matches = {};
      wordIndex = 0;
      for (i = _i = 0, _len = replacementPrefix.length; _i < _len; i = ++_i) {
        ch = replacementPrefix[i];
        while (wordIndex < text.length && text[wordIndex].toLowerCase() !== ch.toLowerCase()) {
          wordIndex += 1;
        }
        if (wordIndex >= text.length) {
          break;
        }
        matches[wordIndex] = true;
        wordIndex += 1;
      }
      return matches;
    };

    SuggestionListElement.prototype.dispose = function() {
      var _ref;
      this.subscriptions.dispose();
      return (_ref = this.parentNode) != null ? _ref.removeChild(this) : void 0;
    };

    return SuggestionListElement;

  })(HTMLElement);

  module.exports = SuggestionListElement = document.registerElement('autocomplete-suggestion-list', {
    prototype: SuggestionListElement.prototype
  });

}).call(this);
