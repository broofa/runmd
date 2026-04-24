import util from 'node:util';

export const RESULT_RE = /\/\/\s*RESULT\s*$/;
export const LARGE_RESULT_LINES = 5;

export class RunmdResultLine {
  static byLineNum = new Map<number, RunmdResultLine>();

  lineNum: number;
  line: string;
  result: string;

  static setResultForLine(lineNum: number, result: string) {
    const resultLine = RunmdResultLine.byLineNum.get(lineNum);
    if (resultLine) {
      resultLine.setResult(result);
    } else {
      console.warn(`No RunmdResultLine at line ${lineNum}`);
    }
  }

  constructor(line: string, lineNum: number) {
    this.lineNum = lineNum;
    this.line = line;
    this.result = 'undefined';

    RunmdResultLine.byLineNum.set(lineNum, this);
  }

  setResult(result: string) {
    this.result = result;
  }

  toScript() {
    // Trim string (including trailing ';')
    const trimmed = this.line
      .replace(RESULT_RE, '')
      .replaceAll(/^\s+|[\s;]+$/g, '');

    // You can't wrap an expression in ()'s if it also has a var declaration, so
    // we do a bit of regex hacking to wrap just the expression part, here
    const match = trimmed.match(/(^\s*(?:const|let|var)[\w\s,]*=\s)*(.*)/);

    const [, declaration, expression] = match ?? [];
    return `${declaration ?? ''}__runmdSetResult(${expression ?? 'undefined'}, '${this.line.replaceAll(/'/g, "\\'")}', ${this.lineNum})`;
  }

  /** Fully rendered line output */
  toString() {
    return this.line.replace(RESULT_RE, this.result);
  }
}
export function formatResult(val: unknown, line: string) {
  const MAX_LEN = 130;

  let indent = line.replace(RESULT_RE, '').replaceAll(/./g, ' ');

  // Format 1:
  // "(spaces) ... code... // => result..."
  // "(      spaces      ) // ..."
  let result = util.inspect(val, {
    depth: null,
    breakLength: Math.max(40, MAX_LEN - indent.length)
  });

  // Format 2:
  // "(spaces) ... code ... // =>
  // "(       spaces      ) // result...",
  // "(       spaces      ) // ...",
  let lines = result.split('\n');
  if (lines.length >= LARGE_RESULT_LINES) {
    indent = line.replace(/\S.*/, '').replaceAll(/./g, ' ');
    result = util.inspect(val, {
      depth: null,
      breakLength: MAX_LEN - indent.length
    });
    lines = result.split('\n');
    lines.unshift('');
  }

  lines = lines.map((line, i) =>
    i === 0 ? `// \u21e8 ${line}` : `${indent}// ${line}`
  );

  return lines.join('\n');
}
