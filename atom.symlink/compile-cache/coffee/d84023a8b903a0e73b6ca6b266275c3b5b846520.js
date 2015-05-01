(function() {
  var grim, triggerAutocompletion, waitForAutocomplete, _, _ref;

  _ref = require('./spec-helper'), waitForAutocomplete = _ref.waitForAutocomplete, triggerAutocompletion = _ref.triggerAutocompletion;

  grim = require('grim');

  _ = require('underscore-plus');

  describe('Provider API Legacy', function() {
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
    describe('Provider with API v1.0 registered as 2.0', function() {
      it("raises deprecations for provider attributes on registration", function() {
        var SampleProvider, deprecation, deprecations, numberDeprecations;
        numberDeprecations = grim.getDeprecationsLength();
        SampleProvider = (function() {
          function SampleProvider() {}

          SampleProvider.prototype.id = 'sample-provider';

          SampleProvider.prototype.selector = '.source.js,.source.coffee';

          SampleProvider.prototype.blacklist = '.comment';

          SampleProvider.prototype.requestHandler = function(options) {
            return [
              {
                word: 'ohai',
                prefix: 'ohai'
              }
            ];
          };

          return SampleProvider;

        })();
        registration = atom.packages.serviceHub.provide('autocomplete.provider', '2.0.0', new SampleProvider);
        expect(grim.getDeprecationsLength() - numberDeprecations).toBe(3);
        deprecations = grim.getDeprecations();
        deprecation = deprecations[deprecations.length - 3];
        expect(deprecation.getMessage()).toContain('`id`');
        expect(deprecation.getMessage()).toContain('SampleProvider');
        deprecation = deprecations[deprecations.length - 2];
        expect(deprecation.getMessage()).toContain('`requestHandler`');
        deprecation = deprecations[deprecations.length - 1];
        return expect(deprecation.getMessage()).toContain('`blacklist`');
      });
      it("raises deprecations when old API parameters are used in the 2.0 API", function() {
        var SampleProvider, numberDeprecations;
        SampleProvider = (function() {
          function SampleProvider() {}

          SampleProvider.prototype.selector = '.source.js,.source.coffee';

          SampleProvider.prototype.getSuggestions = function(options) {
            return [
              {
                word: 'ohai',
                prefix: 'ohai',
                label: '<span style="color: red">ohai</span>',
                renderLabelAsHtml: true,
                className: 'ohai'
              }
            ];
          };

          return SampleProvider;

        })();
        registration = atom.packages.serviceHub.provide('autocomplete.provider', '2.0.0', new SampleProvider);
        numberDeprecations = grim.getDeprecationsLength();
        triggerAutocompletion(editor, true, 'o');
        return runs(function() {
          var deprecation, deprecations;
          expect(grim.getDeprecationsLength() - numberDeprecations).toBe(3);
          deprecations = grim.getDeprecations();
          deprecation = deprecations[deprecations.length - 3];
          expect(deprecation.getMessage()).toContain('`word`');
          expect(deprecation.getMessage()).toContain('SampleProvider');
          deprecation = deprecations[deprecations.length - 2];
          expect(deprecation.getMessage()).toContain('`prefix`');
          deprecation = deprecations[deprecations.length - 1];
          return expect(deprecation.getMessage()).toContain('`label`');
        });
      });
      return it("raises deprecations when hooks are passed via each suggestion", function() {
        var SampleProvider, numberDeprecations;
        SampleProvider = (function() {
          function SampleProvider() {}

          SampleProvider.prototype.selector = '.source.js,.source.coffee';

          SampleProvider.prototype.getSuggestions = function(options) {
            return [
              {
                text: 'ohai',
                replacementPrefix: 'ohai',
                onWillConfirm: function() {},
                onDidConfirm: function() {}
              }
            ];
          };

          return SampleProvider;

        })();
        registration = atom.packages.serviceHub.provide('autocomplete.provider', '2.0.0', new SampleProvider);
        numberDeprecations = grim.getDeprecationsLength();
        triggerAutocompletion(editor, true, 'o');
        return runs(function() {
          var deprecation, deprecations;
          expect(grim.getDeprecationsLength() - numberDeprecations).toBe(2);
          deprecations = grim.getDeprecations();
          deprecation = deprecations[deprecations.length - 2];
          expect(deprecation.getMessage()).toContain('`onWillConfirm`');
          expect(deprecation.getMessage()).toContain('SampleProvider');
          deprecation = deprecations[deprecations.length - 1];
          return expect(deprecation.getMessage()).toContain('`onDidConfirm`');
        });
      });
    });
    describe('Provider API v1.1.0', function() {
      return it('registers the provider specified by {providers: [provider]}', function() {
        expect(_.size(autocompleteManager.providerManager.providersForScopeDescriptor('.source.js'))).toEqual(1);
        testProvider = {
          selector: '.source.js,.source.coffee',
          requestHandler: function(options) {
            return [
              {
                word: 'ohai',
                prefix: 'ohai'
              }
            ];
          }
        };
        registration = atom.packages.serviceHub.provide('autocomplete.provider', '1.1.0', {
          providers: [testProvider]
        });
        return expect(_.size(autocompleteManager.providerManager.providersForScopeDescriptor('.source.js'))).toEqual(2);
      });
    });
    return describe('Provider API v1.0.0', function() {
      var registration1, registration2, registration3, _ref2;
      _ref2 = [], registration1 = _ref2[0], registration2 = _ref2[1], registration3 = _ref2[2];
      afterEach(function() {
        if (registration1 != null) {
          registration1.dispose();
        }
        if (registration2 != null) {
          registration2.dispose();
        }
        return registration3 != null ? registration3.dispose() : void 0;
      });
      it('passes the correct parameters to requestHandler', function() {
        testProvider = {
          selector: '.source.js,.source.coffee',
          requestHandler: function(options) {
            return [
              {
                word: 'ohai',
                prefix: 'ohai'
              }
            ];
          }
        };
        registration = atom.packages.serviceHub.provide('autocomplete.provider', '1.0.0', {
          provider: testProvider
        });
        spyOn(testProvider, 'requestHandler');
        triggerAutocompletion(editor, true, 'o');
        return runs(function() {
          var args;
          args = testProvider.requestHandler.mostRecentCall.args[0];
          expect(args.editor).toBeDefined();
          expect(args.buffer).toBeDefined();
          expect(args.cursor).toBeDefined();
          expect(args.position).toBeDefined();
          expect(args.scope).toBeDefined();
          expect(args.scopeChain).toBeDefined();
          return expect(args.prefix).toBeDefined();
        });
      });
      it('should allow registration of a provider', function() {
        expect(autocompleteManager.providerManager.store).toBeDefined();
        expect(_.size(autocompleteManager.providerManager.providersForScopeDescriptor('.source.js'))).toEqual(1);
        expect(_.size(autocompleteManager.providerManager.providersForScopeDescriptor('.source.coffee'))).toEqual(1);
        expect(autocompleteManager.providerManager.providersForScopeDescriptor('.source.js')[0]).toEqual(autocompleteManager.providerManager.defaultProvider);
        expect(autocompleteManager.providerManager.providersForScopeDescriptor('.source.coffee')[0]).toEqual(autocompleteManager.providerManager.defaultProvider);
        testProvider = {
          requestHandler: function(options) {
            return [
              {
                word: 'ohai',
                prefix: 'ohai',
                label: '<span style="color: red">ohai</span>',
                renderLabelAsHtml: true,
                className: 'ohai'
              }
            ];
          },
          selector: '.source.js,.source.coffee'
        };
        registration = atom.packages.serviceHub.provide('autocomplete.provider', '1.0.0', {
          provider: testProvider
        });
        expect(autocompleteManager.providerManager.store).toBeDefined();
        expect(_.size(autocompleteManager.providerManager.providersForScopeDescriptor('.source.js'))).toEqual(2);
        expect(_.size(autocompleteManager.providerManager.providersForScopeDescriptor('.source.coffee'))).toEqual(2);
        expect(autocompleteManager.providerManager.providersForScopeDescriptor('.source.js')[0]).toEqual(testProvider);
        expect(autocompleteManager.providerManager.providersForScopeDescriptor('.source.js')[1]).toEqual(autocompleteManager.providerManager.defaultProvider);
        expect(autocompleteManager.providerManager.providersForScopeDescriptor('.source.coffee')[0]).toEqual(testProvider);
        expect(autocompleteManager.providerManager.providersForScopeDescriptor('.source.coffee')[1]).toEqual(autocompleteManager.providerManager.defaultProvider);
        expect(autocompleteManager.providerManager.providersForScopeDescriptor('.source.go')[0]).toEqual(autocompleteManager.providerManager.defaultProvider);
        triggerAutocompletion(editor, true, 'o');
        return runs(function() {
          var suggestionListView;
          suggestionListView = atom.views.getView(autocompleteManager.suggestionList);
          expect(suggestionListView.querySelector('li .right-label')).toHaveHtml('<span style="color: red">ohai</span>');
          return expect(suggestionListView.querySelector('li')).toHaveClass('ohai');
        });
      });
      it('should dispose a provider registration correctly', function() {
        expect(autocompleteManager.providerManager.store).toBeDefined();
        expect(_.size(autocompleteManager.providerManager.providersForScopeDescriptor('.source.js'))).toEqual(1);
        expect(_.size(autocompleteManager.providerManager.providersForScopeDescriptor('.source.coffee'))).toEqual(1);
        expect(autocompleteManager.providerManager.providersForScopeDescriptor('.source.js')[0]).toEqual(autocompleteManager.providerManager.defaultProvider);
        expect(autocompleteManager.providerManager.providersForScopeDescriptor('.source.coffee')[0]).toEqual(autocompleteManager.providerManager.defaultProvider);
        testProvider = {
          requestHandler: function(options) {
            return [
              {
                word: 'ohai',
                prefix: 'ohai'
              }
            ];
          },
          selector: '.source.js,.source.coffee'
        };
        registration = atom.packages.serviceHub.provide('autocomplete.provider', '1.0.0', {
          provider: testProvider
        });
        expect(autocompleteManager.providerManager.store).toBeDefined();
        expect(_.size(autocompleteManager.providerManager.providersForScopeDescriptor('.source.js'))).toEqual(2);
        expect(_.size(autocompleteManager.providerManager.providersForScopeDescriptor('.source.coffee'))).toEqual(2);
        expect(autocompleteManager.providerManager.providersForScopeDescriptor('.source.js')[0]).toEqual(testProvider);
        expect(autocompleteManager.providerManager.providersForScopeDescriptor('.source.js')[1]).toEqual(autocompleteManager.providerManager.defaultProvider);
        expect(autocompleteManager.providerManager.providersForScopeDescriptor('.source.coffee')[0]).toEqual(testProvider);
        expect(autocompleteManager.providerManager.providersForScopeDescriptor('.source.coffee')[1]).toEqual(autocompleteManager.providerManager.defaultProvider);
        expect(autocompleteManager.providerManager.providersForScopeDescriptor('.source.go')[0]).toEqual(autocompleteManager.providerManager.defaultProvider);
        registration.dispose();
        expect(autocompleteManager.providerManager.store).toBeDefined();
        expect(_.size(autocompleteManager.providerManager.providersForScopeDescriptor('.source.js'))).toEqual(1);
        expect(_.size(autocompleteManager.providerManager.providersForScopeDescriptor('.source.coffee'))).toEqual(1);
        expect(autocompleteManager.providerManager.providersForScopeDescriptor('.source.js')[0]).toEqual(autocompleteManager.providerManager.defaultProvider);
        expect(autocompleteManager.providerManager.providersForScopeDescriptor('.source.coffee')[0]).toEqual(autocompleteManager.providerManager.defaultProvider);
        registration.dispose();
        expect(autocompleteManager.providerManager.store).toBeDefined();
        expect(_.size(autocompleteManager.providerManager.providersForScopeDescriptor('.source.js'))).toEqual(1);
        expect(_.size(autocompleteManager.providerManager.providersForScopeDescriptor('.source.coffee'))).toEqual(1);
        expect(autocompleteManager.providerManager.providersForScopeDescriptor('.source.js')[0]).toEqual(autocompleteManager.providerManager.defaultProvider);
        return expect(autocompleteManager.providerManager.providersForScopeDescriptor('.source.coffee')[0]).toEqual(autocompleteManager.providerManager.defaultProvider);
      });
      return it('should remove a providers registration if the provider is disposed', function() {
        expect(autocompleteManager.providerManager.store).toBeDefined();
        expect(_.size(autocompleteManager.providerManager.providersForScopeDescriptor('.source.js'))).toEqual(1);
        expect(_.size(autocompleteManager.providerManager.providersForScopeDescriptor('.source.coffee'))).toEqual(1);
        expect(autocompleteManager.providerManager.providersForScopeDescriptor('.source.js')[0]).toEqual(autocompleteManager.providerManager.defaultProvider);
        expect(autocompleteManager.providerManager.providersForScopeDescriptor('.source.coffee')[0]).toEqual(autocompleteManager.providerManager.defaultProvider);
        testProvider = {
          requestHandler: function(options) {
            return [
              {
                word: 'ohai',
                prefix: 'ohai'
              }
            ];
          },
          selector: '.source.js,.source.coffee',
          dispose: function() {}
        };
        registration = atom.packages.serviceHub.provide('autocomplete.provider', '1.0.0', {
          provider: testProvider
        });
        expect(autocompleteManager.providerManager.store).toBeDefined();
        expect(_.size(autocompleteManager.providerManager.providersForScopeDescriptor('.source.js'))).toEqual(2);
        expect(_.size(autocompleteManager.providerManager.providersForScopeDescriptor('.source.coffee'))).toEqual(2);
        expect(autocompleteManager.providerManager.providersForScopeDescriptor('.source.js')[0]).toEqual(testProvider);
        expect(autocompleteManager.providerManager.providersForScopeDescriptor('.source.js')[1]).toEqual(autocompleteManager.providerManager.defaultProvider);
        expect(autocompleteManager.providerManager.providersForScopeDescriptor('.source.coffee')[0]).toEqual(testProvider);
        expect(autocompleteManager.providerManager.providersForScopeDescriptor('.source.coffee')[1]).toEqual(autocompleteManager.providerManager.defaultProvider);
        expect(autocompleteManager.providerManager.providersForScopeDescriptor('.source.go')[0]).toEqual(autocompleteManager.providerManager.defaultProvider);
        testProvider.dispose();
        expect(autocompleteManager.providerManager.store).toBeDefined();
        expect(_.size(autocompleteManager.providerManager.providersForScopeDescriptor('.source.js'))).toEqual(1);
        expect(_.size(autocompleteManager.providerManager.providersForScopeDescriptor('.source.coffee'))).toEqual(1);
        expect(autocompleteManager.providerManager.providersForScopeDescriptor('.source.js')[0]).toEqual(autocompleteManager.providerManager.defaultProvider);
        return expect(autocompleteManager.providerManager.providersForScopeDescriptor('.source.coffee')[0]).toEqual(autocompleteManager.providerManager.defaultProvider);
      });
    });
  });

}).call(this);
