(function() {
  var $, CompositeDisposable, ConflictMarker, GitBridge, MaybeLaterView, MergeConflictsView, MergeState, NothingToMergeView, ResolverView, SuccessView, View, handleErr, path, _, _ref, _ref1,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  _ref = require('space-pen'), $ = _ref.$, View = _ref.View;

  CompositeDisposable = require('atom').CompositeDisposable;

  _ = require('underscore-plus');

  path = require('path');

  GitBridge = require('./git-bridge').GitBridge;

  MergeState = require('./merge-state');

  ResolverView = require('./resolver-view');

  ConflictMarker = require('./conflict-marker');

  _ref1 = require('./message-views'), SuccessView = _ref1.SuccessView, MaybeLaterView = _ref1.MaybeLaterView, NothingToMergeView = _ref1.NothingToMergeView;

  handleErr = require('./error-view');

  MergeConflictsView = (function(_super) {
    __extends(MergeConflictsView, _super);

    function MergeConflictsView() {
      return MergeConflictsView.__super__.constructor.apply(this, arguments);
    }

    MergeConflictsView.prototype.instance = null;

    MergeConflictsView.content = function(state, pkg) {
      return this.div({
        "class": 'merge-conflicts tool-panel panel-bottom padded'
      }, (function(_this) {
        return function() {
          _this.div({
            "class": 'panel-heading'
          }, function() {
            _this.text('Conflicts');
            _this.span({
              "class": 'pull-right icon icon-fold',
              click: 'minimize'
            }, 'Hide');
            return _this.span({
              "class": 'pull-right icon icon-unfold',
              click: 'restore'
            }, 'Show');
          });
          return _this.div({
            outlet: 'body'
          }, function() {
            _this.ul({
              "class": 'block list-group',
              outlet: 'pathList'
            }, function() {
              var message, p, _i, _len, _ref2, _ref3, _results;
              _ref2 = state.conflicts;
              _results = [];
              for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
                _ref3 = _ref2[_i], p = _ref3.path, message = _ref3.message;
                _results.push(_this.li({
                  click: 'navigate',
                  "data-path": p,
                  "class": 'list-item navigate'
                }, function() {
                  _this.span({
                    "class": 'inline-block icon icon-diff-modified status-modified path'
                  }, p);
                  return _this.div({
                    "class": 'pull-right'
                  }, function() {
                    _this.button({
                      click: 'stageFile',
                      "class": 'btn btn-xs btn-success inline-block-tight stage-ready',
                      style: 'display: none'
                    }, 'Stage');
                    _this.span({
                      "class": 'inline-block text-subtle'
                    }, message);
                    _this.progress({
                      "class": 'inline-block',
                      max: 100,
                      value: 0
                    });
                    return _this.span({
                      "class": 'inline-block icon icon-dash staged'
                    });
                  });
                }));
              }
              return _results;
            });
            return _this.div({
              "class": 'block pull-right'
            }, function() {
              return _this.button({
                "class": 'btn btn-sm',
                click: 'quit'
              }, 'Quit');
            });
          });
        };
      })(this));
    };

    MergeConflictsView.prototype.initialize = function(state, pkg) {
      this.state = state;
      this.pkg = pkg;
      this.markers = [];
      this.subs = new CompositeDisposable;
      this.subs.add(this.pkg.onDidResolveConflict((function(_this) {
        return function(event) {
          var found, li, listElement, p, progress, _i, _len, _ref2;
          p = atom.project.getRepositories()[0].relativize(event.file);
          found = false;
          _ref2 = _this.pathList.children();
          for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
            listElement = _ref2[_i];
            li = $(listElement);
            if (li.data('path') === p) {
              found = true;
              progress = li.find('progress')[0];
              progress.max = event.total;
              progress.value = event.resolved;
              if (event.total === event.resolved) {
                li.find('.stage-ready').show();
              }
            }
          }
          if (!found) {
            return console.error("Unrecognized conflict path: " + p);
          }
        };
      })(this)));
      this.subs.add(this.pkg.onDidStageFile((function(_this) {
        return function() {
          return _this.refresh();
        };
      })(this)));
      return this.subs.add(atom.commands.add(this.element, {
        'merge-conflicts:entire-file-ours': this.sideResolver('ours'),
        'merge-conflicts:entire-file-theirs': this.sideResolver('theirs')
      }));
    };

    MergeConflictsView.prototype.navigate = function(event, element) {
      var fullPath, repoPath;
      repoPath = element.find(".path").text();
      fullPath = path.join(atom.project.getRepositories()[0].getWorkingDirectory(), repoPath);
      return atom.workspace.open(fullPath);
    };

    MergeConflictsView.prototype.minimize = function() {
      this.addClass('minimized');
      return this.body.hide('fast');
    };

    MergeConflictsView.prototype.restore = function() {
      this.removeClass('minimized');
      return this.body.show('fast');
    };

    MergeConflictsView.prototype.quit = function() {
      this.pkg.didQuitConflictResolution();
      return this.finish(MaybeLaterView);
    };

    MergeConflictsView.prototype.refresh = function() {
      return this.state.reread((function(_this) {
        return function(err, state) {
          var icon, item, p, _i, _len, _ref2;
          if (handleErr(err)) {
            return;
          }
          _ref2 = _this.pathList.find('li');
          for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
            item = _ref2[_i];
            p = $(item).data('path');
            icon = $(item).find('.staged');
            icon.removeClass('icon-dash icon-check text-success');
            if (_.contains(_this.state.conflictPaths(), p)) {
              icon.addClass('icon-dash');
            } else {
              icon.addClass('icon-check text-success');
              _this.pathList.find("li[data-path='" + p + "'] .stage-ready").hide();
            }
          }
          if (_this.state.isEmpty()) {
            _this.pkg.didCompleteConflictResolution();
            return _this.finish(SuccessView);
          }
        };
      })(this));
    };

    MergeConflictsView.prototype.finish = function(viewClass) {
      var m, _i, _len, _ref2;
      _ref2 = this.markers;
      for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
        m = _ref2[_i];
        m.cleanup();
      }
      this.markers = [];
      this.subs.dispose();
      this.hide('fast', (function(_this) {
        return function() {
          MergeConflictsView.instance = null;
          return _this.remove();
        };
      })(this));
      return atom.workspace.addTopPanel({
        item: new viewClass(this.state)
      });
    };

    MergeConflictsView.prototype.sideResolver = function(side) {
      return function(event) {
        var p;
        p = $(event.target).closest('li').data('path');
        return GitBridge.checkoutSide(side, p, function(err) {
          var full;
          if (handleErr(err)) {
            return;
          }
          full = path.join(atom.project.getPaths()[0], p);
          this.pkg.didResolveConflict({
            file: full,
            total: 1,
            resolved: 1
          });
          return atom.workspace.open(p);
        });
      };
    };

    MergeConflictsView.prototype.stageFile = function(event, element) {
      var e, filePath, repoPath, _i, _len, _ref2;
      repoPath = element.closest('li').data('path');
      filePath = path.join(atom.project.getRepositories()[0].getWorkingDirectory(), repoPath);
      _ref2 = atom.workspace.getTextEditors();
      for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
        e = _ref2[_i];
        if (e.getPath() === filePath) {
          e.save();
        }
      }
      return GitBridge.add(repoPath, (function(_this) {
        return function(err) {
          if (handleErr(err)) {
            return;
          }
          return _this.pkg.didStageFile({
            file: filePath
          });
        };
      })(this));
    };

    MergeConflictsView.detect = function(pkg) {
      if (!(atom.project.getRepositories().length > 0)) {
        return;
      }
      if (this.instance != null) {
        return;
      }
      return MergeState.read((function(_this) {
        return function(err, state) {
          var view;
          if (handleErr(err)) {
            return;
          }
          if (!state.isEmpty()) {
            view = new MergeConflictsView(state, pkg);
            _this.instance = view;
            atom.workspace.addBottomPanel({
              item: view
            });
            return _this.instance.subs.add(atom.workspace.observeTextEditors(function(editor) {
              var marker;
              marker = _this.markConflictsIn(state, editor, pkg);
              if (marker != null) {
                return _this.instance.markers.push(marker);
              }
            }));
          } else {
            return atom.workspace.addTopPanel({
              item: new NothingToMergeView(state)
            });
          }
        };
      })(this));
    };

    MergeConflictsView.markConflictsIn = function(state, editor, pkg) {
      var fullPath, repoPath;
      if (state.isEmpty()) {
        return;
      }
      fullPath = editor.getPath();
      repoPath = atom.project.getRepositories()[0].relativize(fullPath);
      if (!_.contains(state.conflictPaths(), repoPath)) {
        return;
      }
      return new ConflictMarker(state, editor, pkg);
    };

    return MergeConflictsView;

  })(View);

  module.exports = {
    MergeConflictsView: MergeConflictsView
  };

}).call(this);
