# markdown-slideshow

Convert a markdown document into an HTML and JS based slideshow.

# Markdown Setup
The markdown file should follows some simple rules:
* **`#` level headers are ignored by default**, they should be used for dictating structure in your presentation
* **`##` level headers indicate a new slide**, they are also the primary header for the new slide. Headers can end in `ID:SOME_STRING` to denote a unique identifier for that header. This can then be used for the `sectionPreprocess` configuration (see below).
* **Paragraphs are ignored by default**, they should be used for presenter notes
* All other elements reflect their appropriate HTML elements and can be styled as such.

# File Setup
## HTML
```
<html>
  <head>
    <title>Markdown Slideshow Demo</title>

    <link href="../node_modules/prismjs/themes/prism.css" rel="stylesheet"> </link>

    <script src="../node_modules/jquery/dist/jquery.min.js"> </script>
    <script src="../node_modules/showdown/dist/showdown.min.js"> </script>
    <script src="../node_modules/prismjs/prism.js"> </script>
    <script src="../node_modules/markdown-presentation/src/markdown-presentation.js"> </script>
  </head>
  <body>
    <div class="presentation-parent"> </div>

    <script>
      var pres = new MarkdownPresentation({
        presentationElement: '.presentation-parent',
        data: mySlideData
      });

      pres.start();
    </script>
  </body>
</html>
```

# Configuration
## Configuration Object
```JavaScript
{
  presentationElement: '.foo',
  data: `
# Intro
## Slide 1
## Slide 2
# Closing
## Slide 3 ID: slide3
`,
  sectionPreprocess: {
    'slide3': function() {
      // Do some stuff when the slide is opened

      return function() {
        // Do some stuff when the slide is closed
      }
    }
  }

}
```

# Grunt Setup

If you wish to use a separate `.md` file for your slide document, you will either
need to manually copy over the markdown into JavaScript, run the code on a local
or remote webserver, or use something like Grunt to manage the copying for you.

To help with the setup, I've included an example grunt config below, this uses
`fs` and `grunt-replace`. This set up assumes you name the markdown file and
the resulting

## Gruntfile.js
```JavaScript
var sourceFile = './presentation';
var destinationDir = './dist';
var fs = require('fs');
var markdown = fs.readFileSync(sourceFile + '.md', { encoding: 'utf8' });

markdown = markdown.replace(/```/g, '\\`\\`\\`');

module.exports = function (grunt) {
  var config = {
    replace: {
      dev: {
        options: {
          patterns: [
            {
              match: 'MARKDOWN',
              replacement: markdown
            }
          ],
        },
        files: [{
          src: [sourceFile + '.js'],
          dest: destinationDir
        }]
      }
    }
  };
}
```

## presentation.js
```
var data =
`
@@MARKDOWN
`;
```
