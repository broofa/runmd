import { registerHooks } from 'node:module';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { formatResult } from './RunmdResultLine.ts';
import type { RunmdResultMessage } from './runner.ts';

type ImportMap = {
  imports: Record<string, string>;
};

declare global {
  var __runmdSetResult: <T>(value: T, line: string, lineNum: number) => T;

  var runmd: { importMap?: ImportMap };
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
  const result = formatResult(value, line, lineNum);
  const message: RunmdResultMessage = {
    from: 'runmd',
    lineNum,
    result
  };

  // Pass result back to parent process
  process.send?.(message);

  return value;
};

function isImportMap(obj: unknown): obj is ImportMap {
  if (typeof obj !== 'object' || obj === null) {
    return false;
  }
  const keys = Object.keys(obj as object);
  return keys.length == 0 || (keys.length === 1 && keys[0] === 'imports');
}
