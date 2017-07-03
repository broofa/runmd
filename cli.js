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

// Class that for capturing the result of evaluating a line of code, and rendering the result
class ResultLine {
  constructor(id, line) {
    this.id = id;
    this.line = line;
    this._result = util.inspect(undefined);
  }

  get bare() {
    return this.line.replace(RESULT_RE, '');
  }

  get prefix() {
    return this.line.replace(RESULT_RE, '').replace(/./g, ' ') + '// ';
  }

  get scriptLine() {
    const trimmed = this.line.replace(RESULT_RE, '').replace(/^\s+|[\s;]+$/g, '');
    // You can't wrap an expression in ()'s if it also has a var declaration, so
    // so we do a bit of regex hacking to wrap just the expression part, here
    /(^\s*(?:const|let|var)[\w\s,]*=\s)*(.*)/.test(trimmed);

    return `${RegExp.$1} __.results[${this.id}].result = (${RegExp.$2});`;
  }

  set result(val) {
    this._result = util.inspect(val, {breakLength: 120});
  }

  toString() {
    const lines = this._result
      .split('\n')
      .map((line, i) => i == 0 ? '// \u21e8 ' + line: this.prefix + line);
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
    const outputLines = [];
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

    const getContext = (name = 'default') => {
      if (name && contexts[name]) {
        return contexts[name];
      }
      const require = requireLike(inputFile, true);

      const log = function(...args) {
        args = args.map(arg => typeof(arg) == 'string' ? arg: util.inspect(arg));
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
          runContext = getContext(runArgs.context);

          hide = !!runArgs.hide;
          lineOffset = lineNo + 1;
          line = line.replace(/\s.*/, '');
        }
      } else if (runArgs && /^```/.test(line)) {
        const script = scriptLines.join('\n');
        scriptLines.length = 0;
        write('');

        const _timeout = setTimeout;
        setTimeout = runContext.setTimeout
        vm.runInContext(script, runContext, {
          lineOffset,
          filename: inputFile
        });

        runContext.setTimeout.flush();
        setTimeout = _timeout;
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
