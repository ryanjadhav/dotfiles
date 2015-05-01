(function() {
  var path;

  path = require('path');

  module.exports = {
    config: {
      eslintRulesDir: {
        type: 'string',
        "default": ''
      },
      disableWhenNoEslintrcFileInPath: {
        type: 'boolean',
        "default": false
      }
    },
    activate: function() {
      return console.log('activate linter-eslint');
    }
  };

}).call(this);
