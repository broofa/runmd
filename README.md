<!--
  -- This file is auto-generated from src/README_js.md. Changes should be made there.
  -->
# ![RunMD Logo](http://i.imgur.com/cJKo6bU.png)

Run JS code blocks in markdown files and annotate them with the output.

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

### ES6 Imports

**Some** ES6 import incantations will work, however this feature should be
considered very experimental at this point.  Read the source [for
details](https://github.com/broofa/runmd/blob/master/index.js#L229-L246).

## NPM Integration

To avoid publishing when compilation of your README file fails:

    "scripts": {
      "prepare": "runmd README_js.md --output README.md"
    }

## Markdown API

### --run

Runs the script, appending any console.log output.  E.g.:

<table>
<tr><th>Input</th><th>Output</th></tr>
<tr>
<td valign=top>
<pre>
```javascript --run
console.log('Hello, World!');
```
</pre>
</td>
<td valign=top>
<pre>
```javascript
console.log('Hello, World!');
⇨ Hello, World!
```
</pre>
</td>
</tr>
</table>

`--run` may be omitted if other options are present.

### --run [context_name]

Allows for the creation of different JS contexts with different variable name spaces.  Blocks with the same context name share the same variables.  E.g...

<table>
<tr><th>Input</th><th>Output</th></tr>
<tr>
<td valign=top>
<pre>
```javascript --run sample
let text = 'World';
```
</pre>
</td>
<td valign=top>
<pre>
```javascript
let text = 'Hello';
```
</pre>
</td>
</tr>
<tr><td valign=top colspan=2>Continuing on ... </td></tr>
<tr>
<td valign=top>
<pre>
```javascript --run sample
console.log(text);
```
</pre>
</td>
<td valign=top>
<pre>
```javascript
console.log(text);
⇨ Hello
```
</pre>
</td>
</tr>
<tr>
<td valign=top colspan=2>
Attempting to reference state in a different context will error...
</td>
</tr>
<tr>
<td valign=top>
<pre>
```javascript --run
console.log(text);
```
</pre>
</td>
<td valign=top>
<em>ReferenceError: text is not defined</em>
</td>
</tr>
</table>


### --hide

Run the script, but do not render the script source or output.  This is useful
for setting up context that's necessary for code, but not germane to
documentation.

<table>
<tr><th>Input</th><th>Output</th></tr>
<tr>
<td valign=top>
<pre>
Welcome!
&nbsp;
```javascript --run foo --hide
// Setup/utility code or whatever ...
function hello() {
  console.log('Hello, World!');
}
```
&nbsp;
Here is a code snippet:
&nbsp;
```javascript --run foo
hello();
```
</pre>
</td>
<td valign=top>
<pre>
Welcome!
&nbsp;
Here's a code snippet:
&nbsp;
```javascript
hello();
⇨ Hello, World!
```
</pre>
</td>
</tr>
</table>

### "// RESULT"

Result values may be displayed for ***for single line expressions*** by
appending "// RESULT" to the end of a line.

RunMD will error if the line is not a self-contained, evaluate-able, expression.

<table>
<tr><th>Input</th><th>Output</th></tr>
<tr>
<td valign=top>
<pre>
```javascript --run
var x = 'foo' + 'bar'; // RESULT
```
</pre>
</td>
<td valign=top>
<pre>
```javascript
var x = 'foo' + 'bar'; // ⇨ 'foobar'
```
</pre>
</td>
</tr>
</table>

## runmd Object

A global `runmd` object is provided to all contexts. It supports the following
events:

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
Markdown generated by [![RunMD Logo](http://i.imgur.com/h0FVyzU.png)](https://github.com/broofa/runmd)
