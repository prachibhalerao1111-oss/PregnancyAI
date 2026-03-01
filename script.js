const KNOWLEDGE_BASE = [
  {
    topic: 'Preeclampsia warning signs',
    answer:
      'Urgent warning signs include severe headache, vision changes, upper abdominal pain, sudden swelling, breathing difficulty, and high blood pressure. Seek urgent obstetric care if these occur.',
    keywords: ['preeclampsia', 'high blood pressure', 'headache', 'swelling', 'vision', 'urgent'],
    synonyms: ['bp', 'hypertension', 'danger signs']
  },
  {
    topic: 'Foods to avoid',
    answer:
      'Avoid high-mercury fish, raw or undercooked animal foods, unpasteurized products, and alcohol. Reheat deli meats to steaming and wash produce carefully.',
    keywords: ['food', 'avoid', 'mercury', 'raw', 'pasteurized', 'alcohol'],
    synonyms: ['diet', 'nutrition', 'safe food']
  },
  {
    topic: 'Hydration',
    answer:
      'Typical fluid needs are around 8–12 cups per day, adjusted for weather, exercise, and vomiting. Pale-yellow urine usually indicates adequate hydration.',
    keywords: ['water', 'hydration', 'drink', 'fluids', 'dehydration'],
    synonyms: ['thirsty', 'urine color']
  },
  {
    topic: 'Prenatal vitamins',
    answer:
      'A prenatal vitamin generally includes folic acid, iron, iodine, vitamin D, and often DHA. Use your clinician’s dose recommendations for your trimester and labs.',
    keywords: ['prenatal', 'vitamin', 'folic acid', 'iron', 'dha'],
    synonyms: ['supplements', 'first trimester']
  },
  {
    topic: 'Default',
    answer:
      'I can help with warning signs, nutrition, symptoms, and prenatal-care planning. For treatment decisions, contact your obstetric clinician.',
    keywords: [],
    synonyms: []
  }
];

const STOP_WORDS = new Set(['the', 'a', 'an', 'and', 'or', 'is', 'are', 'to', 'of', 'for', 'in', 'on', 'it', 'i', 'my', 'me', 'what', 'how']);

function normalize(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((token) => token && !STOP_WORDS.has(token));
}

function sigmoid(x) {
  return 1 / (1 + Math.exp(-x));
}

function assessBloodPressure(sbp, dbp) {
  if (sbp >= 160 || dbp >= 110) return { points: 35, note: 'Severe-range blood pressure' };
  if (sbp >= 140 || dbp >= 90) return { points: 20, note: 'Hypertensive-range blood pressure' };
  if (sbp <= 90 || dbp <= 60) return { points: 8, note: 'Low blood pressure symptoms risk' };
  return { points: 2, note: 'Blood pressure in safer range' };
}

function assessGlucose(glucose) {
  if (glucose >= 200) return { points: 30, note: 'Very high glucose risk' };
  if (glucose >= 140) return { points: 18, note: 'Possible gestational glucose intolerance' };
  if (glucose < 70) return { points: 8, note: 'Low glucose risk' };
  return { points: 2, note: 'Glucose in safer range' };
}

function assessHemoglobin(hb) {
  if (hb < 9) return { points: 18, note: 'Moderate-to-severe anemia concern' };
  if (hb < 11) return { points: 10, note: 'Mild anemia concern' };
  return { points: 2, note: 'Hemoglobin in safer range' };
}

function predictHealthRisk(features) {
  const bp = assessBloodPressure(features.sbp, features.dbp);
  const glucose = assessGlucose(features.glucose);
  const hemoglobin = assessHemoglobin(features.hemoglobin);

  let score = bp.points + glucose.points + hemoglobin.points;

  if (features.age >= 35 || features.age <= 17) score += 8;
  if (features.bmi >= 30 || features.bmi < 18.5) score += 7;
  if (features.week >= 28) score += 4;
  if (features.prevComplication) score += 15;
  if (features.smoking) score += 8;
  if (features.reducedMovement && features.week >= 24) score += 18;

  score = Math.max(0, Math.min(100, score));
  const probability = Number(sigmoid((score - 38) / 10).toFixed(2));

  const severeFlags = (features.sbp >= 160 || features.dbp >= 110) || features.reducedMovement || features.glucose >= 200;

  let level = 'low';
  if (severeFlags || score >= 70) level = 'critical';
  else if (score >= 50) level = 'high';
  else if (score >= 30) level = 'moderate';

  const confidence = Number((0.9 + Math.min(0.05, Math.abs(score - 40) / 100)).toFixed(2));

  const reasons = [bp.note, glucose.note, hemoglobin.note];
  if (features.prevComplication) reasons.push('History of prior pregnancy complication');
  if (features.reducedMovement && features.week >= 24) reasons.push('Reduced fetal movement concern');

  return { score, probability, level, confidence, reasons };
}

