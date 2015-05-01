(function() {
  var SnippetParser, removeCharFromString;

  module.exports = SnippetParser = (function() {
    function SnippetParser() {}

    SnippetParser.prototype.reset = function() {
      this.inSnippet = false;
      this.inSnippetBody = false;
      this.snippetStart = -1;
      this.snippetEnd = -1;
      this.bodyStart = -1;
      this.bodyEnd = -1;
      return this.escapedBraceIndices = null;
    };

    SnippetParser.prototype.findSnippets = function(text) {
      var body, char, colonIndex, groupEnd, groupStart, i, index, rightBraceIndex, snippets, _i, _j, _len;
      if (!(text.length > 0 && text.indexOf('$') !== -1)) {
        return;
      }
      this.reset();
      snippets = [];
      for (index = _i = 0, _len = text.length; _i < _len; index = ++_i) {
        char = text[index];
        if (this.inSnippet && this.snippetEnd === index) {
          body = text.slice(this.bodyStart, this.bodyEnd + 1);
          body = this.removeBraceEscaping(body, this.bodyStart, this.escapedBraceIndices);
          snippets.push({
            snippetStart: this.snippetStart,
            snippetEnd: this.snippetEnd,
            bodyStart: this.bodyStart,
            bodyEnd: this.bodyEnd,
            body: body
          });
          this.reset();
          continue;
        }
        if (this.inSnippet && index >= this.bodyStart && index <= this.bodyEnd) {
          this.inBody = true;
        }
        if (this.inSnippet && (index > this.bodyEnd || index < this.bodyStart)) {
          this.inBody = false;
        }
        if (this.bodyStart === -1 || this.bodyEnd === -1) {
          this.inBody = false;
        }
        if (this.inSnippet && !this.inBody) {
          continue;
        }
        if (this.inSnippet && this.inBody) {
          continue;
        }
        if (!this.inSnippet && text.indexOf('${', index) === index) {
          colonIndex = text.indexOf(':', index + 3);
          if (colonIndex !== -1) {
            groupStart = index + 2;
            groupEnd = colonIndex - 1;
            if (groupEnd >= groupStart) {
              for (i = _j = groupStart; groupStart <= groupEnd ? _j < groupEnd : _j > groupEnd; i = groupStart <= groupEnd ? ++_j : --_j) {
                if (isNaN(parseInt(text.charAt(i)))) {
                  colonIndex = -1;
                }
              }
            } else {
              colonIndex = -1;
            }
          }
          rightBraceIndex = -1;
          if (colonIndex !== -1) {
            i = index + 4;
            while (true) {
              rightBraceIndex = text.indexOf('}', i);
              if (rightBraceIndex === -1) {
                break;
              }
              if (text.charAt(rightBraceIndex - 1) === '\\') {
                if (this.escapedBraceIndices == null) {
                  this.escapedBraceIndices = [];
                }
                this.escapedBraceIndices.push(rightBraceIndex - 1);
              } else {
                break;
              }
              i = rightBraceIndex + 1;
            }
          }
          if (colonIndex !== -1 && rightBraceIndex !== -1 && colonIndex < rightBraceIndex) {
            this.inSnippet = true;
            this.inBody = false;
            this.snippetStart = index;
            this.snippetEnd = rightBraceIndex;
            this.bodyStart = colonIndex + 1;
            this.bodyEnd = rightBraceIndex - 1;
            continue;
          } else {
            this.reset();
          }
        }
      }
      return snippets;
    };

    SnippetParser.prototype.removeBraceEscaping = function(body, bodyStart, escapedBraceIndices) {
      var bodyIndex, i, _i, _len;
      if (escapedBraceIndices != null) {
        for (i = _i = 0, _len = escapedBraceIndices.length; _i < _len; i = ++_i) {
          bodyIndex = escapedBraceIndices[i];
          body = removeCharFromString(body, bodyIndex - bodyStart - i);
        }
      }
      return body;
    };

    return SnippetParser;

  })();

  removeCharFromString = function(str, index) {
    return str.slice(0, index) + str.slice(index + 1);
  };

}).call(this);
