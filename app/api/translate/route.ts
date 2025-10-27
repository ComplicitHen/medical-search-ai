import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json();

    if (!query) {
      return NextResponse.json(
        { error: "Query is required" },
        { status: 400 }
      );
    }

    // Check which API key is available
    const anthropicKey = process.env.ANTHROPIC_API_KEY;
    const openaiKey = process.env.OPENAI_API_KEY;
    const googleKey = process.env.GOOGLE_API_KEY;

    console.log("API Keys available:", {
      anthropic: !!anthropicKey,
      openai: !!openaiKey,
      google: !!googleKey,
      googleKeyLength: googleKey?.length
    });

    let medicalTerms: string;

    if (anthropicKey) {
      console.log("Using Anthropic API");
      medicalTerms = await translateWithAnthropic(query, anthropicKey);
    } else if (openaiKey) {
      console.log("Using OpenAI API");
      medicalTerms = await translateWithOpenAI(query, openaiKey);
    } else if (googleKey) {
      console.log("Using Google API");
      medicalTerms = await translateWithGoogle(query, googleKey);
    } else {
      console.log("Using fallback translation (no API key)");
      // Fallback: simple keyword extraction (no AI)
      medicalTerms = fallbackTranslation(query);
    }

    return NextResponse.json({ medicalTerms });
  } catch (error) {
    console.error("Translation error:", error);
    return NextResponse.json(
      { error: "Translation failed", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

async function translateWithAnthropic(
  query: string,
  apiKey: string
): Promise<string> {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: `You are a medical terminology expert. Convert this layman's description into precise medical terms and conditions. Return ONLY the medical terms as a concise list or phrase, no explanations.

User description: "${query}"

Medical terms:`,
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`Anthropic API error: ${response.status}`);
  }

  const data = await response.json();
  return data.content[0].text.trim();
}

async function translateWithOpenAI(
  query: string,
  apiKey: string
): Promise<string> {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content:
            "You are a medical terminology expert. Convert layman's descriptions into precise medical terms. Return ONLY medical terms, no explanations.",
        },
        {
          role: "user",
          content: `Convert to medical terms: "${query}"`,
        },
      ],
      max_tokens: 1024,
      temperature: 0.3,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices[0].message.content.trim();
}

async function translateWithGoogle(
  query: string,
  apiKey: string
): Promise<string> {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `Översätt patientens beskrivning till medicinska termer.

Beskrivning: "${query}"

Ge en lista med relevanta medicinska termer och diagnoser (separerade med komma). Håll det kort och koncist.

Medicinska termer:`,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.2,
        },
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Google API error:", response.status, errorText);
    throw new Error(`Google API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();

  // Check if response has the expected structure
  console.log("Gemini response structure:", JSON.stringify(data, null, 2));

  const candidate = data.candidates?.[0];

  if (!candidate) {
    throw new Error("Inget svar från Gemini API");
  }

  if (candidate.finishReason === "MAX_TOKENS") {
    throw new Error("Svaret blev för långt (MAX_TOKENS) - försök igen");
  }

  const text = candidate.content?.parts?.[0]?.text;

  if (!text) {
    console.error("Unexpected Google API response:", JSON.stringify(data));
    throw new Error(`Tomt svar från Gemini: ${candidate.finishReason || 'unknown reason'}`);
  }

  return text.trim();
}

function fallbackTranslation(query: string): string {
  // Simple fallback when no API is available
  // Extract potential medical keywords from common descriptions
  const keywords = query.toLowerCase();
  const terms: string[] = [];

  // Common symptom mappings
  const mappings: { [key: string]: string } = {
    "headache": "cephalgia",
    "light sensitivity": "photophobia",
    "nausea": "nausea",
    "vomiting": "emesis",
    "fever": "pyrexia",
    "chest pain": "chest pain angina",
    "shortness of breath": "dyspnea",
    "dizzy": "vertigo dizziness",
    "stomach pain": "abdominal pain",
    "heart racing": "tachycardia palpitations",
  };

  for (const [layman, medical] of Object.entries(mappings)) {
    if (keywords.includes(layman)) {
      terms.push(medical);
    }
  }

  return terms.length > 0 ? terms.join(", ") : query;
}
