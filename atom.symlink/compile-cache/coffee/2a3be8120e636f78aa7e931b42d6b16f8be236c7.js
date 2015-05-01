(function() {
  module.exports = {
    configDefaults: {
      puppetLintArguments: '--no-autoloader_layout-check',
      puppetLintExecutablePath: null
    },
    activate: function() {
      return console.log('activate linter-puppet-lint');
    }
  };

}).call(this);
