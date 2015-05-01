(function() {
  var Helper, fs, path;

  fs = require('fs');

  path = require('path');

  module.exports = Helper = (function() {
    Helper.prototype.projectRoot = null;

    Helper.prototype.manager = null;

    Helper.prototype.checkpointsDefinition = [];

    Helper.prototype.ternProjectFileContent = '{\n \ "libs": [\n \ \ \ "browser",\n \ \ \ "ecma5",\n \ \ \ "ecma6",\n \ \ \ "jquery"\n \ ],\n \ "loadEagerly": [\n \ \ \ "js/**/*.js"\n \ ],\n \ "plugins": {\n \ \ \ "complete_strings": {},\n \ \ \ "doc_comment": {\n \ \ \ \ "fullDocs": true\n \ \ \ }\n \ }\n}';

    function Helper(manager) {
      this.manager = manager;
    }

    Helper.prototype.hasTernProjectFile = function() {
      this.projectRoot = atom.project.getDirectories()[0];
      if (!this.projectRoot) {
        return void 0;
      }
      if (this.fileExists(path.resolve(__dirname, this.projectRoot.path + '/.tern-project')) === void 0) {
        return true;
      }
      return false;
    };

    Helper.prototype.createTernProjectFile = function() {
      if (this.hasTernProjectFile() !== false) {
        return;
      }
      return this.writeFile(path.resolve(__dirname, this.projectRoot.path + '/.tern-project'));
    };

    Helper.prototype.fileExists = function(path) {
      var e;
      try {
        return fs.accessSync(path, fs.F_OK, (function(_this) {
          return function(err) {
            return console.log(err);
          };
        })(this));
      } catch (_error) {
        e = _error;
        return false;
      }
    };

    Helper.prototype.writeFile = function(path) {
      return fs.writeFile(path, this.ternProjectFileContent, (function(_this) {
        return function(err) {
          var content;
          atom.workspace.open(path);
          if (!err) {
            return;
          }
          content = 'Could not create .tern-project file. Use the README to manually create a .tern-project file.';
          return atom.notifications.addInfo(content, {
            dismissable: true
          });
        };
      })(this));
    };

    Helper.prototype.markerCheckpointBack = function() {
      var checkpoint;
      if (!this.checkpointsDefinition.length) {
        return;
      }
      checkpoint = this.checkpointsDefinition.pop();
      return this.openFileAndGoToPosition(checkpoint.marker.range.start, checkpoint.editor.getURI());
    };

    Helper.prototype.setMarkerCheckpoint = function() {
      var buffer, cursor, editor, marker;
      editor = atom.workspace.getActiveEditor();
      buffer = editor.getBuffer();
      cursor = editor.getLastCursor();
      if (!cursor) {
        return;
      }
      marker = buffer.markPosition(cursor.getBufferPosition(), {});
      return this.checkpointsDefinition.push({
        marker: marker,
        editor: editor
      });
    };

    Helper.prototype.openFileAndGoToPosition = function(position, file) {
      return atom.workspace.open(file).then(function(textEditor) {
        var buffer, cursor;
        buffer = textEditor.getBuffer();
        cursor = textEditor.getLastCursor();
        return cursor.setBufferPosition(position);
      });
    };

    Helper.prototype.openFileAndGoTo = function(start, file) {
      var that;
      that = this;
      return atom.workspace.open(file).then(function(textEditor) {
        var buffer, cursor;
        buffer = textEditor.getBuffer();
        cursor = textEditor.getLastCursor();
        cursor.setBufferPosition(buffer.positionForCharacterIndex(start));
        return that.markDefinitionBufferRange(cursor, textEditor);
      });
    };

    Helper.prototype.formatType = function(data) {
      var str;
      return str = data.type.replace('fn', data.exprName).replace(/->/g, ':').replace('<top>', 'window');
    };

    Helper.prototype.formatTypeCompletion = function(obj) {
      var _ref, _ref1;
      if (obj.isKeyword) {
        obj._typeSelf = 'keyword';
      }
      if (!obj.type) {
        return obj;
      }
      if (!obj.type.startsWith('fn')) {
        obj._typeSelf = 'variable';
      }
      if (obj.type === 'string') {
        obj.name = (_ref = obj.name) != null ? _ref.replace(/(^"|"$)/g, '') : void 0;
      }
      obj.type = (_ref1 = obj.type) != null ? _ref1.replace(/->/g, ':').replace('<top>', 'window') : void 0;
      if (obj.type.replace(/fn\(.+\)/, '').length === 0) {
        obj.leftLabel = '';
      } else {
        if (obj.type.indexOf('fn') === -1) {
          obj.leftLabel = obj.type;
        } else {
          obj.leftLabel = obj.type.replace(/fn\(.{0,}\)/, '').replace(' : ', '');
        }
      }
      obj.rightLabel = obj.rightLabelDoc = obj.type.replace(/( : .+)/, '');
      if (obj.rightLabel.startsWith('fn')) {
        obj._snippet = this.extractParams(obj.rightLabel.replace(/^fn\(/, '').replace(/\)$/, ''), obj.name);
        obj._typeSelf = 'function';
      }
      if (obj.name) {
        obj.rightLabelDoc = obj.rightLabel.replace(/^fn/, obj.name);
        if (obj.leftLabel === obj.name) {
          obj.leftLabel = null;
          obj.rightLabel = null;
        }
      }
      if (obj.leftLabel === obj.rightLabel) {
        obj.rightLabelDoc = null;
        obj.rightLabel = null;
      }
      return obj;
    };

    Helper.prototype.extractParams = function(type, name) {
      var i, param, params, suggestionParams, _i, _len;
      params = type.match(this.manager.regExp.params);
      suggestionParams = [];
      if (!params) {
        return;
      }
      for (i = _i = 0, _len = params.length; _i < _len; i = ++_i) {
        param = params[i];
        suggestionParams.push("${" + (i + 1) + ":" + param + "}");
      }
      return "" + name + "(" + (suggestionParams.join(',')) + ")";
    };

    Helper.prototype.markDefinitionBufferRange = function(cursor, editor) {
      var decoration, marker, range;
      range = cursor.getCurrentWordBufferRange();
      marker = editor.markBufferRange(range, {
        invalidate: 'touch'
      });
      decoration = editor.decorateMarker(marker, {
        type: 'highlight',
        "class": 'atom-ternjs-definition-marker',
        invalidate: 'touch'
      });
      setTimeout((function() {
        return decoration != null ? decoration.setProperties({
          type: 'highlight',
          "class": 'atom-ternjs-definition-marker active',
          invalidate: 'touch'
        }) : void 0;
      }), 1);
      setTimeout((function() {
        return decoration != null ? decoration.setProperties({
          type: 'highlight',
          "class": 'atom-ternjs-definition-marker',
          invalidate: 'touch'
        }) : void 0;
      }), 1501);
      return setTimeout((function() {
        return marker.destroy();
      }), 2500);
    };

    Helper.prototype.focusEditor = function() {
      var editor, view;
      editor = atom.workspace.getActiveTextEditor();
      if (!editor) {
        return;
      }
      view = atom.views.getView(editor);
      return view != null ? typeof view.focus === "function" ? view.focus() : void 0 : void 0;
    };

    Helper.prototype.destroy = function() {
      var checkpoint, _i, _len, _ref, _ref1, _results;
      _ref = this.checkpointsDefinition;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        checkpoint = _ref[_i];
        _results.push((_ref1 = checkpoint.marker) != null ? _ref1.destroy() : void 0);
      }
      return _results;
    };

    return Helper;

  })();

}).call(this);
