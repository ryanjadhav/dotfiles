(function() {
  var CompositeDisposable, CoveringView, NavigationView,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  CompositeDisposable = require('atom').CompositeDisposable;

  CoveringView = require('./covering-view').CoveringView;

  module.exports = NavigationView = (function(_super) {
    __extends(NavigationView, _super);

    function NavigationView() {
      return NavigationView.__super__.constructor.apply(this, arguments);
    }

    NavigationView.content = function(navigator, editor) {
      return this.div({
        "class": 'controls navigation'
      }, (function(_this) {
        return function() {
          _this.text(' ');
          return _this.span({
            "class": 'pull-right'
          }, function() {
            _this.button({
              "class": 'btn btn-xs',
              click: 'up',
              outlet: 'prevBtn'
            }, 'prev');
            return _this.button({
              "class": 'btn btn-xs',
              click: 'down',
              outlet: 'nextBtn'
            }, 'next');
          });
        };
      })(this));
    };

    NavigationView.prototype.initialize = function(navigator, editor) {
      this.navigator = navigator;
      this.subs = new CompositeDisposable;
      NavigationView.__super__.initialize.call(this, editor);
      this.prependKeystroke('merge-conflicts:previous-unresolved', this.prevBtn);
      this.prependKeystroke('merge-conflicts:next-unresolved', this.nextBtn);
      return this.subs.add(this.navigator.conflict.onDidResolveConflict((function(_this) {
        return function() {
          _this.deleteMarker(_this.cover());
          _this.remove();
          return _this.cleanup();
        };
      })(this)));
    };

    NavigationView.prototype.cleanup = function() {
      NavigationView.__super__.cleanup.apply(this, arguments);
      return this.subs.dispose();
    };

    NavigationView.prototype.cover = function() {
      return this.navigator.separatorMarker;
    };

    NavigationView.prototype.up = function() {
      var _ref;
      return this.scrollTo((_ref = this.navigator.previousUnresolved()) != null ? _ref.scrollTarget() : void 0);
    };

    NavigationView.prototype.down = function() {
      var _ref;
      return this.scrollTo((_ref = this.navigator.nextUnresolved()) != null ? _ref.scrollTarget() : void 0);
    };

    NavigationView.prototype.conflict = function() {
      return this.navigator.conflict;
    };

    NavigationView.prototype.toString = function() {
      return "{NavView of: " + (this.conflict()) + "}";
    };

    return NavigationView;

  })(CoveringView);

}).call(this);
