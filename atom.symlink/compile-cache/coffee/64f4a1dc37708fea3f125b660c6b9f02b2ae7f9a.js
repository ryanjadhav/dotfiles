(function() {
  var path;

  path = require('path');

  module.exports = {
    config: {
      stylintExecutablePath: {
        type: 'string',
        "default": '/usr/local/bin/stylint'
      }
    },
    activate: function() {
      return console.log('activate linter-stylint');
    }
  };

}).call(this);
