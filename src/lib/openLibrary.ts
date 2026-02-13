export interface BookSearchResult {
  key: string;
  title: string;
  author_name?: string[];
  cover_i?: number;
  cover_edition_key?: string;
  first_publish_year?: number;
  edition_count?: number;
}

export interface Book {
  key: string;
  title: string;
  author: string | null;
  coverUrl: string | null;
  year: number | null;
  editions: number;
}

export interface Edition {
  key: string;
  title: string;
  covers?: number[];
  publishers?: string[];
  publish_date?: string;
  isbn_13?: string[];
  isbn_10?: string[];
  languages?: { key: string }[];
  contributors?: { role: string; name: string }[];
  contributions?: string[];
  by_statement?: string;
  description?: string | { value: string };
  number_of_pages?: number;
}

export interface BookEdition {
  key: string;
  title: string;
  coverUrl: string | null;
  publisher: string | null;
  year: string | null;
  translator: string | null;
}

function extractTranslator(edition: Edition): string | null {
  // 1. Structured contributors: [{role: "Translator", name: "Matthew Ward"}]
  const structured = edition.contributors?.find(
    (c) => c.role?.toLowerCase() === "translator"
  );
  if (structured) return structured.name;

  // 2. Free-text contributions: ["Matthew Ward (Translator)"] or ["Ward, Matthew, translator"]
  if (edition.contributions) {
    for (const c of edition.contributions) {
      const match = c.match(/^(.+?)\s*\(?\btranslat/i);
      if (match) return match[1].replace(/,\s*$/, "").trim();
    }
  }

  // 3. by_statement: "translated from the French by Stuart Gilbert"
  if (edition.by_statement) {
    const match = edition.by_statement.match(
      /translat(?:ed|ion)\s+(?:from\s+\w+\s+)?by\s+(.+?)(?:[;,.]|$)/i
    );
    if (match) return match[1].trim();
  }

  return null;
}

function editionPopularity(edition: Edition): number {
  let score = 0;
  const hasLanguageData = edition.languages && edition.languages.length > 0;
  const isEnglish = edition.languages?.some(
    (l) => l.key === "/languages/eng"
  );

  if (isEnglish) {
    // Confirmed English — strong boost
    score += 15;
  } else if (hasLanguageData) {
    // Explicitly non-English — penalize
    score -= 10;
  } else {
    // No language data — check title for non-English clues
    const looksNonEnglish =
      /[àáâãäéèêëíîïóôõöúùûüçñæœ¿¡]/i.test(edition.title) ||
      /[^\u0000-\u024F\s\d\-:,.'"!?()&]/u.test(edition.title);
    score += looksNonEnglish ? -5 : 5;
  }
  // Editions with ISBNs are widely distributed (more popular)
  if (edition.isbn_13?.length || edition.isbn_10?.length) score += 5;
  // Editions with covers are better
  if (edition.covers && edition.covers.length > 0) score += 3;
  // Editions with publishers are more established
  if (edition.publishers?.length) score += 1;
  return score;
}

export async function getEditions(workKey: string): Promise<BookEdition[]> {
  try {
    // Fetch more editions to find diverse covers (books like The Stranger have 400+)
    const response = await fetch(
      `https://openlibrary.org${workKey}/editions.json?limit=200`
    );

    if (!response.ok) {
      console.error("Open Library editions error:", response.status);
      return [];
    }

    const data = await response.json();
    const editions: Edition[] = data.entries || [];

    // Sort by popularity: English editions with ISBNs first
    editions.sort((a, b) => editionPopularity(b) - editionPopularity(a));

    // Deduplicate by cover ID so users see unique covers only
    const seenCoverIds = new Set<number>();
    const unique: BookEdition[] = [];

    for (const edition of editions) {
      if (!edition.covers || edition.covers.length === 0) continue;
      const coverId = edition.covers[0];
      if (seenCoverIds.has(coverId)) continue;
      seenCoverIds.add(coverId);

      unique.push({
        key: edition.key,
        title: edition.title,
        coverUrl: `https://covers.openlibrary.org/b/id/${coverId}-M.jpg`,
        publisher: edition.publishers?.[0] || null,
        year: edition.publish_date || null,
        translator: extractTranslator(edition),
      });

      if (unique.length >= 24) break;
    }

    return unique;
  } catch (error) {
    console.error("Failed to fetch editions:", error);
    return [];
  }
}

export interface BookDetails {
  key: string;
  title: string;
  author: string | null;
  translator: string | null;
  coverUrl: string | null;
  description: string | null;
  firstPublishYear: number | null;
  subjects: string[];
  pageCount: number | null;
}

// Fetch description from Google Books API as fallback (cached for 7 days)
async function getGoogleBooksDescription(title: string, author: string | null): Promise<string | null> {
  try {
    const query = author ? `${title} ${author}` : title;
    const response = await fetch(
      `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=1`,
      { next: { revalidate: 604800 } } // Cache for 7 days
    );
    if (!response.ok) return null;
    const data = await response.json();
    return data.items?.[0]?.volumeInfo?.description || null;
  } catch {
    return null;
  }
}

export async function getBookDetails(workKey: string): Promise<BookDetails | null> {
  try {
    // Fetch work details (cached for 1 day)
    const workRes = await fetch(`https://openlibrary.org${workKey}.json`, {
      next: { revalidate: 86400 }
    });
    if (!workRes.ok) return null;
    const work = await workRes.json();

    // Parallel fetch: author and editions (for translator, cover, fallback description)
    const authorKey = work.authors?.[0]?.author?.key;
    const [authorResult, editionsResult] = await Promise.all([
      authorKey
        ? fetch(`https://openlibrary.org${authorKey}.json`, { next: { revalidate: 86400 } })
            .then(r => r.ok ? r.json() : null).catch(() => null)
        : Promise.resolve(null),
      // Fetch editions sorted by popularity to find best English edition
      fetch(`https://openlibrary.org${workKey}/editions.json?limit=50`, { next: { revalidate: 86400 } })
        .then(r => r.ok ? r.json() : null).catch(() => null),
    ]);

    const authorName = authorResult?.name || null;

    // Find best English edition (for cover + translator)
    const allEditions: Edition[] = editionsResult?.entries || [];
    allEditions.sort((a: Edition, b: Edition) => editionPopularity(b) - editionPopularity(a));
    const bestEdition = allEditions[0] || null;

    // Get translator from best English edition
    const translator = bestEdition ? extractTranslator(bestEdition) : null;

    // Get cover — prefer work cover (curated by OpenLibrary as canonical),
    // fall back to best edition's cover
    const workCoverId = work.covers?.[0];
    const bestEditionCoverId = bestEdition?.covers?.[0];
    const coverId = workCoverId || bestEditionCoverId;
    const coverUrl = coverId
      ? `https://covers.openlibrary.org/b/id/${coverId}-L.jpg`
      : null;

    // Get description - try multiple sources
    let description: string | null = null;

    // 1. Try work description
    if (work.description) {
      description = typeof work.description === 'string'
        ? work.description
        : work.description.value || null;
    }

    // 2. Fallback to best edition description
    if (!description && bestEdition?.description) {
      description = typeof bestEdition.description === 'string'
        ? bestEdition.description
        : bestEdition.description.value || null;
    }

    // 3. Fallback to excerpts or first_sentence
    if (!description && work.excerpts?.[0]?.excerpt) {
      description = work.excerpts[0].excerpt;
    }
    if (!description && work.first_sentence) {
      const sentence = typeof work.first_sentence === 'string'
        ? work.first_sentence
        : work.first_sentence.value || null;
      if (sentence) {
        description = sentence;
      }
    }

    // 4. Fallback to Google Books API (also for non-English descriptions)
    const looksNonEnglish = description && /[àáâãäéèêëíîïóôõöúùûüçñæœ]/i.test(description);
    if (!description || looksNonEnglish) {
      const googleDesc = await getGoogleBooksDescription(work.title, authorName);
      if (googleDesc) description = googleDesc;
    }

    // Get publish year - try multiple sources
    let firstPublishYear: number | null = null;
    if (work.first_publish_date) {
      const parsed = parseInt(work.first_publish_date);
      if (!isNaN(parsed)) firstPublishYear = parsed;
    }
    // Try to extract year from subjects like "nyt:...-2019-10-06"
    if (!firstPublishYear && work.subjects) {
      for (const subject of work.subjects) {
        const match = subject.match(/(\d{4})-\d{2}-\d{2}$/);
        if (match) {
          firstPublishYear = parseInt(match[1]);
          break;
        }
      }
    }
    // Try best edition publish date
    if (!firstPublishYear && bestEdition?.publish_date) {
      const match = bestEdition.publish_date.match(/\d{4}/);
      if (match) {
        firstPublishYear = parseInt(match[0]);
      }
    }

    // Get page count from best edition
    const pageCount = bestEdition?.number_of_pages || null;

    // Filter out NYT subjects and clean up subject names
    const cleanSubjects = (work.subjects || [])
      .filter((s: string) => !s.startsWith('nyt:') && !s.includes('New York Times'))
      .slice(0, 6);

    return {
      key: workKey,
      title: work.title,
      author: authorName,
      translator,
      coverUrl,
      description,
      firstPublishYear,
      subjects: cleanSubjects,
      pageCount,
    };
  } catch (error) {
    console.error("Failed to fetch book details:", error);
    return null;
  }
}

export async function fetchWorkSubjects(workKey: string): Promise<string[]> {
  try {
    const res = await fetch(`https://openlibrary.org${workKey}.json`, {
      next: { revalidate: 86400 },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.subjects || [];
  } catch {
    return [];
  }
}

export function detectCategory(
  subjects: string[]
): "fiction" | "nonfiction" | null {
  if (subjects.length === 0) return null;

  let fictionScore = 0;
  let nonfictionScore = 0;

  for (const subject of subjects) {
    const lower = subject.toLowerCase();

    // NYT tags (weight 3)
    if (lower.startsWith("nyt:")) {
      if (lower.includes("fiction")) fictionScore += 3;
      if (lower.includes("nonfiction") || lower.includes("non-fiction"))
        nonfictionScore += 3;
      continue;
    }

    // BISAC prefixes (weight 2)
    if (lower.startsWith("fiction /") || lower.startsWith("fiction/")) {
      fictionScore += 2;
      continue;
    }
    if (
      lower.startsWith("biography & autobiography") ||
      lower.startsWith("business") ||
      lower.startsWith("self-help") ||
      lower.startsWith("history /") ||
      lower.startsWith("science /") ||
      lower.startsWith("psychology /")
    ) {
      nonfictionScore += 2;
      continue;
    }

    // Strong nonfiction markers (weight 2)
    if (
      /^(true crime|biography|biographies|memoir|memoirs|autobiography|case studies)$/i.test(
        lower
      )
    ) {
      nonfictionScore += 2;
      continue;
    }

    // Exact "Fiction" (weight 2)
    if (lower === "fiction") {
      fictionScore += 2;
      continue;
    }

    // Compound fiction patterns (weight 1)
    if (
      /fiction/i.test(lower) &&
      lower !== "fiction" // already handled above
    ) {
      fictionScore += 1;
      continue;
    }

    // Nonfiction keywords (weight 1)
    if (
      /^(history|science|psychology|self-help|philosophy|economics|politics|sociology|essays|journalism|mathematics|education|parenting|health|business|technology|religion|spirituality)$/i.test(
        lower
      )
    ) {
      nonfictionScore += 1;
      continue;
    }

    // Fiction genre keywords (weight 1)
    if (
      /^(novel|novels|fantasy|romance|thriller|thrillers|mystery|horror|adventure|suspense|dystopia|dystopian|manga|comics|graphic novel|graphic novels|fairy tales?)$/i.test(
        lower
      )
    ) {
      fictionScore += 1;
      continue;
    }
  }

  if (fictionScore === 0 && nonfictionScore === 0) return null;
  // Ties go to nonfiction (OpenLibrary over-tags "fiction")
  return fictionScore > nonfictionScore ? "fiction" : "nonfiction";
}

export async function searchBooks(query: string): Promise<Book[]> {
  if (!query.trim()) return [];

  try {
    // Use general `q=` search — it matches across title, alternative_title, author, etc.
    // This finds translated works like "The Stranger" (stored as "L'étranger")
    // and "Three Body Problem" (stored as "三体")
    const response = await fetch(
      `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=20&fields=key,title,author_name,cover_i,cover_edition_key,first_publish_year,edition_count`
    );

    if (!response.ok) {
      console.error("Open Library API error:", response.status, response.statusText);
      return [];
    }

    const data = await response.json();
    const results: BookSearchResult[] = data.docs || [];

    const queryLower = query.toLowerCase();
    const queryWords = queryLower.split(/\s+/);

    return results
      .filter((book) => book.cover_i) // Only show books with covers
      .sort((a, b) => {
        // Boost results whose title closely matches the query
        const aTitle = a.title.toLowerCase();
        const bTitle = b.title.toLowerCase();
        const aMatch = queryWords.every((w) => aTitle.includes(w)) ? 1 : 0;
        const bMatch = queryWords.every((w) => bTitle.includes(w)) ? 1 : 0;
        if (aMatch !== bMatch) return bMatch - aMatch;
        // Then sort by edition count (more editions = more popular)
        return (b.edition_count || 0) - (a.edition_count || 0);
      })
      .slice(0, 8)
      .map((book) => {
        // For translated works, show the English title if the original is non-Latin
        // e.g. "三体" → "The Three-Body Problem", "L'étranger" → "The Stranger"
        let displayTitle = book.title;
        const hasNonLatin = /[^\u0000-\u024F\s]/.test(book.title);
        const hasAccents = /[àáâãäéèêëíîïóôõöúùûüçñæœ]/i.test(book.title);

        if (hasNonLatin || (hasAccents && !book.title.toLowerCase().includes(queryLower))) {
          // Try to build a better title from the query + author context
          // The query itself is usually the English title the user wants
          const capitalizedQuery = query.replace(/\b\w/g, (c) => c.toUpperCase());
          displayTitle = capitalizedQuery;
        }

        return {
          key: book.key,
          title: displayTitle,
          author: book.author_name?.[0] || null,
          coverUrl: `https://covers.openlibrary.org/b/id/${book.cover_i}-M.jpg`,
          year: book.first_publish_year || null,
          editions: book.edition_count || 1,
        };
      });
  } catch (error) {
    console.error("Failed to search books:", error);
    return [];
  }
}
