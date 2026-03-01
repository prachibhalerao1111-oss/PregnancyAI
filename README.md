# PregnancyAI Predictive Health System

PregnancyAI is a static web application that combines:

1. **Pregnancy risk screening** using client-side health-factor scoring.
2. **Care chatbot guidance** for common prenatal questions.

> ⚠️ This project is for **education and screening support** only and is **not a diagnosis system**.

## What this project includes

- `index.html` – app shell with predictor form, prediction output, and chatbot UI.
- `script.js` – predictor logic, explainability output, and chatbot matching logic.
- `styles.css` – responsive theme, predictor/chat cards, and risk badges.
- `tests/predictor.test.js` – Node-based validation for predictor and chatbot routing.

## Predictor model summary

The predictor computes risk from:

- Maternal age
- Gestational week
- Systolic/diastolic blood pressure
- BMI
- Glucose
- Hemoglobin
- Prior pregnancy complication history
- Smoking
- Reduced fetal movement flag

### Output

- Risk score (`0-100`)
- Risk probability (`0-1`, sigmoid-mapped)
- Risk level (`low`, `moderate`, `high`, `critical`)
- Confidence estimate
- Key contributing factors
- Recommended action based on risk level

## Run locally

```bash
python -m http.server 4173
```

Then open `http://127.0.0.1:4173`.

## Test locally

```bash
node --check script.js
node tests/predictor.test.js
```

## Notes for GitHub reviewers

- The predictor is intentionally explainable and deterministic.
- Logic is implemented fully client-side to keep deployment simple.
- Clinical use requires medical validation and regulated workflows.
