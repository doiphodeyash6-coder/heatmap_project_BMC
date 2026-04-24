const API_URL = process.env.NEXT_PUBLIC_AI_API_URL || "http://127.0.0.1:8000";

export interface AIPredictionInput {
  total: number;
  fake: number;
  length: number;
  image: number;
  duplicate: number;
  timeGap: number;
}

export interface AIPredictionResult {
  prediction: number; // 1 = fake user, 0 = real user
  probability: number;
}

export async function checkAI(userData: AIPredictionInput): Promise<AIPredictionResult> {
  const res = await fetch(`${API_URL}/predict`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(userData),
  });

  if (!res.ok) {
    throw new Error(`AI API error: ${res.status}`);
  }

  const data = await res.json();
  return data as AIPredictionResult;
}

