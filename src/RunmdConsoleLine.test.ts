import assert from 'node:assert';
import { describe, test } from 'node:test';
import { RunmdConsoleLine } from './RunmdConsoleLine.ts';

describe('RunmdConsoleLine', () => {
  test('toString returns source line when no outputs', () => {
    const line = new RunmdConsoleLine('console.log(1);', 10);
    assert.equal(line.toString(), 'console.log(1);');
  });

  test('toString renders source line followed by captured outputs', () => {
    const line = new RunmdConsoleLine('console.log(1, 2);', 20);
    line.values.push('// \u21e8 1');
    line.values.push('// \u21e8 2');
    assert.equal(
      line.toString(),
      'console.log(1, 2);\n// \u21e8 1\n// \u21e8 2'
    );
  });
});
