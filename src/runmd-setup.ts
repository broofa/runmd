import { registerHooks } from 'node:module';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { formatResult } from './RunmdResultLine.ts';
import { type RunmdResultMessage } from './runner.ts';

declare global {
  var __runmdSetResult: (value: unknown, line: string, lineNum: number) => void;

  var runmd: {
    importMap?: Record<string, string>;
  };
}

globalThis.runmd ??= {};

registerHooks({
  resolve(specifier, context, nextResolve) {
    const importMap = globalThis.runmd.importMap;
    let mappedSpecifier = importMap?.[specifier];
    if (mappedSpecifier) {
      mappedSpecifier = resolve(
        dirname(fileURLToPath(context.parentURL ?? '')),
        mappedSpecifier,
      );
    }
    return nextResolve(mappedSpecifier ?? specifier, context);
  },
});

globalThis.__runmdSetResult = function (
  value: unknown,
  line: string,
  lineNum: number,
) {
  const result = formatResult(value, line, lineNum);
  const message: RunmdResultMessage = {
    from: 'runmd',
    lineNum,
    result,
  };

  // Pass result back to parent process
  process.send?.(message);
};
