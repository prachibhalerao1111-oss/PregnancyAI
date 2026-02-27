const KNOWLEDGE_BASE = [
  {
    topic: 'Emergency warning signs',
    answer:
      'Call emergency services immediately for severe abdominal pain, heavy bleeding, chest pain, breathing trouble, seizures, fainting, or signs of stroke. Contact your obstetric team urgently for vaginal bleeding, fluid leakage, reduced fetal movement (after 28 weeks), severe headache, vision changes, or swelling of face/hands.',
    keywords: ['emergency', 'bleeding', 'severe pain', 'doctor', 'hospital', 'fetal movement', 'headache', 'vision', 'swelling']
  },
  {
    topic: 'Foods to avoid',
    answer:
      'Avoid high-mercury fish (shark, swordfish, king mackerel), raw or undercooked meat/eggs/seafood, unpasteurized dairy or juice, deli meats unless reheated until steaming, and alcohol. Wash produce well and separate raw foods to lower infection risk.',
    keywords: ['food', 'eat', 'avoid', 'mercury', 'fish', 'raw', 'pasteurized', 'alcohol']
  },
  {
    topic: 'Hydration',
    answer:
      'Most pregnant people need about 8 to 12 cups (1.9 to 2.8 liters) of fluids daily, adjusting for heat/activity. Pale-yellow urine is a useful hydration sign. Increase intake if vomiting, exercising, or in hot weather.',
    keywords: ['water', 'hydration', 'drink', 'fluids', 'dehydration']
  },
  {
    topic: 'Prenatal vitamins',
    answer:
      'A prenatal vitamin with folic acid (typically 400–800 mcg), iron, iodine, vitamin D, and DHA support fetal development. Start folic acid before conception if possible, and follow your clinician for personalized dosing.',
    keywords: ['vitamin', 'folic acid', 'iron', 'dha', 'supplement', 'prenatal']
  },
  {
    topic: 'Nausea support',
    answer:
      'For nausea, try small frequent meals, bland foods, ginger, and hydration between meals. Vitamin B6 may help. Seek care if you cannot keep fluids down, feel dizzy, urinate less, or lose weight.',
    keywords: ['nausea', 'vomit', 'morning sickness', 'ginger', 'b6', 'dizzy']
  },
  {
    topic: 'Exercise safety',
    answer:
      'In uncomplicated pregnancies, moderate activity (~150 min/week) is generally encouraged: walking, swimming, prenatal yoga, and strength training with good form. Avoid contact sports, overheating, and lying flat on your back for long periods after mid-pregnancy.',
    keywords: ['exercise', 'workout', 'walk', 'yoga', 'safe activity', 'sports']
  },
  {
    topic: 'Default',
    answer:
      'I can help with pregnancy topics like nutrition, warning signs, medications, appointments, or symptom tracking. For personalized decisions, please contact your obstetric clinician.',
    keywords: []
  }
];

const STOP_WORDS = new Set(['the', 'a', 'an', 'and', 'or', 'is', 'are', 'to', 'of', 'for', 'in', 'on', 'it', 'while', 'during', 'my', 'i', 'me']);

function normalize(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((token) => token && !STOP_WORDS.has(token));
}

function scoreEntry(tokens, entry) {
  const joined = tokens.join(' ');
  const keywordTokens = entry.keywords.flatMap((key) => normalize(key));

  let matches = 0;
  for (const token of tokens) {
    if (keywordTokens.includes(token)) matches += 1;
  }

  let phraseBonus = 0;
  for (const phrase of entry.keywords) {
    if (joined.includes(phrase.toLowerCase())) phraseBonus += 2;
  }

  const denominator = Math.max(1, Math.sqrt(tokens.length * Math.max(keywordTokens.length, 1)));
  const score = (matches + phraseBonus) / denominator;
  return score;
}

function findBestAnswer(input) {
  const tokens = normalize(input);
  if (!tokens.length) return { ...KNOWLEDGE_BASE.at(-1), confidence: 0 };

  const ranked = KNOWLEDGE_BASE.slice(0, -1)
    .map((entry) => ({ entry, score: scoreEntry(tokens, entry) }))
    .sort((a, b) => b.score - a.score);

  const best = ranked[0];
  const confidence = Math.min(0.99, Number((best.score / 2.4).toFixed(2)));

  if (!best || best.score < 0.45) return { ...KNOWLEDGE_BASE.at(-1), confidence: 0.38 };

  return { ...best.entry, confidence: Math.max(0.4, confidence) };
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

  setTimeout(() => respondToUser(input), 240);
});

document.querySelectorAll('.chip').forEach((btn) => {
  btn.addEventListener('click', () => {
    const query = btn.dataset.query;
    chatInput.value = query;
    chatForm.requestSubmit();
  });
});

addMessage(
  'Hi, I am your PregnancyAI assistant. Ask me anything about pregnancy safety, nutrition, or common symptoms.',
  'bot',
  'Tip: mention week of pregnancy for more precise guidance.'
);
