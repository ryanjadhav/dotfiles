(function() {
  var path;

  path = require('path');

  module.exports = {
    config: {
      csslintExecutablePath: {
        "default": path.join(__dirname, '..', 'node_modules', '.bin'),
        title: 'CSSLint Executable Path',
        type: 'string'
      }
    },
    activate: function() {
      return console.log('activate linter-csslint');
    }
  };

}).call(this);
