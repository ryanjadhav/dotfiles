(function() {
  var triggerAutocompletion, waitForAutocomplete, _, _ref;

  _ref = require('./spec-helper'), waitForAutocomplete = _ref.waitForAutocomplete, triggerAutocompletion = _ref.triggerAutocompletion;

  _ = require('underscore-plus');

  describe('Provider API', function() {
    var autocompleteManager, completionDelay, editor, mainModule, registration, testProvider, _ref1;
    _ref1 = [], completionDelay = _ref1[0], editor = _ref1[1], mainModule = _ref1[2], autocompleteManager = _ref1[3], registration = _ref1[4], testProvider = _ref1[5];
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
      return waitsForPromise(function() {
        return Promise.all([
          atom.packages.activatePackage('language-javascript'), atom.workspace.open('sample.js').then(function(e) {
            return editor = e;
          }), atom.packages.activatePackage('autocomplete-plus').then(function(a) {
            mainModule = a.mainModule;
            return autocompleteManager = mainModule.autocompleteManager;
          })
        ]);
      });
    });
    afterEach(function() {
      if ((registration != null ? registration.dispose : void 0) != null) {
        if (registration != null) {
          registration.dispose();
        }
      }
      registration = null;
      if ((testProvider != null ? testProvider.dispose : void 0) != null) {
        if (testProvider != null) {
          testProvider.dispose();
        }
      }
      return testProvider = null;
    });
    return describe('Provider API v2.0.0', function() {
      it('registers the provider specified by [provider]', function() {
        testProvider = {
          selector: '.source.js,.source.coffee',
          getSuggestions: function(options) {
            return [
              {
                text: 'ohai',
                replacementPrefix: 'ohai'
              }
            ];
          }
        };
        expect(_.size(autocompleteManager.providerManager.providersForScopeDescriptor('.source.js'))).toEqual(1);
        registration = atom.packages.serviceHub.provide('autocomplete.provider', '2.0.0', [testProvider]);
        return expect(_.size(autocompleteManager.providerManager.providersForScopeDescriptor('.source.js'))).toEqual(2);
      });
      it('registers the provider specified by the naked provider', function() {
        testProvider = {
          selector: '.source.js,.source.coffee',
          getSuggestions: function(options) {
            return [
              {
                text: 'ohai',
                replacementPrefix: 'ohai'
              }
            ];
          }
        };
        expect(_.size(autocompleteManager.providerManager.providersForScopeDescriptor('.source.js'))).toEqual(1);
        registration = atom.packages.serviceHub.provide('autocomplete.provider', '2.0.0', testProvider);
        return expect(_.size(autocompleteManager.providerManager.providersForScopeDescriptor('.source.js'))).toEqual(2);
      });
      it('passes the correct parameters to getSuggestions for the version', function() {
        testProvider = {
          selector: '.source.js,.source.coffee',
          getSuggestions: function(options) {
            return [
              {
                text: 'ohai',
                replacementPrefix: 'ohai'
              }
            ];
          }
        };
        registration = atom.packages.serviceHub.provide('autocomplete.provider', '2.0.0', testProvider);
        spyOn(testProvider, 'getSuggestions');
        triggerAutocompletion(editor, true, 'o');
        return runs(function() {
          var args;
          args = testProvider.getSuggestions.mostRecentCall.args[0];
          expect(args.editor).toBeDefined();
          expect(args.bufferPosition).toBeDefined();
          expect(args.scopeDescriptor).toBeDefined();
          expect(args.prefix).toBeDefined();
          expect(args.scope).not.toBeDefined();
          expect(args.scopeChain).not.toBeDefined();
          expect(args.buffer).not.toBeDefined();
          return expect(args.cursor).not.toBeDefined();
        });
      });
      it('correctly displays the suggestion options', function() {
        testProvider = {
          selector: '.source.js, .source.coffee',
          getSuggestions: function(options) {
            return [
              {
                text: 'ohai',
                replacementPrefix: 'o',
                rightLabelHTML: '<span style="color: red">ohai</span>',
                description: 'There be documentation'
              }
            ];
          }
        };
        registration = atom.packages.serviceHub.provide('autocomplete.provider', '2.0.0', testProvider);
        triggerAutocompletion(editor, true, 'o');
        return runs(function() {
          var suggestionListView;
          suggestionListView = atom.views.getView(autocompleteManager.suggestionList);
          expect(suggestionListView.querySelector('li .right-label')).toHaveHtml('<span style="color: red">ohai</span>');
          expect(suggestionListView.querySelector('.word')).toHaveText('ohai');
          expect(suggestionListView.querySelector('.suggestion-description-content')).toHaveText('There be documentation');
          return expect(suggestionListView.querySelector('.suggestion-description-more-link').style.display).toBe('none');
        });
      });
      it("favors the `displayText` over text or snippet suggestion options", function() {
        testProvider = {
          selector: '.source.js, .source.coffee',
          getSuggestions: function(options) {
            return [
              {
                text: 'ohai',
                snippet: 'snippet',
                displayText: 'displayOHAI',
                replacementPrefix: 'o',
                rightLabelHTML: '<span style="color: red">ohai</span>',
                description: 'There be documentation'
              }
            ];
          }
        };
        registration = atom.packages.serviceHub.provide('autocomplete.provider', '2.0.0', testProvider);
        triggerAutocompletion(editor, true, 'o');
        return runs(function() {
          var suggestionListView;
          suggestionListView = atom.views.getView(autocompleteManager.suggestionList);
          return expect(suggestionListView.querySelector('.word')).toHaveText('displayOHAI');
        });
      });
      return it('correctly displays the suggestion description and More link', function() {
        testProvider = {
          selector: '.source.js, .source.coffee',
          getSuggestions: function(options) {
            return [
              {
                text: 'ohai',
                replacementPrefix: 'o',
                rightLabelHTML: '<span style="color: red">ohai</span>',
                description: 'There be documentation',
                descriptionMoreURL: 'http://google.com'
              }
            ];
          }
        };
        registration = atom.packages.serviceHub.provide('autocomplete.provider', '2.0.0', testProvider);
        triggerAutocompletion(editor, true, 'o');
        return runs(function() {
          var content, moreLink, suggestionListView;
          suggestionListView = atom.views.getView(autocompleteManager.suggestionList);
          content = suggestionListView.querySelector('.suggestion-description-content');
          moreLink = suggestionListView.querySelector('.suggestion-description-more-link');
          expect(content).toHaveText('There be documentation');
          expect(moreLink).toHaveText('More..');
          expect(moreLink.style.display).toBe('inline');
          return expect(moreLink.getAttribute('href')).toBe('http://google.com');
        });
      });
    });
  });

}).call(this);
