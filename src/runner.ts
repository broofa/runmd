// Logic for running script blocks in a runmd document

import { spawn } from 'node:child_process';
import { readdir, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { RunmdBlock } from './RunmdBlock.js';
import type RunmdDoc from './RunmdDoc.js';
import { BOOTSTRAP_IMPORT_PATH } from './RunmdDoc.js';

export type RunBlocksResult = {
  scriptPath: string;
  exitCode: number | null;
  signal: NodeJS.Signals | null;
};

export type RunmdMessage = {
  action: 'result' | 'console';
  lineNum: number;
  output: string;
};

function isRunmdMessage(obj: unknown): obj is RunmdMessage {
  const message = obj as RunmdMessage;
  return (
    message?.action !== undefined &&
    ['result', 'console'].includes(message.action)
  );
}

export async function runDoc(doc: RunmdDoc) {
  let setupBlock: RunmdBlock | undefined;
  let jobBlocks: RunmdBlock[] = [];

  const blocks: (RunmdBlock | undefined)[] = doc.getBlocks();
  blocks.push(undefined); // Sentinel to flush out last job blocks

  for (const block of blocks) {
    // Run blocks if this is a module block, a setup block, or the end of the doc
    if (!block || block.isSetup() || block?.isModule()) {
      if (jobBlocks.length > 0) {
        await runBlocks(doc, setupBlock, jobBlocks);
      }

      // Reset
      jobBlocks = [];
    }

    if (!block) break;

    if (block.isSetup()) {
      setupBlock = block;
    } else {
      jobBlocks.push(block);
    }
  }
}

async function runBlocks(
  doc: RunmdDoc,
  setupBlock: RunmdBlock | undefined,
  blocks: RunmdBlock[]
) {
  const firstBlock = blocks[0];
  if (!firstBlock) return;

  let script: string = '';
  for (const block of blocks) {
    script += [
      '//',
      `// Block at line ${block.lineNum}`,
      '//',
      '',
      `${block.toScript()};`,
      ''
    ].join('\n');
  }

  const sourcePath = path.resolve(process.cwd(), doc.sourcePath);
  const sourceDir = path.dirname(sourcePath);
  const namePrefix = `_runmd-${path.basename(sourcePath)}`;
  const setupScriptPath = path.join(
    sourceDir,
    `${namePrefix}-${firstBlock.lineNum}-setup.mjs`
  );

  // Cleanup old scripts from prior runs
  await cleanup(sourceDir, namePrefix);

  if (setupBlock) {
    await writeFile(setupScriptPath, `${setupBlock.toScript()}\n`, 'utf8');
  }
  const scriptPath = path.join(
    sourceDir,
    `${namePrefix}-${firstBlock.lineNum}.ts`
  );
  await writeFile(scriptPath, `${script}\n`, 'utf8');
  try {
    return await new Promise<RunBlocksResult>((resolve, reject) => {
      const nodeArgs = ['--no-warnings', '--import', BOOTSTRAP_IMPORT_PATH];
      if (setupBlock) {
        nodeArgs.push('--import', setupScriptPath);
      }
      nodeArgs.push(scriptPath);

      // console.log('RUNNING:', 'node', ...nodeArgs);
      const child = spawn(process.execPath, nodeArgs, {
        cwd: sourceDir,
        stdio: ['ignore', 'pipe', 'pipe', 'ipc']
      });

      child.stdout?.pipe(process.stdout);
      child.stderr?.pipe(process.stderr);

      child.on('message', (message: unknown) => {
        if (!isRunmdMessage(message)) {
          return;
        }

        const line = doc.lineAtLineNum(message.lineNum);
        if (!line) {
          console.warn(
            `Value received with unexpected line number #(${message.lineNum}) `
          );
          return;
        }

        switch (message.action) {
          case 'result':
            line.addValue(message.output);
            break;
          case 'console':
            line.addValue(message.output);
            break;
        }
      });

      child.on('close', (exitCode, signal) => {
        if (exitCode !== 0) {
          reject(new Error(`Script exited with code ${exitCode ?? signal}`));
        } else {
          resolve({ scriptPath, exitCode, signal });
        }
      });
      child.on('error', (err) => {
        console.log('EXIT CODE', child.exitCode);
        reject(err);
      });
    });
  } finally {
    if (!setupBlock?.args.debug) {
      await cleanup(sourceDir, namePrefix);
    }
  }
}

async function cleanup(sourceDir: string, namePrefix: string) {
  const existing = await readdir(sourceDir).catch(() => [] as string[]);
  await Promise.all(
    existing
      .filter((f) => f.startsWith(namePrefix))
      .map((f) => unlink(path.join(sourceDir, f)).catch(() => undefined))
  );
}
