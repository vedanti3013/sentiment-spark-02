const API_BASE_URL = (import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8000").replace(/\/$/, "");

export type ModelName = "SVM" | "Logistic Regression";
export type Sentiment = "positive" | "neutral" | "negative";

export type PredictionResponse = {
  text: string;
  model: ModelName;
  prediction: Sentiment;
  confidence: number | null;
  probabilities: Record<string, number>;
};

export type BatchResponse = {
  model: ModelName;
  summary: {
    total_reviews: number;
    positive: number;
    neutral: number;
    negative: number;
    positive_percentage: number;
    neutral_percentage: number;
    negative_percentage: number;
    average_confidence: number | null;
  };
  rows: Array<{
    review: string;
    predicted_sentiment: Sentiment;
    confidence: number | null;
    product?: string;
  }>;
};

async function readError(response: Response) {
  try {
    const body = (await response.json()) as { detail?: string };
    return body.detail ?? `Request failed (${response.status})`;
  } catch {
    return `Request failed (${response.status})`;
  }
}

async function request(url: string, init: RequestInit) {
  try {
    return await fetch(url, init);
  } catch {
    throw new Error(
      "Backend से connect नहीं हो पाया. कृपया दूसरे terminal में `python -m uvicorn backend.main:app --reload --host 127.0.0.1 --port 8000` चलाएँ.",
    );
  }
}

export async function predictReview(text: string, model: ModelName): Promise<PredictionResponse> {
  const response = await request(`${API_BASE_URL}/api/predict`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, model }),
  });
  if (!response.ok) throw new Error(await readError(response));
  return (await response.json()) as PredictionResponse;
}

export async function analyzeBatch(
  file: File,
  reviewColumn: string,
  productColumn: string,
  model: ModelName,
): Promise<BatchResponse> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("review_column", reviewColumn);
  if (productColumn) formData.append("product_column", productColumn);
  formData.append("model", model);

  const response = await request(`${API_BASE_URL}/api/batch`, { method: "POST", body: formData });
  if (!response.ok) throw new Error(await readError(response));
  return (await response.json()) as BatchResponse;
}
