#!/usr/bin/env node

const fs = require('fs');
const minimist = require('minimist');
const path = require('path');
const requireLike = require('require-like');
const util = require('util');
const vm = require('vm');

const LINK = '[![RunMD Logo](http://i.imgur.com/h0FVyzU.png)](https://github.com/broofa/runmd)';
const RESULT_RE = /\/\/\s*RESULT\s*$/;

const argv = minimist(process.argv.slice(2));

// Class for capturing the result of evaluating a line of code, and rendering the result
const LARGE_RESULT_LINES = 3; // Number of lines that constitute a "large" result
class ResultLine {
  constructor(id, line) {
    this.id = id;
    this.line = line;
    this._result = util.inspect(undefined);
  }

  get bare() {
    return this.line.replace(RESULT_RE, '');
  }

  get indent() {
    return this.line.replace(/\S.*/, '');
  }

  get prefix() {
    return this.line.replace(RESULT_RE, '').replace(/./g, ' ') + '// ';
  }

  get scriptLine() {
    const trimmed = this.line.replace(RESULT_RE, '').replace(/^\s+|[\s;]+$/g, '');
    // You can't wrap an expression in ()'s if it also has a var declaration, so
    // we do a bit of regex hacking to wrap just the expression part, here
    /(^\s*(?:const|let|var)[\w\s,]*=\s)*(.*)/.test(trimmed);

    return `${RegExp.$1} __.results[${this.id}].result = (${RegExp.$2});`;
  }

  set result(val) {
    const MAX_LEN = 80;

    this._result = util.inspect(val, {
      depth: null,
      breakLength: Math.max(40, MAX_LEN - this.prefix.length)
    });

    // If result spans multiple lines, move it to the next line
    if (this._result.split('\n').length >= LARGE_RESULT_LINES) {
      this._result = util.inspect(val, {depth: null});
    }
  }

  toString() {
    let lines = this._result.split('\n');
    let prefix = this.prefix;

    if (lines.length >= LARGE_RESULT_LINES) {
      lines.unshift('');
      prefix = this.indent + '  // ';
    }

    lines = lines.map((line, i) => i == 0 ? '// \u21e8 ' + line : prefix + line);
    return this.bare + lines.join('\n');
  }
}

class Renderer {
  constructor(inputFile, outputFile) {
    this.inputFile = path.resolve(process.cwd(), inputFile);
    if (outputFile) {
      if (!/\.md$/.test(outputFile)) throw new Error(
        `Output file ${outputFile} must have .md extension`);

      this.outputFile = outputFile && path.resolve(process.cwd(), outputFile);
      this.pathTo = path.relative(path.dirname(this.outputFile), this.inputFile);
    }

    this.onOutputLine = null;
    this.onRequire = null;
  }

  render(options) {
    const outputLines = [
      `<!--`,
      `  -- This file is auto-generated from ${argv._[0]}. Changes should be made there.`,
      `  -->`
    ];
    const scriptLines = [];
    const contexts = [];
    let hide = false;
    let lineOffset = 0;
    let runArgs;
    let runContext = {};
    let transformLine = false;
    let requirePath = false;

    const inputFile = this.inputFile;
    const source = fs.readFileSync(inputFile, 'utf8');
    const lines = source.split('\n');

    function write(...args) {
      if (!hide) outputLines.push(...args);
    }

    const getContext = name => {
      if (name && contexts[name]) {
        return contexts[name];
      }
      const require = requireLike(inputFile, true);

      const log = function(...args) {
        args = args.map(arg => typeof(arg) == 'string' ? arg: util.inspect(arg, {depth: null}));
        let _out = args.join(' ').split('\n');
        _out = _out.map(line => '\u21d2 ' + line);
        if (!hide) write(_out.join('\n'));
      }

      const consoleShim = {
        isRunmd: true,
        log: log,
        warn: log,
        error: log,
      };

      const _timers = [];
      let _time = Date.now();

      const timeoutShim = function(callback, delay) {
        _timers.push({callback, time: _time + delay});
        _timers.sort((a,b) => a.time < b.time ? -1 : (a.time > b.time ? 1 : 0));
      };

      timeoutShim.flush = function() {
        let timer;
        while(timer = _timers.shift()) {
          _time = timer.time;
          timer.callback();
        }
      };

      let context = {
        console: consoleShim,

        __: {results: []},

        process,

        require: (path) => {
          if (this.onRequire) path = this.onRequire(path);
          return require(path);
        },

        runmd: this,

        setTimeout: timeoutShim
      };

      context = vm.createContext(context);

      if (name) contexts[name] = context;
      return context;
    }

    lines.forEach((line, lineNo) => {
      if (!runArgs) {
        runArgs = /^```javascript\s+(--.*)?/i.test(line) && RegExp.$1;
        if (runArgs) {
          runArgs = minimist(runArgs.split(/\s+/));
          runContext = getContext(runArgs.run === true ? '' : runArgs.run);

          hide = !!runArgs.hide;
          lineOffset = lineNo + 1;
          line = line.replace(/\s.*/, '');
        }
      } else if (runArgs && /^```/.test(line)) {
        const script = scriptLines.join('\n');
        scriptLines.length = 0;
        write('');

        // Replace setTimeout globally
        // (is this necessary since we define it in each context?!? I've
        // forgotton :-p )
        const _timeout = setTimeout;
        setTimeout = runContext.setTimeout
        try {
          vm.runInContext(script, runContext, {
            lineOffset,
            filename: inputFile
          });
        } finally {
          runContext.setTimeout.flush();
          setTimeout = _timeout;
        }
        runContext = null;

        runArgs = false;
        if (hide) line = null;
        hide = false;
      } else if (runArgs) {
        // Replace "// RESULT" comments with the result of the line-expression
        if (!hide && RESULT_RE.test(line)) {
          const resultId = runContext.__.results.length;
          line = runContext.__.results[resultId] = new ResultLine(resultId, line);
        }

        scriptLines.push(line.scriptLine || line);
      }

      if (!hide && line != null) {
        if (this.onOutputLine) line = this.onOutputLine(line, !!runArgs);
        if (line != null) write(line);
      }
    });

    if (options && !options.lame) {
      write('----');
      write(this.pathTo ?
        `Markdown generated from [${argv._[0]}](${this.pathTo}) by ${LINK}` :
        `Markdown generated by ${LINK}`);
    }

    if (this.outputFile) {
      const output = fs.openSync(this.outputFile, 'w');
      fs.writeSync(output, outputLines.join('\n'));
      fs.closeSync(output);
    } else {
      process.stdout.write(outputLines.join('\n'));
    }
  }
}

if (argv._.length != 1) {
  console.log(argv);
  console.warn('Must specify exactly one input file');
  process.exit(1);
}

if (argv.watch && !argv.output) {
  console.warn('--watch option requires --output=[output_file] option');
  process.exit(1);
}

const renderer = new Renderer(argv._[0], argv.output);
let mtime = 0;

function render(...args) {
  const stats = fs.statSync(renderer.inputFile);
  if (stats.mtime > mtime) {
    mtime = stats.mtime;
    try {
      renderer.render(argv);
    } catch (err) {
      if (!argv.watch) throw err;
      console.error(err);
    }
    if (argv.output) console.log('Rendered', argv.output);
  }

  if (argv.watch) setTimeout(render, 1000);
}

render();
