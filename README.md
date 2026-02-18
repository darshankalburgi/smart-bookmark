# Smart Bookmark

A private bookmark manager with real-time updates, built with **Next.js (App Router)**, **Supabase**, and **Tailwind CSS**.

🔗 **Live URL**: [https://smart-bookmark-app.vercel.app](https://smart-bookmark-app.vercel.app) *(update after deployment)*

## Features

- 🔐 **Google OAuth** — Sign in with Google, no passwords
- 🔒 **Private bookmarks** — Each user only sees their own bookmarks (enforced via Supabase Row Level Security)
- ⚡ **Real-time updates** — Open two tabs and add a bookmark in one; it instantly appears in the other via Supabase Realtime
- 🗑️ **Delete bookmarks** — Remove any of your bookmarks
- 📱 **Responsive design** — Works on mobile and desktop

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router) |
| Auth & Database | Supabase (Auth, PostgreSQL, Realtime) |
| Styling | Tailwind CSS |
| Deployment | Vercel |

## Local Development

### Prerequisites
- Node.js 18+
- A Supabase project ([supabase.com](https://supabase.com))
- Google OAuth credentials ([console.cloud.google.com](https://console.cloud.google.com))

### Setup

1. **Clone the repo**
   ```bash
   git clone https://github.com/yourusername/smart_bookmark.git
   cd smart_bookmark
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**

   Create `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Set up Supabase database**

   Run this SQL in your Supabase SQL Editor:
   ```sql
   create table bookmarks (
     id uuid primary key default gen_random_uuid(),
     user_id uuid references auth.users(id) on delete cascade not null,
     url text not null,
     title text not null,
     created_at timestamptz default now()
   );

   alter table bookmarks enable row level security;

   create policy "Users can view own bookmarks"
     on bookmarks for select using (auth.uid() = user_id);

   create policy "Users can insert own bookmarks"
     on bookmarks for insert with check (auth.uid() = user_id);

   create policy "Users can delete own bookmarks"
     on bookmarks for delete using (auth.uid() = user_id);
   ```

   Then enable Realtime: **Supabase Dashboard → Database → Replication → enable `bookmarks` table**.

5. **Enable Google OAuth in Supabase**

   Go to **Authentication → Providers → Google** and add your Google Client ID and Secret.

   Add these redirect URLs in Google Cloud Console:
   - `http://localhost:3000/auth/callback` (local)
   - `https://your-vercel-url.vercel.app/auth/callback` (production)

6. **Run locally**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000)

## Problems Encountered & Solutions

### 1. Supabase SSR Cookie Handling in Next.js App Router
**Problem**: The old `@supabase/auth-helpers-nextjs` package doesn't support the Next.js App Router's async `cookies()` API properly, causing session issues.

**Solution**: Switched to `@supabase/ssr` which provides `createBrowserClient` and `createServerClient` with proper cookie handling for both Server Components and Client Components.

### 2. Real-time Updates Requiring Authentication
**Problem**: Supabase Realtime channels need the user's session to respect Row Level Security. Without proper session passing, real-time events weren't filtered per user.

**Solution**: Used a `filter` on the Realtime channel (`user_id=eq.${userId}`) so only the current user's bookmark events are received, and initialized the channel with the authenticated browser client.

### 3. Middleware Session Refresh
**Problem**: Supabase auth tokens expire and need to be refreshed. Without middleware handling this, users would get logged out unexpectedly.

**Solution**: Added Next.js middleware that calls `supabase.auth.getUser()` on every request, which automatically refreshes the session token and sets updated cookies.

### 4. Preventing Duplicate Real-time Events
**Problem**: When a user adds a bookmark, both the optimistic insert and the real-time event could cause duplicates in the list.

**Solution**: In the real-time `INSERT` handler, check if the bookmark ID already exists in state before adding it.

### 5. Google OAuth Redirect URL Configuration
**Problem**: OAuth redirects failed in production because the redirect URL wasn't allowlisted in Google Cloud Console.

**Solution**: Added both `localhost:3000/auth/callback` and the Vercel production URL to the authorized redirect URIs in Google Cloud Console, and set the same URL as the `redirectTo` in the Supabase OAuth call.

## Deployment

Deployed on **Vercel** with environment variables set in the Vercel project settings:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
