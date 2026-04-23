#!/usr/bin/env node --no-warnings

import { Command } from 'commander';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';

import RunmdDoc from './RunmdDoc.ts';

const HEADER_TEMPLATE = `<!--
  -- This file is auto-generated from INPUT_NAME. Changes should be made there.
  -->
`;

const FOOTER_TEMPLATE = `

---
Generated from [INPUT_NAME](INPUT_NAME) by [RunMD](https://github.com/broofa/runmd)
`;

const program = new Command();
program
  .argument('[input_file]', 'markdown file to process')
  .option('-o, --output <file>', 'output file')
  .option('--no-footer', 'remove RunMD footer')
  .option('-w, --watch', 'watch for changes')
  .parse();

const inputName = program.args[0]!;
const options = program.opts();
const { noFooter, watch, output: outputName } = options;

// Full paths (input and output)
const inputPath = path.resolve(process.cwd(), inputName);
let outputPath: string | undefined;
if (outputName) {
  if (!/\.md$/.test(outputName)) {
    throw new Error(`Output file ${outputName} must have .md extension`);
  }

  outputPath = outputName && path.resolve(process.cwd(), outputName);
}

/**
 * Render input file to output.  (args passed by fs.watchFile)
 */
async function run(curr?: fs.Stats, prev?: fs.Stats) {
  // Do nothing if file not modified
  if (curr && prev && curr.mtime === prev.mtime) return;

  let markdown;
  try {
    // Read input file
    const inputText = fs.readFileSync(inputPath, 'utf8');

    // Render it
    const doc = await RunmdDoc.fromFile(inputPath);
    markdown = await doc.render();

    markdown =
      HEADER_TEMPLATE.replaceAll(/INPUT_NAME/g, inputName ?? '(stdin)') +
      markdown;

    // Add footer (unless --no-footer)
    if (!noFooter) {
      markdown += FOOTER_TEMPLATE.replaceAll(
        /INPUT_NAME/g,
        inputName ?? '(stdin)',
      );
    }

    // Format with prettier, if available
    markdown = await formatWithPrettier(markdown, inputPath, outputPath);

    // Write to output (file or stdout)
    if (outputPath) {
      fs.writeFileSync(outputPath, markdown);

      if (watch) {
        console.log('Rendered', outputName);
      }
    } else {
      process.stdout.write(markdown);
      process.stdout.write('\n');
    }
  } catch (err) {
    if (!watch) throw err;
    console.error(err);
  }
}

await run();

// If --watch, rerender when file changes
if (watch) fs.watchFile(inputPath, run);

async function formatWithPrettier(
  markdown: string,
  inputFile: string,
  outputFile?: string,
) {
  const requireFromInput = createRequire(
    path.join(path.dirname(inputFile), '_'),
  );

  let prettier: typeof import('prettier') | undefined;
  try {
    const prettierPath = requireFromInput.resolve('prettier');
    const prettierModule = await import(prettierPath);
    prettier =
      (prettierModule as { default?: typeof import('prettier') }).default ??
      (prettierModule as typeof import('prettier'));
  } catch (err) {
    console.log(
      `Prettier not found (${(err as Error).message}), skipping formatting`,
    );
    return markdown;
  }

  try {
    const filepath = outputFile ?? inputFile;
    const options =
      (await prettier.resolveConfig(inputFile, { editorconfig: true })) ?? {};

    return await prettier.format(markdown, {
      ...options,
      filepath,
    });
  } catch (err) {
    console.error(`Error formatting with Prettier: ${(err as Error).message}`);
    return markdown;
  }
}
