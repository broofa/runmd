<!--
  -- This file is auto-generated from README_js.md. Changes should be made there.
  -->

# ![RunMD Logo](http://i.imgur.com/cJKo6bU.png) ![example workflow](https://github.com/broofa/runmd/actions/workflows/ci.yml/badge.svg)

Run code blocks in your markdown and annotate them with the output.

Creating README files is a pain, especially when it comes to writing code
samples. Code gets out of date, authors get sloppy, details get omitted, etc.
RunMD takes the pain out of this process.

With RunMD, your readers can trust your code blocks are runnable and that code
output will be as-claimed.

[!IMPORTANT] `runmd@2` is a complete rework of this project. Markdown files built for prior versions will not work.

[!NOTE] `runmd@2` does not support CJS, and requires `node@24` or higher.

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

## NPM Integration

To avoid publishing when compilation of your README file fails:

    "scripts": {
      "prepare": "runmd README_js.md --output README.md"
    }

## Markdown API

### --run

Runs the script, appending any console.log output. E.g.:

---

Generated from [README_js.md](README_js.md) by [RunMD](https://github.com/broofa/runmd)
