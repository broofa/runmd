import assert from 'node:assert';
import { describe, test } from 'node:test';
import RunmdDoc from './RunmdDoc.ts';

const TESTS: {
  file: string;
  partCount: number;
  blockCount: number;
}[] = [
  {
    file: 'src/samples/basic.md',
    partCount: 4,
    blockCount: 1
  },
  {
    file: 'src/samples/contexts.md',
    partCount: 12,
    blockCount: 6
  },
  {
    file: 'src/samples/module.md',
    partCount: 4,
    blockCount: 2
  }
];

describe('RunmdDoc.fromFile', () => {
  for (const { file, partCount, blockCount } of TESTS) {
    test(`renders ${file.replace(/.*\//, '')}`, async () => {
      const doc = await RunmdDoc.fromFile(file);
      assert.ok(doc);
      assert.equal(doc.parts.length, partCount, 'part count mismatch');
      assert.equal(doc.getBlocks().length, blockCount, 'block count mismatch');

      await doc.render();
    });
  }

  test('throws if no file', async () => {
    await assert.rejects(
      () => RunmdDoc.fromFile('src/samples/does-not-exist.md'),
      {
        code: 'ENOENT'
      }
    );
  });

  test('throws on runtime error', async () => {
    const doc = await RunmdDoc.fromContent(
      'broken.md',
      "```javascript --run\nthrow new Error('Dooh!');\n```"
    );

    await assert.rejects(() => doc.render());
  });

  test('supports runmd.onOutputLine line transforms and drops', async () => {
    const original = globalThis.runmd;
    const seen: { line: string; inBlock: boolean }[] = [];

    globalThis.runmd = {
      ...(original ?? {}),
      onOutputLine(line, inBlock) {
        seen.push({ line, inBlock: Boolean(inBlock) });
        if (line === '```javascript') return undefined;
        if (line === '```') return undefined;
        if (line === '# Header') return '# HEADER';
        return line;
      }
    };

    try {
      const doc = RunmdDoc.fromContent(
        'inline.md',
        [
          '# Header',
          '',
          '```javascript --run',
          'const total = 1 + 1;',
          '```'
        ].join('\n')
      );

      const output = await doc.render();
      assert.equal(output, ['# HEADER', '', 'const total = 1 + 1;'].join('\n'));
      assert.ok(
        seen.some((entry) => entry.line === '# Header' && !entry.inBlock)
      );
      assert.ok(
        seen.some(
          (entry) => entry.line === 'const total = 1 + 1;' && entry.inBlock
        )
      );
    } finally {
      globalThis.runmd = original;
    }
  });
});
