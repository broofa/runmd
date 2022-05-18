const fs = require('fs');
const path = require('path');
const { render } = require('..');
const test = require('ava');

function transform (filename) {
  const filepath = path.join(__dirname, 'examples', filename);
  const inputText = fs.readFileSync(filepath, 'utf8');
  return render(inputText, {
    lame: true,
    inputName: `test/examples/${path.basename(__filename)}`
  });
}

test('basic', t => {
  const md = transform('basic.md');
  t.regex(md, /^# Header/m, 'has header');
  t.regex(md, /res =.*2$/m, 'has result');
  t.regex(md, /^# Footer/m, 'has footer');
});

test('module', t => {
  const md = transform('module.md');
  t.regex(md, /res =.*123$/m, 'has access to module exports');
});

test('es6', t => {
  const md = transform('es6.md');
  t.regex(md, /fooRes =.*123$/m, 'has access to module exports');
  t.regex(md, /barRes =.*123$/m, 'has access to module exports');
});

test('contexts', t => {
  const md = transform('contexts.md');
  t.regex(md, /def =.*undefined/m, 'foo in unnamed context is not undefined');
  t.regex(md, /alpha =.*alpha/m, 'foo in alpha context');
  t.regex(md, /beta =.*beta/m, 'foo in beta context');
});
