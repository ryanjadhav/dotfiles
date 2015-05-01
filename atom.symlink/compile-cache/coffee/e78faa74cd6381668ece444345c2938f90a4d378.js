(function() {
  var completionDelay;

  completionDelay = 100;

  beforeEach(function() {
    spyOn(atom.views, 'readDocument').andCallFake(function(fn) {
      return fn();
    });
    spyOn(atom.views, 'updateDocument').andCallFake(function(fn) {
      return fn();
    });
    atom.config.set('autocomplete-plus.defaultProvider', 'Fuzzy');
    return atom.config.set('autocomplete-plus.suggestionListFollows', 'Word');
  });

  exports.triggerAutocompletion = function(editor, moveCursor, char) {
    if (moveCursor == null) {
      moveCursor = true;
    }
    if (char == null) {
      char = 'f';
    }
    if (moveCursor) {
      editor.moveToBottom();
      editor.moveToBeginningOfLine();
    }
    editor.insertText(char);
    return exports.waitForAutocomplete();
  };

  exports.waitForAutocomplete = function() {
    advanceClock(completionDelay);
    return waitsFor('autocomplete to show', function(done) {
      return setImmediate(function() {
        advanceClock(10);
        return setImmediate(function() {
          advanceClock(10);
          return done();
        });
      });
    });
  };

  exports.buildIMECompositionEvent = function(event, _arg) {
    var data, target, _ref;
    _ref = _arg != null ? _arg : {}, data = _ref.data, target = _ref.target;
    event = new CustomEvent(event, {
      bubbles: true
    });
    event.data = data;
    Object.defineProperty(event, 'target', {
      get: function() {
        return target;
      }
    });
    return event;
  };

  exports.buildTextInputEvent = function(_arg) {
    var data, event, target;
    data = _arg.data, target = _arg.target;
    event = new CustomEvent('textInput', {
      bubbles: true
    });
    event.data = data;
    Object.defineProperty(event, 'target', {
      get: function() {
        return target;
      }
    });
    return event;
  };

}).call(this);
