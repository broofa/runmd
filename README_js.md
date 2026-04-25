```javascript --run --debug
runmd.importMap = {imports: {}};
```

# RunMD ![example workflow](https://github.com/broofa/runmd/actions/workflows/ci.yml/badge.svg)

Run and annotate JS or TS code blocks in MarkDown files!

[!Note] `runmd@2` is a complete rework of this project designed to work with ESM. CJS is no longer supported, node>=22 is now required, and Markdown files built for prior versions will not work.

## Install

```shell
npm install runmd
```

## Quick Start

1. Make a copy of your existing README. E.g. `cp README.md README_js.md`
2. Edit `README_js.md` to `--run` flag to ` ```javascript` blocks you'd like processed
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

The context resets when a **Setup block** is encountered.  The **Setup block** is run as part of setting up the new context.

The context also resets when a **Module block** is encountered.  `runmd` will run the most recently encountered **Setup block**, then run the **Module block**.  For example:

```javascript --run
// "runmd" here makes this a Setup block (context resets)
runmd.importMap = {imports: {}};
```

```javascript --run
globalThis['run'+'md']; // RESULT
const foo = 123;
// Simple block - we have access to previous block state
foo + 321; // RESULT
```

```javascript --run
runmd
```


```javascript --run
import 'node:path';  // "import" here makes this a Module block

```javascript --run
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


