# PregnancyAI Care Chatbot

PregnancyAI is now a **chatbot-only** static web app focused on friendly pregnancy guidance.

## Features

- Baby-pink, attractive chat interface.
- Hero + gallery images for a warm visual experience.
- Expanded multi-topic chatbot coverage for warning signs, nutrition, hydration, vitamins, exercise, sleep, labor prep, common symptoms, and mental wellbeing.
- Universal fallback guidance so every pregnancy question receives a useful response.
- Quick-action chips for common questions.

> ⚠️ This tool provides educational support only and is not a medical diagnosis platform.

## Project files

- `index.html` — chatbot UI with image-rich layout.
- `styles.css` — baby-pink visual theme and responsive styles.
- `script.js` — chatbot knowledge base, matching logic, and chat rendering.
- `tests/chatbot.test.js` — automated validation for broad chatbot routing and universal fallback behavior.

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
