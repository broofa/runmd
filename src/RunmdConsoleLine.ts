import util from 'node:util';

export class RunmdConsoleLine {
  line: string;
  lineNum: number;
  values: string[] = [];

  constructor(line: string, lineNum: number) {
    this.lineNum = lineNum;
    this.line = line;
    this.values = [];
  }

  addValue(value: string) {
    this.values.push(value);
  }

  toScript() {
    return this.line.replace(
      /\bconsole\.log\(/g,
      `__runmdConsoleLog(${this.lineNum}, ${JSON.stringify(this.line)}, `
    );
  }

  toString() {
    return [this.line, ...this.values].join('\n');
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
