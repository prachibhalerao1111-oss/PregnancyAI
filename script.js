const INTENTS = [
  {
    topic: 'Emergency warning signs',
    response:
      'Get urgent care now for heavy bleeding, severe abdominal pain, chest pain, breathing trouble, seizure, fainting, severe headache with vision changes, or reduced/no fetal movement after 28 weeks.',
    patterns: ['emergency', 'urgent', 'heavy bleeding', 'seizure', 'fainting', 'chest pain', 'cannot breathe', 'reduced fetal movement', 'severe headache', 'vision changes']
  },
  {
    topic: 'Nutrition and food safety',
    response:
      'Use balanced meals with protein, whole grains, fruits, vegetables, calcium, and iron-rich foods. Avoid alcohol, high-mercury fish, raw/undercooked meat or eggs, and unpasteurized dairy.',
    patterns: ['food', 'diet', 'eat', 'nutrition', 'craving', 'mercury', 'pasteurized', 'raw', 'sushi', 'cheese', 'alcohol']
  },
  {
    topic: 'Hydration',
    response:
      'Most pregnant women need ~8–12 cups of fluids per day, often more in heat, exercise, vomiting, or diarrhea. Pale-yellow urine usually indicates better hydration.',
    patterns: ['hydration', 'water', 'drink', 'dehydration', 'thirsty', 'urine color']
  },
  {
    topic: 'Supplements and medications',
    response:
      'Prenatal supplements often include folic acid, iron, iodine, vitamin D, and DHA. For any medicine (prescription/OTC/herbal), confirm safety with your obstetric clinician before use.',
    patterns: ['vitamin', 'prenatal', 'folic acid', 'supplement', 'medicine', 'medication', 'tablet', 'iron', 'dha', 'painkiller']
  },
  {
    topic: 'Common symptoms',
    response:
      'For nausea: small frequent meals + ginger + fluids. For constipation: fiber + hydration + movement. For heartburn: smaller meals and avoid lying down after food. Persistent or worsening symptoms should be reviewed clinically.',
    patterns: ['nausea', 'vomit', 'morning sickness', 'heartburn', 'constipation', 'back pain', 'fatigue', 'headache', 'swelling']
  },
  {
    topic: 'Exercise and activity',
    response:
      'For uncomplicated pregnancy, moderate activity (walking, swimming, prenatal yoga) is commonly advised. Avoid overheating, contact sports, scuba, and high-fall-risk activities.',
    patterns: ['exercise', 'workout', 'yoga', 'running', 'gym', 'walk', 'activity']
  },
  {
    topic: 'Sleep and comfort',
    response:
      'Try side sleeping (often left side), support pillows, regular sleep schedule, and less evening caffeine/screen time. Severe sleep disturbance should be discussed with your clinician.',
    patterns: ['sleep', 'insomnia', 'position', 'rest', 'pillow', 'left side']
  },
  {
    topic: 'Appointments and tests',
    response:
      'Routine prenatal care often includes BP checks, urine/labs, glucose screening, anatomy scan, and growth follow-up based on trimester and risk profile. Keep scheduled visits.',
    patterns: ['appointment', 'scan', 'ultrasound', 'test', 'screening', 'checkup', 'glucose test', 'nt scan', 'anomaly scan']
  },
  {
    topic: 'Labor and delivery prep',
    response:
      'Prepare by learning true-vs-false labor signs, timing contractions, watching for fluid leakage/bleeding, packing a hospital bag, and discussing birth plan and pain options.',
    patterns: ['labor', 'delivery', 'contraction', 'due date', 'birth plan', 'hospital bag', 'water broke', 'induction', 'c section']
  },
  {
    topic: 'Mental health and wellbeing',
    response:
      'Mood changes can happen in pregnancy. Prioritize sleep, social support, light activity, and stress-reduction habits. Persistent anxiety, panic, sadness, or hopelessness needs clinical support.',
    patterns: ['anxiety', 'stress', 'depression', 'panic', 'sad', 'mental health', 'overwhelmed']
  },
  {
    topic: 'Travel and daily life',
    response:
      'Travel is often possible in uncomplicated pregnancy, but timing/risk matters. Keep hydration, move regularly on long trips, wear seat belts properly, and confirm travel safety with your clinician—especially in late pregnancy.',
    patterns: ['travel', 'flight', 'flying', 'car trip', 'journey', 'seat belt']
  },
  {
    topic: 'Sex and relationships',
    response:
      'Sex is commonly safe in uncomplicated pregnancy. Avoid or pause if your clinician advised pelvic rest, or if you have bleeding, pain, fluid leakage, or placenta/cervical concerns.',
    patterns: ['sex', 'intercourse', 'intimacy', 'relationship']
  },
  {
    topic: 'Work and lifestyle',
    response:
      'Most people can continue work with adjustments: hydration breaks, posture support, avoiding heavy lifting/toxins, and managing fatigue. Ask your clinician for personalized workplace limits.',
    patterns: ['work', 'office', 'shift', 'lifting', 'standing', 'job']
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
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
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
    if (pattern.includes(' ') && joined.includes(pattern.toLowerCase())) phraseBonus += 1.45;
  });
  const coverage = uniqueTokens.length ? tokenScore / uniqueTokens.length : 0;
  return tokenScore + phraseBonus + (coverage * 1.3);
}

