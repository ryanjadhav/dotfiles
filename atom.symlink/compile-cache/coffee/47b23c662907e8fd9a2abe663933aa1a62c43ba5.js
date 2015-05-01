(function() {
  var Helper, Manager,
    __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  Helper = require('./atom-ternjs-helper');

  module.exports = Manager = (function() {
    Manager.prototype.disposables = [];

    Manager.prototype.grammars = ['JavaScript'];

    Manager.prototype.client = null;

    Manager.prototype.server = null;

    Manager.prototype.helper = null;

    Manager.prototype.rename = null;

    Manager.prototype.type = null;

    Manager.prototype.reference = null;

    Manager.prototype.provider = null;

    Manager.prototype.initialised = false;

    Manager.prototype.inlineFnCompletion = false;

    Manager.prototype.regExp = {
      params: /(([\w:\.\$\?\[\]\| ]+)(\([\w:\.\$\?\[\]\|, ]*\))?({[\w:\.\$\?\[\]\|, ]*})?\|?([\w:\.\$\?\[\]\| ]*))/ig
    };

    function Manager(provider) {
      this.provider = provider;
      this.checkGrammarSettings();
      this.helper = new Helper(this);
      this.registerHelperCommands();
      this.provider.init(this);
      this.startServer();
      this.disposables.push(atom.workspace.onDidOpen((function(_this) {
        return function(e) {
          return _this.startServer();
        };
      })(this)));
    }

    Manager.prototype.init = function() {
      this.initialised = true;
      this.registerEvents();
      return this.registerCommands();
    };

    Manager.prototype.destroy = function() {
      var _ref, _ref1, _ref2, _ref3, _ref4, _ref5;
      this.stopServer();
      if ((_ref = this.client) != null) {
        _ref.unregisterEvents();
      }
      this.client = null;
      this.unregisterEventsAndCommands();
      if ((_ref1 = this.provider) != null) {
        _ref1.destroy();
      }
      this.provider = null;
      if ((_ref2 = this.reference) != null) {
        _ref2.destroy();
      }
      this.reference = null;
      if ((_ref3 = this.rename) != null) {
        _ref3.destroy();
      }
      this.rename = null;
      if ((_ref4 = this.type) != null) {
        _ref4.destroy();
      }
      this.type = null;
      if ((_ref5 = this.helper) != null) {
        _ref5.destroy();
      }
      this.helper = null;
      return this.initialised = false;
    };

    Manager.prototype.unregisterEventsAndCommands = function() {
      var disposable, _i, _len, _ref;
      _ref = this.disposables;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        disposable = _ref[_i];
        disposable.dispose();
      }
      return this.disposables = [];
    };

    Manager.prototype.startServer = function() {
      var Server, _ref;
      if (!(!((_ref = this.server) != null ? _ref.process : void 0) && atom.project.getDirectories()[0])) {
        return;
      }
      Server = require('./atom-ternjs-server');
      this.server = new Server();
      return this.server.start((function(_this) {
        return function(port) {
          var Client;
          if (!_this.client) {
            Client = require('./atom-ternjs-client');
            _this.client = new Client(_this);
          }
          _this.client.port = port;
          if (_this.initialised) {
            return;
          }
          return _this.init();
        };
      })(this));
    };

    Manager.prototype.isValidEditor = function(editor) {
      var _ref;
      if (!editor || editor.mini) {
        return false;
      }
      if (!editor.getGrammar) {
        return false;
      }
      if (!editor.getGrammar()) {
        return false;
      }
      if (_ref = editor.getGrammar().name, __indexOf.call(this.grammars, _ref) < 0) {
        return false;
      }
      return true;
    };

    Manager.prototype.registerEvents = function() {
      this.disposables.push(atom.commands.add('atom-text-editor', {
        'tern:references': (function(_this) {
          return function(event) {
            var Reference;
            if (!_this.reference) {
              Reference = require('./atom-ternjs-reference');
              _this.reference = new Reference(_this);
            }
            return _this.reference.findReference();
          };
        })(this)
      }));
      this.disposables.push(atom.workspace.observeTextEditors((function(_this) {
        return function(editor) {
          if (!_this.isValidEditor(editor)) {
            return;
          }
          _this.disposables.push(editor.onDidChangeCursorPosition(function(event) {
            var Type, _ref;
            if (_this.inlineFnCompletion) {
              if (!_this.type) {
                Type = require('./atom-ternjs-type');
                _this.type = new Type(_this);
              }
              _this.type.queryType(editor, event.cursor);
            }
            if ((_ref = _this.rename) != null) {
              _ref.hide();
            }
            if (event.textChanged) {

            }
          }));
          _this.disposables.push(editor.getBuffer().onDidChangeModified(function(modified) {
            var _ref;
            if (!modified) {
              return;
            }
            return (_ref = _this.reference) != null ? _ref.hide() : void 0;
          }));
          return _this.disposables.push(editor.getBuffer().onDidSave(function(event) {
            var _ref;
            return (_ref = _this.client) != null ? _ref.update(editor.getURI(), editor.getText()) : void 0;
          }));
        };
      })(this)));
      this.disposables.push(atom.workspace.onDidChangeActivePaneItem((function(_this) {
        return function(item) {
          var _ref, _ref1, _ref2;
          if ((_ref = _this.type) != null) {
            _ref.destroyOverlay();
          }
          if ((_ref1 = _this.rename) != null) {
            _ref1.hide();
          }
          if (!_this.isValidEditor(item)) {
            return (_ref2 = _this.reference) != null ? _ref2.hide() : void 0;
          }
        };
      })(this)));
      this.disposables.push(atom.config.observe('atom-ternjs.inlineFnCompletion', (function(_this) {
        return function() {
          var _ref;
          _this.inlineFnCompletion = atom.config.get('atom-ternjs.inlineFnCompletion');
          return (_ref = _this.type) != null ? _ref.destroyOverlay() : void 0;
        };
      })(this)));
      return this.disposables.push(atom.config.observe('atom-ternjs.coffeeScript', (function(_this) {
        return function() {
          return _this.checkGrammarSettings();
        };
      })(this)));
    };

    Manager.prototype.checkGrammarSettings = function() {
      if (atom.config.get('atom-ternjs.coffeeScript')) {
        this.addGrammar('CoffeeScript');
        return this.provider.addSelector('.source.coffee');
      } else {
        this.removeGrammar('CoffeeScript');
        return this.provider.removeSelector('.source.coffee');
      }
    };

    Manager.prototype.addGrammar = function(grammar) {
      if (this.grammars.indexOf(grammar) !== -1) {
        return;
      }
      return this.grammars.push(grammar);
    };

    Manager.prototype.removeGrammar = function(grammar) {
      var idx;
      idx = this.grammars.indexOf(grammar);
      if (idx === -1) {
        return;
      }
      return this.grammars.splice(idx, 1);
    };

    Manager.prototype.registerHelperCommands = function() {
      return this.disposables.push(atom.commands.add('atom-text-editor', {
        'tern:createTernProjectFile': (function(_this) {
          return function(event) {
            return _this.helper.createTernProjectFile();
          };
        })(this)
      }));
    };

    Manager.prototype.registerCommands = function() {
      this.disposables.push(atom.commands.add('atom-text-editor', {
        'tern:rename': (function(_this) {
          return function(event) {
            var Rename;
            if (!_this.rename) {
              Rename = require('./atom-ternjs-rename');
              _this.rename = new Rename(_this);
            }
            return _this.rename.show();
          };
        })(this)
      }));
      this.disposables.push(atom.commands.add('atom-text-editor', {
        'tern:markerCheckpointBack': (function(_this) {
          return function(event) {
            var _ref;
            return (_ref = _this.helper) != null ? _ref.markerCheckpointBack() : void 0;
          };
        })(this)
      }));
      this.disposables.push(atom.commands.add('atom-text-editor', {
        'tern:startCompletion': (function(_this) {
          return function(event) {
            var _ref;
            return (_ref = _this.provider) != null ? _ref.forceCompletion() : void 0;
          };
        })(this)
      }));
      this.disposables.push(atom.commands.add('atom-text-editor', {
        'tern:definition': (function(_this) {
          return function(event) {
            var _ref;
            return (_ref = _this.client) != null ? _ref.definition() : void 0;
          };
        })(this)
      }));
      return this.disposables.push(atom.commands.add('atom-text-editor', {
        'tern:restart': (function(_this) {
          return function(event) {
            return _this.restartServer();
          };
        })(this)
      }));
    };

    Manager.prototype.stopServer = function() {
      var _ref;
      if ((_ref = this.server) != null) {
        _ref.stop();
      }
      return this.server = null;
    };

    Manager.prototype.restartServer = function() {
      var _ref;
      if ((_ref = this.server) != null) {
        _ref.stop();
      }
      this.server = null;
      return this.startServer();
    };

    return Manager;

  })();

}).call(this);
