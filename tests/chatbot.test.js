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

assert.equal(findBestAnswer('I have severe headache and vision changes, is this emergency?').topic, 'Emergency warning signs');
assert.equal(findBestAnswer('How much water should I drink daily while pregnant?').topic, 'Hydration');
assert.equal(findBestAnswer('Which prenatal vitamins and folic acid do I need?').topic, 'Prenatal vitamins and supplements');
assert.equal(findBestAnswer('Can I do yoga and gym workouts?').topic, 'Exercise and activity');
assert.equal(findBestAnswer('I feel anxiety and stress in pregnancy, what can I do?').topic, 'Mental health and stress');

const fallback = findBestAnswer('How do I prepare legal documents before baby arrives?');
assert.equal(fallback.topic, 'General pregnancy guidance');
assert.match(fallback.answer, /General safe next steps/i);

console.log('All chatbot tests passed.');
