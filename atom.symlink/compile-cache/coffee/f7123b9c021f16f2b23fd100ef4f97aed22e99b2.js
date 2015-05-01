(function() {
  module.exports = {
    activate: function() {
      return console.log('activate linter-less');
    },
    configDefaults: {
      ieCompatibilityChecks: true,
      strictUnits: false,
      strictMath: false
    }
  };

}).call(this);
