import assert from 'node:assert';
import { describe, test } from 'node:test';
import { RunmdResultLine } from './RunmdResultLine.ts';

describe('RunmdResultLine', () => {
  test('toScript wraps plain expressions in the result helper', () => {
    const line = new RunmdResultLine('  1 + 2; // RESULT', 1);

    assert.equal(line.toScript(), '__setRunmdResult(1, 1 + 2);');
  });

  test('toScript preserves declarations while wrapping the expression', () => {
    const line = new RunmdResultLine('const total = 1 + 2; // RESULT', 1);

    assert.equal(line.toScript(), 'const total = __setRunmdResult(1, 1 + 2);');
  });

  test('setResult renders short results inline', () => {
    const line = new RunmdResultLine('const total = 1 + 2; // RESULT', 1);

    line.setResult(3);

    assert.equal(line.toString(), 'const total = 1 + 2; // ⇨ 3');
  });

  test('setResult moves large results onto following lines', () => {
    const line = new RunmdResultLine('items; // RESULT', 1);

    line.setResult(
      Array.from({ length: 20 }, (_, index) => ({
        index,
        value: 'x'.repeat(20),
      })),
    );

    assert.match(line.toString(), /^items; \/\/ ⇨ \n  \/\/ \[/);
  });
});
