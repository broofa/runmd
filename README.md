<!--
  -- This file is auto-generated from README_js.md. Changes should be made there.
  -->

# RunMD ![example workflow](https://github.com/broofa/runmd/actions/workflows/ci.yml/badge.svg)

Run and annotate JS or TS code blocks in MarkDown files!

Note: Version 2 is a bit of a reset for this project as far as how things are implemented. As of `runmd@2` CommonJS is no longer supported and and code is expected to use ESM. Also, `node@22+` is required.

## Install

```shell
npm install runmd
```

## Quick Start

1. Make a copy of your existing README. E.g. `cp README.md README_js.md`
2. Edit `README_js.md` and add the `--run` flag to any ` ```javascript` blocks you'd like processed
3. Add `// RESULT` or `console.log()` to add runtime state
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

### `--run` option

Add `--run` to any JS or TS code block (` ```js`, ` ```ts`, ` ```javascript`, ` ```typescript`) to enable `runmd` processing. E.g.:

    ```javascript --run
    `Hello, ${'Fred Smith'}!`; // RESULT
    ```

... becomes:

    ```javascript --run
    `Hello, ${'Fred Smith'}!`; // ⇨ 'Fred Smith!'
    ```

### `--hide` option

To remove a block from output, add the `--hide` option. For example:

    ```javascript --hide
    `... this block is removed from output`;
    ```

### `// RESULT`

Add `// RESULT` after an expression to document it's value.

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

> [!Note]
>
> The code in question must be self-contained on a single line. Multi-line
> expressions are not supported.

### `console.log`

Use `console.log(...)` to document one or more runtime values.

For example:

    ```javascript --run
    const item = { id: 42, tags: ['a', 'b'] };
    console.log(item);
    ```

... becomes:

    ```javascript --run
    const item = { id: 42, tags: ['a', 'b'] };
    console.log(item);
    // ⇨ { id: 42, tags: [ 'a', 'b' ] }
    ```

> [!Note]
>
> Like `// RESULT`, `console.log()` must be self-contained on a single line.
>
> Other console APIs (`error()`, `warn()`, `info()`, etc.) are not supported and
> will error.

### Loops

If multiple passes are made over a line with `// RESULT` or `console.log()`, all values will be shown in the order they were produced.

For example:

    ```javascript --run
    for (const word of 'The quick brown fox'.split(' ')) {
      word.toUpperCase(); //  RESULT
      console.log(word.match(/[aeiou]/g))
    }
    ```

... becomes:

    ```javascript --run
    for (const [_, word] in 'works for me'.split(' ')) {
      word.toUpperCase(); // ⇨ 'THE'
      // ⇨ 'QUICK'
      // ⇨ 'BROWN'
      // ⇨ 'FOX'
      console.log(word.match(/[aeiou]/g));
      // ⇨ [ 'e' ]
      // ⇨ [ 'u', 'i' ]
      // ⇨ [ 'o' ]
      // ⇨ [ 'o' ]
    }
    ```

## Types of blocks

`runmd` distinguishes between `--run`'able blocks as follows:

- **Setup block** - A block that references the `runmd` global
- **Module block** - A block that uses ESM `import` or `export` directives
- **Simple block** - Any other block

(Note that a **Setup block** can also be a **Module block**)

### Simple block context sharing

**Simple blocks** run in the same context as any preceding block. For example:

    ```javascript --run
    const foo = 'Hello';
    ```

    ```javascript --run
    foo + ', world!'; // `foo` is [still] defined
    ```

### Module block context sharing

The context resets when a **Setup block** is encountered. The **Setup block** is run as part of setting up the new context.

The context also resets when a **Module block** is encountered. `runmd` will run the most recently encountered **Setup block**, then run the **Module block**. For example:

```javascript
globalThis["run" + "md"]; // ⇨ { importMap: { imports: {} } }
const foo = 123;
// Simple block - we have access to previous block state
foo + 321; // ⇨ 444
```

```javascript
runmd;
```

```javascript
import "node:path"; // "import" here makes this a Module block
```

export default {}; //

### Setup block context sharing

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

### `runmd.onOutputLine`

The `runmd.onOutputLine` callback can be used to transform the generated markdown.

For example:

    ```javascript --run
    /**
     * @param {string} line Output line text.
     * @param {object|undefined} inBlock Current code block, if this line came from one.
     * @returns {string|undefined} Return undefined to drop the line, or a string to keep/replace it.
     */
    runmd.onOutputLine = (line, inBlock) => {
      if (line === '```javascript' || line === '```') {
        return undefined; // Drop code fence lines
      }

      if (!inBlock && line.startsWith('# ')) {
        return line.toUpperCase(); // Rewrite markdown headings
      }

      return line;
    };
    ```

---

Generated from [README_js.md](README_js.md) by [`runmd`](https://github.com/broofa/runmd)
