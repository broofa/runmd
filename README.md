# runmd

Run JavaScript in your Markdown files

## Install

```shell
npm install readme_js
```

## Usage

```shell
cp README.md README_js.md
```

Wherever you have `````javascript`` blocks, add one or more of the **Markdown Options* below. Then ...

```shell
runmd README_js.md --output README.md

# Or ...
runmd README_js.md > README.md
```

# Markdown Options

## --run

Runs the script, appending any console.log output

    ```javascript --run
    console.log('Hello, World!');
    ```

Renders as:

    ```javascript
    console.log('Hello, World!');

    ⋖ Hello, World!
    ````

(Note: This option may be omitted if other options are set

## --context[=name]

Create or restore a named execution context.  If `name` hasn't been seen before,
a new context is created.  Otherwise the previously created context for `name`
is applied when the script is run.

    ```javascript --context
    let text = 'Hello';
    ```

    ```javascript --context=world
    let text = 'World!';
    ```

    ```javascript --context
    console.log(text);
    ```

    ```javascript --context=world
    console.log(text);
    ```

Renders as:

    ```javascript
    let text = 'Hello';
    ```

    ```javascript
    let text = 'World!';
    ```

    ```javascript
    console.log(text);

    ⋖ Hello
    ```

    ```javascript
    console.log(text);

    ⋖ World!
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

Renders as:

    Blah blah markdown whatever

    More blah blah markdown whatever

    ```javascript
    hello();

    ⋖ Hello, World!
    ```

# Real example / test

See corresponding section in [README_js.md](./README_js.md) for the source of
this section.
```javascript
console.log('No context: text is', typeof(text));

⋖ No context: text is undefined
```

```javascript
console.log('Default context: text is', text);

⋖ Default context: text is Hello
```

```javascript
console.log('"blarg" context: text is', text);

⋖ "blarg" context: text is World!
```

