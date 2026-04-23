import assert from 'node:assert';
import { describe, test } from 'node:test';
import { formatResult, RunmdResultLine } from './RunmdResultLine.ts';

describe('RunmdResultLine', () => {
  test('toScript wraps plain expressions in the result helper', () => {
    const line = new RunmdResultLine('  1 + 2; // RESULT', 1);

    assert.equal(
      line.toScript(),
      "__runmdSetResult(1 + 2, '  1 + 2; // RESULT', 1)",
    );
  });

  test('toScript preserves declarations while wrapping the expression', () => {
    const line = new RunmdResultLine('const total = 1 + 2; // RESULT', 1);

    assert.equal(
      line.toScript(),
      "const total = __runmdSetResult(1 + 2, 'const total = 1 + 2; // RESULT', 1)",
    );
  });

  test('setResult renders short results inline', () => {
    const line = new RunmdResultLine('const total = 1 + 2; // RESULT', 1);

    line.setResult(formatResult(3, line.line, line.lineNum));

    assert.equal(line.toString(), 'const total = 1 + 2; // ⇨ 3');
  });

  test('setResult moves large results onto following lines', () => {
    const line = new RunmdResultLine('items; // RESULT', 1);

    line.setResult(
      formatResult(
        Array.from({ length: 20 }, (_, index) => ({
          index,
          value: 'x'.repeat(20),
        })),
        line.line,
        line.lineNum,
      ),
    );

    assert.match(line.toString(), /^items; \/\/ ⇨ \n\/\/ \[/);
  });

  test('formatResult wraps multi-line results with correct indent', () => {
    const line = new RunmdResultLine('  items; // RESULT', 1);

    const result = formatResult(
      Uint8Array.from([
        110, 192, 189, 127, 17, 192, 67, 218, 151, 94, 42, 138, 217, 235, 174,
        11,
      ]),
      line.line,
      line.lineNum,
    );

    assert.match(result, /^\/\/ ⇨ \n  \/\/ Uint8Array/);
  });
});
