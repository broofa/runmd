const fs = require('fs');
const path = require('path');
const Renderer = require('../lib/Renderer');

describe(__filename, () => {
  it('hello', () => {
    const file = path.join(__dirname, './hello.md');
    const renderer = new Renderer(file);
    const text = fs.readFileSync(file, 'utf8');
    const md = renderer.render(text, null, {lame: true});
    console.log(md);
  });
});
