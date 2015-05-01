(function() {
  var Emitter;

  Emitter = require('atom').Emitter;

  module.exports = {
    openPath: function(path, callback) {
      var workspaceElement;
      workspaceElement = atom.views.getView(atom.workspace);
      jasmine.attachToDOM(workspaceElement);
      waitsForPromise(function() {
        return atom.workspace.open(path);
      });
      return runs(function() {
        return callback(atom.views.getView(atom.workspace.getActivePaneItem()));
      });
    },
    rowRangeFrom: function(marker) {
      return [marker.getTailBufferPosition().row, marker.getHeadBufferPosition().row];
    },
    pkgEmitter: function() {
      var emitter;
      emitter = new Emitter;
      return {
        onDidResolveConflict: function(callback) {
          return emitter.on('did-resolve-conflict', callback);
        },
        didResolveConflict: function(event) {
          return emitter.emit('did-resolve-conflict', event);
        },
        onDidStageFile: function(callback) {
          return emitter.on('did-stage-file', callback);
        },
        didStageFile: function(event) {
          return emitter.emit('did-stage-file', event);
        },
        onDidQuitConflictResolution: function(callback) {
          return emitter.on('did-quit-conflict-resolution', callback);
        },
        didQuitConflictResolution: function() {
          return emitter.emit('did-quit-conflict-resolution');
        },
        onDidCompleteConflictResolution: function(callback) {
          return emitter.on('did-complete-conflict-resolution', callback);
        },
        didCompleteConflictResolution: function() {
          return emitter.emit('did-complete-conflict-resolution');
        },
        dispose: function() {
          return emitter.dispose();
        }
      };
    }
  };

}).call(this);
