(function() {
  var GitBridge, MergeState;

  GitBridge = require('./git-bridge').GitBridge;

  module.exports = MergeState = (function() {
    function MergeState(conflicts, isRebase) {
      this.conflicts = conflicts;
      this.isRebase = isRebase;
    }

    MergeState.prototype.conflictPaths = function() {
      var c, _i, _len, _ref, _results;
      _ref = this.conflicts;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        c = _ref[_i];
        _results.push(c.path);
      }
      return _results;
    };

    MergeState.prototype.reread = function(callback) {
      return GitBridge.withConflicts((function(_this) {
        return function(err, conflicts) {
          _this.conflicts = conflicts;
          if (err != null) {
            return callback(err, null);
          } else {
            return callback(null, _this);
          }
        };
      })(this));
    };

    MergeState.prototype.isEmpty = function() {
      return this.conflicts.length === 0;
    };

    MergeState.read = function(callback) {
      var isr;
      isr = GitBridge.isRebasing();
      return GitBridge.withConflicts(function(err, cs) {
        if (err != null) {
          return callback(err, null);
        } else {
          return callback(null, new MergeState(cs, isr));
        }
      });
    };

    return MergeState;

  })();

}).call(this);
