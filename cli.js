#!/usr/bin/env node

const minimist = require('minimist');
const assert = require('assert');
const fs = require('fs');
const stream = require('stream');
const util = require('util');
const vm = require('vm');

const argv = minimist(process.argv.slice(2));

if (argv._.length != 1) {
  console.log(argv);
  console.warn('Must specify exactly one input file');
  process.exit(1);
}

let output = process.stdout.fd;
if (argv.output) {
  if (!/\.md$/.test(argv.output)) throw new Error(`Output file ${argv.output} must have .md extension`);

  output = fs.openSync(argv.output, 'w');
}
let hide = false;

function write(...args) {
  if (!hide) fs.writeSync(output, args.join(' ') + '\n');
}


function getContext(name) {
  if (name && contexts[name]) return contexts[name];

  const context = vm.createContext({
    console: {
      log: function(...args) {
        args = args.map(arg => typeof(arg) == 'string' ? arg: util.inspect(arg));
        let lines = args.join(' ').split('\n');
        lines = lines.map(line => '\u22d6 ' + line);
        lines.unshift('');
        if (!hide) write(lines.join('\n'));
      }
    },

    require,
  });

  if (name) contexts[name] = context;
  return context;
}

const source = fs.readFileSync(argv._[0], 'utf8');
lines = source.split('\n');
const scriptLines = [];
let lineOffset = 0;
let contexts = {};
let runArgs;

lines.forEach((line, lineNo) => {
  if (!runArgs) {
    runArgs = /^```javascript\s+(--.*)?/i.test(line) && RegExp.$1;
    if (runArgs) {
      runArgs = minimist(runArgs.split(/\s+/));
      hide = runArgs.hide;
      lineOffset = lineNo + 1;
      line = line.replace(/\s.*/, '');
    }
  } else if (runArgs && /^```/.test(line)) {
    script = scriptLines.join('\n');
    scriptLines.length = 0;
    vm.runInContext(script, getContext(runArgs.context), {lineOffset});

    runArgs = false;
  } else if (runArgs) {
    scriptLines.push(line);
  }

  if (!hide) write(line);
});

if (argv.output) fs.closeSync(output);
