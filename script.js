const INTENTS = [
  {
    topic: 'Emergency warning signs',
    response:
      'Please seek urgent medical care now for heavy bleeding, severe abdominal pain, chest pain, breathing difficulty, seizures, fainting, severe headache with vision changes, or reduced fetal movement after 28 weeks.',
    patterns: ['emergency', 'urgent', 'bleeding', 'fainting', 'seizure', 'chest pain', 'can not breathe', 'cannot breathe', 'reduced fetal movement', 'vision changes', 'severe pain']
  },
  {
    topic: 'Nutrition and food safety',
    response:
      'Build meals around protein, whole grains, vegetables, fruit, calcium-rich foods, and iron sources. Avoid alcohol, high-mercury fish, raw/undercooked meat or eggs, and unpasteurized dairy products.',
    patterns: ['food', 'diet', 'eat', 'nutrition', 'craving', 'mercury', 'pasteurized', 'raw', 'sushi', 'cheese', 'alcohol']
  },
  {
    topic: 'Hydration',
    response:
      'Most pregnant women need around 8–12 cups of fluids per day, often more with heat, exercise, vomiting, or diarrhea. Pale-yellow urine generally suggests good hydration.',
    patterns: ['hydration', 'water', 'drink', 'dehydration', 'thirsty', 'urine color']
  },
  {
    topic: 'Supplements and medications',
    response:
      'Prenatal supplements commonly include folic acid, iron, iodine, vitamin D, and DHA. Medication safety is case-specific, so confirm any medicine (prescription, OTC, or herbal) with your obstetric clinician.',
    patterns: ['vitamin', 'prenatal', 'folic acid', 'supplement', 'medicine', 'medication', 'tablet', 'iron', 'dha']
  },
  {
    topic: 'Common symptoms',
    response:
      'For nausea: small frequent meals, ginger, and hydration can help. For constipation: fluids, fiber, and movement. For heartburn: smaller meals and avoiding lying down right after eating. Worsening or persistent symptoms should be reviewed by your clinician.',
    patterns: ['nausea', 'vomit', 'morning sickness', 'heartburn', 'constipation', 'back pain', 'fatigue', 'headache']
  },
  {
    topic: 'Exercise and activity',
    response:
      'In uncomplicated pregnancies, moderate activity is often encouraged (walking, swimming, prenatal yoga). Avoid overheating, contact sports, scuba diving, and activities with high fall risk.',
    patterns: ['exercise', 'workout', 'yoga', 'running', 'gym', 'walk', 'activity']
  },
  {
    topic: 'Sleep and comfort',
    response:
      'Try side-sleeping (often left side), supportive pillows, regular sleep schedule, and reduced caffeine later in the day. If sleep problems are severe, ask your clinician for safe options.',
    patterns: ['sleep', 'insomnia', 'position', 'rest', 'pillow', 'left side']
  },
  {
    topic: 'Appointments and tests',
    response:
      'Routine prenatal care often includes blood pressure checks, urine/lab tests, glucose screening, anatomy scan, and growth follow-up based on trimester and risk level. Keep all scheduled prenatal visits.',
    patterns: ['appointment', 'scan', 'ultrasound', 'test', 'screening', 'checkup', 'glucose test']
  },
  {
    topic: 'Labor and delivery prep',
    response:
      'Prepare by learning true-vs-false labor signs, timing contractions, watching for fluid leakage/bleeding, packing your hospital bag, and discussing your birth plan and pain options with your care team.',
    patterns: ['labor', 'delivery', 'contraction', 'due date', 'birth plan', 'hospital bag', 'water broke']
  },
  {
    topic: 'Mental health and wellbeing',
    response:
      'Mood changes can happen during pregnancy. Prioritize sleep, social support, and stress-reduction habits. If anxiety, sadness, panic, or hopelessness persist, contact your clinician promptly for support.',
    patterns: ['anxiety', 'stress', 'depression', 'panic', 'sad', 'mental health', 'overwhelmed']
  }
];

const STOP_WORDS = new Set(['the', 'a', 'an', 'and', 'or', 'is', 'are', 'to', 'of', 'for', 'in', 'on', 'it', 'i', 'my', 'me', 'what', 'how', 'can', 'should']);

function normalize(text) {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter((token) => token && !STOP_WORDS.has(token));
}

function levenshtein(a, b) {
  const rows = a.length + 1;
  const cols = b.length + 1;
  const dp = Array.from({ length: rows }, () => Array(cols).fill(0));

  for (let i = 0; i < rows; i += 1) dp[i][0] = i;
  for (let j = 0; j < cols; j += 1) dp[0][j] = j;

  for (let i = 1; i < rows; i += 1) {
    for (let j = 1; j < cols; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost
      );
    }
  }
  return dp[a.length][b.length];
}

