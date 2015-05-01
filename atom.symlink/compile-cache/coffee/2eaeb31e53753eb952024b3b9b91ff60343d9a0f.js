(function() {
  var Navigator;

  module.exports = Navigator = (function() {
    function Navigator(separatorMarker) {
      var _ref;
      this.separatorMarker = separatorMarker;
      _ref = [null, null, null], this.conflict = _ref[0], this.previous = _ref[1], this.next = _ref[2];
    }

    Navigator.prototype.linkToPrevious = function(c) {
      this.previous = c;
      if (c != null) {
        return c.navigator.next = this.conflict;
      }
    };

    Navigator.prototype.nextUnresolved = function() {
      var current;
      current = this.next;
      while ((current != null) && current.isResolved()) {
        current = current.navigator.next;
      }
      return current;
    };

    Navigator.prototype.previousUnresolved = function() {
      var current;
      current = this.previous;
      while ((current != null) && current.isResolved()) {
        current = current.navigator.previous;
      }
      return current;
    };

    Navigator.prototype.markers = function() {
      return [this.separatorMarker];
    };

    return Navigator;

  })();

}).call(this);
