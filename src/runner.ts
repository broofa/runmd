// Logic for running script blocks in a runmd document

import { spawn } from 'node:child_process';
import { unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { RunmdBlock } from './RunmdBlock.ts';
import RunmdDoc, { BOOTSTRAP_IMPORT_PATH } from './RunmdDoc.ts';
import { RunmdResultLine } from './RunmdResultLine.ts';

export type RunBlocksResult = {
  scriptPath: string;
  exitCode: number | null;
  signal: NodeJS.Signals | null;
};

export type RunmdResultMessage = {
  from: 'runmd';
  lineNum: number;
  value: unknown;
};

function isRunmdMessage(obj: unknown): obj is RunmdResultMessage {
  return (obj as any)?.from === 'runmd';
}

export async function runDoc(doc: RunmdDoc) {
  let jobno = 0;
  let setupBlock: RunmdBlock | undefined;
  let jobBlocks: RunmdBlock[] = [];

  const blocks: (RunmdBlock | undefined)[] = doc.getBlocks();
  blocks.push(undefined); // Sentinel to flush out last job blocks

  for (const block of blocks) {
    // Run blocks if we this is a module block, a setup block, or the end of the doc
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
  blocks: RunmdBlock[],
) {
  const firstBlock = blocks[0];
  if (!firstBlock) return;

  let script: string = '';
  for (const block of blocks) {
    script += `\n\n//---  Block at line ${block.lineNum}---\n`;
    script += `${block.toScript()}\n\n`;
  }

  const sourcePath = doc.sourcePath
    ? path.resolve(process.cwd(), doc.sourcePath)
    : path.resolve(process.cwd(), 'stdin.md');
  const sourceDir = path.dirname(sourcePath);
  const pathBase = path.join(
    sourceDir,
    `__runmd-${path.basename(sourcePath)}-${firstBlock.lineNum}`,
  );

  let setupScriptPath: string | undefined;
  if (setupBlock) {
    setupScriptPath = `${pathBase}-setup.ts`;
    await writeFile(setupScriptPath, `${setupBlock.toScript()}\n`, 'utf8');
  }
  const scriptPath = `${pathBase}.ts`;
  await writeFile(scriptPath, `${script}\n`, 'utf8');

  try {
    return await new Promise<RunBlocksResult>((resolve, reject) => {
      const nodeArgs = ['--no-warnings', '--import', BOOTSTRAP_IMPORT_PATH];
      if (setupScriptPath) {
        nodeArgs.push('--import', setupScriptPath);
      }
      nodeArgs.push(scriptPath);

      // console.log('RUNNING:', 'node', ...nodeArgs);
      const child = spawn(process.execPath, nodeArgs, {
        cwd: sourceDir,
        stdio: ['ignore', 'pipe', 'pipe', 'ipc'],
      });

      child.stdout?.pipe(process.stdout);
      child.stderr?.pipe(process.stderr);

      child.on('message', (message: unknown) => {
        if (!isRunmdMessage(message)) {
          return;
        }

        RunmdResultLine.setResultForLine(message.lineNum, message.value);
      });

      child.on('close', (exitCode, signal) => {
        resolve({ scriptPath, exitCode, signal });
      });
      child.on('error', reject);
    });
  } finally {
    await unlink(scriptPath).catch(() => undefined);
    if (setupScriptPath) {
      await unlink(setupScriptPath).catch(() => undefined);
    }
  }
}
