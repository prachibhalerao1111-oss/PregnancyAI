# PregnancyAI Care Chatbot

PregnancyAI is now a **chatbot-only** static web app focused on friendly pregnancy guidance.

## Features

- Baby-pink, attractive chat interface.
- Hero + gallery images for a warm visual experience.
- Rule-based chatbot responses for:
  - warning signs,
  - foods to avoid,
  - hydration,
  - prenatal vitamins,
  - exercise,
  - sleep comfort.
- Quick-action chips for common questions.

> ⚠️ This tool provides educational support only and is not a medical diagnosis platform.

## Project files

- `index.html` — chatbot UI with image-rich layout.
- `styles.css` — baby-pink visual theme and responsive styles.
- `script.js` — chatbot knowledge base, matching logic, and chat rendering.
- `tests/chatbot.test.js` — automated validation for chatbot topic routing.

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
