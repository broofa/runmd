import { registerHooks } from 'node:module';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { type RunmdResultMessage } from './runner.ts';

declare global {
  var __setRunmdResult: (lineNum: number, value: unknown) => unknown;

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

globalThis.__setRunmdResult = (lineNum: number, value: unknown) => {
  const message: RunmdResultMessage = {
    from: 'runmd',
    lineNum,
    value,
  };

  // Pass result back to parent process
  process.send?.(message);
};
