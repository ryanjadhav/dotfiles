(function() {
  var Type, TypeView;

  TypeView = require('./atom-ternjs-type-view');

  module.exports = Type = (function() {
    Type.prototype.view = null;

    Type.prototype.manager = null;

    Type.prototype.overlayDecoration = null;

    Type.prototype.marker = null;

    function Type(manager, state) {
      if (state == null) {
        state = {};
      }
      this.manager = manager;
      this.view = new TypeView();
      this.view.initialize(state);
      atom.views.getView(atom.workspace).appendChild(this.view);
    }

    Type.prototype.setPosition = function() {
      var editor;
      if (!this.marker) {
        editor = atom.workspace.getActiveTextEditor();
        this.marker = typeof editor.getLastCursor === "function" ? editor.getLastCursor().getMarker() : void 0;
        if (!this.marker) {
          return;
        }
        return this.overlayDecoration = editor.decorateMarker(this.marker, {
          type: 'overlay',
          item: this.view,
          "class": 'atom-ternjs-type',
          position: 'tale',
          invalidate: 'touch'
        });
      } else {
        return this.marker.setProperties({
          type: 'overlay',
          item: this.view,
          "class": 'atom-ternjs-type',
          position: 'tale',
          invalidate: 'touch'
        });
      }
    };

    Type.prototype.destroyOverlay = function() {
      var _ref;
      if ((_ref = this.overlayDecoration) != null) {
        _ref.destroy();
      }
      this.overlayDecoration = null;
      return this.marker = null;
    };

    Type.prototype.queryType = function(editor, cursor) {
      var buffer, cancel, lineCount, may, may2, paramPosition, position, rangeBefore, rowStart, scopeDescriptor, skipCounter, skipCounter2, text, tmp, tolerance;
      if (cursor.destroyed) {
        return;
      }
      scopeDescriptor = cursor.getScopeDescriptor();
      if (scopeDescriptor.scopes.join().match(/comment/)) {
        this.destroyOverlay();
        return;
      }
      tolerance = 20;
      rowStart = 0;
      position = cursor.getBufferPosition();
      lineCount = editor.getLineCount();
      if (position.row - tolerance < 0) {
        rowStart = 0;
      } else {
        rowStart = position.row - tolerance;
      }
      buffer = editor.getBuffer();
      rangeBefore = false;
      tmp = false;
      may = 0;
      may2 = 0;
      skipCounter = 0;
      skipCounter2 = 0;
      paramPosition = 0;
      cancel = false;
      buffer.backwardsScanInRange(/\]|\[|\(|\)|\,|\{|\}/g, [[rowStart, 0], [position.row, position.column]], (function(_this) {
        return function(obj) {
          if (editor.scopeDescriptorForBufferPosition(obj.range.start).scopes.join().match(/string/)) {
            return;
          }
          if (obj.matchText === '}') {
            may++;
            return;
          }
          if (obj.matchText === ']') {
            if (tmp === false) {
              skipCounter2++;
            }
            may2++;
            return;
          }
          if (obj.matchText === '{') {
            if (!may) {
              rangeBefore = false;
              obj.stop();
              return;
            }
            may--;
            return;
          }
          if (obj.matchText === '[') {
            if (skipCounter2) {
              skipCounter2--;
            }
            if (!may2) {
              rangeBefore = false;
              obj.stop();
              return;
            }
            may2--;
            return;
          }
          if (obj.matchText === ')' && tmp === false) {
            skipCounter++;
            return;
          }
          if (obj.matchText === ',' && !skipCounter && !skipCounter2 && !may && !may2) {
            paramPosition++;
            return;
          }
          if (obj.matchText === ',') {
            return;
          }
          if (obj.matchText === '(' && skipCounter) {
            skipCounter--;
            return;
          }
          if (skipCounter || skipCounter2) {
            return;
          }
          if (obj.matchText === '(' && tmp === false) {
            rangeBefore = obj.range;
            obj.stop();
            return;
          }
          return tmp = obj.matchText;
        };
      })(this));
      if (!rangeBefore) {
        this.destroyOverlay();
        return;
      }
      text = buffer.getTextInRange([[rangeBefore.start.row, 0], [rangeBefore.start.row, rangeBefore.start.column]]);
      if (!text.replace(/\s/g, '').length || text.match(/\bif\b/)) {
        this.destroyOverlay();
        return;
      }
      return this.manager.client.update(editor.getURI(), editor.getText()).then((function(_this) {
        return function() {
          return _this.manager.client.type(editor, rangeBefore.start).then(function(data) {
            var matches, offsetFix, type;
            if (!data || data.type === '?' || !data.exprName) {
              _this.destroyOverlay();
              return;
            }
            data.type = _this.manager.helper.formatType(data);
            type = data.type.substring(data.type.indexOf('(') + 1, data.type.length);
            matches = type.match(_this.manager.regExp.params);
            if (matches != null ? matches[matches.length - 1].startsWith(' :') : void 0) {
              matches.splice(matches.length - 1);
            }
            if (matches != null ? matches[paramPosition] : void 0) {
              offsetFix = paramPosition > 0 ? ' ' : '';
              data.type = data.type.replace(matches[paramPosition], offsetFix + ("<span class=\"current-param\">" + matches[paramPosition] + "</span>"));
            }
            _this.view.setData({
              word: data.exprName,
              label: data.type,
              docs: {
                doc: data.doc,
                url: data.url,
                origin: data.origin
              }
            });
            return _this.setPosition();
          });
        };
      })(this));
    };

    Type.prototype.hide = function() {
      return this.view.classList.remove('active');
    };

    Type.prototype.show = function() {
      return this.view.classList.add('active');
    };

    Type.prototype.destroy = function() {
      var _ref;
      this.destroyOverlay();
      if ((_ref = this.view) != null) {
        _ref.destroy();
      }
      return this.view = null;
    };

    return Type;

  })();

}).call(this);