function recommendationByLevel(level) {
  if (level === 'critical') {
    return 'Seek urgent obstetric/emergency assessment now, especially if symptoms are present (severe headache, bleeding, chest pain, breathing difficulty, or reduced fetal movement).';
  }
  if (level === 'high') {
    return 'Arrange same-day or next-day obstetric review, monitor blood pressure, and review glucose/anemia labs promptly.';
  }
  if (level === 'moderate') {
    return 'Schedule early follow-up, improve hydration/nutrition, and continue symptom tracking with your prenatal team.';
  }
  return 'Continue routine prenatal visits, healthy lifestyle habits, and regular symptom monitoring.';
}

function renderPrediction(result) {
  const output = document.getElementById('prediction-output');
  output.innerHTML = `
    <h3>Prediction output</h3>
    <p><span class="badge ${result.level}">${result.level.toUpperCase()} RISK</span></p>
    <p><strong>Risk score:</strong> ${result.score}/100</p>
    <p><strong>Risk probability:</strong> ${Math.round(result.probability * 100)}%</p>
    <p><strong>Model confidence:</strong> ${Math.round(result.confidence * 100)}%</p>
    <p><strong>Key factors:</strong> ${result.reasons.join('; ')}.</p>
    <p><strong>Recommended action:</strong> ${recommendationByLevel(result.level)}</p>
  `;
}

function setupPredictor() {
  const form = document.getElementById('predict-form');
  form.addEventListener('submit', (event) => {
    event.preventDefault();

    const features = {
      age: Number(document.getElementById('age').value),
      week: Number(document.getElementById('week').value),
      sbp: Number(document.getElementById('sbp').value),
      dbp: Number(document.getElementById('dbp').value),
      bmi: Number(document.getElementById('bmi').value),
      glucose: Number(document.getElementById('glucose').value),
      hemoglobin: Number(document.getElementById('hemoglobin').value),
      prevComplication: document.getElementById('prevComplication').checked,
      smoking: document.getElementById('smoking').checked,
      reducedMovement: document.getElementById('reducedMovement').checked
    };

    const result = predictHealthRisk(features);
    renderPrediction(result);
  });
}

function scoreEntry(tokens, entry, fullInput) {
  const vocabulary = [...entry.keywords, ...entry.synonyms].flatMap((item) => normalize(item));
  const uniqueTokens = [...new Set(tokens)];

  let tokenHits = 0;
  uniqueTokens.forEach((token) => {
    if (vocabulary.includes(token)) tokenHits += 1;
  });

  let phraseBoost = 0;
  const lower = fullInput.toLowerCase();
  [...entry.keywords, ...entry.synonyms].forEach((phrase) => {
    if (phrase.includes(' ') && lower.includes(phrase.toLowerCase())) phraseBoost += 1.5;
  });

  return tokenHits + phraseBoost;
}

function findBestAnswer(input) {
  const tokens = normalize(input);
  if (!tokens.length) return { ...KNOWLEDGE_BASE.at(-1), confidence: 0.9 };

  const ranked = KNOWLEDGE_BASE.slice(0, -1)
    .map((entry) => ({ entry, score: scoreEntry(tokens, entry, input) }))
    .sort((a, b) => b.score - a.score);

  const best = ranked[0];
  if (!best || best.score < 1) return { ...KNOWLEDGE_BASE.at(-1), confidence: 0.9 };

  return { ...best.entry, confidence: 0.92 };
}

const chatWindow = document.getElementById('chat-window');
const chatForm = document.getElementById('chat-form');
const chatInput = document.getElementById('chat-input');

function addMessage(text, role, metaText = '') {
  const msg = document.createElement('article');
  msg.className = `message ${role}`;

  const body = document.createElement('div');
  body.textContent = text;
  msg.appendChild(body);

  if (metaText) {
    const meta = document.createElement('p');
    meta.className = 'meta';
    meta.textContent = metaText;
    msg.appendChild(meta);
  }

  chatWindow.appendChild(msg);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

function respondToUser(input) {
  const result = findBestAnswer(input);
  const confidenceLabel = `Topic: ${result.topic} · confidence ${Math.round(result.confidence * 100)}%`;
  addMessage(result.answer, 'bot', confidenceLabel);
}

chatForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const input = chatInput.value.trim();
  if (!input) return;

  addMessage(input, 'user');
  chatInput.value = '';
  setTimeout(() => respondToUser(input), 200);
});

document.querySelectorAll('.chip').forEach((btn) => {
  btn.addEventListener('click', () => {
    chatInput.value = btn.dataset.query;
    chatForm.requestSubmit();
  });
});

addMessage(
  'Hi, I can help explain pregnancy symptoms and health planning. Use the predictor above for risk screening and this chat for guidance.',
  'bot',
  'Important: this is screening support and not a medical diagnosis.'
);

setupPredictor();

if (typeof window !== 'undefined') {
  window.predictHealthRisk = predictHealthRisk;
}
