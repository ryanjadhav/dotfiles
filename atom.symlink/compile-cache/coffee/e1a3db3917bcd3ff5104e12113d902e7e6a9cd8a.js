(function() {
  var OurSide, Side, TheirSide,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  Side = (function() {
    function Side(originalText, ref, marker, refBannerMarker, position) {
      this.originalText = originalText;
      this.ref = ref;
      this.marker = marker;
      this.refBannerMarker = refBannerMarker;
      this.position = position;
      this.conflict = null;
      this.isDirty = false;
      this.followingMarker = null;
    }

    Side.prototype.resolve = function() {
      return this.conflict.resolveAs(this);
    };

    Side.prototype.wasChosen = function() {
      return this.conflict.resolution === this;
    };

    Side.prototype.lineClass = function() {
      if (this.wasChosen()) {
        return 'conflict-resolved';
      } else if (this.isDirty) {
        return 'conflict-dirty';
      } else {
        return "conflict-" + (this.klass());
      }
    };

    Side.prototype.markers = function() {
      return [this.marker, this.refBannerMarker];
    };

    Side.prototype.toString = function() {
      var chosenMark, dirtyMark, text;
      text = this.originalText.replace(/[\n\r]/, ' ');
      if (text.length > 20) {
        text = text.slice(0, 18) + "...";
      }
      dirtyMark = this.isDirty ? ' dirty' : '';
      chosenMark = this.wasChosen() ? ' chosen' : '';
      return "[" + (this.klass()) + ": " + text + " :" + dirtyMark + chosenMark + "]";
    };

    return Side;

  })();

  OurSide = (function(_super) {
    __extends(OurSide, _super);

    function OurSide() {
      return OurSide.__super__.constructor.apply(this, arguments);
    }

    OurSide.prototype.site = function() {
      return 1;
    };

    OurSide.prototype.klass = function() {
      return 'ours';
    };

    OurSide.prototype.description = function() {
      return 'our changes';
    };

    OurSide.prototype.eventName = function() {
      return 'merge-conflicts:accept-ours';
    };

    return OurSide;

  })(Side);

  TheirSide = (function(_super) {
    __extends(TheirSide, _super);

    function TheirSide() {
      return TheirSide.__super__.constructor.apply(this, arguments);
    }

    TheirSide.prototype.site = function() {
      return 2;
    };

    TheirSide.prototype.klass = function() {
      return 'theirs';
    };

    TheirSide.prototype.description = function() {
      return 'their changes';
    };

    TheirSide.prototype.eventName = function() {
      return 'merge-conflicts:accept-theirs';
    };

    return TheirSide;

  })(Side);

  module.exports = {
    Side: Side,
    OurSide: OurSide,
    TheirSide: TheirSide
  };

}).call(this);
