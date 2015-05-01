(function() {
  var KeymapManager, NodeTypeText, buildIMECompositionEvent, buildTextInputEvent, triggerAutocompletion, waitForAutocomplete, _, _ref;

  _ref = require('./spec-helper'), triggerAutocompletion = _ref.triggerAutocompletion, waitForAutocomplete = _ref.waitForAutocomplete, buildIMECompositionEvent = _ref.buildIMECompositionEvent, buildTextInputEvent = _ref.buildTextInputEvent;

  _ = require('underscore-plus');

  KeymapManager = require('atom').KeymapManager;

  NodeTypeText = 3;

  describe('Autocomplete Manager', function() {
    var autocompleteManager, completionDelay, editor, editorView, gutterWidth, mainModule, pixelLeftForBufferPosition, requiresGutter, workspaceElement, _ref1;
    _ref1 = [], workspaceElement = _ref1[0], completionDelay = _ref1[1], editorView = _ref1[2], editor = _ref1[3], mainModule = _ref1[4], autocompleteManager = _ref1[5], mainModule = _ref1[6], gutterWidth = _ref1[7];
    beforeEach(function() {
      gutterWidth = null;
      return runs(function() {
        atom.config.set('autocomplete-plus.enableAutoActivation', true);
        atom.config.set('editor.fontSize', '16');
        completionDelay = 100;
        atom.config.set('autocomplete-plus.autoActivationDelay', completionDelay);
        completionDelay += 100;
        workspaceElement = atom.views.getView(atom.workspace);
        jasmine.attachToDOM(workspaceElement);
        return atom.config.set('autocomplete-plus.maxVisibleSuggestions', 10);
      });
    });
    describe("when an external provider is registered", function() {
      var provider;
      provider = [][0];
      beforeEach(function() {
        waitsForPromise(function() {
          return Promise.all([
            atom.workspace.open('').then(function(e) {
              editor = e;
              return editorView = atom.views.getView(editor);
            }), atom.packages.activatePackage('autocomplete-plus').then(function(a) {
              return mainModule = a.mainModule;
            })
          ]);
        });
        return runs(function() {
          provider = {
            selector: '*',
            inclusionPriority: 2,
            excludeLowerPriority: true,
            getSuggestions: function(_arg) {
              var list, prefix, text, _i, _len, _results;
              prefix = _arg.prefix;
              list = ['ab', 'abc', 'abcd', 'abcde'];
              _results = [];
              for (_i = 0, _len = list.length; _i < _len; _i++) {
                text = list[_i];
                _results.push({
                  text: text,
                  replacementPrefix: prefix
                });
              }
              return _results;
            }
          };
          return mainModule.consumeProvider(provider);
        });
      });
      it("calls the provider's onDidInsertSuggestion method when it exists", function() {
        provider.onDidInsertSuggestion = jasmine.createSpy();
        triggerAutocompletion(editor, true, 'a');
        return runs(function() {
          var suggestion, suggestionListView, triggerPosition, _ref2;
          suggestionListView = editorView.querySelector('.autocomplete-plus autocomplete-suggestion-list');
          atom.commands.dispatch(suggestionListView, 'autocomplete-plus:confirm');
          expect(provider.onDidInsertSuggestion).toHaveBeenCalled();
          _ref2 = provider.onDidInsertSuggestion.mostRecentCall.args[0], editor = _ref2.editor, triggerPosition = _ref2.triggerPosition, suggestion = _ref2.suggestion;
          expect(editor).toBe(editor);
          expect(triggerPosition).toEqual([0, 1]);
          return expect(suggestion.text).toBe('ab');
        });
      });
      describe("suppression for editorView classes", function() {
        beforeEach(function() {
          return atom.config.set('autocomplete-plus.suppressActivationForEditorClasses', ['vim-mode.command-mode', 'vim-mode . visual-mode', ' vim-mode.operator-pending-mode ', ' ']);
        });
        it('should show the suggestion list when the suppression list does not match', function() {
          runs(function() {
            editorView.classList.add('vim-mode');
            return editorView.classList.add('insert-mode');
          });
          runs(function() {
            expect(editorView.querySelector('.autocomplete-plus')).not.toExist();
            return triggerAutocompletion(editor);
          });
          return runs(function() {
            return expect(editorView.querySelector('.autocomplete-plus')).toExist();
          });
        });
        it('should not show the suggestion list when the suppression list does match', function() {
          runs(function() {
            editorView.classList.add('vim-mode');
            return editorView.classList.add('command-mode');
          });
          runs(function() {
            expect(editorView.querySelector('.autocomplete-plus')).not.toExist();
            return triggerAutocompletion(editor);
          });
          return runs(function() {
            return expect(editorView.querySelector('.autocomplete-plus')).not.toExist();
          });
        });
        it('should not show the suggestion list when the suppression list does match', function() {
          runs(function() {
            editorView.classList.add('vim-mode');
            return editorView.classList.add('operator-pending-mode');
          });
          runs(function() {
            expect(editorView.querySelector('.autocomplete-plus')).not.toExist();
            return triggerAutocompletion(editor);
          });
          return runs(function() {
            return expect(editorView.querySelector('.autocomplete-plus')).not.toExist();
          });
        });
        it('should not show the suggestion list when the suppression list does match', function() {
          runs(function() {
            editorView.classList.add('vim-mode');
            return editorView.classList.add('visual-mode');
          });
          runs(function() {
            expect(editorView.querySelector('.autocomplete-plus')).not.toExist();
            return triggerAutocompletion(editor);
          });
          return runs(function() {
            return expect(editorView.querySelector('.autocomplete-plus')).not.toExist();
          });
        });
        it('should show the suggestion list when the suppression list does not match', function() {
          runs(function() {
            editorView.classList.add('vim-mode');
            return editorView.classList.add('some-unforeseen-mode');
          });
          runs(function() {
            expect(editorView.querySelector('.autocomplete-plus')).not.toExist();
            return triggerAutocompletion(editor);
          });
          return runs(function() {
            return expect(editorView.querySelector('.autocomplete-plus')).toExist();
          });
        });
        return it('should show the suggestion list when the suppression list does not match', function() {
          runs(function() {
            return editorView.classList.add('command-mode');
          });
          runs(function() {
            expect(editorView.querySelector('.autocomplete-plus')).not.toExist();
            return triggerAutocompletion(editor);
          });
          return runs(function() {
            return expect(editorView.querySelector('.autocomplete-plus')).toExist();
          });
        });
      });
      describe("prefix passed to getSuggestions", function() {
        var prefix;
        prefix = null;
        beforeEach(function() {
          editor.setText('var something = abc');
          editor.setCursorBufferPosition([0, 10000]);
          return spyOn(provider, 'getSuggestions').andCallFake(function(options) {
            prefix = options.prefix;
            return [];
          });
        });
        it("calls with word prefix", function() {
          editor.insertText('d');
          waitForAutocomplete();
          return runs(function() {
            return expect(prefix).toBe('abcd');
          });
        });
        it("calls with word prefix after punctuation", function() {
          editor.insertText('d.okyea');
          editor.insertText('h');
          waitForAutocomplete();
          return runs(function() {
            return expect(prefix).toBe('okyeah');
          });
        });
        it("calls with word prefix containing a dash", function() {
          editor.insertText('-okyea');
          editor.insertText('h');
          waitForAutocomplete();
          return runs(function() {
            return expect(prefix).toBe('abc-okyeah');
          });
        });
        it("calls with space character", function() {
          editor.insertText(' ');
          waitForAutocomplete();
          return runs(function() {
            return expect(prefix).toBe(' ');
          });
        });
        it("calls with non-word prefix", function() {
          editor.insertText(':');
          editor.insertText(':');
          waitForAutocomplete();
          return runs(function() {
            return expect(prefix).toBe('::');
          });
        });
        it("calls with non-word bracket", function() {
          editor.insertText('[');
          waitForAutocomplete();
          return runs(function() {
            return expect(prefix).toBe('[');
          });
        });
        it("calls with dot prefix", function() {
          editor.insertText('.');
          waitForAutocomplete();
          return runs(function() {
            return expect(prefix).toBe('.');
          });
        });
        it("calls with prefix after non \\b word break", function() {
          editor.insertText('=""');
          editor.insertText(' ');
          waitForAutocomplete();
          return runs(function() {
            return expect(prefix).toBe(' ');
          });
        });
        return it("calls with prefix after non \\b word break", function() {
          editor.insertText('?');
          editor.insertText(' ');
          waitForAutocomplete();
          return runs(function() {
            return expect(prefix).toBe(' ');
          });
        });
      });
      describe("when the character entered is not at the cursor position", function() {
        beforeEach(function() {
          editor.setText('some text ok');
          return editor.setCursorBufferPosition([0, 7]);
        });
        return it("does not show the suggestion list", function() {
          var buffer;
          buffer = editor.getBuffer();
          buffer.setTextInRange([[0, 0], [0, 0]], "s");
          waitForAutocomplete();
          return runs(function() {
            return expect(editorView.querySelector('.autocomplete-plus')).not.toExist();
          });
        });
      });
      describe("when number of suggestions > maxVisibleSuggestions", function() {
        beforeEach(function() {
          return atom.config.set('autocomplete-plus.maxVisibleSuggestions', 2);
        });
        describe("when a suggestion description is not specified", function() {
          return it("only shows the maxVisibleSuggestions in the suggestion popup", function() {
            triggerAutocompletion(editor, true, 'a');
            return runs(function() {
              var itemHeight, suggestionList;
              expect(editorView.querySelector('.autocomplete-plus')).toExist();
              itemHeight = parseInt(getComputedStyle(editorView.querySelector('.autocomplete-plus li')).height);
              expect(editorView.querySelectorAll('.autocomplete-plus li')).toHaveLength(4);
              suggestionList = editorView.querySelector('.autocomplete-plus autocomplete-suggestion-list');
              expect(suggestionList.offsetHeight).toBe(2 * itemHeight);
              return expect(suggestionList.querySelector('.suggestion-list-scroller').style['max-height']).toBe("" + (2 * itemHeight) + "px");
            });
          });
        });
        return describe("when a suggestion description is specified", function() {
          beforeEach(function() {
            return spyOn(provider, 'getSuggestions').andCallFake(function() {
              var list, text, _i, _len, _results;
              list = ['ab', 'abc', 'abcd', 'abcde'];
              _results = [];
              for (_i = 0, _len = list.length; _i < _len; _i++) {
                text = list[_i];
                _results.push({
                  text: text,
                  description: "" + text + " yeah ok"
                });
              }
              return _results;
            });
          });
          return it("shows the maxVisibleSuggestions in the suggestion popup, but with extra height for the description", function() {
            triggerAutocompletion(editor, true, 'a');
            return runs(function() {
              var itemHeight, suggestionList;
              expect(editorView.querySelector('.autocomplete-plus')).toExist();
              itemHeight = parseInt(getComputedStyle(editorView.querySelector('.autocomplete-plus li')).height);
              expect(editorView.querySelectorAll('.autocomplete-plus li')).toHaveLength(4);
              suggestionList = editorView.querySelector('.autocomplete-plus autocomplete-suggestion-list');
              expect(suggestionList.offsetHeight).toBe(3 * itemHeight);
              return expect(suggestionList.querySelector('.suggestion-list-scroller').style['max-height']).toBe("" + (2 * itemHeight) + "px");
            });
          });
        });
      });
      describe("when match.snippet is used", function() {
        beforeEach(function() {
          return spyOn(provider, 'getSuggestions').andCallFake(function(_arg) {
            var list, prefix, snippet, _i, _len, _results;
            prefix = _arg.prefix;
            list = ['method(${1:something})', 'method2(${1:something})', 'method3(${1:something})'];
            _results = [];
            for (_i = 0, _len = list.length; _i < _len; _i++) {
              snippet = list[_i];
              _results.push({
                snippet: snippet,
                replacementPrefix: prefix
              });
            }
            return _results;
          });
        });
        return describe("when the snippets package is enabled", function() {
          beforeEach(function() {
            return waitsForPromise(function() {
              return atom.packages.activatePackage('snippets');
            });
          });
          it("displays the snippet without the `${1:}` in its own class", function() {
            triggerAutocompletion(editor, true, 'm');
            return runs(function() {
              var wordElement, wordElements;
              wordElement = editorView.querySelector('.autocomplete-plus span.word');
              expect(wordElement.textContent).toBe('method(something)');
              expect(wordElement.querySelector('.snippet-completion').textContent).toBe('something');
              wordElements = editorView.querySelectorAll('.autocomplete-plus span.word');
              return expect(wordElements).toHaveLength(3);
            });
          });
          return it("accepts the snippet when autocomplete-plus:confirm is triggered", function() {
            triggerAutocompletion(editor, true, 'm');
            return runs(function() {
              var suggestionListView;
              suggestionListView = editorView.querySelector('.autocomplete-plus autocomplete-suggestion-list');
              atom.commands.dispatch(suggestionListView, 'autocomplete-plus:confirm');
              expect(editorView.querySelector('.autocomplete-plus')).not.toExist();
              return expect(editor.getSelectedText()).toBe('something');
            });
          });
        });
      });
      describe("when the matched prefix is highlighted", function() {
        it('highlights the prefix of the word in the suggestion list', function() {
          spyOn(provider, 'getSuggestions').andCallFake(function(_arg) {
            var prefix;
            prefix = _arg.prefix;
            return [
              {
                text: 'items',
                replacementPrefix: prefix
              }
            ];
          });
          expect(editorView.querySelector('.autocomplete-plus')).not.toExist();
          editor.moveToBottom();
          editor.insertText('i');
          editor.insertText('e');
          editor.insertText('m');
          waitForAutocomplete();
          return runs(function() {
            var word;
            expect(editorView.querySelector('.autocomplete-plus')).toExist();
            word = editorView.querySelector('.autocomplete-plus li span.word');
            expect(word.childNodes).toHaveLength(5);
            expect(word.childNodes[0]).toHaveClass('character-match');
            expect(word.childNodes[1].nodeType).toBe(NodeTypeText);
            expect(word.childNodes[2]).toHaveClass('character-match');
            expect(word.childNodes[3]).toHaveClass('character-match');
            return expect(word.childNodes[4].nodeType).toBe(NodeTypeText);
          });
        });
        it('highlights repeated characters in the prefix', function() {
          spyOn(provider, 'getSuggestions').andCallFake(function(_arg) {
            var prefix;
            prefix = _arg.prefix;
            return [
              {
                text: 'apply',
                replacementPrefix: prefix
              }
            ];
          });
          expect(editorView.querySelector('.autocomplete-plus')).not.toExist();
          editor.moveToBottom();
          editor.insertText('a');
          editor.insertText('p');
          editor.insertText('p');
          waitForAutocomplete();
          return runs(function() {
            var word;
            expect(editorView.querySelector('.autocomplete-plus')).toExist();
            word = editorView.querySelector('.autocomplete-plus li span.word');
            expect(word.childNodes).toHaveLength(4);
            expect(word.childNodes[0]).toHaveClass('character-match');
            expect(word.childNodes[1]).toHaveClass('character-match');
            expect(word.childNodes[2]).toHaveClass('character-match');
            expect(word.childNodes[3].nodeType).toBe(3);
            return expect(word.childNodes[3].textContent).toBe('ly');
          });
        });
        return describe("when the prefix does not match the word", function() {
          it("does not render any character-match spans", function() {
            spyOn(provider, 'getSuggestions').andCallFake(function(_arg) {
              var prefix;
              prefix = _arg.prefix;
              return [
                {
                  text: 'omgnope',
                  replacementPrefix: prefix
                }
              ];
            });
            editor.moveToBottom();
            editor.insertText('x');
            editor.insertText('y');
            editor.insertText('z');
            waitForAutocomplete();
            return runs(function() {
              var characterMatches, text;
              expect(editorView.querySelector('.autocomplete-plus')).toExist();
              characterMatches = editorView.querySelectorAll('.autocomplete-plus li span.word .character-match');
              text = editorView.querySelector('.autocomplete-plus li span.word').textContent;
              expect(characterMatches).toHaveLength(0);
              return expect(text).toBe('omgnope');
            });
          });
          return describe("when the snippets package is enabled", function() {
            beforeEach(function() {
              return waitsForPromise(function() {
                return atom.packages.activatePackage('snippets');
              });
            });
            it("does not highlight the snippet html; ref issue 301", function() {
              spyOn(provider, 'getSuggestions').andCallFake(function() {
                return [
                  {
                    snippet: 'ab(${1:c})c'
                  }
                ];
              });
              editor.moveToBottom();
              editor.insertText('c');
              waitForAutocomplete();
              return runs(function() {
                var charMatch, word;
                word = editorView.querySelector('.autocomplete-plus li span.word');
                charMatch = editorView.querySelector('.autocomplete-plus li span.word .character-match');
                expect(word.textContent).toBe('ab(c)c');
                expect(charMatch.textContent).toBe('c');
                return expect(charMatch.parentNode).toHaveClass('snippet-completion');
              });
            });
            return it("does not highlight the snippet html when highlight beginning of the word", function() {
              spyOn(provider, 'getSuggestions').andCallFake(function() {
                return [
                  {
                    snippet: 'abcde(${1:e}, ${1:f})f'
                  }
                ];
              });
              editor.moveToBottom();
              editor.insertText('c');
              editor.insertText('e');
              editor.insertText('f');
              waitForAutocomplete();
              return runs(function() {
                var charMatches, word;
                word = editorView.querySelector('.autocomplete-plus li span.word');
                expect(word.textContent).toBe('abcde(e, f)f');
                charMatches = editorView.querySelectorAll('.autocomplete-plus li span.word .character-match');
                expect(charMatches[0].textContent).toBe('c');
                expect(charMatches[0].parentNode).toHaveClass('word');
                expect(charMatches[1].textContent).toBe('e');
                expect(charMatches[1].parentNode).toHaveClass('word');
                expect(charMatches[2].textContent).toBe('f');
                return expect(charMatches[2].parentNode).toHaveClass('snippet-completion');
              });
            });
          });
        });
      });
      describe("when a replacementPrefix is not specified", function() {
        beforeEach(function() {
          return spyOn(provider, 'getSuggestions').andCallFake(function() {
            return [
              {
                text: 'something'
              }
            ];
          });
        });
        it("replaces with the default input prefix", function() {
          editor.insertText('abc');
          triggerAutocompletion(editor, false, 'm');
          expect(editor.getText()).toBe('abcm');
          return runs(function() {
            var suggestionListView;
            expect(editorView.querySelector('.autocomplete-plus')).toExist();
            suggestionListView = editorView.querySelector('.autocomplete-plus autocomplete-suggestion-list');
            atom.commands.dispatch(suggestionListView, 'autocomplete-plus:confirm');
            return expect(editor.getText()).toBe('something');
          });
        });
        return it("does not replace non-word prefixes with the chosen suggestion", function() {
          editor.insertText('abc');
          editor.insertText('.');
          waitForAutocomplete();
          expect(editor.getText()).toBe('abc.');
          return runs(function() {
            var suggestionListView;
            expect(editorView.querySelector('.autocomplete-plus')).toExist();
            suggestionListView = editorView.querySelector('.autocomplete-plus autocomplete-suggestion-list');
            atom.commands.dispatch(suggestionListView, 'autocomplete-plus:confirm');
            return expect(editor.getText()).toBe('abc.something');
          });
        });
      });
      describe("when autocomplete-plus.suggestionListFollows is 'Cursor'", function() {
        beforeEach(function() {
          return atom.config.set('autocomplete-plus.suggestionListFollows', 'Cursor');
        });
        return it("places the suggestion list at the cursor", function() {
          spyOn(provider, 'getSuggestions').andCallFake(function(options) {
            return [
              {
                text: 'ab',
                leftLabel: 'void'
              }, {
                text: 'abc',
                leftLabel: 'void'
              }
            ];
          });
          editor.insertText('omghey ab');
          triggerAutocompletion(editor, false, 'c');
          return runs(function() {
            var overlayElement, suggestionList;
            overlayElement = editorView.querySelector('.autocomplete-plus');
            expect(overlayElement).toExist();
            expect(overlayElement.style.left).toBe(pixelLeftForBufferPosition([0, 10]));
            suggestionList = editorView.querySelector('.autocomplete-plus autocomplete-suggestion-list');
            return expect(suggestionList.style['margin-left']).toBeFalsy();
          });
        });
      });
      describe("when autocomplete-plus.suggestionListFollows is 'Word'", function() {
        beforeEach(function() {
          return atom.config.set('autocomplete-plus.suggestionListFollows', 'Word');
        });
        it("opens to the correct position, and correctly closes on cancel", function() {
          editor.insertText('x ab');
          triggerAutocompletion(editor, false, 'c');
          return runs(function() {
            var overlayElement;
            overlayElement = editorView.querySelector('.autocomplete-plus');
            expect(overlayElement).toExist();
            return expect(overlayElement.style.left).toBe(pixelLeftForBufferPosition([0, 2]));
          });
        });
        it("displays the suggestion list with a negative margin to align the prefix with the word-container", function() {
          spyOn(provider, 'getSuggestions').andCallFake(function(options) {
            return [
              {
                text: 'ab',
                leftLabel: 'void'
              }, {
                text: 'abc',
                leftLabel: 'void'
              }
            ];
          });
          editor.insertText('omghey ab');
          triggerAutocompletion(editor, false, 'c');
          return runs(function() {
            var suggestionList, wordContainer;
            suggestionList = editorView.querySelector('.autocomplete-plus autocomplete-suggestion-list');
            wordContainer = editorView.querySelector('.autocomplete-plus autocomplete-suggestion-list .word-container');
            return expect(suggestionList.style['margin-left']).toBe("-" + wordContainer.offsetLeft + "px");
          });
        });
        it("keeps the suggestion list planted at the beginning of the prefix when typing", function() {
          var overlayElement;
          overlayElement = null;
          editor.insertText('x');
          editor.insertText(' ');
          waitForAutocomplete();
          runs(function() {
            overlayElement = editorView.querySelector('.autocomplete-plus');
            expect(overlayElement.style.left).toBe(pixelLeftForBufferPosition([0, 2]));
            editor.insertText('a');
            return waitForAutocomplete();
          });
          runs(function() {
            expect(overlayElement.style.left).toBe(pixelLeftForBufferPosition([0, 2]));
            editor.insertText('b');
            return waitForAutocomplete();
          });
          runs(function() {
            expect(overlayElement.style.left).toBe(pixelLeftForBufferPosition([0, 2]));
            editor.backspace();
            editor.backspace();
            return waitForAutocomplete();
          });
          runs(function() {
            expect(overlayElement.style.left).toBe(pixelLeftForBufferPosition([0, 2]));
            editor.backspace();
            return waitForAutocomplete();
          });
          runs(function() {
            expect(overlayElement.style.left).toBe(pixelLeftForBufferPosition([0, 0]));
            editor.insertText(' ');
            editor.insertText('a');
            editor.insertText('b');
            editor.insertText('c');
            return waitForAutocomplete();
          });
          return runs(function() {
            return expect(overlayElement.style.left).toBe(pixelLeftForBufferPosition([0, 2]));
          });
        });
        return it("when broken by a non-word character, the suggestion list is positioned at the beginning of the new word", function() {
          var overlayElement;
          overlayElement = null;
          editor.insertText('x');
          editor.insertText(' abc');
          editor.insertText('d');
          waitForAutocomplete();
          runs(function() {
            var left;
            overlayElement = editorView.querySelector('.autocomplete-plus');
            left = editorView.pixelPositionForBufferPosition([0, 2]).left;
            expect(overlayElement.style.left).toBe(pixelLeftForBufferPosition([0, 2]));
            editor.insertText(' ');
            editor.insertText('a');
            editor.insertText('b');
            return waitForAutocomplete();
          });
          runs(function() {
            expect(overlayElement.style.left).toBe(pixelLeftForBufferPosition([0, 7]));
            editor.backspace();
            editor.backspace();
            editor.backspace();
            return waitForAutocomplete();
          });
          return runs(function() {
            return expect(overlayElement.style.left).toBe(pixelLeftForBufferPosition([0, 2]));
          });
        });
      });
      describe('accepting suggestions', function() {
        beforeEach(function() {
          editor.setText('ok then ');
          return editor.setCursorBufferPosition([0, 20]);
        });
        it('hides the suggestions list when a suggestion is confirmed', function() {
          triggerAutocompletion(editor, false, 'a');
          return runs(function() {
            var suggestionListView;
            expect(editorView.querySelector('.autocomplete-plus')).toExist();
            suggestionListView = editorView.querySelector('.autocomplete-plus autocomplete-suggestion-list');
            atom.commands.dispatch(suggestionListView, 'autocomplete-plus:confirm');
            return expect(editorView.querySelector('.autocomplete-plus')).not.toExist();
          });
        });
        describe("when the replacementPrefix is empty", function() {
          beforeEach(function() {
            return spyOn(provider, 'getSuggestions').andCallFake(function() {
              return [
                {
                  text: 'someMethod()',
                  replacementPrefix: ''
                }
              ];
            });
          });
          return it("will insert the text without replacing anything", function() {
            editor.insertText('a');
            triggerAutocompletion(editor, false, '.');
            return runs(function() {
              var suggestionListView;
              suggestionListView = editorView.querySelector('.autocomplete-plus autocomplete-suggestion-list');
              atom.commands.dispatch(suggestionListView, 'autocomplete-plus:confirm');
              return expect(editor.getText()).toBe('ok then a.someMethod()');
            });
          });
        });
        describe('when tab is used to accept suggestions', function() {
          beforeEach(function() {
            return atom.config.set('autocomplete-plus.confirmCompletion', 'tab');
          });
          it('inserts the word and moves the cursor to the end of the word', function() {
            triggerAutocompletion(editor, false, 'a');
            return runs(function() {
              var bufferPosition, key;
              key = atom.keymaps.constructor.buildKeydownEvent('tab', {
                target: document.activeElement
              });
              atom.keymaps.handleKeyboardEvent(key);
              expect(editor.getText()).toBe('ok then ab');
              bufferPosition = editor.getCursorBufferPosition();
              expect(bufferPosition.row).toEqual(0);
              return expect(bufferPosition.column).toEqual(10);
            });
          });
          return it('does not insert the word when enter completion not enabled', function() {
            triggerAutocompletion(editor, false, 'a');
            return runs(function() {
              var key;
              key = atom.keymaps.constructor.buildKeydownEvent('enter', {
                keyCode: 13,
                target: document.activeElement
              });
              atom.keymaps.handleKeyboardEvent(key);
              return expect(editor.getText()).toBe('ok then a\n');
            });
          });
        });
        describe('when enter is used to accept suggestions', function() {
          beforeEach(function() {
            return atom.config.set('autocomplete-plus.confirmCompletion', 'enter');
          });
          it('inserts the word and moves the cursor to the end of the word', function() {
            triggerAutocompletion(editor, false, 'a');
            return runs(function() {
              var bufferPosition, key;
              key = atom.keymaps.constructor.buildKeydownEvent('enter', {
                target: document.activeElement
              });
              atom.keymaps.handleKeyboardEvent(key);
              expect(editor.getText()).toBe('ok then ab');
              bufferPosition = editor.getCursorBufferPosition();
              expect(bufferPosition.row).toEqual(0);
              return expect(bufferPosition.column).toEqual(10);
            });
          });
          return it('does not insert the word when tab completion not enabled', function() {
            triggerAutocompletion(editor, false, 'a');
            return runs(function() {
              var key;
              key = atom.keymaps.constructor.buildKeydownEvent('tab', {
                keyCode: 13,
                target: document.activeElement
              });
              atom.keymaps.handleKeyboardEvent(key);
              return expect(editor.getText()).toBe('ok then a ');
            });
          });
        });
        describe("when the cursor suffix matches the replacement", function() {
          beforeEach(function() {
            return spyOn(provider, 'getSuggestions').andCallFake(function() {
              return [
                {
                  text: 'oneomgtwo',
                  replacementPrefix: 'one'
                }
              ];
            });
          });
          return it('replaces the suffix with the replacement', function() {
            editor.setText('ontwothree');
            editor.setCursorBufferPosition([0, 2]);
            triggerAutocompletion(editor, false, 'e');
            return runs(function() {
              var suggestionListView;
              suggestionListView = editorView.querySelector('.autocomplete-plus autocomplete-suggestion-list');
              atom.commands.dispatch(suggestionListView, 'autocomplete-plus:confirm');
              return expect(editor.getText()).toBe('oneomgtwothree');
            });
          });
        });
        return describe("when the cursor suffix does not match the replacement", function() {
          beforeEach(function() {
            return spyOn(provider, 'getSuggestions').andCallFake(function() {
              return [
                {
                  text: 'oneomgTwo',
                  replacementPrefix: 'one'
                }
              ];
            });
          });
          return it('replaces the suffix with the replacement', function() {
            editor.setText('ontwothree');
            editor.setCursorBufferPosition([0, 2]);
            triggerAutocompletion(editor, false, 'e');
            return runs(function() {
              var suggestionListView;
              suggestionListView = editorView.querySelector('.autocomplete-plus autocomplete-suggestion-list');
              atom.commands.dispatch(suggestionListView, 'autocomplete-plus:confirm');
              return expect(editor.getText()).toBe('oneomgTwotwothree');
            });
          });
        });
      });
      describe('when auto-activation is disabled', function() {
        beforeEach(function() {
          return atom.config.set('autocomplete-plus.enableAutoActivation', false);
        });
        it('does not show suggestions after a delay', function() {
          triggerAutocompletion(editor);
          return runs(function() {
            return expect(editorView.querySelector('.autocomplete-plus')).not.toExist();
          });
        });
        it('shows suggestions when explicitly triggered', function() {
          triggerAutocompletion(editor);
          runs(function() {
            expect(editorView.querySelector('.autocomplete-plus')).not.toExist();
            atom.commands.dispatch(editorView, 'autocomplete-plus:activate');
            return waitForAutocomplete();
          });
          return runs(function() {
            return expect(editorView.querySelector('.autocomplete-plus')).toExist();
          });
        });
        it("stays open when typing", function() {
          triggerAutocompletion(editor, false, 'a');
          runs(function() {
            expect(editorView.querySelector('.autocomplete-plus')).not.toExist();
            atom.commands.dispatch(editorView, 'autocomplete-plus:activate');
            return waitForAutocomplete();
          });
          runs(function() {
            expect(editorView.querySelector('.autocomplete-plus')).toExist();
            editor.insertText('b');
            return waitForAutocomplete();
          });
          return runs(function() {
            return expect(editorView.querySelector('.autocomplete-plus')).toExist();
          });
        });
        it('accepts the suggestion if there is one', function() {
          spyOn(provider, 'getSuggestions').andCallFake(function(options) {
            return [
              {
                text: 'omgok'
              }
            ];
          });
          triggerAutocompletion(editor);
          runs(function() {
            expect(editorView.querySelector('.autocomplete-plus')).not.toExist();
            atom.commands.dispatch(editorView, 'autocomplete-plus:activate');
            return waitForAutocomplete();
          });
          return runs(function() {
            expect(editorView.querySelector('.autocomplete-plus')).not.toExist();
            return expect(editor.getText()).toBe('omgok');
          });
        });
        it('does not auto-accept a single suggestion when filtering', function() {
          spyOn(provider, 'getSuggestions').andCallFake(function(_arg) {
            var list, prefix, t, _i, _len, _results;
            prefix = _arg.prefix;
            list = _.filter(['a', 'abc'], function(word) {
              return word.indexOf(prefix) === 0;
            });
            _results = [];
            for (_i = 0, _len = list.length; _i < _len; _i++) {
              t = list[_i];
              _results.push({
                text: t
              });
            }
            return _results;
          });
          editor.insertText('a');
          atom.commands.dispatch(editorView, 'autocomplete-plus:activate');
          waitForAutocomplete();
          runs(function() {
            expect(editorView.querySelector('.autocomplete-plus')).toExist();
            expect(editorView.querySelectorAll('.autocomplete-plus li')).toHaveLength(2);
            editor.insertText('b');
            return waitForAutocomplete();
          });
          return runs(function() {
            expect(editorView.querySelector('.autocomplete-plus')).toExist();
            return expect(editorView.querySelectorAll('.autocomplete-plus li')).toHaveLength(1);
          });
        });
        return describe("strict matching of prefix when explicitly triggered", function() {
          beforeEach(function() {
            return spyOn(provider, 'getSuggestions').andCallFake(function(_arg) {
              var prefix;
              prefix = _arg.prefix;
              return [
                {
                  text: 'abcOk'
                }, {
                  text: 'aabcOk'
                }
              ];
            });
          });
          it('strict matches, and confirms the suggestion with the strict match', function() {
            editor.insertText('ok ab');
            editor.setCursorBufferPosition([0, 1000]);
            triggerAutocompletion(editor, false, 'c');
            runs(function() {
              expect(editorView.querySelector('.autocomplete-plus')).not.toExist();
              atom.commands.dispatch(editorView, 'autocomplete-plus:activate');
              return waitForAutocomplete();
            });
            return runs(function() {
              expect(editorView.querySelector('.autocomplete-plus')).not.toExist();
              return expect(editor.getText()).toBe('ok abcOk');
            });
          });
          return describe("when a provider uses its own prefix scheme", function() {
            beforeEach(function() {
              var specialProvider;
              specialProvider = {
                selector: '*',
                inclusionPriority: 2,
                getSuggestions: function(_arg) {
                  var prefix, replacementPrefix;
                  prefix = _arg.prefix;
                  replacementPrefix = "self " + prefix;
                  return [
                    {
                      text: '[self abcOk]',
                      replacementPrefix: replacementPrefix
                    }, {
                      text: '[self aabcOk]',
                      replacementPrefix: replacementPrefix
                    }
                  ];
                }
              };
              return mainModule.consumeProvider(specialProvider);
            });
            it('ignores the suggestions with their own prefix scheme', function() {
              editor.insertText('yeah ab');
              editor.setCursorBufferPosition([0, 1000]);
              triggerAutocompletion(editor, false, 'c');
              runs(function() {
                expect(editorView.querySelector('.autocomplete-plus')).not.toExist();
                atom.commands.dispatch(editorView, 'autocomplete-plus:activate');
                return waitForAutocomplete();
              });
              return runs(function() {
                var items;
                expect(editorView.querySelector('.autocomplete-plus')).toExist();
                items = editorView.querySelectorAll('.autocomplete-plus li');
                expect(items).toHaveLength(3);
                expect(items[0].textContent).toContain('abcOk');
                expect(items[1].textContent).toContain('[self abcOk]');
                return expect(items[2].textContent).toContain('[self aabcOk]');
              });
            });
            return it('resets the strict match on subsequent opens', function() {
              editor.insertText('yeah ab');
              editor.setCursorBufferPosition([0, 1000]);
              triggerAutocompletion(editor, false, 'c');
              runs(function() {
                atom.commands.dispatch(editorView, 'autocomplete-plus:activate');
                return waitForAutocomplete();
              });
              runs(function() {
                expect(editorView.querySelector('.autocomplete-plus')).toExist();
                expect(editorView.querySelectorAll('.autocomplete-plus li')).toHaveLength(3);
                editor.setText('yeah ');
                editor.setCursorBufferPosition([0, 1000]);
                return triggerAutocompletion(editor, false, 'a');
              });
              runs(function() {
                atom.commands.dispatch(editorView, 'autocomplete-plus:activate');
                return waitForAutocomplete();
              });
              return runs(function() {
                expect(editorView.querySelector('.autocomplete-plus')).toExist();
                return expect(editorView.querySelectorAll('.autocomplete-plus li')).toHaveLength(4);
              });
            });
          });
        });
      });
      describe("when the replacementPrefix doesnt match the actual prefix", function() {
        describe("when snippets are not used", function() {
          beforeEach(function() {
            return spyOn(provider, 'getSuggestions').andCallFake(function() {
              return [
                {
                  text: 'something',
                  replacementPrefix: 'bcm'
                }
              ];
            });
          });
          return it("only replaces the suggestion at cursors whos prefix matches the replacementPrefix", function() {
            editor.setText("abc abc\ndef");
            editor.setCursorBufferPosition([0, 3]);
            editor.addCursorAtBufferPosition([0, 7]);
            editor.addCursorAtBufferPosition([1, 3]);
            triggerAutocompletion(editor, false, 'm');
            return runs(function() {
              var suggestionListView;
              expect(editorView.querySelector('.autocomplete-plus')).toExist();
              suggestionListView = editorView.querySelector('.autocomplete-plus autocomplete-suggestion-list');
              atom.commands.dispatch(suggestionListView, 'autocomplete-plus:confirm');
              return expect(editor.getText()).toBe("asomething asomething\ndefm");
            });
          });
        });
        return describe("when snippets are used", function() {
          beforeEach(function() {
            spyOn(provider, 'getSuggestions').andCallFake(function() {
              return [
                {
                  snippet: 'ok(${1:omg})',
                  replacementPrefix: 'bcm'
                }
              ];
            });
            return waitsForPromise(function() {
              return atom.packages.activatePackage('snippets');
            });
          });
          return it("only replaces the suggestion at cursors whos prefix matches the replacementPrefix", function() {
            editor.setText("abc abc\ndef");
            editor.setCursorBufferPosition([0, 3]);
            editor.addCursorAtBufferPosition([0, 7]);
            editor.addCursorAtBufferPosition([1, 3]);
            triggerAutocompletion(editor, false, 'm');
            return runs(function() {
              var suggestionListView;
              expect(editorView.querySelector('.autocomplete-plus')).toExist();
              suggestionListView = editorView.querySelector('.autocomplete-plus autocomplete-suggestion-list');
              atom.commands.dispatch(suggestionListView, 'autocomplete-plus:confirm');
              return expect(editor.getText()).toBe("aok(omg) aok(omg)\ndefm");
            });
          });
        });
      });
      describe('select-previous event', function() {
        it('selects the previous item in the list', function() {
          spyOn(provider, 'getSuggestions').andCallFake(function() {
            return [
              {
                text: 'ab'
              }, {
                text: 'abc'
              }, {
                text: 'abcd'
              }
            ];
          });
          triggerAutocompletion(editor, false, 'a');
          return runs(function() {
            var items;
            items = editorView.querySelectorAll('.autocomplete-plus li');
            expect(items[0]).toHaveClass('selected');
            expect(items[1]).not.toHaveClass('selected');
            expect(items[2]).not.toHaveClass('selected');
            atom.commands.dispatch(editorView, 'core:move-up');
            items = editorView.querySelectorAll('.autocomplete-plus li');
            expect(items[0]).not.toHaveClass('selected');
            expect(items[1]).not.toHaveClass('selected');
            return expect(items[2]).toHaveClass('selected');
          });
        });
        it('closes the autocomplete when up arrow pressed when only one item displayed', function() {
          spyOn(provider, 'getSuggestions').andCallFake(function(_arg) {
            var prefix;
            prefix = _arg.prefix;
            return [
              {
                text: 'quicksort'
              }, {
                text: 'quack'
              }
            ].filter(function(val) {
              return val.text.startsWith(prefix);
            });
          });
          editor.insertText('q');
          editor.insertText('u');
          waitForAutocomplete();
          runs(function() {
            var autocomplete;
            atom.commands.dispatch(editorView, 'core:move-up');
            advanceClock(1);
            autocomplete = editorView.querySelector('.autocomplete-plus');
            expect(autocomplete).toExist();
            editor.insertText('a');
            return waitForAutocomplete();
          });
          return runs(function() {
            var autocomplete;
            autocomplete = editorView.querySelector('.autocomplete-plus');
            expect(autocomplete).toExist();
            atom.commands.dispatch(editorView, 'core:move-up');
            advanceClock(1);
            autocomplete = editorView.querySelector('.autocomplete-plus');
            return expect(autocomplete).not.toExist();
          });
        });
        return it('does not close the autocomplete when up arrow pressed with multiple items displayed but triggered on one item', function() {
          spyOn(provider, 'getSuggestions').andCallFake(function(_arg) {
            var prefix;
            prefix = _arg.prefix;
            return [
              {
                text: 'quicksort'
              }, {
                text: 'quack'
              }
            ].filter(function(val) {
              return val.text.startsWith(prefix);
            });
          });
          editor.insertText('q');
          editor.insertText('u');
          editor.insertText('a');
          waitForAutocomplete();
          runs(function() {
            editor.backspace();
            return waitForAutocomplete();
          });
          return runs(function() {
            var autocomplete;
            autocomplete = editorView.querySelector('.autocomplete-plus');
            expect(autocomplete).toExist();
            atom.commands.dispatch(editorView, 'core:move-up');
            advanceClock(1);
            autocomplete = editorView.querySelector('.autocomplete-plus');
            return expect(autocomplete).toExist();
          });
        });
      });
      describe('select-next event', function() {
        it('selects the next item in the list', function() {
          triggerAutocompletion(editor, false, 'a');
          return runs(function() {
            var items;
            items = editorView.querySelectorAll('.autocomplete-plus li');
            expect(items[0]).toHaveClass('selected');
            expect(items[1]).not.toHaveClass('selected');
            expect(items[2]).not.toHaveClass('selected');
            atom.commands.dispatch(editorView, 'core:move-down');
            items = editorView.querySelectorAll('.autocomplete-plus li');
            expect(items[0]).not.toHaveClass('selected');
            expect(items[1]).toHaveClass('selected');
            return expect(items[2]).not.toHaveClass('selected');
          });
        });
        return it('wraps to the first item when triggered at the end of the list', function() {
          spyOn(provider, 'getSuggestions').andCallFake(function() {
            return [
              {
                text: 'ab'
              }, {
                text: 'abc'
              }, {
                text: 'abcd'
              }
            ];
          });
          triggerAutocompletion(editor, false, 'a');
          return runs(function() {
            var items, suggestionListView;
            items = editorView.querySelectorAll('.autocomplete-plus li');
            expect(items[0]).toHaveClass('selected');
            expect(items[1]).not.toHaveClass('selected');
            expect(items[2]).not.toHaveClass('selected');
            suggestionListView = editorView.querySelector('.autocomplete-plus autocomplete-suggestion-list');
            items = editorView.querySelectorAll('.autocomplete-plus li');
            atom.commands.dispatch(suggestionListView, 'core:move-down');
            expect(items[1]).toHaveClass('selected');
            atom.commands.dispatch(suggestionListView, 'core:move-down');
            expect(items[2]).toHaveClass('selected');
            atom.commands.dispatch(suggestionListView, 'core:move-down');
            return expect(items[0]).toHaveClass('selected');
          });
        });
      });
      describe("label rendering", function() {
        describe("when no labels are specified", function() {
          beforeEach(function() {
            return spyOn(provider, 'getSuggestions').andCallFake(function(options) {
              return [
                {
                  text: 'ok'
                }
              ];
            });
          });
          return it("displays the text in the suggestion", function() {
            triggerAutocompletion(editor);
            return runs(function() {
              var iconContainer, leftLabel, rightLabel;
              iconContainer = editorView.querySelector('.autocomplete-plus li .icon-container');
              leftLabel = editorView.querySelector('.autocomplete-plus li .right-label');
              rightLabel = editorView.querySelector('.autocomplete-plus li .right-label');
              expect(iconContainer.childNodes).toHaveLength(0);
              expect(leftLabel.childNodes).toHaveLength(0);
              return expect(rightLabel.childNodes).toHaveLength(0);
            });
          });
        });
        describe("when `type` is specified", function() {
          beforeEach(function() {
            return spyOn(provider, 'getSuggestions').andCallFake(function(options) {
              return [
                {
                  text: 'ok',
                  type: 'omg'
                }
              ];
            });
          });
          return it("displays an icon in the icon-container", function() {
            triggerAutocompletion(editor);
            return runs(function() {
              var icon;
              icon = editorView.querySelector('.autocomplete-plus li .icon-container .icon');
              return expect(icon.textContent).toBe('o');
            });
          });
        });
        describe("when the `type` specified has a default icon", function() {
          beforeEach(function() {
            return spyOn(provider, 'getSuggestions').andCallFake(function(options) {
              return [
                {
                  text: 'ok',
                  type: 'snippet'
                }
              ];
            });
          });
          return it("displays the default icon in the icon-container", function() {
            triggerAutocompletion(editor);
            return runs(function() {
              var icon;
              icon = editorView.querySelector('.autocomplete-plus li .icon-container .icon i');
              return expect(icon).toHaveClass('icon-move-right');
            });
          });
        });
        describe("when `type` is an empty string", function() {
          beforeEach(function() {
            return spyOn(provider, 'getSuggestions').andCallFake(function(options) {
              return [
                {
                  text: 'ok',
                  type: ''
                }
              ];
            });
          });
          return it("does not display an icon in the icon-container", function() {
            triggerAutocompletion(editor);
            return runs(function() {
              var iconContainer;
              iconContainer = editorView.querySelector('.autocomplete-plus li .icon-container');
              return expect(iconContainer.childNodes).toHaveLength(0);
            });
          });
        });
        describe("when `iconHTML` is specified", function() {
          beforeEach(function() {
            return spyOn(provider, 'getSuggestions').andCallFake(function(options) {
              return [
                {
                  text: 'ok',
                  iconHTML: '<i class="omg"></i>'
                }
              ];
            });
          });
          return it("displays an icon in the icon-container", function() {
            triggerAutocompletion(editor);
            return runs(function() {
              var icon;
              icon = editorView.querySelector('.autocomplete-plus li .icon-container .icon .omg');
              return expect(icon).toExist();
            });
          });
        });
        describe("when `iconHTML` is false", function() {
          beforeEach(function() {
            return spyOn(provider, 'getSuggestions').andCallFake(function(options) {
              return [
                {
                  text: 'ok',
                  type: 'something',
                  iconHTML: false
                }
              ];
            });
          });
          return it("does not display an icon in the icon-container", function() {
            triggerAutocompletion(editor);
            return runs(function() {
              var iconContainer;
              iconContainer = editorView.querySelector('.autocomplete-plus li .icon-container');
              return expect(iconContainer.childNodes).toHaveLength(0);
            });
          });
        });
        describe("when `iconHTML` is not a string and a `type` is specified", function() {
          beforeEach(function() {
            return spyOn(provider, 'getSuggestions').andCallFake(function(options) {
              return [
                {
                  text: 'ok',
                  type: 'something',
                  iconHTML: true
                }
              ];
            });
          });
          return it("displays the default icon in the icon-container", function() {
            triggerAutocompletion(editor);
            return runs(function() {
              var icon;
              icon = editorView.querySelector('.autocomplete-plus li .icon-container .icon');
              return expect(icon.textContent).toBe('s');
            });
          });
        });
        describe("when `iconHTML` is not a string and no type is specified", function() {
          beforeEach(function() {
            return spyOn(provider, 'getSuggestions').andCallFake(function(options) {
              return [
                {
                  text: 'ok',
                  iconHTML: true
                }
              ];
            });
          });
          return it("it does not display an icon", function() {
            triggerAutocompletion(editor);
            return runs(function() {
              var iconContainer;
              iconContainer = editorView.querySelector('.autocomplete-plus li .icon-container');
              return expect(iconContainer.childNodes).toHaveLength(0);
            });
          });
        });
        describe("when `rightLabel` is specified", function() {
          beforeEach(function() {
            return spyOn(provider, 'getSuggestions').andCallFake(function(options) {
              return [
                {
                  text: 'ok',
                  rightLabel: '<i class="something">sometext</i>'
                }
              ];
            });
          });
          return it("displays the text in the suggestion", function() {
            triggerAutocompletion(editor);
            return runs(function() {
              var label;
              label = editorView.querySelector('.autocomplete-plus li .right-label');
              return expect(label).toHaveText('<i class="something">sometext</i>');
            });
          });
        });
        describe("when `rightLabelHTML` is specified", function() {
          beforeEach(function() {
            return spyOn(provider, 'getSuggestions').andCallFake(function(options) {
              return [
                {
                  text: 'ok',
                  rightLabelHTML: '<i class="something">sometext</i>'
                }
              ];
            });
          });
          return it("displays the text in the suggestion", function() {
            triggerAutocompletion(editor);
            return runs(function() {
              var label;
              label = editorView.querySelector('.autocomplete-plus li .right-label .something');
              return expect(label).toHaveText('sometext');
            });
          });
        });
        describe("when `leftLabel` is specified", function() {
          beforeEach(function() {
            return spyOn(provider, 'getSuggestions').andCallFake(function(options) {
              return [
                {
                  text: 'ok',
                  leftLabel: '<i class="something">sometext</i>'
                }
              ];
            });
          });
          return it("displays the text in the suggestion", function() {
            triggerAutocompletion(editor);
            return runs(function() {
              var label;
              label = editorView.querySelector('.autocomplete-plus li .left-label');
              return expect(label).toHaveText('<i class="something">sometext</i>');
            });
          });
        });
        return describe("when `leftLabelHTML` is specified", function() {
          beforeEach(function() {
            return spyOn(provider, 'getSuggestions').andCallFake(function(options) {
              return [
                {
                  text: 'ok',
                  leftLabelHTML: '<i class="something">sometext</i>'
                }
              ];
            });
          });
          return it("displays the text in the suggestion", function() {
            triggerAutocompletion(editor);
            return runs(function() {
              var label;
              label = editorView.querySelector('.autocomplete-plus li .left-label .something');
              return expect(label).toHaveText('sometext');
            });
          });
        });
      });
      return describe('when clicking in the suggestion list', function() {
        beforeEach(function() {
          return spyOn(provider, 'getSuggestions').andCallFake(function() {
            var list, text, _i, _len, _results;
            list = ['ab', 'abc', 'abcd', 'abcde'];
            _results = [];
            for (_i = 0, _len = list.length; _i < _len; _i++) {
              text = list[_i];
              _results.push({
                text: text,
                description: "" + text + " yeah ok"
              });
            }
            return _results;
          });
        });
        it('will select the item and confirm the selection', function() {
          triggerAutocompletion(editor, true, 'a');
          return runs(function() {
            var item, mouse;
            item = editorView.querySelectorAll('.autocomplete-plus li')[1];
            mouse = document.createEvent('MouseEvents');
            mouse.initMouseEvent('mousedown', true, true, window);
            item.dispatchEvent(mouse);
            mouse = document.createEvent('MouseEvents');
            mouse.initMouseEvent('mouseup', true, true, window);
            item.dispatchEvent(mouse);
            expect(editorView.querySelector('.autocomplete-plus')).not.toExist();
            return expect(editor.getBuffer().getLastLine()).toEqual(item.textContent.trim());
          });
        });
        return it('will not close the list when the description is clicked', function() {
          triggerAutocompletion(editor, true, 'a');
          return runs(function() {
            var description, mouse;
            description = editorView.querySelector('.autocomplete-plus .suggestion-description-content');
            mouse = document.createEvent('MouseEvents');
            mouse.initMouseEvent('mousedown', true, true, window);
            description.dispatchEvent(mouse);
            mouse = document.createEvent('MouseEvents');
            mouse.initMouseEvent('mouseup', true, true, window);
            description.dispatchEvent(mouse);
            return expect(editorView.querySelector('.autocomplete-plus')).toExist();
          });
        });
      });
    });
    describe('when opening a file without a path', function() {
      beforeEach(function() {
        waitsForPromise(function() {
          return atom.workspace.open('').then(function(e) {
            editor = e;
            return editorView = atom.views.getView(editor);
          });
        });
        waitsForPromise(function() {
          return atom.packages.activatePackage('language-text');
        });
        waitsForPromise(function() {
          return atom.packages.activatePackage('autocomplete-plus').then(function(a) {
            return mainModule = a.mainModule;
          });
        });
        waitsFor(function() {
          var _ref2;
          return (_ref2 = mainModule.autocompleteManager) != null ? _ref2.ready : void 0;
        });
        return runs(function() {
          autocompleteManager = mainModule.autocompleteManager;
          spyOn(autocompleteManager, 'findSuggestions').andCallThrough();
          return spyOn(autocompleteManager, 'displaySuggestions').andCallThrough();
        });
      });
      return describe("when strict matching is used", function() {
        beforeEach(function() {
          return atom.config.set('autocomplete-plus.strictMatching', true);
        });
        return it('using strict matching does not cause issues when typing', function() {
          runs(function() {
            editor.moveToBottom();
            editor.insertText('h');
            editor.insertText('e');
            editor.insertText('l');
            editor.insertText('l');
            editor.insertText('o');
            return advanceClock(completionDelay + 1000);
          });
          return waitsFor(function() {
            return autocompleteManager.findSuggestions.calls.length === 1;
          });
        });
      });
    });
    describe('when opening a javascript file', function() {
      beforeEach(function() {
        runs(function() {
          return atom.config.set('autocomplete-plus.enableAutoActivation', true);
        });
        waitsForPromise(function() {
          return atom.workspace.open('sample.js').then(function(e) {
            editor = e;
            return editorView = atom.views.getView(editor);
          });
        });
        waitsForPromise(function() {
          return atom.packages.activatePackage('language-javascript');
        });
        waitsForPromise(function() {
          return atom.packages.activatePackage('autocomplete-plus').then(function(a) {
            mainModule = a.mainModule;
            return autocompleteManager = mainModule.autocompleteManager;
          });
        });
        return runs(function() {
          return advanceClock(autocompleteManager.providerManager.defaultProvider.deferBuildWordListInterval);
        });
      });
      describe('when the built-in provider is disabled', function() {
        return it('should not show the suggestion list', function() {
          atom.config.set('autocomplete-plus.enableBuiltinProvider', false);
          expect(editorView.querySelector('.autocomplete-plus')).not.toExist();
          triggerAutocompletion(editor);
          return runs(function() {
            return expect(editorView.querySelector('.autocomplete-plus')).not.toExist();
          });
        });
      });
      describe('when the buffer changes', function() {
        it('should show the suggestion list when suggestions are found', function() {
          expect(editorView.querySelector('.autocomplete-plus')).not.toExist();
          triggerAutocompletion(editor);
          return runs(function() {
            var index, item, suggestions, _i, _len, _ref2, _results;
            expect(editorView.querySelector('.autocomplete-plus')).toExist();
            suggestions = ['function', 'if', 'left', 'shift'];
            _ref2 = editorView.querySelectorAll('.autocomplete-plus li span.word');
            _results = [];
            for (index = _i = 0, _len = _ref2.length; _i < _len; index = ++_i) {
              item = _ref2[index];
              _results.push(expect(item.innerText).toEqual(suggestions[index]));
            }
            return _results;
          });
        });
        it('should not show the suggestion list when no suggestions are found', function() {
          expect(editorView.querySelector('.autocomplete-plus')).not.toExist();
          editor.moveToBottom();
          editor.insertText('x');
          waitForAutocomplete();
          return runs(function() {
            return expect(editorView.querySelector('.autocomplete-plus')).not.toExist();
          });
        });
        it('shows the suggestion list on backspace if allowed', function() {
          runs(function() {
            atom.config.set('autocomplete-plus.backspaceTriggersAutocomplete', true);
            expect(editorView.querySelector('.autocomplete-plus')).not.toExist();
            editor.moveToBottom();
            editor.insertText('f');
            editor.insertText('u');
            return waitForAutocomplete();
          });
          runs(function() {
            expect(editorView.querySelector('.autocomplete-plus')).toExist();
            editor.insertText('\r');
            return waitForAutocomplete();
          });
          runs(function() {
            var key;
            expect(editorView.querySelector('.autocomplete-plus')).not.toExist();
            key = atom.keymaps.constructor.buildKeydownEvent('backspace', {
              target: document.activeElement
            });
            atom.keymaps.handleKeyboardEvent(key);
            return waitForAutocomplete();
          });
          runs(function() {
            var key;
            expect(editorView.querySelector('.autocomplete-plus')).not.toExist();
            key = atom.keymaps.constructor.buildKeydownEvent('backspace', {
              target: document.activeElement
            });
            atom.keymaps.handleKeyboardEvent(key);
            return waitForAutocomplete();
          });
          return runs(function() {
            expect(editorView.querySelector('.autocomplete-plus')).toExist();
            return expect(editor.lineTextForBufferRow(13)).toBe('f');
          });
        });
        it('does not shows the suggestion list on backspace if disallowed', function() {
          runs(function() {
            atom.config.set('autocomplete-plus.backspaceTriggersAutocomplete', false);
            expect(editorView.querySelector('.autocomplete-plus')).not.toExist();
            editor.moveToBottom();
            editor.insertText('f');
            editor.insertText('u');
            return waitForAutocomplete();
          });
          runs(function() {
            expect(editorView.querySelector('.autocomplete-plus')).toExist();
            editor.insertText('\r');
            return waitForAutocomplete();
          });
          runs(function() {
            var key;
            expect(editorView.querySelector('.autocomplete-plus')).not.toExist();
            key = atom.keymaps.constructor.buildKeydownEvent('backspace', {
              target: document.activeElement
            });
            atom.keymaps.handleKeyboardEvent(key);
            return waitForAutocomplete();
          });
          runs(function() {
            var key;
            expect(editorView.querySelector('.autocomplete-plus')).not.toExist();
            key = atom.keymaps.constructor.buildKeydownEvent('backspace', {
              target: document.activeElement
            });
            atom.keymaps.handleKeyboardEvent(key);
            return waitForAutocomplete();
          });
          return runs(function() {
            expect(editorView.querySelector('.autocomplete-plus')).not.toExist();
            return expect(editor.lineTextForBufferRow(13)).toBe('f');
          });
        });
        it("keeps the suggestion list open when it's already open on backspace", function() {
          expect(editorView.querySelector('.autocomplete-plus')).not.toExist();
          editor.moveToBottom();
          editor.insertText('f');
          editor.insertText('u');
          waitForAutocomplete();
          runs(function() {
            var key;
            expect(editorView.querySelector('.autocomplete-plus')).toExist();
            key = atom.keymaps.constructor.buildKeydownEvent('backspace', {
              target: document.activeElement
            });
            atom.keymaps.handleKeyboardEvent(key);
            return waitForAutocomplete();
          });
          return runs(function() {
            expect(editorView.querySelector('.autocomplete-plus')).toExist();
            return expect(editor.lineTextForBufferRow(13)).toBe('f');
          });
        });
        it("does not open the suggestion on backspace when it's closed", function() {
          atom.config.set('autocomplete-plus.backspaceTriggersAutocomplete', false);
          expect(editorView.querySelector('.autocomplete-plus')).not.toExist();
          editor.setCursorBufferPosition([2, 39]);
          runs(function() {
            var key;
            key = atom.keymaps.constructor.buildKeydownEvent('backspace', {
              target: document.activeElement
            });
            atom.keymaps.handleKeyboardEvent(key);
            return waitForAutocomplete();
          });
          return runs(function() {
            return expect(editorView.querySelector('.autocomplete-plus')).not.toExist();
          });
        });
        it('should not update the suggestion list while composition is in progress', function() {
          var activeElement;
          triggerAutocompletion(editor);
          activeElement = editorView.rootElement.querySelector('input');
          runs(function() {
            spyOn(autocompleteManager.suggestionList, 'changeItems').andCallThrough();
            expect(autocompleteManager.suggestionList.changeItems).not.toHaveBeenCalled();
            activeElement.dispatchEvent(buildIMECompositionEvent('compositionstart', {
              target: activeElement
            }));
            activeElement.dispatchEvent(buildIMECompositionEvent('compositionupdate', {
              data: '~',
              target: activeElement
            }));
            return waitForAutocomplete();
          });
          return runs(function() {
            expect(autocompleteManager.suggestionList.changeItems).not.toHaveBeenCalled();
            activeElement.dispatchEvent(buildIMECompositionEvent('compositionend', {
              target: activeElement
            }));
            activeElement.dispatchEvent(buildTextInputEvent({
              data: 'ã',
              target: activeElement
            }));
            return expect(editor.lineTextForBufferRow(13)).toBe('fã');
          });
        });
        return it('does not show the suggestion list when it is triggered then no longer needed', function() {
          runs(function() {
            editor.moveToBottom();
            editor.insertText('f');
            editor.insertText('u');
            editor.insertText('\r');
            return waitForAutocomplete();
          });
          return runs(function() {
            return expect(editorView.querySelector('.autocomplete-plus')).not.toExist();
          });
        });
      });
      return describe('.cancel()', function() {
        return it('unbinds autocomplete event handlers for move-up and move-down', function() {
          triggerAutocompletion(editor, false);
          autocompleteManager.hideSuggestionList();
          editorView = atom.views.getView(editor);
          atom.commands.dispatch(editorView, 'core:move-down');
          expect(editor.getCursorBufferPosition().row).toBe(1);
          atom.commands.dispatch(editorView, 'core:move-up');
          return expect(editor.getCursorBufferPosition().row).toBe(0);
        });
      });
    });
    describe('when a long completion exists', function() {
      beforeEach(function() {
        runs(function() {
          return atom.config.set('autocomplete-plus.enableAutoActivation', true);
        });
        waitsForPromise(function() {
          return atom.workspace.open('samplelong.js').then(function(e) {
            return editor = e;
          });
        });
        return waitsForPromise(function() {
          return atom.packages.activatePackage('autocomplete-plus').then(function(a) {
            mainModule = a.mainModule;
            return autocompleteManager = mainModule.autocompleteManager;
          });
        });
      });
      return it('sets the width of the view to be wide enough to contain the longest completion without scrolling', function() {
        editor.moveToBottom();
        editor.insertNewline();
        editor.insertText('t');
        waitForAutocomplete();
        return runs(function() {
          var suggestionListView;
          suggestionListView = atom.views.getView(autocompleteManager.suggestionList);
          return expect(suggestionListView.scrollWidth).toBe(suggestionListView.offsetWidth);
        });
      });
    });
    requiresGutter = function() {
      var _ref2;
      return ((_ref2 = editorView.component) != null ? _ref2.overlayManager : void 0) != null;
    };
    return pixelLeftForBufferPosition = function(bufferPosition) {
      var left;
      if (gutterWidth == null) {
        gutterWidth = editorView.shadowRoot.querySelector('.gutter').offsetWidth;
      }
      left = editorView.pixelPositionForBufferPosition(bufferPosition).left;
      if (requiresGutter()) {
        left = gutterWidth + left;
      }
      return "" + left + "px";
    };
  });

}).call(this);
