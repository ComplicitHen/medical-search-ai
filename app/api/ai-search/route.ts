import { NextRequest, NextResponse } from "next/server";

interface GroundingSource {
  title: string;
  url: string;
}

export async function POST(request: NextRequest) {
  try {
    const { query, medicalTerms } = await request.json();

    if (!query || !medicalTerms) {
      return NextResponse.json(
        { error: "Query and medicalTerms are required" },
        { status: 400 }
      );
    }

    const googleApiKey = process.env.GOOGLE_API_KEY;

    if (!googleApiKey) {
      return NextResponse.json(
        { error: "Google API key not configured" },
        { status: 500 }
      );
    }

    // Use Gemini with Google Search Grounding
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${googleApiKey}`,
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
                  text: `Du är en medicinsk expert. Ge en sammanfattande förklaring på svenska om följande medicinska tillstånd: ${medicalTerms}

Ursprunglig beskrivning från patienten: "${query}"

Sök efter information från medicinska källor (särskilt internetmedicin.se, orto.nu, pubmed.ncbi.nlm.nih.gov, medlineplus.gov).

Inkludera:
- Vad tillståndet innebär
- Vanliga symptom
- När man ska söka vård
- Eventuell behandling

Svara på SVENSKA och håll det kortfattat och begripligt.`,
                },
              ],
            },
          ],
          tools: [
            {
              google_search_retrieval: {
                dynamic_retrieval_config: {
                  mode: "MODE_DYNAMIC",
                  dynamic_threshold: 0.3,
                },
              },
            },
          ],
          generationConfig: {
            temperature: 0.4,
            maxOutputTokens: 1000,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini AI search error:", response.status, errorText);
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    console.log("Gemini AI search response:", JSON.stringify(data, null, 2));

    const candidate = data.candidates?.[0];

    if (!candidate) {
      throw new Error("Inget svar från Gemini");
    }

    const text = candidate.content?.parts?.find((part: any) => part.text)?.text;

    if (!text) {
      throw new Error("Tomt svar från Gemini");
    }

    // Extract grounding sources if available
    const sources: GroundingSource[] = [];

    if (candidate.groundingMetadata?.groundingChunks) {
      for (const chunk of candidate.groundingMetadata.groundingChunks) {
        if (chunk.web?.uri && chunk.web?.title) {
          sources.push({
            title: chunk.web.title,
            url: chunk.web.uri,
          });
        }
      }
    }

    // Also check for grounding supports in the content
    if (candidate.groundingMetadata?.webSearchQueries) {
      console.log("Search queries used:", candidate.groundingMetadata.webSearchQueries);
    }

    return NextResponse.json({
      answer: text.trim(),
      sources: sources,
      hasGrounding: sources.length > 0,
    });
  } catch (error) {
    console.error("AI search error:", error);
    return NextResponse.json(
      {
        error: "AI-sökning misslyckades",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
