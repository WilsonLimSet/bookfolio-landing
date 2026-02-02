# Bookfolio

A book tracking and rating app. Rank books, share lists, and connect with readers.

## Features

- **Rank Books** - Rate and rank books using a comparison-based system
- **Reading Lists** - Track currently reading, want to read, and finished books
- **Public Lists** - Create curated book lists like "Best Sci-Fi" or "Beach Reads"
- **Social Feed** - See what friends are reading, like and comment on reviews
- **Reading Goals** - Set and track yearly reading goals
- **Profiles** - Share your reading stats and favorites

## Tech Stack

- Next.js 16 + React 19
- Supabase (Auth, Database, Storage)
- Open Library API (book data)
- Tailwind CSS

## Getting Started

```bash
npm install
npm run dev
```

Requires Supabase project with `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=your-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-key
```
