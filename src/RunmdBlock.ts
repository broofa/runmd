import { Command } from 'commander';
import { RunmdConsoleLine } from './RunmdConsoleLine.ts';
import { RESULT_RE, RunmdResultLine } from './RunmdResultLine.ts';

const BLOCK_START_REGEX = /^```\s*((?:javascript|js|typescript|ts))\s+(--.*)?/i;
const BLOCK_END_REGEX = /^```/;
const CONSOLE_LOG_RE = /\bconsole\.log\(/;
const DEFAULT_CONTEXT = 'main';

export function isRunmdBlock(part: unknown): part is RunmdBlock {
  return part instanceof RunmdBlock;
}

export class RunmdBlock {
  lineNum: number;
  lang: string;
  lines: (string | RunmdResultLine | RunmdConsoleLine)[] = [];
  args: {
    run?: string;
    debug?: boolean;
    hide?: boolean;
  };

  static fromStartLine(line: string, lineNum: number) {
    if (BLOCK_START_REGEX.test(line)) {
      return new RunmdBlock(line, lineNum);
    }
  }

  constructor(startLine: string, lineNum: number) {
    this.lineNum = lineNum;
    const match = startLine.match(BLOCK_START_REGEX);
    if (!match?.[1] || !match?.[2]) {
      throw new Error(`Invalid start line: ${startLine}`);
    }

    this.lang = match[1];

    // Parse args out of the start line line
    const cmd = new Command();
    cmd
      // Prevent commander from exiting the process on error
      .exitOverride()
      // Suppress commander output
      .configureOutput({ writeOut: () => {}, writeErr: () => {} })
      .option('--run', 'run in named context')
      .option('--hide', 'hide output')
      .option('--debug', 'enable debug mode mode (leave temp files around)');
    try {
      cmd.parse(['', '', ...match[2].split(/\s+/).filter(Boolean)]);
    } catch (err) {
      let { message } = err as Error;
      message = message.replace(/error:\s+/i, '');
      const error = /*foo*/ new Error(
        `Line ${lineNum}: ${message}\n  "${startLine}"\n`
      );
      throw error;
    }

    this.args = cmd.opts<RunmdBlock['args']>();
    if (typeof this.args.run !== 'string') {
      this.args.run = DEFAULT_CONTEXT;
    }
  }

  lineAtLineNum(lineNum: number) {
    for (const line of this.lines) {
      if (typeof line === 'string') {
        continue;
      }

      if (line.lineNum === lineNum) {
        return line;
      }
    }
  }

  includeLine(line: string): boolean {
    if (BLOCK_END_REGEX.test(line)) {
      return false;
    }

    if (RESULT_RE.test(line)) {
      const resultLine = new RunmdResultLine(
        line,
        this.lineNum + this.lines.length
      );
      this.lines.push(resultLine);
    } else if (CONSOLE_LOG_RE.test(line)) {
      const consoleLine = new RunmdConsoleLine(
        line,
        this.lineNum + this.lines.length
      );
      this.lines.push(consoleLine);
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
    return [`\`\`\`${this.lang}`, ...this.lines.map(String), '```'].join('\n');
  }

  toScript() {
    const result: string[] = [];
    for (const line of this.lines) {
      if (line instanceof RunmdResultLine) {
        result.push(line.toScript());
      } else if (line instanceof RunmdConsoleLine) {
        result.push(line.toScript());
      } else {
        result.push(line);
      }
    }
    return result.join('\n');
  }
}