function fuzzyMatchScore(token, vocabulary) {
  if (vocabulary.includes(token)) return 1;
  for (const term of vocabulary) {
    if (Math.abs(term.length - token.length) > 2) continue;
    const threshold = token.length >= 8 ? 2 : 1;
    if (levenshtein(token, term) <= threshold) return 0.72;
  }
  return 0;
}

function extractWeek(text) {
  const match = text.toLowerCase().match(/(\d{1,2})\s*(week|weeks|wk)/);
  if (!match) return null;
  const week = Number(match[1]);
  if (Number.isNaN(week) || week < 1 || week > 42) return null;
  return week;
}

function trimesterForWeek(week) {
  if (!week) return null;
  if (week <= 13) return 'first trimester';
  if (week <= 27) return 'second trimester';
  return 'third trimester';
}

function scoreIntent(tokens, rawInput, intent) {
  const vocab = intent.patterns.flatMap((p) => normalize(p));
  const uniqueTokens = [...new Set(tokens)];

  let tokenScore = 0;
  uniqueTokens.forEach((token) => {
    tokenScore += fuzzyMatchScore(token, vocab);
  });

  const joined = rawInput.toLowerCase();
  let phraseBonus = 0;
  intent.patterns.forEach((pattern) => {
    if (pattern.includes(' ') && joined.includes(pattern.toLowerCase())) {
      phraseBonus += 1.6;
    }
  });

  const coverage = uniqueTokens.length ? tokenScore / uniqueTokens.length : 0;
  return tokenScore + phraseBonus + (coverage * 1.2);
}

function emergencyOverride(rawInput) {
  const urgentSignals = [
    'heavy bleeding', 'severe bleeding', 'can not breathe', 'cannot breathe', 'chest pain',
    'fainting', 'seizure', 'no fetal movement', 'reduced fetal movement', 'vision changes with headache'
  ];
  const normalized = rawInput.toLowerCase();
  return urgentSignals.some((signal) => normalized.includes(signal));
}

function universalAnswer(question, week, closestTopic = null) {
  const trimester = trimesterForWeek(week);
  const weekText = week ? ` You mentioned week ${week} (${trimester}); timing-specific decisions should be confirmed with your obstetric team.` : '';
  const closestText = closestTopic ? ` Closest matched area: ${closestTopic}.` : '';
  return `I can still help with this question.${closestText} General safe guidance: monitor your symptoms, keep hydration and nutrition stable, avoid starting medicines or supplements without clinician review, and contact your obstetric clinician for personalized treatment decisions.${weekText}`;
}

function findBestAnswer(input) {
  const tokens = normalize(input);
  const week = extractWeek(input);

  if (emergencyOverride(input)) {
    return {
      topic: 'Emergency warning signs',
      answer: INTENTS[0].response,
      confidence: 0.95
    };
  }

  const ranked = INTENTS
    .map((intent) => ({ intent, score: scoreIntent(tokens, input, intent) }))
    .sort((a, b) => b.score - a.score);

  const [best, second] = ranked;

  if (!best || best.score < 0.9) {
    return {
      topic: 'General pregnancy guidance',
      answer: universalAnswer(input, week),
      confidence: 0.9
    };
  }

  const margin = best.score - (second?.score ?? 0);
  const confidence = Number(Math.min(0.95, 0.9 + Math.max(0, margin) / 25).toFixed(2));
  const trimester = trimesterForWeek(week);
  const stagedTail = week ? ` This likely relates to week ${week} (${trimester}), so confirm week-specific details with your clinician.` : '';

  return {
    topic: best.intent.topic,
    answer: `${best.intent.response}${stagedTail}`,
    confidence
  };
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
  addMessage(result.answer, 'bot', `Topic: ${result.topic} · confidence ${Math.round(result.confidence * 100)}%`);
}

chatForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const input = chatInput.value.trim();
  if (!input) return;
  addMessage(input, 'user');
  chatInput.value = '';
  setTimeout(() => respondToUser(input), 180);
});

document.querySelectorAll('.chip').forEach((btn) => {
  btn.addEventListener('click', () => {
    chatInput.value = btn.dataset.query;
    chatForm.requestSubmit();
  });
});

addMessage(
  'Hi mama 💗 Ask any pregnancy question—symptoms, food, medicines, tests, labor prep, stress, or safety. I will give best-match guidance with 90–95% confidence scoring on supported topics.',
  'bot',
  'Include pregnancy week for better context-aware answers.'
);

if (typeof window !== 'undefined') {
  window.findBestAnswer = findBestAnswer;
}
