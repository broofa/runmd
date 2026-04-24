import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { isRunmdBlock, RunmdBlock } from './RunmdBlock.ts';
import { runDoc } from './runner.ts';

export const BOOTSTRAP_IMPORT_PATH = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  'runmd-setup.ts',
);

/**
 * A Runmd document (markdown file) that may contain special "```javascript"
 * code blocks that get evaluated.
 */
export default class RunmdDoc {
  static async fromFile(sourcePath: string) {
    const absolutePath = path.resolve(process.cwd(), sourcePath);
    const fileContents = await readFile(absolutePath, 'utf8');

    return RunmdDoc.fromContent(sourcePath, fileContents);
  }

  static fromContent(sourcePath: string, content: string) {
    const doc = new RunmdDoc(sourcePath, content);
    return doc;
  }

  sourcePath?: string;
  parts: (string | RunmdBlock)[];

  constructor(sourcePath: string, content: string) {
    this.sourcePath = sourcePath;
    this.parts = this.#parse(content);
  }

  #parse(content: string) {
    const parts: (string | RunmdBlock)[] = [];
    let currentBlock: RunmdBlock | undefined;
    let nextBlockID = 0;

    let lineNum = 0;
    for (const line of content.split('\n')) {
      lineNum++;

      if (!currentBlock) {
        currentBlock = RunmdBlock.fromStartLine(line, lineNum);
        if (currentBlock) {
          parts.push(currentBlock);
          nextBlockID++;
          continue;
        } else {
          parts.push(line);
        }
      } else {
        if (!currentBlock.includeLine(line)) {
          // End of script block.  Process the script lines we gathered
          currentBlock = undefined;
        }
      }
    }

    return parts;
  }

  getBlocks() {
    return this.parts.filter(isRunmdBlock);
  }

  async render() {
    await runDoc(this);

    const parts = this.parts.filter(
      (part) => !(isRunmdBlock(part) && (part.isSetup() || part.isHidden())),
    );

    return parts.map(String).join('\n');
  }
}