function emergencyOverride(rawInput) {
  const urgentSignals = ['heavy bleeding', 'severe bleeding', 'cannot breathe', 'chest pain', 'fainting', 'seizure', 'no fetal movement', 'reduced fetal movement', 'vision changes with headache'];
  const normalized = rawInput.toLowerCase();
  return urgentSignals.some((signal) => normalized.includes(signal));
}

function buildPracticalChecklist(question, week) {
  const trimester = trimesterForWeek(week);
  const stageText = week ? `Because you mentioned week ${week} (${trimester}), confirm timing-specific advice with your obstetric team.` : 'If possible, include your pregnancy week for more tailored guidance.';
  return `Practical next steps:\n1) Track symptom timing/severity and triggers.\n2) Maintain hydration and regular nutrition.\n3) Avoid starting medicines/supplements without clinician confirmation.\n4) Seek urgent care for bleeding, severe pain, chest pain, breathing trouble, fainting, or reduced fetal movement after 28 weeks.\n${stageText}`;
}

function universalAnswer(question, week, closestTopic = null) {
  const closestText = closestTopic ? `Closest matched area: ${closestTopic}.` : 'I could not map this to one exact topic.';
  return `${closestText} I can still help with this question in a safe way. ${buildPracticalChecklist(question, week)}`;
}

function localAnswer(input) {
  const tokens = normalize(input);
  const week = extractWeek(input);

  if (emergencyOverride(input)) {
    return { topic: 'Emergency warning signs', answer: INTENTS[0].response, confidence: 0.95 };
  }

  const ranked = INTENTS.map((intent) => ({ intent, score: scoreIntent(tokens, input, intent) })).sort((a, b) => b.score - a.score);
  const [best, second] = ranked;

  if (!best || best.score < 0.8) {
    return { topic: 'General pregnancy guidance', answer: universalAnswer(input, week), confidence: 0.9 };
  }

  const secondTopic = second?.intent?.topic;
  const margin = best.score - (second?.score ?? 0);
  const confidence = Number(Math.min(0.95, 0.9 + Math.max(0, margin) / 25).toFixed(2));
  const trimester = trimesterForWeek(week);
  const stageTail = week ? ` This appears related to week ${week} (${trimester}).` : '';
  const combinedContext = secondTopic ? ` Related area: ${secondTopic}.` : '';

  return {
    topic: best.intent.topic,
    answer: `${best.intent.response}${combinedContext}${stageTail} ${buildPracticalChecklist(input, week)}`,
    confidence
  };
}

function buildApiMessages(userInput) {
  return [
    {
      role: 'system',
      content: 'You are PregnancyAI, a supportive pregnancy-health chatbot. Answer any pregnancy question with practical and evidence-aligned guidance. Always mention urgent red flags when relevant. Never claim diagnosis. For medicines/treatment, advise clinician confirmation. If uncertain, provide safe next steps and follow-up questions.'
    },
    { role: 'user', content: userInput }
  ];
}

async function getApiAnswer(userInput, apiKey, model) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ model, messages: buildApiMessages(userInput), temperature: 0.2 })
  });

  if (!response.ok) throw new Error(`API request failed (${response.status})`);
  const payload = await response.json();
  const content = payload?.choices?.[0]?.message?.content?.trim();
  if (!content) throw new Error('Empty API response');
  return content;
}

const chatWindow = document.getElementById('chat-window');
const chatForm = document.getElementById('chat-form');
const chatInput = document.getElementById('chat-input');
const apiKeyInput = document.getElementById('api-key');
const apiModelInput = document.getElementById('api-model');

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

async function respondToUser(input) {
  const apiKey = apiKeyInput?.value?.trim();
  const model = apiModelInput?.value?.trim() || 'gpt-4o-mini';

  if (apiKey && typeof fetch === 'function') {
    try {
      const aiAnswer = await getApiAnswer(input, apiKey, model);
      addMessage(aiAnswer, 'bot', `Topic: Full AI answer · model ${model}`);
      return;
    } catch (_err) {
      const local = localAnswer(input);
      addMessage(local.answer, 'bot', `Topic: ${local.topic} · local fallback after API error`);
      return;
    }
  }

  const result = localAnswer(input);
  addMessage(result.answer, 'bot', `Topic: ${result.topic} · confidence ${Math.round(result.confidence * 100)}%`);
}

chatForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const input = chatInput.value.trim();
  if (!input) return;
  addMessage(input, 'user');
  chatInput.value = '';
  await respondToUser(input);
});

document.querySelectorAll('.chip').forEach((btn) => {
  btn.addEventListener('click', () => {
    chatInput.value = btn.dataset.query;
    chatForm.requestSubmit();
  });
});

addMessage(
  'Hi mama 💗 I can handle broad pregnancy questions. For best open-ended answers, add API key above. Without key, I still provide detailed local guidance with safety checklists.',
  'bot',
  'Educational support only; for diagnosis and treatment, contact your clinician.'
);

if (typeof window !== 'undefined') {
  window.findBestAnswer = localAnswer;
  window.buildApiMessages = buildApiMessages;
}
