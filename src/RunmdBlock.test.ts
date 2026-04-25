import assert from 'node:assert';
import { describe, test } from 'node:test';
import { RunmdBlock } from './RunmdBlock.ts';
import { RunmdConsoleLine } from './RunmdConsoleLine.ts';
import { RunmdResultLine } from './RunmdResultLine.ts';

describe('RunmdBlock.fromStartLine', () => {
  const TESTS = [
    {
      name: 'parses run and hide options',
      startLine: '```javascript --run --hide',
      expectedArgs: {
        run: 'main',
        hide: true
      }
    },
    {
      name: 'accepts uppercase javascript fences',
      startLine: '```JavaScript --run',
      expectedArgs: {
        run: 'main'
      }
    },
    {
      name: 'accepts js shorthand fences',
      startLine: '```js --run',
      expectedArgs: {
        run: 'main'
      }
    },
    {
      name: 'accepts ts shorthand fences',
      startLine: '```ts --run',
      expectedArgs: {
        run: 'main'
      }
    },
    {
      name: 'accepts typescript fences',
      startLine: '```typescript --run',
      expectedArgs: {
        run: 'main'
      }
    }
  ];

  for (const { name, startLine, expectedArgs } of TESTS) {
    test(name, () => {
      const block = RunmdBlock.fromStartLine(startLine, 7);

      assert.ok(block);
      assert.equal(block.lineNum, 7);
      assert.deepEqual(block.args, expectedArgs);
    });
  }

  test('returns undefined for non-runmd fences', () => {
    assert.equal(RunmdBlock.fromStartLine('```ts', 1), undefined);
  });

  test('toString preserves the original language tag', () => {
    const jsBlock = RunmdBlock.fromStartLine('```javascript --run', 1);
    assert.ok(jsBlock);
    jsBlock.includeLine('const x = 1;');
    jsBlock.includeLine('```');
    assert.ok(jsBlock.toString().startsWith('```javascript\n'));

    const tsBlock = RunmdBlock.fromStartLine('```ts --run', 1);
    assert.ok(tsBlock);
    tsBlock.includeLine('const x = 1;');
    tsBlock.includeLine('```');
    assert.ok(tsBlock.toString().startsWith('```ts\n'));
  });
});

describe('RunmdBlock.includeLine', () => {
  const TESTS = [
    {
      name: 'keeps plain lines and converts result lines',
      startLine: '```javascript --run',
      script: ['const total = 1 + 2;', 'total; // RESULT', '```'].join('\n'),
      expectedNextResultLineId: 1,
      expectedLines: [
        {
          type: 'string',
          value: 'const total = 1 + 2;'
        },
        {
          type: 'result',
          id: 2,
          source: 'total; // RESULT',
          script: "__runmdSetResult(total, 'total; // RESULT', 2)"
        }
      ]
    },
    {
      name: 'assigns incrementing ids to multiple result lines',
      startLine: '```javascript --hide',
      script: [
        'const first = 1; // RESULT',
        'const second = 2; // RESULT',
        'console.log(second);',
        '```'
      ].join('\n'),
      expectedNextResultLineId: 2,
      expectedLines: [
        {
          type: 'result',
          id: 1,
          source: 'const first = 1; // RESULT',
          script:
            "const first = __runmdSetResult(1, 'const first = 1; // RESULT', 1)"
        },
        {
          type: 'result',
          id: 2,
          source: 'const second = 2; // RESULT',
          script:
            "const second = __runmdSetResult(2, 'const second = 2; // RESULT', 2)"
        },
        {
          type: 'string',
          value: 'console.log(second);'
        },
        {
          type: 'console',
          lineNum: 3
        }
      ]
    }
  ];

  for (const {
    name,
    startLine,
    script,
    expectedNextResultLineId,
    expectedLines
  } of TESTS) {
    test(name, () => {
      const block = new RunmdBlock(startLine, 1);
      const includeResults = script
        .split('\n')
        .map((line) => block.includeLine(line));

      // includeResults has one entry per script line; last is the closing fence
      const scriptLines = script.split('\n');
      assert.deepEqual(includeResults, [
        ...Array(scriptLines.length - 1).fill(true),
        false
      ]);
      assert.equal(block.nextResultLineId, expectedNextResultLineId);
      assert.equal(block.lines.length, expectedLines.length);

      for (const [index, expectedLine] of expectedLines.entries()) {
        const actualLine = block.lines[index];

        if (expectedLine.type === 'string') {
          assert.equal(actualLine, expectedLine.value);
          continue;
        }

        if (expectedLine.type === 'console') {
          assert.ok(actualLine instanceof RunmdConsoleLine);
          assert.equal(actualLine.lineNum, expectedLine.lineNum);
          continue;
        }

        assert.ok(actualLine instanceof RunmdResultLine);
        assert.equal(actualLine.lineNum, expectedLine.id);
        assert.equal(actualLine.line, expectedLine.source);
        assert.equal(actualLine.toScript(), expectedLine.script);
      }
    });
  }
});

describe('RunmdBlock console.log support', () => {
  test('includeLine inserts RunmdConsoleLine after console.log lines', () => {
    const block = new RunmdBlock('```javascript --run', 5);
    block.includeLine('const x = 1;');
    block.includeLine('console.log(x);');
    block.includeLine('```');

    // lines: ['const x = 1;', 'console.log(x);', RunmdConsoleLine]
    assert.equal(block.lines.length, 3);
    assert.equal(block.lines[0], 'const x = 1;');
    assert.equal(block.lines[1], 'console.log(x);');
    assert.ok(block.lines[2] instanceof RunmdConsoleLine);
    assert.equal((block.lines[2] as RunmdConsoleLine).lineNum, 6);
  });

  test('toScript replaces console.log( with __runmdConsoleLog(lineNum, sourceLine,', () => {
    const block = new RunmdBlock('```javascript --run', 1);
    block.includeLine('console.log(42);');
    block.includeLine('```');

    const script = block.toScript();
    assert.ok(script.includes('__runmdConsoleLog(1, "console.log(42);", 42);'));
  });

  test(' toString omits RunmdConsoleLine slot when no output captured', () => {
    const block = new RunmdBlock('```javascript --run', 1);
    block.includeLine('console.log(42);');
    block.includeLine('```');

    const out = block.toString();
    assert.ok(!out.includes('// \u21e8'));
    assert.ok(out.includes('console.log(42);'));
  });

  test('toString inserts captured output below the console.log line', () => {
    const block = new RunmdBlock('```javascript --run', 1);
    block.includeLine('console.log(42);');
    block.includeLine('```');

    const consoleLine = block.lines[1] as RunmdConsoleLine;
    RunmdConsoleLine.appendOutputForLine(consoleLine.lineNum, '// \u21e8 42');

    const out = block.toString();
    const lines = out.split('\n');
    const logIdx = lines.indexOf('console.log(42);');
    assert.ok(logIdx >= 0, 'console.log line should be in output');
    assert.equal(lines[logIdx + 1], '// \u21e8 42');
  });
});
