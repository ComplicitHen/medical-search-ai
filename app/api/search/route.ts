import { NextRequest, NextResponse } from "next/server";

interface SearchResult {
  title: string;
  snippet: string;
  url: string;
  source: string;
}

export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json();

    if (!query) {
      return NextResponse.json(
        { error: "Query is required" },
        { status: 400 }
      );
    }

    // Search multiple medical databases in parallel
    const [pubmedResults, medlinePlusResults] = await Promise.all([
      searchPubMed(query),
      searchMedlinePlus(query),
    ]);

    const allResults = [...pubmedResults, ...medlinePlusResults];

    return NextResponse.json({ results: allResults });
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json(
      { error: "Search failed", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

async function searchPubMed(query: string): Promise<SearchResult[]> {
  try {
    // Step 1: Search for article IDs
    const searchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=${encodeURIComponent(
      query
    )}&retmax=5&retmode=json`;

    const searchResponse = await fetch(searchUrl);
    if (!searchResponse.ok) {
      throw new Error("PubMed search failed");
    }

    const searchData = await searchResponse.json();
    const ids = searchData.esearchresult?.idlist || [];

    if (ids.length === 0) {
      return [];
    }

    // Step 2: Fetch article details
    const summaryUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&id=${ids.join(
      ","
    )}&retmode=json`;

    const summaryResponse = await fetch(summaryUrl);
    if (!summaryResponse.ok) {
      throw new Error("PubMed summary fetch failed");
    }

    const summaryData = await summaryResponse.json();
    const results: SearchResult[] = [];

    for (const id of ids) {
      const article = summaryData.result?.[id];
      if (article) {
        results.push({
          title: article.title || "Untitled",
          snippet:
            article.authors?.slice(0, 3).map((a: any) => a.name).join(", ") +
              ` - ${article.source || "PubMed"} (${article.pubdate || "N/A"})` ||
            "No abstract available",
          url: `https://pubmed.ncbi.nlm.nih.gov/${id}/`,
          source: "PubMed",
        });
      }
    }

    return results;
  } catch (error) {
    console.error("PubMed search error:", error);
    return [];
  }
}

async function searchMedlinePlus(query: string): Promise<SearchResult[]> {
  try {
    // MedlinePlus Connect API
    const url = `https://connect.medlineplus.gov/service?mainSearchCriteria.v.cs=2.16.840.1.113883.6.103&mainSearchCriteria.v.c=${encodeURIComponent(
      query
    )}&knowledgeResponseType=application/json&informationRecipient.languageCode.c=en`;

    const response = await fetch(url);
    if (!response.ok) {
      // MedlinePlus API might not find results, which is okay
      return [];
    }

    const data = await response.json();
    const results: SearchResult[] = [];

    const entries = data.feed?.entry || [];
    for (const entry of entries.slice(0, 3)) {
      const title = entry.title?._value || entry.title || "Untitled";
      const summary = entry.summary?._value || entry.summary || "No description available";
      const link = entry.link?.find((l: any) => l.$.rel === "alternate")?.$?.href || "#";

      results.push({
        title,
        snippet: summary.substring(0, 200) + (summary.length > 200 ? "..." : ""),
        url: link,
        source: "MedlinePlus",
      });
    }

    return results;
  } catch (error) {
    console.error("MedlinePlus search error:", error);
    return [];
  }
}

// You can add more search sources here:
// - OpenFDA: https://open.fda.gov/apis/
// - ClinicalTrials.gov: https://clinicaltrials.gov/api/
// - CDC: Custom scraping or API if available
// - WHO: Custom scraping or API if available
