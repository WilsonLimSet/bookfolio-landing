export interface BookSearchResult {
  key: string;
  title: string;
  author_name?: string[];
  cover_i?: number;
  cover_edition_key?: string;
  first_publish_year?: number;
  edition_count?: number;
  alternative_title?: string[];
}

export interface Book {
  key: string;
  title: string;
  author: string | null;
  coverUrl: string | null;
  year: number | null;
  editions: number;
  alternativeTitles?: string[];
}

export interface Edition {
  key: string;
  title: string;
  covers?: number[];
  publishers?: string[];
  publish_date?: string;
  isbn_13?: string[];
  isbn_10?: string[];
}

export interface BookEdition {
  key: string;
  title: string;
  coverUrl: string | null;
  publisher: string | null;
  year: string | null;
}

export async function getEditions(workKey: string): Promise<BookEdition[]> {
  try {
    // workKey is like "/works/OL123W"
    const response = await fetch(
      `https://openlibrary.org${workKey}/editions.json?limit=50`
    );

    if (!response.ok) {
      console.error("Open Library editions error:", response.status);
      return [];
    }

    const data = await response.json();
    const editions: Edition[] = data.entries || [];

    return editions
      .filter((edition) => edition.covers && edition.covers.length > 0)
      .map((edition) => ({
        key: edition.key,
        title: edition.title,
        coverUrl: `https://covers.openlibrary.org/b/id/${edition.covers![0]}-M.jpg`,
        publisher: edition.publishers?.[0] || null,
        year: edition.publish_date || null,
      }))
      .slice(0, 24); // Show more editions with covers
  } catch (error) {
    console.error("Failed to fetch editions:", error);
    return [];
  }
}

export interface BookDetails {
  key: string;
  title: string;
  author: string | null;
  coverUrl: string | null;
  description: string | null;
  firstPublishYear: number | null;
  subjects: string[];
}

export async function getBookDetails(workKey: string): Promise<BookDetails | null> {
  try {
    // Fetch work details
    const workRes = await fetch(`https://openlibrary.org${workKey}.json`);
    if (!workRes.ok) return null;
    const work = await workRes.json();

    // Get author name
    let authorName: string | null = null;
    if (work.authors?.[0]?.author?.key) {
      const authorRes = await fetch(`https://openlibrary.org${work.authors[0].author.key}.json`);
      if (authorRes.ok) {
        const author = await authorRes.json();
        authorName = author.name || null;
      }
    }

    // Get cover
    const coverId = work.covers?.[0];
    const coverUrl = coverId
      ? `https://covers.openlibrary.org/b/id/${coverId}-L.jpg`
      : null;

    // Get description
    let description: string | null = null;
    if (work.description) {
      description = typeof work.description === 'string'
        ? work.description
        : work.description.value || null;
    }

    return {
      key: workKey,
      title: work.title,
      author: authorName,
      coverUrl,
      description,
      firstPublishYear: work.first_publish_date ? parseInt(work.first_publish_date) : null,
      subjects: (work.subjects || []).slice(0, 5),
    };
  } catch (error) {
    console.error("Failed to fetch book details:", error);
    return null;
  }
}

export async function searchBooks(query: string): Promise<Book[]> {
  if (!query.trim()) return [];

  try {
    // Search using title field which also matches alternative_title (translations)
    // This helps find books like "The Stranger" which is stored as "L'Étranger"
    const response = await fetch(
      `https://openlibrary.org/search.json?title=${encodeURIComponent(query)}&limit=12&fields=key,title,author_name,cover_i,cover_edition_key,first_publish_year,edition_count,alternative_title`
    );

    if (!response.ok) {
      console.error("Open Library API error:", response.status, response.statusText);
      return [];
    }

    const data = await response.json();
    const results: BookSearchResult[] = data.docs || [];

    // If few results with title search, also do general search
    if (results.filter(b => b.cover_i).length < 4) {
      const generalResponse = await fetch(
        `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=12&fields=key,title,author_name,cover_i,cover_edition_key,first_publish_year,edition_count`
      );
      if (generalResponse.ok) {
        const generalData = await generalResponse.json();
        const generalResults: BookSearchResult[] = generalData.docs || [];
        // Merge results, avoiding duplicates
        const existingKeys = new Set(results.map(r => r.key));
        for (const book of generalResults) {
          if (!existingKeys.has(book.key)) {
            results.push(book);
          }
        }
      }
    }

    return results
      .filter((book) => book.cover_i) // Only show books with covers
      .slice(0, 8)
      .map((book) => ({
        key: book.key,
        title: book.title,
        author: book.author_name?.[0] || null,
        coverUrl: `https://covers.openlibrary.org/b/id/${book.cover_i}-M.jpg`,
        year: book.first_publish_year || null,
        editions: book.edition_count || 1,
        alternativeTitles: book.alternative_title?.slice(0, 3),
      }));
  } catch (error) {
    console.error("Failed to search books:", error);
    return [];
  }
}
