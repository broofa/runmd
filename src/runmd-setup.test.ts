import assert from 'node:assert';
import { spawnSync } from 'node:child_process';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const thisDir = path.dirname(fileURLToPath(import.meta.url));

test('runmd.importMap remaps module specifiers', async () => {
  const tempDir = await mkdtemp(path.join(tmpdir(), 'runmd-import-map-'));
  const setupPath = path.join(thisDir, 'runmd-setup.ts');
  const targetModulePath = path.join(tempDir, 'mapped.mjs');
  const entryPath = path.join(tempDir, 'entry.mjs');

  await writeFile(targetModulePath, `export const answer = 42;\n`);
  await writeFile(
    entryPath,
    `
      globalThis.runmd.importMap = { alias: './mapped.mjs' };
      const mod = await import('alias');
      process.stdout.write(String(mod.answer));
    `,
    'utf8',
  );

  try {
    const result = spawnSync(
      process.execPath,
      ['--import', setupPath, entryPath],
      {
        cwd: tempDir,
        encoding: 'utf8',
      },
    );

    assert.equal(result.status, 0, result.stderr);
    assert.equal(result.stdout.trim(), '42');
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
});
