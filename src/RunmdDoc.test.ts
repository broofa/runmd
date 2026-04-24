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
    blockCount: 1,
  },
  {
    file: 'src/samples/contexts.md',
    partCount: 12,
    blockCount: 6,
  },
  {
    file: 'src/samples/module.md',
    partCount: 4,
    blockCount: 2,
  },
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
        code: 'ENOENT',
      },
    );
  });

  test('throws on runtime error', async () => {
    const doc = await RunmdDoc.fromContent(
      'broken.md',
      "```javascript --run\nthrow new Error('Dooh!');\n```",
    );

    await assert.rejects(() => doc.render());
  });
});
