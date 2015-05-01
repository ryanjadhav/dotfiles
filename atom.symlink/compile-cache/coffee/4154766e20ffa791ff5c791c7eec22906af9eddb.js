(function() {
  var CompositeDisposable, Emitter, GitBridge, MergeConflictsView, handleErr, _ref;

  _ref = require('atom'), CompositeDisposable = _ref.CompositeDisposable, Emitter = _ref.Emitter;

  MergeConflictsView = require('./merge-conflicts-view').MergeConflictsView;

  GitBridge = require('./git-bridge').GitBridge;

  handleErr = require('./error-view');

  module.exports = {
    activate: function(state) {
      var pkgEmitter;
      this.subs = new CompositeDisposable;
      this.emitter = new Emitter;
      pkgEmitter = {
        onDidResolveConflict: (function(_this) {
          return function(callback) {
            return _this.onDidResolveConflict(callback);
          };
        })(this),
        didResolveConflict: (function(_this) {
          return function(event) {
            return _this.emitter.emit('did-resolve-conflict', event);
          };
        })(this),
        onDidStageFile: (function(_this) {
          return function(callback) {
            return _this.onDidStageFile(callback);
          };
        })(this),
        didStageFile: (function(_this) {
          return function(event) {
            return _this.emitter.emit('did-stage-file', event);
          };
        })(this),
        onDidQuitConflictResolution: (function(_this) {
          return function(callback) {
            return _this.onDidQuitConflictResolution(callback);
          };
        })(this),
        didQuitConflictResolution: (function(_this) {
          return function() {
            return _this.emitter.emit('did-quit-conflict-resolution');
          };
        })(this),
        onDidCompleteConflictResolution: (function(_this) {
          return function(callback) {
            return _this.onDidCompleteConflictResolution(callback);
          };
        })(this),
        didCompleteConflictResolution: (function(_this) {
          return function() {
            return _this.emitter.emit('did-complete-conflict-resolution');
          };
        })(this)
      };
      return this.subs.add(atom.commands.add('atom-workspace', 'merge-conflicts:detect', function() {
        return GitBridge.locateGitAnd(function(err) {
          if (err != null) {
            return handleErr(err);
          }
          return MergeConflictsView.detect(pkgEmitter);
        });
      }));
    },
    deactivate: function() {
      this.subs.dispose();
      return this.emitter.dispose();
    },
    config: {
      gitPath: {
        type: 'string',
        "default": '',
        description: 'Absolute path to your git executable.'
      }
    },
    onDidResolveConflict: function(callback) {
      return this.emitter.on('did-resolve-conflict', callback);
    },
    onDidStageFile: function(callback) {
      return this.emitter.on('did-stage-file', callback);
    },
    onDidQuitConflictResolution: function(callback) {
      return this.emitter.on('did-quit-conflict-resolution', callback);
    },
    onDidCompleteConflictResolution: function(callback) {
      return this.emitter.on('did-complete-conflict-resolution', callback);
    }
  };

}).call(this);
