(function() {
  var CompositeDisposable, GitBridge, ResolverView, View, handleErr,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  CompositeDisposable = require('atom').CompositeDisposable;

  View = require('space-pen').View;

  GitBridge = require('./git-bridge').GitBridge;

  handleErr = require('./error-view');

  module.exports = ResolverView = (function(_super) {
    __extends(ResolverView, _super);

    function ResolverView() {
      return ResolverView.__super__.constructor.apply(this, arguments);
    }

    ResolverView.content = function(editor, pkg) {
      return this.div({
        "class": 'overlay from-top resolver'
      }, (function(_this) {
        return function() {
          _this.div({
            "class": 'block text-highlight'
          }, "We're done here");
          _this.div({
            "class": 'block'
          }, function() {
            _this.div({
              "class": 'block text-info'
            }, function() {
              return _this.text("You've dealt with all of the conflicts in this file.");
            });
            return _this.div({
              "class": 'block text-info'
            }, function() {
              _this.span({
                outlet: 'actionText'
              }, 'Save and stage');
              return _this.text(' this file for commit?');
            });
          });
          _this.div({
            "class": 'pull-left'
          }, function() {
            return _this.button({
              "class": 'btn btn-primary',
              click: 'dismiss'
            }, 'Maybe Later');
          });
          return _this.div({
            "class": 'pull-right'
          }, function() {
            return _this.button({
              "class": 'btn btn-primary',
              click: 'resolve'
            }, 'Stage');
          });
        };
      })(this));
    };

    ResolverView.prototype.initialize = function(editor, pkg) {
      this.editor = editor;
      this.pkg = pkg;
      this.subs = new CompositeDisposable();
      this.refresh();
      this.subs.add(this.editor.onDidSave((function(_this) {
        return function() {
          return _this.refresh();
        };
      })(this)));
      return this.subs.add(atom.commands.add(this.element, 'merge-conflicts:quit', (function(_this) {
        return function() {
          return _this.dismiss();
        };
      })(this)));
    };

    ResolverView.prototype.detached = function() {
      return this.subs.dispose();
    };

    ResolverView.prototype.getModel = function() {
      return null;
    };

    ResolverView.prototype.relativePath = function() {
      return atom.project.getRepositories()[0].relativize(this.editor.getURI());
    };

    ResolverView.prototype.refresh = function() {
      return GitBridge.isStaged(this.relativePath(), (function(_this) {
        return function(err, staged) {
          var modified, needsSaved, needsStaged;
          if (handleErr(err)) {
            return;
          }
          modified = _this.editor.isModified();
          needsSaved = modified;
          needsStaged = modified || !staged;
          if (!(needsSaved || needsStaged)) {
            _this.hide('fast', function() {
              return this.remove();
            });
            _this.pkg.didStageFile({
              file: _this.editor.getURI()
            });
            return;
          }
          if (needsSaved) {
            return _this.actionText.text('Save and stage');
          } else if (needsStaged) {
            return _this.actionText.text('Stage');
          }
        };
      })(this));
    };

    ResolverView.prototype.resolve = function() {
      this.editor.save();
      return GitBridge.add(this.relativePath(), (function(_this) {
        return function(err) {
          if (handleErr(err)) {
            return;
          }
          return _this.refresh();
        };
      })(this));
    };

    ResolverView.prototype.dismiss = function() {
      return this.hide('fast', (function(_this) {
        return function() {
          return _this.remove();
        };
      })(this));
    };

    return ResolverView;

  })(View);

}).call(this);
