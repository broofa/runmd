import assert from 'node:assert';
import { describe, test } from 'node:test';
import { RunmdBlock } from './RunmdBlock.ts';
import { RunmdResultLine } from './RunmdResultLine.ts';

describe('RunmdBlock.fromStartLine', () => {
  const TESTS = [
    {
      name: 'parses run and hide options',
      startLine: '```javascript --run --hide',
      expectedArgs: {
        run: 'main',
        hide: true,
      },
    },
    {
      name: 'accepts uppercase javascript fences',
      startLine: '```JavaScript --run',
      expectedArgs: {
        run: 'main',
      },
    },
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
          value: 'const total = 1 + 2;',
        },
        {
          type: 'result',
          id: 2,
          source: 'total; // RESULT',
          script: "__runmdSetResult(total, 'total; // RESULT', 2)",
        },
      ],
    },
    {
      name: 'assigns incrementing ids to multiple result lines',
      startLine: '```javascript --hide',
      script: [
        'const first = 1; // RESULT',
        'const second = 2; // RESULT',
        'console.log(second);',
        '```',
      ].join('\n'),
      expectedNextResultLineId: 2,
      expectedLines: [
        {
          type: 'result',
          id: 1,
          source: 'const first = 1; // RESULT',
          script:
            "const first = __runmdSetResult(1, 'const first = 1; // RESULT', 1)",
        },
        {
          type: 'result',
          id: 2,
          source: 'const second = 2; // RESULT',
          script:
            "const second = __runmdSetResult(2, 'const second = 2; // RESULT', 2)",
        },
        {
          type: 'string',
          value: 'console.log(second);',
        },
      ],
    },
  ];

  for (const {
    name,
    startLine,
    script,
    expectedNextResultLineId,
    expectedLines,
  } of TESTS) {
    test(name, () => {
      const block = new RunmdBlock(startLine, 1);
      const includeResults = script
        .split('\n')
        .map((line) => block.includeLine(line));

      assert.deepEqual(includeResults, [
        true,
        ...Array(expectedLines.length - 1).fill(true),
        false,
      ]);
      assert.equal(block.nextResultLineId, expectedNextResultLineId);
      assert.equal(block.lines.length, expectedLines.length);

      for (const [index, expectedLine] of expectedLines.entries()) {
        const actualLine = block.lines[index];

        if (expectedLine.type === 'string') {
          assert.equal(actualLine, expectedLine.value);
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
