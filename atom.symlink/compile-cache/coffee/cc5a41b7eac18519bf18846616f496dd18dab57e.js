(function() {
  var $, BOTTOM, CONFLICT_REGEX, Conflict, Emitter, INVALID, MIDDLE, Marker, Navigator, OurSide, Side, TOP, TheirSide, _, _ref;

  $ = require('space-pen').$;

  Emitter = require('atom').Emitter;

  _ = require('underscore-plus');

  _ref = require('./side'), Side = _ref.Side, OurSide = _ref.OurSide, TheirSide = _ref.TheirSide;

  Navigator = require('./navigator');

  CONFLICT_REGEX = /^<{7} (.+)\r?\n([^]*?)={7}\r?\n([^]*?)>{7} (.+)(?:\r?\n)?/mg;

  INVALID = null;

  TOP = 'top';

  MIDDLE = 'middle';

  BOTTOM = 'bottom';

  Marker = (function() {
    var options;

    options = {
      persistent: false,
      invalidate: 'never'
    };

    function Marker(state, editor) {
      this.state = state;
      this.editor = editor;
      this.position = INVALID;
    }

    Marker.prototype.start = function(m) {
      this.m = m;
      this.startRow = this.m.range.start.row;
      this.endRow = this.m.range.end.row;
      this.chunks = this.m.match;
      this.chunks.shift();
      this.currentRow = this.startRow;
      this.position = TOP;
      return this.previousSide = null;
    };

    Marker.prototype.finish = function() {
      return this.previousSide.followingMarker = this.previousSide.refBannerMarker;
    };

    Marker.prototype.markOurs = function() {
      return this._markHunk(OurSide);
    };

    Marker.prototype.markSeparator = function() {
      var marker, sepRowEnd, sepRowStart;
      if (this.position !== MIDDLE) {
        throw new Error("Unexpected position for separator: " + this.position);
      }
      this.position = BOTTOM;
      sepRowStart = this.currentRow;
      sepRowEnd = this._advance(1);
      marker = this.editor.markBufferRange([[sepRowStart, 0], [sepRowEnd, 0]], this.options);
      this.previousSide.followingMarker = marker;
      return new Navigator(marker);
    };

    Marker.prototype.markTheirs = function() {
      return this._markHunk(TheirSide);
    };

    Marker.prototype._markHunk = function(sideKlass) {
      var bannerMarker, bannerRowEnd, bannerRowStart, lines, marker, ref, rowEnd, rowStart, side, sidePosition, text;
      sidePosition = this.position;
      switch (this.position) {
        case TOP:
          ref = this.chunks.shift();
          text = this.chunks.shift();
          lines = text.split(/\n/);
          bannerRowStart = this.currentRow;
          bannerRowEnd = rowStart = this._advance(1);
          rowEnd = this._advance(lines.length - 1);
          this.position = MIDDLE;
          break;
        case BOTTOM:
          text = this.chunks.shift();
          ref = this.chunks.shift();
          lines = text.split(/\n/);
          rowStart = this.currentRow;
          bannerRowStart = rowEnd = this._advance(lines.length - 1);
          bannerRowEnd = this._advance(1);
          this.position = INVALID;
          break;
        default:
          throw new Error("Unexpected position for side: " + this.position);
      }
      bannerMarker = this.editor.markBufferRange([[bannerRowStart, 0], [bannerRowEnd, 0]], this.options);
      marker = this.editor.markBufferRange([[rowStart, 0], [rowEnd, 0]], this.options);
      side = new sideKlass(text, ref, marker, bannerMarker, sidePosition);
      this.previousSide = side;
      return side;
    };

    Marker.prototype._advance = function(rowCount) {
      return this.currentRow += rowCount;
    };

    return Marker;

  })();

  module.exports = Conflict = (function() {
    function Conflict(ours, theirs, parent, navigator, state) {
      this.ours = ours;
      this.theirs = theirs;
      this.parent = parent;
      this.navigator = navigator;
      this.state = state;
      this.emitter = new Emitter;
      this.ours.conflict = this;
      this.theirs.conflict = this;
      this.navigator.conflict = this;
      this.resolution = null;
    }

    Conflict.prototype.isResolved = function() {
      return this.resolution != null;
    };

    Conflict.prototype.onDidResolveConflict = function(callback) {
      return this.emitter.on('resolve-conflict', callback);
    };

    Conflict.prototype.resolveAs = function(side) {
      this.resolution = side;
      return this.emitter.emit('resolve-conflict');
    };

    Conflict.prototype.scrollTarget = function() {
      return this.ours.marker.getTailBufferPosition();
    };

    Conflict.prototype.markers = function() {
      return _.flatten([this.ours.markers(), this.theirs.markers(), this.navigator.markers()], true);
    };

    Conflict.prototype.toString = function() {
      return "[conflict: " + this.ours + " " + this.theirs + "]";
    };

    Conflict.all = function(state, editor) {
      var marker, previous, results;
      results = [];
      previous = null;
      marker = new Marker(state, editor);
      editor.getBuffer().scan(CONFLICT_REGEX, function(m) {
        var c, nav, ours, theirs;
        marker.start(m);
        if (state.isRebase) {
          theirs = marker.markTheirs();
          nav = marker.markSeparator();
          ours = marker.markOurs();
        } else {
          ours = marker.markOurs();
          nav = marker.markSeparator();
          theirs = marker.markTheirs();
        }
        marker.finish();
        c = new Conflict(ours, theirs, null, nav, state);
        results.push(c);
        nav.linkToPrevious(previous);
        return previous = c;
      });
      return results;
    };

    return Conflict;

  })();

}).call(this);
