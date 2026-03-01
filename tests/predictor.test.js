const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

function loadAppFunctions() {
  const code = fs.readFileSync('script.js', 'utf8');

  const dummyEl = {
    addEventListener: () => {},
    appendChild: () => {},
    scrollTop: 0,
    scrollHeight: 0,
    value: '',
    requestSubmit: () => {},
    dataset: {},
    checked: false,
    innerHTML: '',
    textContent: '',
    className: ''
  };

  const sandbox = {
    document: {
      getElementById: () => dummyEl,
      querySelectorAll: () => ({ forEach: () => {} }),
      createElement: () => ({ ...dummyEl })
    },
    setTimeout: (fn) => fn(),
    window: {}
  };

  vm.createContext(sandbox);
  vm.runInContext(code, sandbox);

  return sandbox.window;
}

const { predictHealthRisk } = loadAppFunctions();

assert.equal(typeof predictHealthRisk, 'function', 'predictHealthRisk should be exposed on window');

const lowRisk = predictHealthRisk({
  age: 26,
  week: 18,
  sbp: 112,
  dbp: 72,
  bmi: 23,
  glucose: 96,
  hemoglobin: 12.4,
  prevComplication: false,
  smoking: false,
  reducedMovement: false
});

assert.equal(lowRisk.level, 'low', 'Expected low-risk profile to classify as low');
assert.ok(lowRisk.probability < 0.2, 'Expected low-risk profile to have low probability');

const criticalRisk = predictHealthRisk({
  age: 36,
  week: 33,
  sbp: 165,
  dbp: 112,
  bmi: 32,
  glucose: 210,
  hemoglobin: 8.7,
  prevComplication: true,
  smoking: true,
  reducedMovement: true
});

assert.equal(criticalRisk.level, 'critical', 'Expected severe profile to classify as critical');
assert.ok(criticalRisk.probability >= 0.95, 'Expected severe profile to have very high probability');
assert.ok(criticalRisk.reasons.length >= 3, 'Expected explanatory factors for severe profile');

console.log('All predictor tests passed.');
