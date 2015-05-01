(function() {
  var fs, path, temp;

  temp = require('temp').track();

  path = require('path');

  fs = require('fs-plus');

  describe('Autocomplete Manager', function() {
    var autocompleteManager, completionDelay, didAutocomplete, directory, editor, editorView, filePath, mainModule, _ref;
    _ref = [], directory = _ref[0], filePath = _ref[1], completionDelay = _ref[2], editorView = _ref[3], editor = _ref[4], mainModule = _ref[5], autocompleteManager = _ref[6], didAutocomplete = _ref[7];
    beforeEach(function() {
      runs(function() {
        var sample, workspaceElement;
        directory = temp.mkdirSync();
        sample = 'var quicksort = function () {\n  var sort = function(items) {\n    if (items.length <= 1) return items;\n    var pivot = items.shift(), current, left = [], right = [];\n    while(items.length > 0) {\n      current = items.shift();\n      current < pivot ? left.push(current) : right.push(current);\n    }\n    return sort(left).concat(pivot).concat(sort(right));\n  };\n\n  return sort(Array.apply(this, arguments));\n};\n';
        filePath = path.join(directory, 'sample.js');
        fs.writeFileSync(filePath, sample);
        atom.config.set('autosave.enabled', true);
        atom.config.set('autocomplete-plus.enableAutoActivation', true);
        atom.config.set('editor.fontSize', '16');
        completionDelay = 100;
        atom.config.set('autocomplete-plus.autoActivationDelay', completionDelay);
        completionDelay += 100;
        workspaceElement = atom.views.getView(atom.workspace);
        return jasmine.attachToDOM(workspaceElement);
      });
      waitsForPromise(function() {
        return atom.packages.activatePackage('autosave');
      });
      waitsForPromise(function() {
        return atom.workspace.open(filePath).then(function(e) {
          editor = e;
          return editorView = atom.views.getView(editor);
        });
      });
      waitsForPromise(function() {
        return atom.packages.activatePackage('language-javascript');
      });
      waitsForPromise(function() {
        return atom.packages.activatePackage('autocomplete-plus').then(function(a) {
          return mainModule = a.mainModule;
        });
      });
      waitsFor(function() {
        var _ref1;
        return (_ref1 = mainModule.autocompleteManager) != null ? _ref1.ready : void 0;
      });
      return runs(function() {
        var displaySuggestions;
        advanceClock(mainModule.autocompleteManager.providerManager.defaultProvider.deferBuildWordListInterval);
        autocompleteManager = mainModule.autocompleteManager;
        displaySuggestions = autocompleteManager.displaySuggestions;
        return spyOn(autocompleteManager, 'displaySuggestions').andCallFake(function(suggestions, options) {
          displaySuggestions(suggestions, options);
          return didAutocomplete = true;
        });
      });
    });
    afterEach(function() {
      return didAutocomplete = false;
    });
    return describe('autosave compatibility', function() {
      return it('keeps the suggestion list open while saving', function() {
        runs(function() {
          expect(editorView.querySelector('.autocomplete-plus')).not.toExist();
          editor.moveToBottom();
          editor.moveToBeginningOfLine();
          editor.insertText('f');
          return advanceClock(completionDelay);
        });
        waitsFor(function() {
          return didAutocomplete === true;
        });
        runs(function() {
          editor.save();
          didAutocomplete = false;
          expect(editorView.querySelector('.autocomplete-plus')).toExist();
          editor.insertText('u');
          return advanceClock(completionDelay);
        });
        waitsFor(function() {
          return didAutocomplete === true;
        });
        return runs(function() {
          var suggestionListView;
          editor.save();
          didAutocomplete = false;
          expect(editorView.querySelector('.autocomplete-plus')).toExist();
          suggestionListView = atom.views.getView(autocompleteManager.suggestionList);
          atom.commands.dispatch(suggestionListView, 'autocomplete-plus:confirm');
          return expect(editor.getBuffer().getLastLine()).toEqual('function');
        });
      });
    });
  });

}).call(this);
