import { NextRequest, NextResponse } from "next/server";

interface GroundingSource {
  title: string;
  url: string;
}

interface Sources {
  pubmed?: boolean;
  medlineplus?: boolean;
  internetmedicin?: boolean;
  orto?: boolean;
}

export async function POST(request: NextRequest) {
  try {
    const { query, medicalTerms, sources: selectedSources } = await request.json();

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

    // Determine which sources are enabled
    const enabledSources: Sources = selectedSources || {
      pubmed: true,
      medlineplus: true,
      internetmedicin: true,
      orto: true,
    };

    // Build source list string
    const sourceList: string[] = [];
    if (enabledSources.internetmedicin) sourceList.push("internetmedicin.se (svensk medicinsk databas)");
    if (enabledSources.orto) sourceList.push("orto.nu (svensk ortopedisk information)");
    if (enabledSources.pubmed) sourceList.push("pubmed.ncbi.nlm.nih.gov (vetenskapliga artiklar)");
    if (enabledSources.medlineplus) sourceList.push("medlineplus.gov (patientinformation)");

    const sourcesText = sourceList.length > 0
      ? sourceList.map(s => `- ${s}`).join('\n')
      : "- internetmedicin.se\n- orto.nu\n- pubmed.ncbi.nlm.nih.gov\n- medlineplus.gov";

    const sourceCountText = sourceList.length === 1
      ? "den valda källan"
      : `de ${sourceList.length} valda källorna`;

    // Try with Google Search Grounding first, fallback to regular Gemini if not supported
    let response;
    let useGrounding = true;

    // First attempt: With Google Search Grounding
    response = await fetch(
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
                  text: `Du är en medicinsk informationsspecialist med tillgång till medicinska databaser. Din uppgift är att ge DETALJERAD medicinsk information.

Patientens beskrivning: "${query}"
Medicinska termer: ${medicalTerms}

SÖK AKTIVT efter information från ${sourceCountText}. Sök med BÅDE patientens ursprungliga beskrivning OCH de medicinska termerna för att få bästa resultat:
${sourcesText}

GE EN OMFATTANDE SAMMANSTÄLLNING som inkluderar:

1. **Översikt av tillståndet**:
   - Vad är det troliga tillståndet/diagnosen baserat på symtomen?
   - Grundläggande förklaring av tillståndet/symtomen
   - Hur vanligt är det?

2. **Symtom och tecken**:
   - Lista de mest förekommande symtomen för detta tillstånd
   - Vilka symptom matchar patientens beskrivning?
   - Eventuella relaterade symptom att vara uppmärksam på

3. **Möjliga orsaker och riskfaktorer**:
   - Vanliga orsaker till detta tillstånd
   - Riskfaktorer som kan bidra
   - Bakomliggande mekanismer

4. **När man ska söka vård**:
   - AKUTA varningssignaler som kräver omedelbar vård
   - När man bör kontakta vårdcentral
   - När egenvård kan vara tillräckligt

5. **Utredning och diagnos**:
   - Hur ställs diagnosen?
   - Vanliga undersökningar och tester
   - Eventuella differentialdiagnoser

6. **Behandling och egenvård**:
   - Medicinska behandlingsalternativ (läkemedel, kirurgi, etc.)
   - Evidensbaserade råd för egenvård
   - Livsstilsförändringar som kan hjälpa
   - Vad man kan göra själv för att lindra symtomen

7. **Prognos och förlopp**:
   - Hur brukar tillståndet utvecklas?
   - Förväntad återhämtningstid
   - Långsiktiga utsikter

VIKTIGT:
- Svara på SVENSKA
- Använd ENDAST information från de källor du hittar via sökningen - INGA EGNA ANTAGANDEN
- Fokusera ENDAST på ${sourceCountText} - sök INTE på andra källor
- Om du inte hittar tillräckligt med information från de valda källorna, var ärlig om det
- Använd information från så många av de valda källorna som möjligt
- Var MYCKET noggrann och detaljerad (minst 5-6 stycken text totalt om information finns)
- Skriv så att patienter förstår, men var medicinskt korrekt
- Basera allt på information från de valda medicinska källorna
- Inkludera specifika detaljer från källorna som stödjer informationen
- Citera eller referera till källorna när du presenterar information`,
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
            temperature: 0.1,
            maxOutputTokens: 8000,
          },
        }),
      }
    );

    // If Search Grounding not supported, fallback to regular Gemini
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      if (errorData.error?.message?.includes("Search Grounding")) {
        console.log("Search Grounding not supported, using regular Gemini");
        useGrounding = false;

        // Retry without Search Grounding
        response = await fetch(
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
                      text: `Du är en medicinsk informationsspecialist. Baserat på din medicinska kunskap, ge detaljerad information om följande:

Patientens beskrivning: "${query}"
Medicinska termer: ${medicalTerms}

GE EN OMFATTANDE SAMMANSTÄLLNING som inkluderar:

1. **Översikt av tillståndet**:
   - Vad är det troliga tillståndet/diagnosen baserat på symtomen?
   - Grundläggande förklaring av tillståndet/symtomen
   - Hur vanligt är det?

2. **Symtom och tecken**:
   - Lista de mest förekommande symtomen för detta tillstånd
   - Vilka symptom matchar patientens beskrivning?

3. **Möjliga orsaker och riskfaktorer**:
   - Vanliga orsaker till detta tillstånd
   - Riskfaktorer som kan bidra

4. **När man ska söka vård**:
   - AKUTA varningssignaler som kräver omedelbar vård
   - När man bör kontakta vårdcentral

5. **Behandling och egenvård**:
   - Medicinska behandlingsalternativ
   - Råd för egenvård
   - Vad man kan göra själv för att lindra symtomen

6. **Prognos**: Hur brukar tillståndet utvecklas?

VIKTIGT:
- Svara på SVENSKA
- Var noggrann och detaljerad (5-6 stycken text)
- Skriv så att patienter förstår, men var medicinskt korrekt
- Basera svaret på etablerad medicinsk kunskap`,
                    },
                  ],
                },
              ],
              generationConfig: {
                temperature: 0.2,
                maxOutputTokens: 8000,
              },
            }),
          }
        );
      }
    }

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

    // Extract grounding sources if available (only when using Search Grounding)
    const sources: GroundingSource[] = [];

    if (useGrounding && candidate.groundingMetadata?.groundingChunks) {
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

    // Add disclaimer if not using grounding
    let finalAnswer = text.trim();
    if (!useGrounding) {
      finalAnswer = `${text.trim()}\n\n---\n*OBS: Detta svar är baserat på AI:ns träningsdata. För mest aktuell information, kontrollera källorna nedan eller besök de medicinska databaserna.*`;
    }

    return NextResponse.json({
      answer: finalAnswer,
      sources: sources,
      hasGrounding: sources.length > 0,
      usedGrounding: useGrounding,
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
