import { Command } from 'commander';
import { RESULT_RE, RunmdResultLine } from './RunmdResultLine.ts';

const START_LINE_REGEX = /^\s*```\s*javascript\s+(--.*)?/i;
const DEFAULT_CONTEXT = 'main';

export function isRunmdBlock(part: unknown): part is RunmdBlock {
  return part instanceof RunmdBlock;
}

export class RunmdBlock {
  lineNum: number;
  nextResultLineId = 0;
  lines: (string | RunmdResultLine)[] = [];
  args: {
    run: string;
    reset: boolean;
    hide?: boolean;
  };

  static fromStartLine(line: string, lineNum: number) {
    if (START_LINE_REGEX.test(line)) {
      return new RunmdBlock(line, lineNum);
    }
  }

  constructor(startLine: string, lineNum: number) {
    this.lineNum = lineNum;
    const match = startLine.match(START_LINE_REGEX);
    if (!match || !match[1]) {
      throw new Error(`Invalid start line: ${startLine}`);
    }

    // Parse args out of the "```javascript..." line
    const cmd = new Command();
    cmd
      .option('--run', 'run in named context')
      .option('--hide', 'hide output')
      .option('--reset', 'reset JS context before running block')
      .parse(['', '', ...match[1].split(/\s+/).filter(Boolean)]);

    this.args = cmd.opts<RunmdBlock['args']>();
    if (typeof this.args.run !== 'string') {
      this.args.run = DEFAULT_CONTEXT;
    }
  }

  includeLine(line: string): boolean {
    if (/^```/.test(line)) {
      return false;
    }

    if (RESULT_RE.test(line)) {
      const resultLine = new RunmdResultLine(
        line,
        this.lineNum + this.lines.length,
      );
      this.lines.push(resultLine);
      this.nextResultLineId += 1;
    } else {
      this.lines.push(line);
    }

    return true;
  }

  isModule() {
    return (
      this.lines.some((line) => /^\s*import /.test(line as string)) ||
      this.lines.some((line) => /^\s*export /.test(line as string))
    );
  }

  isSetup() {
    return this.lines.some((line) => String(line).includes('runmd.'));
  }

  isHidden() {
    return Boolean(this.args.hide);
  }

  toString() {
    return this.lines.map(String).join('\n');
  }

  toScript() {
    return this.lines
      .map((line) => {
        return line instanceof RunmdResultLine ? line.toScript() : line;
      })
      .join('\n');
  }
}
