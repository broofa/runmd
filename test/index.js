const assert = require('assert');
const fs = require('fs');
const path = require('path');
const {render} = require('..');

function transform(filename) {
  const filepath = path.join(__dirname, filename);
  const inputText = fs.readFileSync(filepath, 'utf8');
  return render(inputText, {lame: true, inputName: `test/${path.basename(__filename)}`});
}

describe(__filename, () => {
  it('basic', () => {
    const md = transform('basic.md');
    assert(/^# Header/m.test(md), 'has header');
    assert(/res =.*2$/m.test(md), 'has result');
    assert(/^# Footer/m.test(md), 'has footer');
  });

  it('module', () => {
    const md = transform('module.md');
    assert(/res =.*123$/m.test(md), 'has access to module exports');
  });

  it('es6', () => {
    const md = transform('es6.md');
    assert(/fooRes =.*123$/m.test(md), 'has access to module exports');
    assert(/barRes =.*123$/m.test(md), 'has access to module exports');
  });

  it('contexts', () => {
    const md = transform('contexts.md');
    assert(/def =.*undefined/m.test(md), 'foo in unnamed context is not undefined');
    assert(/alpha =.*alpha/m.test(md), 'foo in alpha context');
    assert(/beta =.*beta/m.test(md), 'foo in beta context');
  });
});
