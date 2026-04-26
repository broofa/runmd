import { registerHooks } from 'node:module';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { RunmdBlock } from './RunmdBlock.js';
import { formatConsoleArgs } from './RunmdConsoleLine.js';
import { formatResult } from './RunmdResultLine.js';
import type { RunmdMessage } from './runner.js';

type ImportMap = {
  imports: Record<string, string>;
};

declare global {
  var __runmdSetResult: <T>(value: T, line: string, lineNum: number) => T;
  var __runmdConsoleLog: (
    lineNum: number,
    sourceLine: string,
    ...args: unknown[]
  ) => void;

  var runmd: {
    importMap?: ImportMap;

    onOutputLine?: (
      line: string,
      inBlock: RunmdBlock | undefined
    ) => string | undefined;

    /** @deprecated use importMap instead */
    onRequire?: never;
  };
}

globalThis.runmd ??= {};

registerHooks({
  resolve(specifier, context, nextResolve) {
    const importMap = globalThis.runmd.importMap;
    if (importMap) {
      if (isImportMap(importMap)) {
        const mappedSpecifier = importMap.imports[specifier];
        if (mappedSpecifier) {
          specifier = resolve(
            dirname(fileURLToPath(context.parentURL ?? '')),
            mappedSpecifier
          );
        }
      } else {
        throw new Error(
          'runmd.importMap must be an object with an "imports" property'
        );
      }
    }

    return nextResolve(specifier ?? specifier, context);
  }
});

globalThis.__runmdSetResult = <T>(value: T, line: string, lineNum: number) => {
  const output = formatResult(value, line);
  const message: RunmdMessage = {
    action: 'result',
    lineNum,
    output
  };

  // Pass result back to parent process
  process.send?.(message);

  return value;
};

globalThis.__runmdConsoleLog = (
  lineNum: number,
  sourceLine: string,
  ...args: unknown[]
) => {
  const output = formatConsoleArgs(args, sourceLine);
  const message: RunmdMessage = {
    action: 'console',
    lineNum,
    output
  };

  // Pass console output back to parent process
  process.send?.(message);
};

function isImportMap(obj: unknown): obj is ImportMap {
  if (typeof obj !== 'object' || obj === null) {
    return false;
  }
  const keys = Object.keys(obj as object);
  return keys.length === 0 || (keys.length === 1 && keys[0] === 'imports');
}
