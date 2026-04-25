import util from 'node:util';

export class RunmdConsoleLine {
  static byLineNum = new Map<number, RunmdConsoleLine>();

  lineNum: number;
  outputs: string[] = [];

  static appendOutputForLine(lineNum: number, output: string) {
    const consoleLine = RunmdConsoleLine.byLineNum.get(lineNum);
    if (consoleLine) {
      consoleLine.outputs.push(output);
    } else {
      console.warn(`No RunmdConsoleLine at line ${lineNum}`);
    }
  }

  constructor(lineNum: number) {
    this.lineNum = lineNum;
    RunmdConsoleLine.byLineNum.set(lineNum, this);
  }

  toString() {
    return this.outputs.join('\n');
  }
}

export function formatConsoleArgs(args: unknown[], sourceLine: string) {
  const MAX_LEN = 130;
  // Use the leading whitespace of the source line for indentation
  const lineIndent = sourceLine.replace(/\S.*/, '').replaceAll(/./g, ' ');

  const inspected = args.map((arg) =>
    util.inspect(arg, {
      depth: null,
      breakLength: Math.max(40, MAX_LEN - lineIndent.length)
    })
  );
  let lines = inspected.join(' ').split('\n');

  lines = lines.map((line, i) =>
    i === 0 ? `${lineIndent}// \u21e8 ${line}` : `${lineIndent}// ${line}`
  );

  return lines.join('\n');
}
