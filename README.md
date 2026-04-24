<!--
  -- This file is auto-generated from README_js.md. Changes should be made there.
  -->

# RunMD ![example workflow](https://github.com/broofa/runmd/actions/workflows/ci.yml/badge.svg)

Run and annotate JS or TS code blocks in MarkDown files!

Creating README files is a pain, especially when it comes to code samples. Code
changes, the samples get out of date, details get omitted, and the output the code is supposed to produce ends up being... diggerent.

RunMD to the rescue! Adding RunMD to your toolchain insures the code samples in your Markdown files are runnable, complete, and accurate.

[!Note] `runmd@2` is a complete rework of this project designed to work with ESM. CJS is no longer supported, node@24 is now required, and Markdown files built for prior versions will not work.

## Install

```shell
npm install runmd
```

## Quick Start

To make an existing README.md file RunMD-compatible:

1. Make a copy of your README. E.g. `cp README.md README_js.md`
2. Edit README_js.md and add a `--run` flag to any ` ```javascript` block you'd like evaluated
3. Add `// RESULT` comments to show the runtime value of an expression.
4. Run it with `runmd README_js.md --output README.md`

## Usage

```shell
$ runmd --help
Usage: runmd [options] <input_file>

Arguments:
  input_file           markdown file to process

Options:
  -o, --output <file>  output file
  --no-footer          remove RunMD footer
  -w, --watch          watch for changes
  -h, --help           display help for command
```

## Markdown API

### `--run` block option

Add `--run` to a ` ```javascript` block to run it through `runmd`. E.g.:

    ```javascript --run
    `Hello, ${'Fred Smith'}!`; // RESULT
    ```

... becomes:

    ```javascript --run
    `Hello, ${'Fred Smith'}!`; // ⇨ 'Fred Smith!'
    ```

`--run` may be omitted if other options are present.

### `// RESULT` comments

As shown above, `// RESULT` comments get replaced with the value of the expression immediately to their left.

> [!IMPORTANT]
>
> This only works for one-line expressions. Trying to do this for multi-line
> expressions will break runmd in unexpected ways.

For example:

    ```javascript --run
    const a = 'Hello'; // RESULT
    a + ', world!'; // RESULT
    ```

... becomes:

    ```javascript
    const a = "Hello"; // ⇨ 'Hello'
    a + ", world!"; // ⇨ 'Hello, world!'
    ```

## Types of blocks

`runmd` distinguishes between `--run`'able blocks as follows:

- "Setup block" - A block that references the `runmd` global
- "Module block" - A block that uses ESM `import` or `export` directives
- "Simple block" - Any other block

(Note that a Setup block can also be a Module block)

### Context sharing

Blocks can and do share the same runtime context, depending on their type and order. Simple blocks that follow one another (standard markdown is allowed in between) will all run in the same context. For example:

    ```javascript --run
    const a = 'Hello';
    ```

    ```javascript --run
    a + ', world!'; // `a` is available from the previous block
    ```

### Context boundaries

A new context is created any time a Setup block is encountered.

A new context is also created any time a Module block is encountered. In this case, the most recently seen setup block will be run before the Module block or any subsequent Simple blocks.

### `runmd.importMap`

`runmd` has basic support for [import maps](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/script/type/importmap) in the form of `runmd.importMap.imports`. For example:

    ```javascript --run
    runmd.importMap = {
      imports: {
        'foo': './src/foo.ts'
      }
    }
    ```

    ```javascript --run
    import foo from 'foo';  // Imports './src/foo.ts'
    ```

---

Generated from [README_js.md](README_js.md) by [`runmd`](https://github.com/broofa/runmd)
