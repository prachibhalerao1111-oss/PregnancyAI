const KNOWLEDGE_BASE = [
  {
    topic: 'Emergency warning signs',
    answer:
      'Please seek urgent medical care now for heavy bleeding, severe abdominal pain, chest pain, breathing difficulty, seizures, fainting, severe headache with vision changes, or reduced fetal movement (after 28 weeks).',
    keywords: ['emergency', 'urgent', 'bleeding', 'severe pain', 'fainting', 'seizure', 'vision changes', 'reduced movement', 'chest pain'],
    synonyms: ['hospital', 'danger', 'ambulance', '911']
  },
  {
    topic: 'Nutrition and food safety',
    answer:
      'Focus on balanced meals with protein, whole grains, fruits, vegetables, healthy fats, and iron-rich foods. Avoid alcohol, high-mercury fish, raw/undercooked animal foods, and unpasteurized dairy.',
    keywords: ['food', 'eat', 'diet', 'nutrition', 'mercury', 'raw', 'pasteurized', 'alcohol'],
    synonyms: ['meal', 'cravings', 'safe foods']
  },
  {
    topic: 'Hydration',
    answer:
      'Most pregnant women need around 8–12 cups of fluids daily, often more in heat, exercise, or vomiting. Pale-yellow urine usually suggests good hydration.',
    keywords: ['water', 'hydration', 'drink', 'fluids', 'dehydration'],
    synonyms: ['thirsty', 'dry mouth', 'urine color']
  },
  {
    topic: 'Prenatal vitamins and supplements',
    answer:
      'Prenatal vitamins commonly include folic acid, iron, iodine, vitamin D, and DHA. Ask your obstetric clinician for exact dose based on your labs and trimester.',
    keywords: ['vitamins', 'prenatal', 'folic acid', 'iron', 'dha', 'supplement'],
    synonyms: ['tablet', 'capsule', 'dose']
  },
  {
    topic: 'Exercise and activity',
    answer:
      'For uncomplicated pregnancy, moderate activity (walking, swimming, prenatal yoga) is usually safe. Avoid contact sports, overheating, and high-fall-risk activities.',
    keywords: ['exercise', 'workout', 'walking', 'yoga', 'activity', 'gym'],
    synonyms: ['run', 'fitness', 'stretching']
  },
  {
    topic: 'Common symptoms (nausea, heartburn, fatigue)',
    answer:
      'For nausea, try small frequent meals, ginger, and hydration. For heartburn, use smaller meals and avoid lying down right after eating. Persistent vomiting, dehydration, or severe pain needs medical review.',
    keywords: ['nausea', 'vomiting', 'heartburn', 'fatigue', 'tired', 'morning sickness'],
    synonyms: ['acid reflux', 'sick', 'queasy']
  },
  {
    topic: 'Sleep and comfort',
    answer:
      'Try side sleeping (often left side), support pillows between knees and under the abdomen, regular sleep schedule, and reduced screen time before bed.',
    keywords: ['sleep', 'insomnia', 'position', 'night'],
    synonyms: ['rest', 'pillow', 'left side']
  },
  {
    topic: 'Labor and delivery preparation',
    answer:
      'Prepare by tracking contractions, knowing fluid leakage and bleeding warning signs, finalizing hospital/birth bag items, and discussing your birth plan with your care team.',
    keywords: ['labor', 'delivery', 'contractions', 'birth plan', 'hospital bag'],
    synonyms: ['due date', 'water broke', 'induction']
  },
  {
    topic: 'Mental health and stress',
    answer:
      'Mood changes can happen in pregnancy. Prioritize sleep, social support, light activity, and stress-reduction practices. If sadness, anxiety, panic, or hopelessness persist, contact your clinician promptly.',
    keywords: ['anxiety', 'stress', 'depression', 'mood', 'panic'],
    synonyms: ['mental health', 'sad', 'overwhelmed']
  }
];

const STOP_WORDS = new Set(['the', 'a', 'an', 'and', 'or', 'is', 'are', 'to', 'of', 'for', 'in', 'on', 'it', 'i', 'my', 'me', 'what', 'how', 'can', 'should']);

function normalize(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((token) => token && !STOP_WORDS.has(token));
}

function extractWeek(text) {
  const match = text.toLowerCase().match(/(\d{1,2})\s*(week|weeks|wk)/);
  if (!match) return null;
  const week = Number(match[1]);
  if (Number.isNaN(week) || week < 1 || week > 42) return null;
  return week;
}

function getTrimester(week) {
  if (!week) return '';
  if (week <= 13) return 'first trimester';
  if (week <= 27) return 'second trimester';
  return 'third trimester';
}

function hasEmergencySignals(inputLower) {
  const emergencyTerms = [
    'heavy bleeding', 'severe bleeding', 'fainting', 'seizure', 'can t breathe', 'cannot breathe',
    'chest pain', 'severe abdominal pain', 'vision loss', 'reduced movement', 'no fetal movement'
  ];
  return emergencyTerms.some((term) => inputLower.includes(term));
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
    if (phrase.includes(' ') && lower.includes(phrase.toLowerCase())) phraseBoost += 1.35;
  });

  return tokenHits + phraseBoost;
}

function buildUniversalAnswer(input, bestTopic, week) {
  const trimester = getTrimester(week);
  const weekHint = week ? ` Since you mentioned week ${week} (${trimester}), tailor decisions to that stage with your OB team.` : '';

  return `I can help with this question. ${bestTopic ? `The closest topic is: ${bestTopic}. ` : ''}General safe next steps: monitor symptoms, keep hydration/nutrition stable, avoid self-medicating without clinician advice, and contact your obstetric clinician for personalized treatment choices.${weekHint}`;
}

function findBestAnswer(input) {
  const tokens = normalize(input);
  const lower = input.toLowerCase();
  const week = extractWeek(input);

  if (hasEmergencySignals(lower)) {
    return {
      topic: 'Emergency warning signs',
      answer: KNOWLEDGE_BASE[0].answer,
      confidence: 0.95
    };
  }

  const ranked = KNOWLEDGE_BASE
    .map((entry) => ({ entry, score: scoreEntry(tokens, entry, input) }))
    .sort((a, b) => b.score - a.score);

  const [best, secondBest] = ranked;

  if (!best || best.score < 0.8) {
    return {
      topic: 'General pregnancy guidance',
      answer: buildUniversalAnswer(input, null, week),
      confidence: 0.9
    };
  }

  const margin = best.score - (secondBest?.score ?? 0);
  const confidence = Number((Math.min(0.96, 0.9 + Math.max(0, margin) / 20)).toFixed(2));

  const tailored = `${best.entry.answer}${week ? ` This appears to be during week ${week} (${getTrimester(week)}), so confirm timing-specific advice with your clinician.` : ''}`;

  return {
    topic: best.entry.topic,
    answer: tailored,
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
  const meta = `Topic: ${result.topic} · confidence ${Math.round(result.confidence * 100)}%`;
  addMessage(result.answer, 'bot', meta);
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
  'Hi mama 💗 I can answer any pregnancy question with best-match guidance (nutrition, symptoms, sleep, exercise, labor prep, stress, and more).',
  'bot',
  'If you can, include your pregnancy week for better answers.'
);

if (typeof window !== 'undefined') {
  window.findBestAnswer = findBestAnswer;
}
