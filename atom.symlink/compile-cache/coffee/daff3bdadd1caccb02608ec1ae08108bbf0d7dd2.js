(function() {
  var SuggestionListElement, _;

  SuggestionListElement = require('../lib/suggestion-list-element');

  _ = require('underscore-plus');

  describe('Suggestion List Element', function() {
    var suggestionListElement;
    suggestionListElement = [][0];
    beforeEach(function() {
      return suggestionListElement = new SuggestionListElement();
    });
    afterEach(function() {
      if (suggestionListElement != null) {
        suggestionListElement.dispose();
      }
      return suggestionListElement = null;
    });
    describe('getDisplayHTML', function() {
      it('uses displayText over text or snippet', function() {
        var displayText, html, replacementPrefix, snippet, text;
        text = 'abcd()';
        snippet = void 0;
        displayText = 'acd';
        replacementPrefix = 'a';
        html = suggestionListElement.getDisplayHTML(text, snippet, displayText, replacementPrefix);
        return expect(html).toBe('<span class="character-match">a</span>cd');
      });
      it('handles the empty string in the text field', function() {
        var html, replacementPrefix, snippet, text;
        text = '';
        snippet = void 0;
        replacementPrefix = 'a';
        html = suggestionListElement.getDisplayHTML(text, snippet, null, replacementPrefix);
        return expect(html).toBe('');
      });
      it('handles the empty string in the snippet field', function() {
        var html, replacementPrefix, snippet, text;
        text = void 0;
        snippet = '';
        replacementPrefix = 'a';
        html = suggestionListElement.getDisplayHTML(text, snippet, null, replacementPrefix);
        return expect(html).toBe('');
      });
      it('handles an empty prefix', function() {
        var html, replacementPrefix, snippet, text;
        text = void 0;
        snippet = 'abc';
        replacementPrefix = '';
        html = suggestionListElement.getDisplayHTML(text, snippet, null, replacementPrefix);
        return expect(html).toBe('abc');
      });
      it('outputs correct html when there are no snippets in the snippet field', function() {
        var html, replacementPrefix, snippet, text;
        text = '';
        snippet = 'abc(d, e)f';
        replacementPrefix = 'a';
        html = suggestionListElement.getDisplayHTML(text, snippet, null, replacementPrefix);
        return expect(html).toBe('<span class="character-match">a</span>bc(d, e)f');
      });
      it('outputs correct html when there are not character matches', function() {
        var html, replacementPrefix, snippet, text;
        text = '';
        snippet = 'abc(d, e)f';
        replacementPrefix = 'omg';
        html = suggestionListElement.getDisplayHTML(text, snippet, null, replacementPrefix);
        return expect(html).toBe('abc(d, e)f');
      });
      it('outputs correct html when the text field is used', function() {
        var html, replacementPrefix, snippet, text;
        text = 'abc(d, e)f';
        snippet = void 0;
        replacementPrefix = 'a';
        html = suggestionListElement.getDisplayHTML(text, snippet, null, replacementPrefix);
        return expect(html).toBe('<span class="character-match">a</span>bc(d, e)f');
      });
      it('replaces a snippet with no escaped right braces', function() {
        var html, replacementPrefix, snippet, text;
        text = '';
        snippet = 'abc(${1:d}, ${2:e})f';
        replacementPrefix = 'a';
        html = suggestionListElement.getDisplayHTML(text, snippet, null, replacementPrefix);
        return expect(html).toBe('<span class="character-match">a</span>bc(<span class="snippet-completion">d</span>, <span class="snippet-completion">e</span>)f');
      });
      it('replaces a snippet with no escaped right braces', function() {
        var html, replacementPrefix, snippet, text;
        text = '';
        snippet = 'text(${1:ab}, ${2:cd})';
        replacementPrefix = 'ta';
        html = suggestionListElement.getDisplayHTML(text, snippet, null, replacementPrefix);
        return expect(html).toBe('<span class="character-match">t</span>ext(<span class="snippet-completion"><span class="character-match">a</span>b</span>, <span class="snippet-completion">cd</span>)');
      });
      it('replaces a snippet with escaped right braces', function() {
        var replacementPrefix, snippet, text;
        text = '';
        snippet = 'abc(${1:d}, ${2:e})f ${3:interface{\\}}';
        replacementPrefix = 'a';
        return expect(suggestionListElement.getDisplayHTML(text, snippet, null, replacementPrefix)).toBe('<span class="character-match">a</span>bc(<span class="snippet-completion">d</span>, <span class="snippet-completion">e</span>)f <span class="snippet-completion">interface{}</span>');
      });
      it('replaces a snippet with escaped multiple right braces', function() {
        var replacementPrefix, snippet, text;
        text = '';
        snippet = 'abc(${1:d}, ${2:something{ok\\}}, ${3:e})f ${4:interface{\\}}';
        replacementPrefix = 'a';
        return expect(suggestionListElement.getDisplayHTML(text, snippet, null, replacementPrefix)).toBe('<span class="character-match">a</span>bc(<span class="snippet-completion">d</span>, <span class="snippet-completion">something{ok}</span>, <span class="snippet-completion">e</span>)f <span class="snippet-completion">interface{}</span>');
      });
      return it('replaces a snippet with elements that have no text', function() {
        var replacementPrefix, snippet, text;
        text = '';
        snippet = 'abc(${1:d}, ${2:e})f${3}';
        replacementPrefix = 'a';
        return expect(suggestionListElement.getDisplayHTML(text, snippet, null, replacementPrefix)).toBe('<span class="character-match">a</span>bc(<span class="snippet-completion">d</span>, <span class="snippet-completion">e</span>)f');
      });
    });
    describe('findCharacterMatches', function() {
      var assertMatches;
      assertMatches = function(text, replacementPrefix, truthyIndices) {
        var i, matches, snippets, _i, _ref, _results;
        text = suggestionListElement.removeEmptySnippets(text);
        snippets = suggestionListElement.snippetParser.findSnippets(text);
        text = suggestionListElement.removeSnippetsFromText(snippets, text);
        matches = suggestionListElement.findCharacterMatchIndices(text, replacementPrefix);
        _results = [];
        for (i = _i = 0, _ref = text.length; 0 <= _ref ? _i < _ref : _i > _ref; i = 0 <= _ref ? ++_i : --_i) {
          if (truthyIndices.indexOf(i) !== -1) {
            _results.push(expect(matches != null ? matches[i] : void 0).toBeTruthy());
          } else {
            _results.push(expect(matches != null ? matches[i] : void 0).toBeFalsy());
          }
        }
        return _results;
      };
      it('finds matches when no snippets exist', function() {
        assertMatches('hello', '', []);
        assertMatches('hello', 'h', [0]);
        assertMatches('hello', 'hl', [0, 2]);
        return assertMatches('hello', 'hlo', [0, 2, 4]);
      });
      return it('finds matches when snippets exist', function() {
        assertMatches('${0:hello}', '', []);
        assertMatches('${0:hello}', 'h', [0]);
        assertMatches('${0:hello}', 'hl', [0, 2]);
        assertMatches('${0:hello}', 'hlo', [0, 2, 4]);
        assertMatches('${0:hello}world', '', []);
        assertMatches('${0:hello}world', 'h', [0]);
        assertMatches('${0:hello}world', 'hw', [0, 5]);
        assertMatches('${0:hello}world', 'hlw', [0, 2, 5]);
        assertMatches('hello${0:world}', '', []);
        assertMatches('hello${0:world}', 'h', [0]);
        assertMatches('hello${0:world}', 'hw', [0, 5]);
        return assertMatches('hello${0:world}', 'hlw', [0, 2, 5]);
      });
    });
    return describe('removeEmptySnippets', function() {
      it('removes an empty snippet group', function() {
        expect(suggestionListElement.removeEmptySnippets('$0')).toBe('');
        return expect(suggestionListElement.removeEmptySnippets('$1000')).toBe('');
      });
      it('removes an empty snippet group with surrounding text', function() {
        expect(suggestionListElement.removeEmptySnippets('hello$0')).toBe('hello');
        expect(suggestionListElement.removeEmptySnippets('$0hello')).toBe('hello');
        expect(suggestionListElement.removeEmptySnippets('hello$0hello')).toBe('hellohello');
        return expect(suggestionListElement.removeEmptySnippets('hello$1000hello')).toBe('hellohello');
      });
      it('removes an empty snippet group with braces', function() {
        expect(suggestionListElement.removeEmptySnippets('${0}')).toBe('');
        return expect(suggestionListElement.removeEmptySnippets('${1000}')).toBe('');
      });
      it('removes an empty snippet group with braces with surrounding text', function() {
        expect(suggestionListElement.removeEmptySnippets('hello${0}')).toBe('hello');
        expect(suggestionListElement.removeEmptySnippets('${0}hello')).toBe('hello');
        expect(suggestionListElement.removeEmptySnippets('hello${0}hello')).toBe('hellohello');
        return expect(suggestionListElement.removeEmptySnippets('hello${1000}hello')).toBe('hellohello');
      });
      it('removes an empty snippet group with braces and a colon', function() {
        expect(suggestionListElement.removeEmptySnippets('${0:}')).toBe('');
        return expect(suggestionListElement.removeEmptySnippets('${1000:}')).toBe('');
      });
      return it('removes an empty snippet group with braces and a colon with surrounding text', function() {
        expect(suggestionListElement.removeEmptySnippets('hello${0:}')).toBe('hello');
        expect(suggestionListElement.removeEmptySnippets('${0:}hello')).toBe('hello');
        expect(suggestionListElement.removeEmptySnippets('hello${0:}hello')).toBe('hellohello');
        return expect(suggestionListElement.removeEmptySnippets('hello${1000:}hello')).toBe('hellohello');
      });
    });
  });

}).call(this);
