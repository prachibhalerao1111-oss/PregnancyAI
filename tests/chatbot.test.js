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
assert.equal(typeof findBestAnswer, 'function');

assert.equal(findBestAnswer('I have heavy bleeding and chest pain').topic, 'Emergency warning signs');
assert.equal(findBestAnswer('Can I eat sushi or unpasteurized cheese?').topic, 'Nutrition and food safety');
assert.equal(findBestAnswer('how much water daily in pregnancy?').topic, 'Hydration');
assert.equal(findBestAnswer('Which prenatal vitamins and medicines are safe?').topic, 'Supplements and medications');
assert.equal(findBestAnswer('Morning sickness and heartburn tips please').topic, 'Common symptoms');
assert.equal(findBestAnswer('Can I do yoga and running while pregnant?').topic, 'Exercise and activity');
assert.equal(findBestAnswer('I cannot sleep and need better position').topic, 'Sleep and comfort');
assert.equal(findBestAnswer('when is my glucose screening test and ultrasound').topic, 'Appointments and tests');
assert.equal(findBestAnswer('How to prepare hospital bag and birth plan?').topic, 'Labor and delivery prep');
assert.equal(findBestAnswer('I feel anxiety and panic in week 30').topic, 'Mental health and wellbeing');

const fallback = findBestAnswer('How should I design a nursery budget spreadsheet?');
assert.equal(fallback.topic, 'General pregnancy guidance');
assert.match(fallback.answer, /General safe guidance/i);

console.log('All chatbot tests passed.');
