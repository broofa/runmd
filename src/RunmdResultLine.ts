import util from 'node:util';

export const RESULT_RE = /\/\/\s*RESULT\s*$/;
const LARGE_RESULT_LINES = 5;

export class RunmdResultLine {
  static byLineNum = new Map<number, RunmdResultLine>();

  lineNum: number;
  line: string;
  result: string;

  static setResultForLine(lineNum: number, val: unknown) {
    const resultLine = RunmdResultLine.byLineNum.get(lineNum);
    if (resultLine) {
      resultLine.setResult(val);
    } else {
      console.warn(`No RunmdResultLine at line ${lineNum}`);
    }
  }

  constructor(line: string, lineNum: number) {
    this.lineNum = lineNum;
    this.line = line;
    this.result = util.inspect(undefined);

    RunmdResultLine.byLineNum.set(lineNum, this);
  }

  /** Source w/out RESULT comment e */
  get bare() {
    return this.line.replace(RESULT_RE, '');
  }

  /** Source w/out indenting */
  get undent() {
    return this.line.replace(/^\S.*/, '');
  }

  /** String needed to line up with RESULT comment */
  get prefix() {
    return this.line.replace(RESULT_RE, '').replace(/./g, ' ') + '// ';
  }

  setResult(val: unknown) {
    const MAX_LEN = 130; // Github horizontal scrollbars appear at ~140 chars

    this.result = util.inspect(val, {
      depth: null,
      breakLength: Math.max(40, MAX_LEN - this.prefix.length),
    });

    // If result spans multiple lines, move it to the next line
    if (this.result.split('\n').length >= LARGE_RESULT_LINES) {
      this.result = util.inspect(val, {
        depth: null,
        breakLength: MAX_LEN - this.undent.length,
      });
    }
  }

  toScript() {
    // Trim string (including trailing ';')
    const trimmed = this.line
      .replace(RESULT_RE, '')
      .replace(/^\s+|[\s;]+$/g, '');

    // You can't wrap an expression in ()'s if it also has a var declaration, so
    // we do a bit of regex hacking to wrap just the expression part, here
    const match = trimmed.match(/(^\s*(?:const|let|var)[\w\s,]*=\s)*(.*)/);

    const [, declaration, expression] = match!;
    return `${declaration ?? ''}__setRunmdResult(${this.lineNum}, ${expression ?? 'undefined'});`;
  }

  /** Fully rendered line output */
  toString() {
    let lines = this.result.split('\n');
    let prefix = this.prefix;

    if (lines.length >= LARGE_RESULT_LINES) {
      lines.unshift('');
      prefix = `${this.undent}  // `;
    }

    lines = lines.map((line, i) =>
      i === 0 ? `// \u21e8 ${line}` : `${prefix}${line}`,
    );
    return `${this.bare}${lines.join('\n')}`;
  }
}
