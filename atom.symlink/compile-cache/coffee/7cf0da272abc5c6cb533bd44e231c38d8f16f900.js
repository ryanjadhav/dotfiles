(function() {
  var MaybeLaterView, MessageView, NothingToMergeView, SuccessView, View,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  View = require('space-pen').View;

  MessageView = (function(_super) {
    __extends(MessageView, _super);

    function MessageView() {
      return MessageView.__super__.constructor.apply(this, arguments);
    }

    MessageView.content = function(state) {
      return this.div({
        "class": 'overlay from-top merge-conflicts-message'
      }, (function(_this) {
        return function() {
          return _this.div({
            "class": 'panel',
            click: 'dismiss'
          }, function() {
            _this.div({
              "class": "panel-heading text-" + _this.headingClass
            }, _this.headingText);
            return _this.div({
              "class": 'panel-body'
            }, function() {
              _this.div({
                "class": 'block'
              }, function() {
                return _this.bodyMarkup(state);
              });
              return _this.div({
                "class": 'block text-subtle'
              }, 'click to dismiss');
            });
          });
        };
      })(this));
    };

    MessageView.prototype.dismiss = function() {
      return this.hide('fast', (function(_this) {
        return function() {
          return _this.remove();
        };
      })(this));
    };

    return MessageView;

  })(View);

  SuccessView = (function(_super) {
    __extends(SuccessView, _super);

    function SuccessView() {
      return SuccessView.__super__.constructor.apply(this, arguments);
    }

    SuccessView.headingText = 'Merge Complete';

    SuccessView.headingClass = 'success';

    SuccessView.bodyMarkup = function(state) {
      this.text("That's everything. ");
      if (state.isRebase) {
        this.code('git rebase --continue');
        return this.text(' at will to resume rebasing.');
      } else {
        this.code('git commit');
        return this.text(' at will to finish the merge.');
      }
    };

    return SuccessView;

  })(MessageView);

  NothingToMergeView = (function(_super) {
    __extends(NothingToMergeView, _super);

    function NothingToMergeView() {
      return NothingToMergeView.__super__.constructor.apply(this, arguments);
    }

    NothingToMergeView.headingText = 'Nothing to Merge';

    NothingToMergeView.headingClass = 'info';

    NothingToMergeView.bodyMarkup = function(state) {
      return this.text('No conflicts here!');
    };

    return NothingToMergeView;

  })(MessageView);

  MaybeLaterView = (function(_super) {
    __extends(MaybeLaterView, _super);

    function MaybeLaterView() {
      return MaybeLaterView.__super__.constructor.apply(this, arguments);
    }

    MaybeLaterView.headingText = 'Maybe Later';

    MaybeLaterView.headingClass = 'warning';

    MaybeLaterView.bodyMarkup = function(state) {
      this.text("Careful, you've still got conflict markers left! ");
      if (state.isRebase) {
        this.code('git rebase --abort');
      } else {
        this.code('git merge --abort');
      }
      return this.text(' if you just want to give up on this one.');
    };

    return MaybeLaterView;

  })(MessageView);

  module.exports = {
    SuccessView: SuccessView,
    MaybeLaterView: MaybeLaterView,
    NothingToMergeView: NothingToMergeView
  };

}).call(this);
