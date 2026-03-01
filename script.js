const KNOWLEDGE_BASE = [
  {
    topic: 'Warning signs',
    answer:
      'Call emergency care immediately for severe abdominal pain, heavy bleeding, chest pain, breathing trouble, seizures, or fainting. Contact your obstetric team urgently for fluid leakage, severe headache, vision changes, or reduced fetal movement after 28 weeks.',
    keywords: ['warning signs', 'bleeding', 'emergency', 'danger', 'pain', 'headache', 'vision', 'fetal movement'],
    synonyms: ['urgent', 'hospital', 'alarm']
  },
  {
    topic: 'Foods to avoid',
    answer:
      'Avoid alcohol, high-mercury fish, raw or undercooked meat/eggs/seafood, and unpasteurized dairy products. Reheat deli meats to steaming and wash fruits/vegetables well.',
    keywords: ['foods', 'avoid', 'diet', 'raw', 'mercury', 'alcohol', 'pasteurized'],
    synonyms: ['nutrition', 'safe foods', 'sushi', 'cheese']
  },
  {
    topic: 'Hydration',
    answer:
      'Most pregnant women need around 8 to 12 cups of fluids daily. Drink more in hot weather, with exercise, or with vomiting. Pale-yellow urine is a useful hydration clue.',
    keywords: ['water', 'hydration', 'drink', 'fluids', 'dehydration'],
    synonyms: ['thirsty', 'urine color']
  },
  {
    topic: 'Prenatal vitamins',
    answer:
      'Prenatal vitamins usually include folic acid, iron, iodine, vitamin D, and DHA. Confirm exact dose and brand with your obstetric clinician.',
    keywords: ['vitamins', 'prenatal', 'folic acid', 'iron', 'dha', 'supplements'],
    synonyms: ['tablets', 'capsules']
  },
  {
    topic: 'Exercise',
    answer:
      'In uncomplicated pregnancies, moderate activity is often safe (walking, swimming, prenatal yoga). Avoid contact sports, overheating, and activities with high fall risk.',
    keywords: ['exercise', 'workout', 'walking', 'yoga', 'safe', 'activity'],
    synonyms: ['gym', 'fitness', 'running']
  },
  {
    topic: 'Sleep comfort',
    answer:
      'Try sleeping on your side (often left side), use pillows between knees and under your bump, and keep a regular bedtime routine for better comfort.',
    keywords: ['sleep', 'insomnia', 'side sleeping', 'night'],
    synonyms: ['rest', 'tired', 'position']
  },
  {
    topic: 'Default',
    answer:
      'I can help with pregnancy nutrition, warning signs, hydration, exercise, sleep comfort, and prenatal-care tips. For diagnosis or medication decisions, please contact your clinician.',
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
    if (phrase.includes(' ') && lower.includes(phrase.toLowerCase())) phraseBoost += 1.4;
  });

  return tokenHits + phraseBoost;
}

function findBestAnswer(input) {
  const tokens = normalize(input);
  if (!tokens.length) return { ...KNOWLEDGE_BASE.at(-1), confidence: 0.9 };

  const ranked = KNOWLEDGE_BASE.slice(0, -1)
    .map((entry) => ({ entry, score: scoreEntry(tokens, entry, input) }))
    .sort((a, b) => b.score - a.score);

  const [best, secondBest] = ranked;
  if (!best || best.score < 1) return { ...KNOWLEDGE_BASE.at(-1), confidence: 0.9 };

  const margin = best.score - (secondBest?.score ?? 0);
  const confidence = Number((Math.min(0.95, 0.9 + Math.max(0, margin) / 20)).toFixed(2));
  return { ...best.entry, confidence };
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
  setTimeout(() => respondToUser(input), 200);
});

document.querySelectorAll('.chip').forEach((btn) => {
  btn.addEventListener('click', () => {
    chatInput.value = btn.dataset.query;
    chatForm.requestSubmit();
  });
});

addMessage(
  'Hi mama! I am your baby-pink PregnancyAI chatbot 💗 Ask me about warning signs, food, hydration, vitamins, exercise, or sleep comfort.',
  'bot',
  'This is educational guidance, not a diagnosis.'
);

if (typeof window !== 'undefined') {
  window.findBestAnswer = findBestAnswer;
}
