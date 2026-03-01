const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

function loadFunctions() {
  const code = fs.readFileSync('script.js', 'utf8');

  const dummy = {
    addEventListener: () => {},
    appendChild: () => {},
    scrollTop: 0,
    scrollHeight: 0,
    value: '',
    requestSubmit: () => {},
    dataset: {},
    textContent: '',
    className: ''
  };

  const sandbox = {
    document: {
      getElementById: () => dummy,
      querySelectorAll: () => ({ forEach: () => {} }),
      createElement: () => ({ ...dummy })
    },
    setTimeout: (fn) => fn(),
    window: {}
  };

  vm.createContext(sandbox);
  vm.runInContext(code, sandbox);
  return sandbox.window;
}

const { findBestAnswer } = loadFunctions();
assert.equal(typeof findBestAnswer, 'function', 'findBestAnswer should be exposed on window');

const warning = findBestAnswer('I have severe headache and vision changes, is it emergency?');
assert.equal(warning.topic, 'Warning signs');

const hydration = findBestAnswer('How much water should I drink daily while pregnant?');
assert.equal(hydration.topic, 'Hydration');

const vitamins = findBestAnswer('Which prenatal vitamins and folic acid do I need?');
assert.equal(vitamins.topic, 'Prenatal vitamins');

const unknown = findBestAnswer('Tell me a random joke');
assert.equal(unknown.topic, 'Default');

console.log('All chatbot tests passed.');
