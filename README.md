# PregnancyAI Care Chatbot

PregnancyAI is now a **chatbot-only** static web app focused on friendly pregnancy guidance.

## Features

- Baby-pink, attractive chat interface.
- Hero + gallery images for a warm visual experience.
- Expanded intent coverage across 10 domains: emergency signs, nutrition, hydration, supplements/medications, common symptoms, exercise, sleep, appointments/tests, labor prep, and mental wellbeing.
- API-key mode for full LLM answers to open-ended pregnancy questions.
- Universal local fallback guidance if API key is not provided or API fails.
- Quick-action chips for common questions.

> ⚠️ This tool provides educational support only and is not a medical diagnosis platform.

## Project files

- `index.html` — chatbot UI with image-rich layout.
- `styles.css` — baby-pink visual theme and responsive styles.
- `script.js` — API-enabled chatbot flow + local intent fallback and chat rendering.
- `tests/chatbot.test.js` — automated validation for 10-topic routing, emergency overrides, and universal fallback behavior.

## Run locally

```bash
python -m http.server 4173
```

Open: `http://127.0.0.1:4173`

## Run tests

```bash
node --check script.js
node tests/chatbot.test.js
```
