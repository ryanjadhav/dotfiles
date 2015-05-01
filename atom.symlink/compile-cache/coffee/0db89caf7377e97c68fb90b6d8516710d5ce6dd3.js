(function() {
  var ProviderMetadata, Selector, selectorForScopeChain, selectorsMatchScopeChain, _ref;

  Selector = require('selector-kit').Selector;

  _ref = require('./scope-helpers'), selectorForScopeChain = _ref.selectorForScopeChain, selectorsMatchScopeChain = _ref.selectorsMatchScopeChain;

  module.exports = ProviderMetadata = (function() {
    function ProviderMetadata(provider, apiVersion) {
      var providerBlacklist, _ref1;
      this.provider = provider;
      this.apiVersion = apiVersion;
      this.selectors = Selector.create(this.provider.selector);
      if (this.provider.disableForSelector != null) {
        this.disableForSelectors = Selector.create(this.provider.disableForSelector);
      }
      if (providerBlacklist = (_ref1 = this.provider.providerblacklist) != null ? _ref1['autocomplete-plus-fuzzyprovider'] : void 0) {
        this.disableDefaultProviderSelectors = Selector.create(providerBlacklist);
      }
    }

    ProviderMetadata.prototype.matchesScopeChain = function(scopeChain) {
      if (this.disableForSelectors != null) {
        if (selectorsMatchScopeChain(this.disableForSelectors, scopeChain)) {
          return false;
        }
      }
      if (selectorsMatchScopeChain(this.selectors, scopeChain)) {
        return true;
      } else {
        return false;
      }
    };

    ProviderMetadata.prototype.shouldDisableDefaultProvider = function(scopeChain) {
      if (this.disableDefaultProviderSelectors != null) {
        return selectorsMatchScopeChain(this.disableDefaultProviderSelectors, scopeChain);
      } else {
        return false;
      }
    };

    ProviderMetadata.prototype.getSpecificity = function(scopeChain) {
      var selector;
      if (selector = selectorForScopeChain(this.selectors, scopeChain)) {
        return selector.getSpecificity();
      } else {
        return 0;
      }
    };

    return ProviderMetadata;

  })();

}).call(this);
