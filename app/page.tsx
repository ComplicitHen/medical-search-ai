"use client";

import { useState } from "react";

interface SearchResult {
  title: string;
  snippet: string;
  url: string;
  source: string;
}

interface AISource {
  title: string;
  url: string;
}

export default function Home() {
  const [query, setQuery] = useState("");
  const [translatedQuery, setTranslatedQuery] = useState("");
  const [aiAnswer, setAiAnswer] = useState("");
  const [aiSources, setAiSources] = useState<AISource[]>([]);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Source selection state
  const [sources, setSources] = useState({
    pubmed: true,
    medlineplus: true,
    internetmedicin: true,
    orto: true,
  });

  const handleSourceToggle = (source: keyof typeof sources) => {
    setSources((prev) => ({ ...prev, [source]: !prev[source] }));
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResults([]);
    setAiAnswer("");
    setAiSources([]);
    setTranslatedQuery("");

    try {
      // Step 1: Translate layman's terms to medical terms
      const translateRes = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });

      if (!translateRes.ok) {
        const errorData = await translateRes.json();
        const errorMsg = errorData.details || errorData.error || "Översättning misslyckades";
        throw new Error(`Översättning misslyckades: ${errorMsg}`);
      }

      const { medicalTerms } = await translateRes.json();
      setTranslatedQuery(medicalTerms);

      // Step 2: AI Search with Gemini Google Search Grounding
      const aiSearchRes = await fetch("/api/ai-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, medicalTerms, sources }),
      });

      if (aiSearchRes.ok) {
        const { answer, sources: foundSources } = await aiSearchRes.json();
        setAiAnswer(answer);
        setAiSources(foundSources || []);
      }

      // Step 3: Traditional search (as fallback/complement)
      const searchRes = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: medicalTerms,
          originalQuery: query,
          sources
        }),
      });

      if (searchRes.ok) {
        const { results: searchResults } = await searchRes.json();
        setResults(searchResults);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ett fel inträffade");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold text-blue-600 dark:text-blue-400 mb-4">
            Medicinsk Sökning AI
          </h1>
          <p className="text-gray-600 dark:text-gray-300 text-lg">
            Beskriv dina symptom på vanlig svenska - AI översätter dem till medicinska termer
          </p>
        </header>

        <form onSubmit={handleSearch} className="mb-8">
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="t.ex. Jag har värk i huvudet och är känslig för ljus..."
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? "Söker..." : "Sök"}
            </button>
          </div>

          {/* Source Selection */}
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              Sökkällor:
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={sources.pubmed}
                  onChange={() => handleSourceToggle("pubmed")}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  PubMed
                </span>
              </label>

              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={sources.medlineplus}
                  onChange={() => handleSourceToggle("medlineplus")}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  MedlinePlus
                </span>
              </label>

              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={sources.internetmedicin}
                  onChange={() => handleSourceToggle("internetmedicin")}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Internetmedicin
                </span>
              </label>

              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={sources.orto}
                  onChange={() => handleSourceToggle("orto")}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Orto.nu
                </span>
              </label>
            </div>
          </div>
        </form>

        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg dark:bg-red-900 dark:border-red-700 dark:text-red-200">
            <p className="font-semibold">Fel:</p>
            <p>{error}</p>
          </div>
        )}

        {translatedQuery && (
          <div className="mb-6 p-4 bg-blue-100 border border-blue-400 text-blue-800 rounded-lg dark:bg-blue-900 dark:border-blue-700 dark:text-blue-200">
            <p className="font-semibold mb-1">AI-översättning:</p>
            <p className="italic">{translatedQuery}</p>
          </div>
        )}

        {/* AI Answer Section */}
        {aiAnswer && (
          <div className="mb-8 p-6 bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 border-2 border-green-300 dark:border-green-700 rounded-xl shadow-lg">
            <div className="flex items-center gap-3 mb-5 pb-4 border-b-2 border-green-300 dark:border-green-700">
              <svg className="w-8 h-8 text-green-600 dark:text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <div>
                <h2 className="text-2xl font-bold text-green-800 dark:text-green-300">
                  Medicinsk Information
                </h2>
                <p className="text-sm text-green-700 dark:text-green-400 mt-1">
                  Sammanställd från medicinska källor
                </p>
              </div>
            </div>

            <div className="prose prose-lg dark:prose-invert max-w-none">
              <div className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap leading-relaxed text-base">
                {aiAnswer}
              </div>
            </div>

            {aiSources.length > 0 && (
              <div className="mt-6 pt-4 border-t-2 border-green-300 dark:border-green-700">
                <div className="flex items-center gap-2 mb-3">
                  <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                  <p className="font-bold text-green-800 dark:text-green-300 text-lg">
                    Källor ({aiSources.length})
                  </p>
                </div>
                <div className="space-y-2">
                  {aiSources.map((source, index) => (
                    <a
                      key={index}
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block p-3 bg-white dark:bg-gray-800 rounded-lg hover:shadow-md transition-shadow border border-green-200 dark:border-green-800"
                    >
                      <div className="flex items-start gap-2">
                        <svg className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                        </svg>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                            {source.title}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {source.url}
                          </p>
                        </div>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Traditional Search Results */}
        {results.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                Ytterligare resultat ({results.length})
              </h2>
            </div>
            {results.map((result, index) => (
              <div
                key={index}
                className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-1 text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded">
                    {result.source}
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-blue-600 dark:text-blue-400 mb-2">
                  {result.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-3">
                  {result.snippet}
                </p>
                <a
                  href={result.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:underline text-sm"
                >
                  Läs mer →
                </a>
              </div>
            ))}
          </div>
        )}

        {!loading && !aiAnswer && results.length === 0 && !error && translatedQuery && (
          <div className="text-center text-gray-500 dark:text-gray-400 mt-12">
            <p>Inga resultat hittades. Prova ett annat sökord.</p>
          </div>
        )}

        <footer className="mt-16 pt-8 border-t border-gray-200 dark:border-gray-700 text-center text-sm text-gray-500 dark:text-gray-400">
          <p className="mb-2">
            ⚠️ Detta verktyg är endast för informationsändamål. Konsultera alltid en vårdprofessionell för medicinsk rådgivning.
          </p>
          <p>Drivs av Gemini AI • Söker i flera medicinska källor</p>
        </footer>
      </div>
    </div>
  );
}
