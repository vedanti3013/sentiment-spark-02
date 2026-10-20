# Sentiment Insights

Global rules

Use a Devanagari-capable font (Noto Sans Devanagari or Mukta) for all Hindi text. Otherwise Hindi renders incorrectly in the mockups.

Use the same color for each sentiment everywhere: negative = red, neutral = amber, positive = green. Always pair the color with an icon or text, so it isn't color-only.

Make a Desktop frame (1440 px wide) and a Mobile frame (390 px wide) for every screen.

Top navigation with four tabs: Analyze · Batch Upload · Model Performance · About.

Screen 1: Analyze (single review)

ElementDetailsModel dropdownOptions: SVM (default), Logistic Regression, Naive Bayes, Decision Tree. Each shows its accuracy next to the name.Title input (optional)One-line text fieldReview textareaHindi placeholder text, character counter, max 1,000 charactersButtons"Analyze" (primary), "Clear" (secondary)Example chipsThree chips (one per class) that fill the textarea with a real test reviewResult cardLarge sentiment label with icon and color, confidence percentage, three horizontal probability bars (negative/neutral/positive), and a line "Predicted by: SVM"

States to design: empty, loading (spinner inside the button), result, and error (empty input, or "server not reachable").

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/7f72bf9d-a982-4c51-9392-77bd9ecbd4b2).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

### Run the project with the trained models (Windows)

The backend loads the trained pipelines from `model_bundle/`:

- `svm.joblib`
- `logistic_regression.joblib`
- `naive_bayes.joblib`
- `decision_tree.joblib`

The frontend dropdown intentionally exposes SVM and Logistic Regression. Predictions,
confidence, and class probabilities come from the selected trained pipeline. A narrow
backend guardrail corrects only clear Hindi cue/negation mismatches, such as `खराब`
or `अच्छा नहीं`, because the saved models have weak performance on some short or
long out-of-training-distribution reviews.

#### First-time setup

Open PowerShell in the repository root:

```powershell
cd C:\Users\MANISHA\Desktop\amazon-hindi-sentiment
py -3.13 -m pip install fastapi uvicorn joblib pandas openpyxl python-multipart
npm install
```

Python 3.13 is required in this workspace because it has the installed backend and
scikit-learn dependencies. The default Python 3.14 installation does not have `uvicorn`.

#### Every time you run the project

1. Open PowerShell terminal 1 and start the backend:

   ```powershell
   cd C:\Users\MANISHA\Desktop\amazon-hindi-sentiment
   py -3.13 -m uvicorn backend.main:app --reload --host 127.0.0.1 --port 8000
   ```

2. Leave terminal 1 running. In PowerShell terminal 2, start the frontend:

   ```powershell
   cd C:\Users\MANISHA\Desktop\amazon-hindi-sentiment
   npm run dev -- --host 127.0.0.1
   ```

3. Open the URL printed by Vite. In this workspace it is usually:
   `http://127.0.0.1:8080/`

4. Confirm the backend is running before analyzing:

   ```powershell
   Invoke-RestMethod http://127.0.0.1:8000/
   ```

   The response should say `Hindi Sentiment Analysis API is running`.

5. To stop either service, press `Ctrl+C` in its terminal.

#### Backend API endpoints

- `GET http://127.0.0.1:8000/` — health check
- `GET http://127.0.0.1:8000/api/models` — model names and metrics
- `POST http://127.0.0.1:8000/api/predict` — single-review prediction
- `POST http://127.0.0.1:8000/api/batch` — CSV/XLSX batch prediction

To use a different backend URL, set `VITE_API_URL` before starting the frontend:

```powershell
$env:VITE_API_URL="http://127.0.0.1:8000"
npm run dev -- --host 127.0.0.1
```
