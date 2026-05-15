// lib/ai.ts

interface BudgetSuggestionResult {
  conservative: number;
  recommended: number;
  comfortable: number;
  reasoning: string;
  confidence: "low" | "medium" | "high";
}

export async function getBudgetSuggestion(
  categoryName: string,
  historicalData: { month: string; total: number }[]
): Promise<BudgetSuggestionResult | null> {
  if (!process.env.GROQ_API_KEY) {
    console.error("GROQ_API_KEY not set");
    return null;
  }

  // Build the prompt — clear and specific gets better results
  const historyText = historicalData
    .map((d) => `${d.month}: ₹${d.total.toFixed(2)}`)
    .join("\n");

  const average =
    historicalData.reduce((sum, d) => sum + d.total, 0) / historicalData.length;

  const prompt = `You are a personal finance advisor. A user wants a budget recommendation for "${categoryName}".

Their spending history for this category (last ${historicalData.length} months):
${historyText}

Average monthly spending: ₹${average.toFixed(2)}

Suggest 3 budget amounts as JSON. Be practical and based purely on the data.

Respond with ONLY valid JSON, no explanation outside the JSON:
{
  "conservative": <number, 10-15% below average>,
  "recommended": <number, close to average with small buffer>,
  "comfortable": <number, 15-20% above average>,
  "reasoning": "<one sentence why>",
  "confidence": "<low|medium|high based on data consistency>"
}`;

  try {
    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "llama-3.1-8b-instant",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.2, // low temperature = more consistent/predictable output
          max_tokens: 200,
        }),
      }
    );

    if (!response.ok) {
      console.error("Groq API error:", response.status);
      return null;
    }

    const data = await response.json();
    const content = data.choices[0].message.content;

    // Strip markdown code blocks if model wraps response in ```json
    const cleaned = content.replace(/```json\n?|\n?```/g, "").trim();
    const parsed = JSON.parse(cleaned);

    return {
      conservative: Number(parsed.conservative),
      recommended: Number(parsed.recommended),
      comfortable: Number(parsed.comfortable),
      reasoning: String(parsed.reasoning),
      confidence: parsed.confidence ?? "medium",
    };
  } catch (err) {
    console.error("AI suggestion failed:", err);
    return null;
  }
}
