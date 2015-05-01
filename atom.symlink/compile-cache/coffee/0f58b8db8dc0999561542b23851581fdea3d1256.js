(function() {
  var RefCountedTokenList;

  module.exports = RefCountedTokenList = (function() {
    function RefCountedTokenList() {
      this.clear();
    }

    RefCountedTokenList.prototype.clear = function() {
      this.references = {};
      return this.tokens = [];
    };

    RefCountedTokenList.prototype.getLength = function() {
      return this.tokens.length;
    };

    RefCountedTokenList.prototype.getTokens = function() {
      return this.tokens;
    };

    RefCountedTokenList.prototype.getTokenWrappers = function() {
      var key, tokenWrapper, _ref, _results;
      _ref = this.references;
      _results = [];
      for (key in _ref) {
        tokenWrapper = _ref[key];
        _results.push(tokenWrapper);
      }
      return _results;
    };

    RefCountedTokenList.prototype.getToken = function(tokenKey) {
      var _ref;
      return (_ref = this.getTokenWrapper(tokenKey)) != null ? _ref.token : void 0;
    };

    RefCountedTokenList.prototype.getTokenWrapper = function(tokenKey) {
      tokenKey = this.getTokenKey(tokenKey);
      return this.references[tokenKey];
    };

    RefCountedTokenList.prototype.refCountForToken = function(tokenKey) {
      var _ref, _ref1;
      tokenKey = this.getTokenKey(tokenKey);
      return (_ref = (_ref1 = this.references[tokenKey]) != null ? _ref1.count : void 0) != null ? _ref : 0;
    };

    RefCountedTokenList.prototype.addToken = function(token, tokenKey) {
      tokenKey = this.getTokenKey(token, tokenKey);
      return this.updateRefCount(tokenKey, token, 1);
    };

    RefCountedTokenList.prototype.removeToken = function(token, tokenKey) {
      tokenKey = this.getTokenKey(token, tokenKey);
      if (this.references[tokenKey] != null) {
        token = this.references[tokenKey].token;
        this.updateRefCount(tokenKey, token, -1);
        return true;
      } else {
        return false;
      }
    };


    /*
    Private Methods
     */

    RefCountedTokenList.prototype.updateRefCount = function(tokenKey, token, increment) {
      var _base, _ref;
      if (increment > 0 && (this.references[tokenKey] == null)) {
        if ((_base = this.references)[tokenKey] == null) {
          _base[tokenKey] = {
            tokenKey: tokenKey,
            token: token,
            count: 0
          };
        }
        this.addTokenToList(token);
      }
      if (this.references[tokenKey] != null) {
        this.references[tokenKey].count += increment;
      }
      if (((_ref = this.references[tokenKey]) != null ? _ref.count : void 0) <= 0) {
        delete this.references[tokenKey];
        return this.removeTokenFromList(token);
      }
    };

    RefCountedTokenList.prototype.addTokenToList = function(token) {
      return this.tokens.push(token);
    };

    RefCountedTokenList.prototype.removeTokenFromList = function(token) {
      var index;
      index = this.tokens.indexOf(token);
      if (index > -1) {
        return this.tokens.splice(index, 1);
      }
    };

    RefCountedTokenList.prototype.getTokenKey = function(token, tokenKey) {
      return (tokenKey != null ? tokenKey : token) + '$$';
    };

    return RefCountedTokenList;

  })();

}).call(this);
