(function() {
  module.exports = {
    configDefaults: {
      scssLintExecutablePath: '',
      scssLintExcludedLinters: []
    },
    activate: function() {
      return console.log('activate linter-scss-lint');
    }
  };

}).call(this);
