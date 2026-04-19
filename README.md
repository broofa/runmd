# ![RunMD Logo](http://i.imgur.com/cJKo6bU.png) ![example workflow](https://github.com/broofa/runmd/actions/workflows/ci.yml/badge.svg)

Run code blocks in your markdown and annotate them with the output.

Creating README files is a pain, especially when it comes to writing code
samples. Code gets out of date, authors get sloppy, details get omitted, etc.
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

- `--output=output_file` file to write specify an output file
- `--watch` Watch `input_file` for changes and rerender
- `--lame` Suppress attribution footer

For example, to port an existing README.md file:

    cp README.md README_js.md

Edit README_js.md to add Markdown Options (below) to your ````javascript`
blocks, then ...

    runmd README_js.md --output README.md

## Limitations

RunMD scripts are run using [Node.js' `vm` module](https://nodejs.org/api/vm.html).
This environment is limited in "interesting" ways, and RunMD runs fast and loose with some APIs. Specifically:

- `console.log()` works, but no other `console` methods are supported at this
  time
- `setTimeout()` works, but all timers fire immediately at the end of script
  execution. `clearTimeout`, `setInterval`, and `clearInterval` are not
  supported

[Note: PRs fleshing out these and other missing APIs would be "well received"]

### ES6 Imports

**Some** ES6 import incantations will work, however this feature should be
considered very experimental at this point. Read the source [for
details](https://github.com/broofa/runmd/blob/master/index.js#L229-L246).

## NPM Integration

To avoid publishing when compilation of your README file fails:

    "scripts": {
      "prepare": "runmd README_js.md --output README.md"
    }

## Markdown API

### --run

Runs the script, appending any console.log output. E.g.:

---

Generated from [README_js.md](README_js.md) by <a href="https://github.com/broofa/runmd"><img height="13" alt="RunMD logo" src="https://i.ibb.co/wZ01ZCWL/logo.png" /></a>
