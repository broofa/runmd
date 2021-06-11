const path = require('path');
const util = require('util');
const vm = require('vm');
const minimist = require('minimist');
const requireLike = require('require-like');

const RESULT_RE = /\/\/\s*RESULT\s*$/;
const LARGE_RESULT_LINES = 2; // Number of lines that constitute a "large" result

/**
 * Represents a line of source showing an evaluated expression
 */
class ResultLine {
  constructor(id, line) {
    this.id = id;
    this.line = line;
    this._result = util.inspect(undefined);
  }

  /** Source w/out RESULT comment e*/
  get bare() {
    return this.line.replace(RESULT_RE, '');
  }

  /** Source w/out indenting */
  get undent() {
    return this.line.replace(/^\S.*/, '');
  }

  /** String needed to line up with RESULT comment */
  get prefix() {
    return this.line.replace(RESULT_RE, '').replace(/./g, ' ') + '// ';
  }

  /** Executable source needed to produce result */
  get scriptLine() {
    // Trim string (including trailing ';')
    const trimmed = this.line.replace(RESULT_RE, '').replace(/^\s+|[\s;]+$/g, '');

    // You can't wrap an expression in ()'s if it also has a var declaration, so
    // we do a bit of regex hacking to wrap just the expression part, here
    /(^\s*(?:const|let|var)[\w\s,]*=\s)*(.*)/.test(trimmed);

    // Script line with code needed to set the result in the context-global
    // `__.results` object
    return `${RegExp.$1} __.results[${this.id}].result = (${RegExp.$2});`;
  }

  /** Set result of evaluating line's expression */
  set result(val) {
    const MAX_LEN = 130; // Github horizontal scrollbars appear at ~140 chars

    this._result = util.inspect(val, {
      depth: null,
      breakLength: Math.max(40, MAX_LEN - this.prefix.length)
    });

    // If result spans multiple lines, move it to the next line
    if (this._result.split('\n').length >= LARGE_RESULT_LINES) {
      this._result = util.inspect(val, {
        depth: null,
        breakLength: MAX_LEN - this.undent.length
      });
    }
  }

  /** Fully rendered line output */
  toString() {
    let lines = this._result.split('\n');
    let prefix = this.prefix;

    if (lines.length >= LARGE_RESULT_LINES) {
      lines.unshift('');
      prefix = this.undent + '  // ';
    }

    lines = lines.map((line, i) => i == 0 ? '// \u21e8 ' + line : prefix + line);
    return this.bare + lines.join('\n');
  }
}

/**
 * Create a VM context factory.  Creates a function that creates / returns VM
 * contexts.
 */
function _createCache(runmd, inputName, write) {
  const contexts = new Map();

  /**
   * Get a [named] VM execution context
   *
   * @param {String} [name] of context to reuse / create
   */
  return function(name) {
    if (name && contexts.has(name)) return contexts.get(name);

    // require() function that operates relative to input file path, ignore
    // existing require() cache
    if (!inputName) inputName = path.join(process.cwd(), '(stdin)');
    const contextRequire = requireLike(inputName, true);

    // Create console shim that renders to our output file
    const log = function(...args) {
      // Stringify args with util.inspect
      args = args.map(arg => typeof(arg) == 'string' ? arg : util.inspect(arg, {depth: null}));
      const lines = args.join(' ').split('\n').map(line => '\u21d2 ' + line);

      write(...lines);
    };
    const consoleShim = {
      log,
      warn: log,
      error: log,
    };

    // Crude setTimeout shim.  Callbacks are invoked immediately after script
    // block(s) run
    const _timers = [];
    let _time = Date.now();

    const timeoutShim = function(callback, delay) {
      _timers.push({callback, time: _time + delay});
      _timers.sort((a, b) => a.time < b.time ? -1 : (a.time > b.time ? 1 : 0));
    };

    timeoutShim.flush = function() {
      let timer;
      while (timer = _timers.shift()) { // eslint-disable-line no-cond-assign
        _time = timer.time;
        timer.callback();
      }
    };

    // Create VM context
    const context = vm.createContext({
      console: consoleShim,

      __: {results: []},

      process,

      require: ref => {
        if (runmd.onRequire) ref = runmd.onRequire(ref);
        return contextRequire(ref);
      },

      runmd,

      setTimeout: timeoutShim
    });

    // Named contexts get cached
    if (name) contexts.set(name, context);

    return context;
  };
}

