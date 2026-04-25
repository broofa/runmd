import assert from 'node:assert';
import { describe, test } from 'node:test';
import { RunmdConsoleLine } from './RunmdConsoleLine.ts';

describe('RunmdConsoleLine', () => {
  test('toString returns empty string when no outputs', () => {
    const line = new RunmdConsoleLine(10);
    assert.equal(line.toString(), '');
  });

  test('toString joins multiple outputs with newline', () => {
    const line = new RunmdConsoleLine(20);
    line.outputs.push('// \u21e8 1');
    line.outputs.push('// \u21e8 2');
    assert.equal(line.toString(), '// \u21e8 1\n// \u21e8 2');
  });

  test('appendOutputForLine appends to the registered instance', () => {
    const line = new RunmdConsoleLine(30);
    RunmdConsoleLine.appendOutputForLine(30, '// \u21e8 hello');
    assert.equal(line.outputs.length, 1);
    assert.equal(line.outputs[0], '// \u21e8 hello');
  });

  test('appendOutputForLine warns when lineNum not registered', () => {
    const warnings: string[] = [];
    const orig = console.warn;
    console.warn = (msg: string) => warnings.push(msg);
    try {
      RunmdConsoleLine.appendOutputForLine(9999, '// \u21e8 lost');
      assert.ok(warnings.some((w) => w.includes('9999')));
    } finally {
      console.warn = orig;
    }
  });
});
