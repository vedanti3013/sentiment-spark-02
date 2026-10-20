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

### Run the sentiment backend

The frontend calls the FastAPI service at `http://127.0.0.1:8000` by default. Start it
from the repository root in a second terminal:

```sh
python -m pip install fastapi uvicorn joblib pandas openpyxl python-multipart
python -m uvicorn backend.main:app --reload --host 127.0.0.1 --port 8000
```

To use a different backend URL, set `VITE_API_URL` before starting the frontend:

```sh
VITE_API_URL=http://127.0.0.1:8000 npm run dev
```

In PowerShell, use `$env:VITE_API_URL="http://127.0.0.1:8000"` before
`npm run dev`.
