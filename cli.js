#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const minimist = require('minimist');
const { render } = require('.');

const argv = minimist(process.argv.slice(2));

function usage () {
  console.log('Usage: runmd input_file [--lame] [--watch] [--output=output_file]');
  process.exit(1);
}

const inputName = argv._[0];
const outputName = argv.output;

// Check usage
if (!argv._.length) usage();

// Full paths (input and output)
const inputPath = path.resolve(process.cwd(), inputName);
let outputPath;
if (outputName) {
  if (!/\.md$/.test(outputName)) {
    throw new Error(`Output file ${outputName} must have .md extension`);
  }

  outputPath = outputName && path.resolve(process.cwd(), outputName);
}

/**
 * Render input file to output.  (args passed by fs.watchFile)
 */
function run (curr, prev) {
  // Do nothing if file not modified
  if (curr && prev && curr.mtime === prev.mtime) return;

  let markdown;
  try {
    // Read input file
    const inputText = fs.readFileSync(inputPath, 'utf8');

    // Render it
    markdown = render(inputText, {
      inputName,
      outputName,
      lame: argv.lame
    });

    // Write to output (file or stdout)
    if (outputPath) {
      fs.writeFileSync(outputPath, markdown);
      console.log('Rendered', argv.output);
    } else {
      process.stdout.write(markdown);
      process.stdout.write('\n');
    }
  } catch (err) {
    if (!argv.watch) throw err;
    console.error(err);
  }
}

run();

// If --watch, rerender when file changes
if (argv.watch) fs.watchFile(inputPath, run);
