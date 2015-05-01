(function() {
  var Function, Provider, apd;

  apd = require('atom-package-dependencies');

  Function = require('loophole').Function;

  module.exports = Provider = (function() {
    function Provider() {}

    Provider.prototype.manager = null;

    Provider.prototype.force = false;

    Provider.prototype.autocompletePlus = null;

    Provider.prototype.selector = '.source.js';

    Provider.prototype.disableForSelector = '.source.js .comment';

    Provider.prototype.inclusionPriority = 1;

    Provider.prototype.excludeLowerPriority = true;

    Provider.prototype.init = function(manager) {
      this.manager = manager;
      return atom.packages.activatePackage('autocomplete-plus').then((function(_this) {
        return function(pkg) {
          return _this.autocompletePlus = apd.require('autocomplete-plus');
        };
      })(this));
    };

    Provider.prototype.isValidPrefix = function(prefix) {
      var e, _ref;
      if (prefix[prefix.length - 1] === '\.') {
        return true;
      }
      if ((_ref = prefix[prefix.length - 1]) != null ? _ref.match(/;|\s/) : void 0) {
        return false;
      }
      if (prefix.length > 1) {
        prefix = '_' + prefix;
      }
      try {
        (new Function("var " + prefix))();
      } catch (_error) {
        e = _error;
        return false;
      }
      return true;
    };

    Provider.prototype.checkPrefix = function(prefix) {
      if (prefix.match(/(\s|;|\.|\"|\')$/) || prefix.replace(/\s/g, '').length === 0) {
        return '';
      }
      return prefix;
    };

    Provider.prototype.getPrefix = function(editor, bufferPosition) {
      var line, regexp, _ref;
      regexp = /(([\$\w]+[\w-]*)|([.:;'"[{( ]+))$/g;
      line = editor.getTextInRange([[bufferPosition.row, 0], bufferPosition]);
      return (_ref = line.match(regexp)) != null ? _ref[0] : void 0;
    };

    Provider.prototype.getSuggestions = function(_arg) {
      var bufferPosition, editor, prefix, scopeDescriptor, tempPrefix, that;
      editor = _arg.editor, bufferPosition = _arg.bufferPosition, scopeDescriptor = _arg.scopeDescriptor, prefix = _arg.prefix;
      tempPrefix = this.getPrefix(editor, bufferPosition) || prefix;
      if (!this.isValidPrefix(tempPrefix) && !this.force) {
        return [];
      }
      prefix = this.checkPrefix(tempPrefix);
      that = this;
      return new Promise(function(resolve) {
        return that.manager.client.update(editor.getURI(), editor.getText()).then((function(_this) {
          return function() {
            return that.manager.client.completions(editor.getURI(), {
              line: bufferPosition.row,
              ch: bufferPosition.column
            }).then(function(data) {
              var description, index, obj, suggestionsArr, url, _i, _len, _ref;
              if (!data.completions.length) {
                resolve([]);
                return;
              }
              suggestionsArr = [];
              _ref = data.completions;
              for (index = _i = 0, _len = _ref.length; _i < _len; index = ++_i) {
                obj = _ref[index];
                obj = that.manager.helper.formatTypeCompletion(obj);
                description = obj.doc ? obj.doc : null;
                url = obj.url ? obj.doc : null;
                suggestionsArr.push({
                  text: obj.name,
                  replacementPrefix: prefix,
                  className: null,
                  type: obj._typeSelf,
                  leftLabel: obj.leftLabel,
                  snippet: obj._snippet,
                  description: description,
                  descriptionMoreURL: url
                });
              }
              return resolve(suggestionsArr);
            }, function(err) {
              return console.log(err);
            });
          };
        })(this));
      });
    };

    Provider.prototype.forceCompletion = function() {
      this.force = true;
      this.autocompletePlus.autocompleteManager.shouldDisplaySuggestions = true;
      this.autocompletePlus.autocompleteManager.findSuggestions();
      return this.force = false;
    };

    Provider.prototype.addSelector = function(selector) {
      return this.selector = this.selector + ',' + selector;
    };

    Provider.prototype.removeSelector = function(selector) {
      return this.selector = this.selector.replace(',' + selector, '');
    };

    return Provider;

  })();

}).call(this);
