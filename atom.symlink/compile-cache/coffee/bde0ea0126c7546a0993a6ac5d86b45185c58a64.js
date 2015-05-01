(function() {
  var MyClass, SomeModule,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  SomeModule = require('some-module');

  MyClass = (function(_super) {
    __extends(MyClass, _super);

    function MyClass() {}

    MyClass.prototype.quicksort = function() {};

    return MyClass;

  })(SomeModule);

}).call(this);
