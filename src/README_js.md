# ![RunMD Logo](http://i.imgur.com/cJKo6bU.png)

Evaluate your Markdown code blocks and annotate them with the output.

Creating README files is a pain in the ass, especially when it comes to writing
code samples.  Code gets out of date, authors get sloppy, details get omitted,
etc.  This module makes allows you to show your readers code that they both you
and they can trust to be executable, with the actual output they should expect.

## Install

```shell
npm install readme_js
```

## Usage

`runmd [options] input_file`

Where `options` may be zero or more of:
  * `--output=output_file` file to write specify an output file
  * `--watch` Watch `input_file` for changes and rerender
  * `--lame` Suppress attribution footer

For example, to port an existing README.md file, do the following:

```shell
cp README.md README_js.md

# Edit README_js.md to add Markdown Options below to your "```javascript" blocks
# Then ...

runmd README_js.md --output README.md
```

## For Module Authors ...

Want to avoid publishing with an out-of-date README file?  Add the following to
`package.json` and `npm` will refuse to publish if any of the code in your
README fails to run:

    "prepare": "runmd README_js.md --output README.md"


# Markdown Options

## --run

Runs the script, appending any console.log output

    ```javascript --run
    console.log('Hello, World!');
    ```

... becomes:

    ```javascript
    console.log('Hello, World!');

    ⇒ Hello, World!
    ````

(Note: This option may be omitted if other options are set

## --context[=name]

Create/apply a persistent execution context.

This is useful interspersing code with explanatory text.  For example:

    ```javascript --context
    let text = 'Hello';
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

    Blah blah markdown whatever

    ```javascript --context --hide
    function hello() {
      console.log('Hello, World!');
    }
    ```

    More blah blah markdown whatever

    ```javascript --context
    hello();
    ```

... becomes:

    Blah blah markdown whatever

    More blah blah markdown whatever

    ```javascript
    hello();

    ⇒ Hello, World!
    ```

## setLineTransformer [Experimental]

A custom line transformation function may be supplied as follows:

    ```javascript --hide
    setTransformLine((line, isRunning) => return !isRunning ? line.toUpperCase() : line);
    ```

The `isRunning` argument will be `true` only for lines that that are
interpreted as code by this module.  Transformations do not affect interpreted source, only how source is rendered.

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
