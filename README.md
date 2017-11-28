<!--
  -- This file is auto-generated from src/README_js.md. Changes should be made there.
  -->
# ![RunMD Logo](http://i.imgur.com/cJKo6bU.png)

Run code blocks in your markdown and annotate them with the output.

Creating README files is a pain, especially when it comes to writing code
samples.  Code gets out of date, authors get sloppy, details get omitted, etc.
RunMD takes the pain out of this process.

With RunMD, your readers can trust your code blocks are runnable and that code
output will be as-claimed.

## Install

```shell
npm install runmd
```

## Usage

`runmd [options] input_file`

Where `options` may be zero or more of:
  * `--output=output_file` file to write specify an output file
  * `--watch` Watch `input_file` for changes and rerender
  * `--lame` Suppress attribution footer

For example, to port an existing README.md file:

    cp README.md README_js.md

Edit README_js.md to add Markdown Options (below) to your ````javascript`
blocks, then ...

    runmd README_js.md --output README.md

## Limitations

RunMD scripts are run using [Node.js' `vm` module](https://nodejs.org/api/vm.html).
This environment is limited in "interesting" ways, and RunMD runs fast and loose with some APIs.  Specifically:

  * `console.log()` works, but no other `console` methods are supported at this
  time
  * `setTimeout()` works, but all timers fire immediately at the end of script
  execution. `clearTimeout`, `setInterval`, and `clearInterval` are not
  supported

[Note: PRs fleshing out these and other missing APIs would be "well received"]

## NPM Integration

To avoid publishing when compilation of your README file fails:

    "scripts": {
      "prepare": "runmd README_js.md --output README.md"
    }

## Markdown API

### --run

Runs the script, appending any console.log output.  E.g.:

    ```javascript --run
    console.log('Hello, World!');
    ```

... becomes:

    ```javascript
    console.log('Hello, World!');

    ⇒ Hello, World!
    ````

`--run` may be omitted if other options are present.

### --run [context_name]

If a `context_name` is provided, all blocks with that name will share the same
runtime context. E.g.

    ```javascript --run sample
    let text = 'World';
    ```

    Continuing on ...

    ```javascript --run sample
    console.log(text);
    ```

... becomes:

    ```javascript
    let text = 'Hello';
    ```

    Continuing on ...

    ```javascript
    console.log(text);

    ⇒ Hello
    ```

... but trying to reference `text` in a new context or other named context will
fail:

    ```javascript --run
    console.log(text);
    ```

(Results in `ReferenceError: text is not defined`.)

### --hide

Run the script, but do not render the script source or output.  This is useful
for setting up context that's necessary for code, but not germane to
documentation.

    Welcome!

    ```javascript --run foo --hide
    // Setup/utility code or whatever ...
    function hello() {
      console.log('Hello, World!');
    }
    ```

    Here is a code snippet:

    ```javascript --run foo
    hello();
    ```

... becomes:

    Welcome!

    Here's a code snippet:

    ```javascript
    hello();

    ⇒ Hello, World!
    ```

### "// RESULT"

Inline values ***for single line expressions*** may be displayed by appending
"// RESULT" to the end of a line.  Note: RunMD will error if the line is not a
self-contained, evaluate-able, expression.

    ```javascript --run
    ['Hello', ' World!'].join(','); // RESULT
    ```

... becomes:

    ```javascript
    ['Hello', ' World!'].join(','); // ⇨ 'Hello, World!'
    ```

## runmd Object

A global `runmd` object is provided all contexts, and supports the following:

### runmd.onRequire

The `onRequire` event gives pages the opportunity to transform module require
paths.  This is useful if the module context in which you render markdown is
different from what your readers will typically encounter.  (Often the case with
npm-published modules).

    ```javascript --hide
    // Remap `require('uuid/*') to `require('./*')
    runmd.onRequire = function(path) {
      return path.replace(/^uuid\//, './');
    }
    ```

### runmd.onOutputLine

The `onOutputLine` event gives pages the opportunity to transform markdown output.

    ```javascript --hide
    runmd.onOutputLine = function(line, isRunning) {
      return !isRunning ? line.toUpperCase() : line);
    }
    ```

The `isRunning` argument will be `true` for any lines that are interpreted as
code by this module.  Transformations do not affect interpreted source, only how
source is rendered.

Return `null` to omit the line from the rendered output.

# Recommended workflow: RunMD + Chrome + Markdown Preview Plus

There's more than one way to visualize changes to Markdown files as you edit
them, but the following works pretty well for me:

  * Install [the Markdown Preview Plus](https://goo.gl/iDhAL) Chrome
  * ... Allow it to access file URLs" (in chrome://extensions tab)
  * ... Set Reload Frequency to "1 second" (in the extension options)
  * Launch `runmd` with the `--watch` option to have it continuously re-render your output file as you make changes
  * Open the output file in Chrome, and it will update in realtime as you make changes to your runmd input file(s)

----
Markdown generated from [src/README_js.md](src/README_js.md) by [![RunMD Logo](http://i.imgur.com/h0FVyzU.png)](https://github.com/broofa/runmd)