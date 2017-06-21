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

```shell
cp README.md README_js.md

# Edit README_js.md to add Markdown Options (below) to your "```javascript" blocks
# Then ...

runmd README_js.md --output README.md
```

## For Module Authors ...

Want to avoid publishing with an out-of-date README file?  Add a 'prepare'
script to `package.json` scripts block:

    "scripts": {
      "prepare": "runmd README_js.md --output README.md"
    }

and `npm` will refuse to publish if any of the code in your
README fails to run:


# Markdown Options

## --run

Runs the script, appending any console.log output.  E.g.:

    ```javascript --run
    console.log('Hello, World!');
    ```

... becomes:

    ```javascript
    console.log('Hello, World!');

    ⇒ Hello, World!
    ````

(`--run` may be omitted if other options are present.)

## --context[=name]

Create/apply a persistent execution context.

Without this option, each code block runs in a new context (i.e. all state
resets).  To share context across blocks, add `--context`, like so:

    ```javascript --context
    let text = 'World';
    ```

    Continuing on ...

    ```javascript --context
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

## --hide

Run the script, but do not render the script source or output.  Mostly useful
in conjunction with `--context` for setting up an execution context.

    Welcome!

    ```javascript --context --hide
    // Setup/utility code or whatever ...
    function hello() {
      console.log('Hello, World!');
    }
    ```

    Here's a code snippet:

    ```javascript --context
    hello();
    ```

... becomes:

    Welcome!

    Here's a code snippet:

    ```javascript
    hello();

    ⇒ Hello, World!
    ```

## setLineTransformer [Experimental]

RunMD also allows you to transform your markdown.  Just supply a line
transformation function:

    ```javascript --hide
    setTransformLine((line, isRunning) => return !isRunning ? line.toUpperCase() : line);
    ```

The `isRunning` argument will be `true` for any lines that are interpreted as
code by this module.  Transformations do not affect interpreted source, only how
source is rendered.

Return `null` to omit the line from the rendered output.

# Pro-Tip: RunMD + Chrome + Markdown Preview Plus

There's more than one way to visualize changes to Markdown files as you edit
them, but
the following works pretty well for me:

  * Install [the Markdown Preview Plus](https://goo.gl/iDhAL) Chrome
  * ... Allow it to access file URLs" (in chrome://extensions tab)
  * ... Set Reload Frequency to "1 second" (in the extension options)
  * Launch `runmd` with the `--watch` option to have it continuously re-render your output file when you make a change to the input file
  * Open your output file in Chrome

... now any time you make a change to the input file, the rendered output will appear in Chrome shortly after

----
Markdown generated from [src/README_js.md](src/README_js.md) by [![RunMD Logo](http://i.imgur.com/h0FVyzU.png)](https://github.com/broofa/runmd)