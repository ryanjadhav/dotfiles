(function() {
  var ProviderManager, _;

  ProviderManager = require('../lib/provider-manager');

  _ = require('underscore-plus');

  describe('Provider Manager', function() {
    var providerManager, registration, testProvider, _ref;
    _ref = [], providerManager = _ref[0], testProvider = _ref[1], registration = _ref[2];
    beforeEach(function() {
      atom.config.set('autocomplete-plus.enableBuiltinProvider', true);
      providerManager = new ProviderManager();
      return testProvider = {
        getSuggestions: function(options) {
          return [
            {
              text: 'ohai',
              replacementPrefix: 'ohai'
            }
          ];
        },
        selector: '.source.js',
        dispose: function() {}
      };
    });
    afterEach(function() {
      if (registration != null) {
        if (typeof registration.dispose === "function") {
          registration.dispose();
        }
      }
      registration = null;
      if (testProvider != null) {
        if (typeof testProvider.dispose === "function") {
          testProvider.dispose();
        }
      }
      testProvider = null;
      if (providerManager != null) {
        providerManager.dispose();
      }
      return providerManager = null;
    });
    describe('when no providers have been registered, and enableBuiltinProvider is true', function() {
      beforeEach(function() {
        return atom.config.set('autocomplete-plus.enableBuiltinProvider', true);
      });
      it('is constructed correctly', function() {
        expect(providerManager.providers).toBeDefined();
        expect(providerManager.subscriptions).toBeDefined();
        return expect(providerManager.defaultProvider).toBeDefined();
      });
      it('disposes correctly', function() {
        providerManager.dispose();
        expect(providerManager.providers).toBeNull();
        expect(providerManager.subscriptions).toBeNull();
        return expect(providerManager.defaultProvider).toBeNull();
      });
      it('registers the default provider for all scopes', function() {
        expect(_.size(providerManager.providersForScopeDescriptor('*'))).toBe(1);
        return expect(providerManager.providersForScopeDescriptor('*')[0]).toBe(providerManager.defaultProvider);
      });
      it('adds providers', function() {
        var apiVersion, _ref1, _ref2;
        expect(providerManager.isProviderRegistered(testProvider)).toEqual(false);
        expect(_.contains((_ref1 = providerManager.subscriptions) != null ? _ref1.disposables : void 0, testProvider)).toEqual(false);
        providerManager.addProvider(testProvider, '2.0.0');
        expect(providerManager.isProviderRegistered(testProvider)).toEqual(true);
        apiVersion = providerManager.apiVersionForProvider(testProvider);
        expect(apiVersion).toEqual('2.0.0');
        return expect(_.contains((_ref2 = providerManager.subscriptions) != null ? _ref2.disposables : void 0, testProvider)).toEqual(true);
      });
      it('removes providers', function() {
        var _ref1, _ref2, _ref3;
        expect(providerManager.metadataForProvider(testProvider)).toBeFalsy();
        expect(_.contains((_ref1 = providerManager.subscriptions) != null ? _ref1.disposables : void 0, testProvider)).toEqual(false);
        providerManager.addProvider(testProvider);
        expect(providerManager.metadataForProvider(testProvider)).toBeTruthy();
        expect(_.contains((_ref2 = providerManager.subscriptions) != null ? _ref2.disposables : void 0, testProvider)).toEqual(true);
        providerManager.removeProvider(testProvider);
        expect(providerManager.metadataForProvider(testProvider)).toBeFalsy();
        return expect(_.contains((_ref3 = providerManager.subscriptions) != null ? _ref3.disposables : void 0, testProvider)).toEqual(false);
      });
      it('can identify a provider with a missing getSuggestions', function() {
        var bogusProvider;
        bogusProvider = {
          badgetSuggestions: function(options) {},
          selector: '.source.js',
          dispose: function() {}
        };
        expect(providerManager.isValidProvider({}, '2.0.0')).toEqual(false);
        expect(providerManager.isValidProvider(bogusProvider, '2.0.0')).toEqual(false);
        return expect(providerManager.isValidProvider(testProvider, '2.0.0')).toEqual(true);
      });
      it('can identify a provider with an invalid getSuggestions', function() {
        var bogusProvider;
        bogusProvider = {
          getSuggestions: 'yo, this is a bad handler',
          selector: '.source.js',
          dispose: function() {}
        };
        expect(providerManager.isValidProvider({}, '2.0.0')).toEqual(false);
        expect(providerManager.isValidProvider(bogusProvider, '2.0.0')).toEqual(false);
        return expect(providerManager.isValidProvider(testProvider, '2.0.0')).toEqual(true);
      });
      it('can identify a provider with a missing selector', function() {
        var bogusProvider;
        bogusProvider = {
          getSuggestions: function(options) {},
          aSelector: '.source.js',
          dispose: function() {}
        };
        expect(providerManager.isValidProvider(bogusProvider, '2.0.0')).toEqual(false);
        return expect(providerManager.isValidProvider(testProvider, '2.0.0')).toEqual(true);
      });
      it('can identify a provider with an invalid selector', function() {
        var bogusProvider;
        bogusProvider = {
          getSuggestions: function(options) {},
          selector: '',
          dispose: function() {}
        };
        expect(providerManager.isValidProvider(bogusProvider, '2.0.0')).toEqual(false);
        expect(providerManager.isValidProvider(testProvider, '2.0.0')).toEqual(true);
        bogusProvider = {
          getSuggestions: function(options) {},
          selector: false,
          dispose: function() {}
        };
        return expect(providerManager.isValidProvider(bogusProvider, '2.0.0')).toEqual(false);
      });
      it('correctly identifies a 1.0 provider', function() {
        var bogusProvider, legitProvider;
        bogusProvider = {
          selector: '.source.js',
          requestHandler: 'yo, this is a bad handler',
          dispose: function() {}
        };
        expect(providerManager.isValidProvider({}, '1.0.0')).toEqual(false);
        expect(providerManager.isValidProvider(bogusProvider, '1.0.0')).toEqual(false);
        legitProvider = {
          selector: '.source.js',
          requestHandler: function() {},
          dispose: function() {}
        };
        return expect(providerManager.isValidProvider(legitProvider, '1.0.0')).toEqual(true);
      });
      it('registers a valid provider', function() {
        expect(_.size(providerManager.providersForScopeDescriptor('.source.js'))).toEqual(1);
        expect(_.contains(providerManager.providersForScopeDescriptor('.source.js'), testProvider)).toEqual(false);
        expect(providerManager.metadataForProvider(testProvider)).toBeFalsy();
        registration = providerManager.registerProvider(testProvider);
        expect(_.size(providerManager.providersForScopeDescriptor('.source.js'))).toEqual(2);
        expect(_.contains(providerManager.providersForScopeDescriptor('.source.js'), testProvider)).toEqual(true);
        return expect(providerManager.metadataForProvider(testProvider)).toBeTruthy();
      });
      it('removes a registration', function() {
        expect(_.size(providerManager.providersForScopeDescriptor('.source.js'))).toEqual(1);
        expect(_.contains(providerManager.providersForScopeDescriptor('.source.js'), testProvider)).toEqual(false);
        expect(providerManager.metadataForProvider(testProvider)).toBeFalsy();
        registration = providerManager.registerProvider(testProvider);
        expect(_.size(providerManager.providersForScopeDescriptor('.source.js'))).toEqual(2);
        expect(_.contains(providerManager.providersForScopeDescriptor('.source.js'), testProvider)).toEqual(true);
        expect(providerManager.metadataForProvider(testProvider)).toBeTruthy();
        registration.dispose();
        expect(_.size(providerManager.providersForScopeDescriptor('.source.js'))).toEqual(1);
        expect(_.contains(providerManager.providersForScopeDescriptor('.source.js'), testProvider)).toEqual(false);
        return expect(providerManager.metadataForProvider(testProvider)).toBeFalsy();
      });
      it('does not create duplicate registrations for the same scope', function() {
        expect(_.size(providerManager.providersForScopeDescriptor('.source.js'))).toEqual(1);
        expect(_.contains(providerManager.providersForScopeDescriptor('.source.js'), testProvider)).toEqual(false);
        expect(providerManager.metadataForProvider(testProvider)).toBeFalsy();
        registration = providerManager.registerProvider(testProvider);
        expect(_.size(providerManager.providersForScopeDescriptor('.source.js'))).toEqual(2);
        expect(_.contains(providerManager.providersForScopeDescriptor('.source.js'), testProvider)).toEqual(true);
        expect(providerManager.metadataForProvider(testProvider)).toBeTruthy();
        registration = providerManager.registerProvider(testProvider);
        expect(_.size(providerManager.providersForScopeDescriptor('.source.js'))).toEqual(2);
        expect(_.contains(providerManager.providersForScopeDescriptor('.source.js'), testProvider)).toEqual(true);
        expect(providerManager.metadataForProvider(testProvider)).toBeTruthy();
        registration = providerManager.registerProvider(testProvider);
        expect(_.size(providerManager.providersForScopeDescriptor('.source.js'))).toEqual(2);
        expect(_.contains(providerManager.providersForScopeDescriptor('.source.js'), testProvider)).toEqual(true);
        return expect(providerManager.metadataForProvider(testProvider)).toBeTruthy();
      });
      it('does not register an invalid provider', function() {
        var bogusProvider;
        bogusProvider = {
          getSuggestions: 'yo, this is a bad handler',
          selector: '.source.js',
          dispose: function() {}
        };
        expect(_.size(providerManager.providersForScopeDescriptor('.source.js'))).toEqual(1);
        expect(_.contains(providerManager.providersForScopeDescriptor('.source.js'), bogusProvider)).toEqual(false);
        expect(providerManager.metadataForProvider(bogusProvider)).toBeFalsy();
        registration = providerManager.registerProvider(bogusProvider);
        expect(_.size(providerManager.providersForScopeDescriptor('.source.js'))).toEqual(1);
        expect(_.contains(providerManager.providersForScopeDescriptor('.source.js'), bogusProvider)).toEqual(false);
        return expect(providerManager.metadataForProvider(bogusProvider)).toBeFalsy();
      });
      return it('registers a provider with a blacklist', function() {
        testProvider = {
          getSuggestions: function(options) {
            return [
              {
                text: 'ohai',
                replacementPrefix: 'ohai'
              }
            ];
          },
          selector: '.source.js',
          disableForSelector: '.source.js .comment',
          dispose: function() {}
        };
        expect(providerManager.isValidProvider(testProvider, '2.0.0')).toEqual(true);
        expect(_.size(providerManager.providersForScopeDescriptor('.source.js'))).toEqual(1);
        expect(_.contains(providerManager.providersForScopeDescriptor('.source.js'), testProvider)).toEqual(false);
        expect(providerManager.metadataForProvider(testProvider)).toBeFalsy();
        registration = providerManager.registerProvider(testProvider);
        expect(_.size(providerManager.providersForScopeDescriptor('.source.js'))).toEqual(2);
        expect(_.contains(providerManager.providersForScopeDescriptor('.source.js'), testProvider)).toEqual(true);
        return expect(providerManager.metadataForProvider(testProvider)).toBeTruthy();
      });
    });
    describe('when no providers have been registered, and enableBuiltinProvider is false', function() {
      beforeEach(function() {
        return atom.config.set('autocomplete-plus.enableBuiltinProvider', false);
      });
      return it('does not register the default provider for all scopes', function() {
        expect(_.size(providerManager.providersForScopeDescriptor('*'))).toBe(0);
        expect(providerManager.defaultProvider).toEqual(null);
        return expect(providerManager.defaultProviderRegistration).toEqual(null);
      });
    });
    describe('when providers have been registered', function() {
      var testProvider1, testProvider2, testProvider3, testProvider4, _ref1;
      _ref1 = [], testProvider1 = _ref1[0], testProvider2 = _ref1[1], testProvider3 = _ref1[2], testProvider4 = _ref1[3];
      beforeEach(function() {
        atom.config.set('autocomplete-plus.enableBuiltinProvider', true);
        providerManager = new ProviderManager();
        testProvider1 = {
          selector: '.source.js',
          getSuggestions: function(options) {
            return [
              {
                text: 'ohai2',
                replacementPrefix: 'ohai2'
              }
            ];
          },
          dispose: function() {}
        };
        testProvider2 = {
          selector: '.source.js .variable.js',
          disableForSelector: '.source.js .variable.js .comment2',
          providerblacklist: {
            'autocomplete-plus-fuzzyprovider': '.source.js .variable.js .comment3'
          },
          getSuggestions: function(options) {
            return [
              {
                text: 'ohai2',
                replacementPrefix: 'ohai2'
              }
            ];
          },
          dispose: function() {}
        };
        testProvider3 = {
          selector: '*',
          getSuggestions: function(options) {
            return [
              {
                text: 'ohai3',
                replacementPrefix: 'ohai3'
              }
            ];
          },
          dispose: function() {}
        };
        testProvider4 = {
          selector: '.source.js .comment',
          getSuggestions: function(options) {
            return [
              {
                text: 'ohai4',
                replacementPrefix: 'ohai4'
              }
            ];
          },
          dispose: function() {}
        };
        providerManager.registerProvider(testProvider1);
        providerManager.registerProvider(testProvider2);
        providerManager.registerProvider(testProvider3);
        return providerManager.registerProvider(testProvider4);
      });
      it('returns providers in the correct order for the given scope chain', function() {
        var defaultProvider, providers;
        defaultProvider = providerManager.defaultProvider;
        providers = providerManager.providersForScopeDescriptor('.source.other');
        expect(providers).toHaveLength(2);
        expect(providers[0]).toEqual(testProvider3);
        expect(providers[1]).toEqual(defaultProvider);
        providers = providerManager.providersForScopeDescriptor('.source.js');
        expect(providers).toHaveLength(3);
        expect(providers[0]).toEqual(testProvider1);
        expect(providers[1]).toEqual(testProvider3);
        expect(providers[2]).toEqual(defaultProvider);
        providers = providerManager.providersForScopeDescriptor('.source.js .comment');
        expect(providers).toHaveLength(4);
        expect(providers[0]).toEqual(testProvider4);
        expect(providers[1]).toEqual(testProvider1);
        expect(providers[2]).toEqual(testProvider3);
        expect(providers[3]).toEqual(defaultProvider);
        providers = providerManager.providersForScopeDescriptor('.source.js .variable.js');
        expect(providers).toHaveLength(4);
        expect(providers[0]).toEqual(testProvider2);
        expect(providers[1]).toEqual(testProvider1);
        expect(providers[2]).toEqual(testProvider3);
        expect(providers[3]).toEqual(defaultProvider);
        providers = providerManager.providersForScopeDescriptor('.source.js .other.js');
        expect(providers).toHaveLength(3);
        expect(providers[0]).toEqual(testProvider1);
        expect(providers[1]).toEqual(testProvider3);
        return expect(providers[2]).toEqual(defaultProvider);
      });
      it('does not return providers if the scopeChain exactly matches a global blacklist item', function() {
        expect(providerManager.providersForScopeDescriptor('.source.js .comment')).toHaveLength(4);
        atom.config.set('autocomplete-plus.scopeBlacklist', ['.source.js .comment']);
        return expect(providerManager.providersForScopeDescriptor('.source.js .comment')).toHaveLength(0);
      });
      it('does not return providers if the scopeChain matches a global blacklist item with a wildcard', function() {
        expect(providerManager.providersForScopeDescriptor('.source.js .comment')).toHaveLength(4);
        atom.config.set('autocomplete-plus.scopeBlacklist', ['.source.js *']);
        return expect(providerManager.providersForScopeDescriptor('.source.js .comment')).toHaveLength(0);
      });
      it('does not return providers if the scopeChain matches a global blacklist item with a wildcard one level of depth below the current scope', function() {
        expect(providerManager.providersForScopeDescriptor('.source.js .comment')).toHaveLength(4);
        atom.config.set('autocomplete-plus.scopeBlacklist', ['.source.js *']);
        return expect(providerManager.providersForScopeDescriptor('.source.js .comment .other')).toHaveLength(0);
      });
      it('does return providers if the scopeChain does not match a global blacklist item with a wildcard', function() {
        expect(providerManager.providersForScopeDescriptor('.source.js .comment')).toHaveLength(4);
        atom.config.set('autocomplete-plus.scopeBlacklist', ['.source.coffee *']);
        return expect(providerManager.providersForScopeDescriptor('.source.js .comment')).toHaveLength(4);
      });
      it('filters a provider if the scopeChain matches a provider blacklist item', function() {
        var defaultProvider, providers;
        defaultProvider = providerManager.defaultProvider;
        providers = providerManager.providersForScopeDescriptor('.source.js .variable.js .other.js');
        expect(providers).toHaveLength(4);
        expect(providers[0]).toEqual(testProvider2);
        expect(providers[1]).toEqual(testProvider1);
        expect(providers[2]).toEqual(testProvider3);
        expect(providers[3]).toEqual(defaultProvider);
        providers = providerManager.providersForScopeDescriptor('.source.js .variable.js .comment2.js');
        expect(providers).toHaveLength(3);
        expect(providers[0]).toEqual(testProvider1);
        expect(providers[1]).toEqual(testProvider3);
        return expect(providers[2]).toEqual(defaultProvider);
      });
      return it('filters a provider if the scopeChain matches a provider providerblacklist item', function() {
        var providers;
        providers = providerManager.providersForScopeDescriptor('.source.js .variable.js .other.js');
        expect(providers).toHaveLength(4);
        expect(providers[0]).toEqual(testProvider2);
        expect(providers[1]).toEqual(testProvider1);
        expect(providers[2]).toEqual(testProvider3);
        expect(providers[3]).toEqual(providerManager.defaultProvider);
        providers = providerManager.providersForScopeDescriptor('.source.js .variable.js .comment3.js');
        expect(providers).toHaveLength(3);
        expect(providers[0]).toEqual(testProvider2);
        expect(providers[1]).toEqual(testProvider1);
        return expect(providers[2]).toEqual(testProvider3);
      });
    });
    return describe("when inclusion priorities are used", function() {
      var accessoryProvider1, accessoryProvider2, defaultProvider, mainProvider, verySpecificProvider, _ref1;
      _ref1 = [], accessoryProvider1 = _ref1[0], accessoryProvider2 = _ref1[1], verySpecificProvider = _ref1[2], mainProvider = _ref1[3], defaultProvider = _ref1[4];
      beforeEach(function() {
        atom.config.set('autocomplete-plus.enableBuiltinProvider', true);
        providerManager = new ProviderManager();
        defaultProvider = providerManager.defaultProvider;
        accessoryProvider1 = {
          selector: '*',
          inclusionPriority: 2,
          getSuggestions: function(options) {},
          dispose: function() {}
        };
        accessoryProvider2 = {
          selector: '.source.js',
          inclusionPriority: 2,
          getSuggestions: function(options) {},
          dispose: function() {}
        };
        verySpecificProvider = {
          selector: '.source.js .comment',
          inclusionPriority: 2,
          excludeLowerPriority: true,
          getSuggestions: function(options) {},
          dispose: function() {}
        };
        mainProvider = {
          selector: '.source.js',
          inclusionPriority: 1,
          excludeLowerPriority: true,
          getSuggestions: function(options) {},
          dispose: function() {}
        };
        providerManager.registerProvider(accessoryProvider1);
        providerManager.registerProvider(accessoryProvider2);
        providerManager.registerProvider(verySpecificProvider);
        return providerManager.registerProvider(mainProvider);
      });
      it('returns the default provider and higher when nothing with a higher proirity is excluding the lower', function() {
        var providers;
        providers = providerManager.providersForScopeDescriptor('.source.coffee');
        expect(providers).toHaveLength(2);
        expect(providers[0]).toEqual(accessoryProvider1);
        return expect(providers[1]).toEqual(defaultProvider);
      });
      it('exclude the lower priority provider, the default, when one with a higher proirity excludes the lower', function() {
        var providers;
        providers = providerManager.providersForScopeDescriptor('.source.js');
        expect(providers).toHaveLength(3);
        expect(providers[0]).toEqual(accessoryProvider2);
        expect(providers[1]).toEqual(mainProvider);
        return expect(providers[2]).toEqual(accessoryProvider1);
      });
      return it('excludes the all lower priority providers when multiple providers of lower priority', function() {
        var providers;
        providers = providerManager.providersForScopeDescriptor('.source.js .comment');
        expect(providers).toHaveLength(3);
        expect(providers[0]).toEqual(verySpecificProvider);
        expect(providers[1]).toEqual(accessoryProvider2);
        return expect(providers[2]).toEqual(accessoryProvider1);
      });
    });
  });

}).call(this);
