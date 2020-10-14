(function(window, exports, $, showdown, Prism) {
  var MDP = function(config) {
    if (!config.presentationElement) {
      throw 'Must configure a presentationElement selector';
    }

    this.presentationElement = $(config.presentationElement);
    this.data = config.data;
    this.sectionPreprocessLookup = config.sectionPreprocess || {};
    this.sections = [];
    this.notes = {};
    this.current = 0;
  };

  MDP.prototype.tagLookup = {
    'H1': function() {
      return false;
    },
    'P': function(element) {
      const $element = $(element);

      if ($element.children().length === 1 && $element.children().first()[0].tagName === "IMG") {
        return;
      }

      this.notes[this.sections.length - 1] = this.notes[this.sections.length - 1] || $("<div />");
      this.notes[this.sections.length - 1] = this.notes[this.sections.length - 1].append($element.clone());

      return false;
    },
    'H2': function(element, sections) {
      var splits = $(element).html().split('ID:');
      var section;

      if (splits[1]) {
        if (splits[1].match(/\s+ANIMATE$/)) {
          splits[0] += " ANIMATE";
        }

        section = $('<section data-id="' + splits[1].replace(/\s+ANIMATE/, "") + '">');
      }
      else {
        section = $('<section>');
      }

      $(element).html(splits[0]);

      sections.push(section);

      return section;
    },
    'H3': function(element) {
      var splits = element.innerText.split('ID:');

      if (splits[1]) {
        if (splits[1].match(/\s+ANIMATE$/)) {
          splits[0] += " ANIMATE";
        }

        $(element).attr("data-id", splits[1].replace(/\s*ANIMATE/, ""))
          .text(splits[0]);
      }
    }
  };

  MDP.prototype.updateCurrent = function() {
    var lookup = this.sectionPreprocessLookup[
      this.sections[this.current].attr('data-id')
    ];

    if (lookup) {
      this.cleanup = lookup(this.sections[this.current]);
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

    if (this.notesBody) {
      if (this.notes[this.current]) {
        this.notesBody.empty().append(this.notes[this.current].clone());
      }
      else {
        this.notesBody.empty().append("No Notes.");
      }
    }
  }

  MDP.prototype.onKeyup = function(event) {
    var oldCurrent = this.current;
    var animateElements = this.presentationElement.children().first().children().filter("[data-animate]");
    var hiddenElements = animateElements.filter(":hidden");
    var visibleElements = animateElements.filter(":visible");
    var isBack = false;

    if (event.which === 37) {
      if (visibleElements.length) {
        visibleElements
          .last()
          .hide();

        return;
      }

      if (this.current > 0) {
        isBack = true;
        this.current--;
      }
    } else if (event.which === 32 || event.which === 13 || event.which === 39) {
      if (hiddenElements.length) {
        hiddenElements
          .first()
          .fadeIn();

        return;
      }

      if (this.current < this.sections.length - 1) {
        this.current++;
      }
    }

    if (this.current !== oldCurrent) {
      if (this.cleanup) {
        this.cleanup();
      }

      this.presentationElement.children()
        .first()
          .detach()
          .hide();

      if (isBack) {
        this.sections[this.current].children().filter("[data-animate]").show();
      }
      else {
        this.sections[this.current].children().filter("[data-animate]").hide();
      }

      this.sections[this.current].appendTo(
        this.presentationElement.empty()
      ).show();

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
      ).each((i, element) => {
        var result;

        if (element.tagName === undefined) {
          return;
        }

        if (that.tagLookup[element.tagName]) {
          result = that.tagLookup[element.tagName].call(this, element, that.sections);
        }

        if (element.innerText.match(/ANIMATE$/)) {
          $(element)
            .hide()
            .attr("data-animate", true);

          element.innerHTML = element.innerHTML.replace(/ANIMATE<|ANIMATE$/, "");
        }

        if (result === false) {
          return;
        }

        if (result !== undefined) {
          if (currentSection) {
            currentSection.attr("data-tags", currentSection.tags.join("-"));
          }

          currentSection = result;
          currentSection.tags = [];
        } else {
          result = element;
        }

        currentSection.tags.push(element.tagName);
        currentSection.append(element);
      });

      if (window.location.hash) {
        this.current = parseInt(window.location.hash.replace('#', ''), 10);
      }

      this.presentationElement
        .empty()
        .append(this.sections[this.current]);

      this.sections[this.current].fadeIn();

      if (Object.keys(this.notes).length) {
        this.notesWindow = window.open(undefined, "_blank", "toolbar=0,location=0,menubar=0,modal=yes,alwaysRaised=yes,width=500,height=500");
        this.notesBody = $(this.notesWindow.document.body)
          .attr("style", "background-color: #000000; font-size: 2em; color: #eeeeee; font-family: Helvetica; padding: 5em;");
      }

      this.updateCurrent();

      $('body').keyup(function(event) {
        that.onKeyup(event);
      });

      window.onbeforeunload = () => {
        this.notesWindow.close();
      }
    }
  };

  if (window) {
    window.MarkdownPresentation = MDP;
  }

  if (typeof exports === 'object') {
    exports.MDP = MDP;
  }
})(window, exports, $, showdown, Prism);