/**
  * Render RunMD-compatible markdown file
  *
  * @param {String} text to transform
  * @param {Object}  [options]
  * @param {String}  [options.inputName] name of input file
  * @param {String}  [options.outputName] name of output file
  * @param {Boolean}  [options.lame] if true, disables RunMD footer
  */
function render(inputText, options = {}) {
  const {inputName, outputName, lame} = options;

  // Warn people against editing the output file (only helps about 50% of the
  // time but, hey, we tried!)
  const outputLines = inputName ? [
    `<!--`,
    `  -- This file is auto-generated from ${inputName}. Changes should be made there.`,
    `  -->`
  ] : [];

  const scriptLines = [];
  let lineOffset = 0;
  let runArgs;
  let runContext = {};
  let hide = false;

  // Read input file, split into lines
  const lines = inputText.split('\n');

  // Add line(s) to output (when --hide flag not active)
  function _write(...lines) {
    if (hide) return;
    outputLines.push(...lines.filter(line => line != null));
  }

  // State available to all contexts as `runmd`
  const runmd = {
    // Hook for transforming output lines
    onOutputLine: null,

    // Hook for transforming require()'s
    onRequire: null,

    // Make Date available for duck-patching
    Date
  };

  // Clear VM context cache
  const getContext = _createCache(runmd, inputName, _write);

  // Process each line of input
  lines.forEach((line, lineNo) => {
    if (!runArgs) {
      // Look for start of script block with '--(arg)' arguments
      runArgs = /^```javascript\s+(--.*)?/i.test(line) && RegExp.$1;
      if (runArgs) {
        runArgs = minimist(runArgs.split(/\s+/));

        // Get runContext for this script block
        runContext = getContext(runArgs.run === true ? '' : runArgs.run);

        hide = !!runArgs.hide;
        lineOffset = lineNo + 1;
        line = line.replace(/\s.*/, '');
      }
    } else if (runArgs && /^```/.test(line)) {
      // End of script block.  Process the script lines we gathered

      let script = scriptLines.join('\n');

      // Limited support for ES6-style imports. Transforms some "import"
      // patterns into CommonJS require()'s via regex.
      script = script
      // "import { X as Y } from 'Z'"
        .replace(
          /import\s*\{\s*([^\s]+)\s+as\s+([^\s]+)\s*\}\s*from\s*['"]([^']+)['"]/g,
          'const { $1: $2 } = require("$3")',
        )
      // "import { X } from 'Z'"
        .replace(
          /import\s*\{\s*([^\s]+)\s*\}\s*from\s*['"]([^']+)['"]/g,
          'const { $1 } = require("$2")',
        )
      // ES6: "import X from 'Z'"
        .replace(
          /import\s([^\s]+)\sfrom\s*['"]([^']+)['"]/g,
          'const $1 = require("$2")',
        );

      // Clear out script lines
      scriptLines.length = 0;

      // Replace setTimeout globally
      // (is this necessary since we define it in each context?!? I've
      // forgotten :-p )
      const _timeout = setTimeout;
      setTimeout = runContext.setTimeout; // eslint-disable-line no-global-assign

      // Run the script (W00t!)
      try {
        vm.runInContext(script, runContext, {
          lineOffset,
          filename: inputName || '(input string)'
        });
      } finally {
        // Flush pending timers
        runContext.setTimeout.flush();

        // Restore system setTimeout
        setTimeout = _timeout; // eslint-disable-line no-global-assign
      }
      runContext = null;

      runArgs = false;
      if (hide) line = null;
      hide = false;
    } else if (runArgs) {
      // Line is part of a script block

      // If line has a RESULT comment, turn it into a ResultLine that injects
      // the value of the expression into the comment
      if (!hide && RESULT_RE.test(line)) {
        const resultId = runContext.__.results.length;
        line = runContext.__.results[resultId] = new ResultLine(resultId, line);
      }

      scriptLines.push(line.scriptLine || line);
    }

    // Add line to output
    if (!hide) {
      // onOutputLine for user script transforms
      if (line != null && runmd.onOutputLine) line = runmd.onOutputLine(line, !!runArgs);

      _write(line);
    }
  });

  const LINK = '[![RunMD Logo](https://i.imgur.com/h0FVyzU.png)](https://github.com/broofa/runmd)';
  if (!lame) {
    _write('----');
    _write(outputName ?
      `Markdown generated from [${inputName}](${inputName}) by ${LINK}` :
      `Markdown generated by ${LINK}`);
  }

  return outputLines.join('\n');
}

module.exports = {
  render
};
