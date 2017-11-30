(function(window, exports, $, showdown, Prism) {
  var MDP = function(config) {
    if (!config.presentationElement) {
      throw 'Must configure a presentationElement selector';
    }

    this.presentationElement = $(config.presentationElement);
    this.data = config.data;
    this.sectionPreprocessLookup = config.sectionPreprocess || {};
    this.sections = [];
    this.current = 0;
  };

  MDP.prototype.tagLookup = {
    'H1': function() {
      return false;
    },
    'P': function() {
      return false;
    },
    'H2': function(element, sections) {
      var id = element.innerText.split('ID:');
      var section;

      element.innerText = id[0];

      section = $('<section data-id="' + id[1] + '">')
      sections.push(section);

      return section;
    }
  };

  MDP.prototype.updateCurrent = function() {
    var lookup = this.sectionPreprocessLookup[
      this.sections[this.current].attr('data-id')
    ];

    if (lookup) {
      this.cleanup = lookup();
    }

    if (Prism) {
      this.sections[this.current]
        .find('code')
        .html(
          Prism.highlight(
            this.sections[this.current].find('code')
              .text(),
            Prism.languages.javascript
          )
        );
    }
  }

  MDP.prototype.onKeyup = function(event) {
    var oldCurrent = this.current;

    if (event.which === 37) {
      if (this.current > 0) {
        this.current--;
      }
    } else if (event.which === 32 || event.which === 13) {
      if (this.current < this.sections.length - 1) {
        this.current++;
      }
    }

    if (this.current !== this.oldCurrent) {
      if (this.cleanup) {
        this.cleanup();
      }

      this.presentationElement.children()
        .first()
          .detach()
          .hide();

      this.sections[this.current].appendTo(
        this.presentationElement.empty()
      ).fadeIn();

      this.updateCurrent();

      window.location.hash = this.current;
    }
  }

  MDP.prototype.start = function() {
    var that = this;
    var currentSection;

    if (this.presentationElement.length) {
      $(
        (new showdown.Converter({
          disableForced4SpacesIndentedSublists: true
        }))
        .makeHtml(this.data)
      ).each(function(i, element) {
        var result;

        if (element.tagName === undefined) {
          return;
        }

        if (that.tagLookup[element.tagName]) {
          result = that.tagLookup[element.tagName](element, that.sections);
        }

        if (result === false) {
          return;
        }

        if (result !== undefined) {
          currentSection = result;
        } else {
          result = element;
        }

        currentSection.append(element);
      });

      if (window.location.hash) {
        this.current = parseInt(window.location.hash.replace('#', ''), 10);
      }

      this.presentationElement
        .empty()
        .append(this.sections[this.current]);

      this.sections[this.current].fadeIn();

      this.updateCurrent();

      $('body').keyup(function(event) {
        that.onKeyup(event);
      });
    }
  };

  if (window) {
    window.MarkdownPresentation = MDP;
  }

  if (typeof exports === 'object') {
    exports.MDP = MDP;
  }
})(window, exports, $, showdown, Prism);
