# Smart Bookmark

A private bookmark manager with real-time updates, built with **Next.js (App Router)**, **Supabase**, and **Tailwind CSS**.

## Features

- 🔐 **Google OAuth** — Sign in with Google, no passwords
- 🔒 **Private bookmarks** — Each user only sees their own bookmarks (enforced via Supabase Row Level Security)
- ⚡ **Real-time updates** — Add a bookmark in one tab, it instantly appears in another
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
   git clone https://github.com/darshankalburgi/smart-bookmark.git
   cd smart-bookmark
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

5. **Enable Google OAuth in Supabase**

   Go to **Authentication → Providers → Google** and add your Google Client ID and Secret.

6. **Run locally**
   ```bash
   npm run dev
   ```

---

## Problems I Ran Into & How I Solved Them

### 1. `redirect_uri_mismatch` — Google OAuth kept failing

**Problem:** After setting up Google OAuth, clicking "Sign in with Google" showed `Error 400: redirect_uri_mismatch`. I had added `http://localhost:3000/auth/callback` to Google Cloud Console, but that's the wrong URL.

**Solution:** Google needs Supabase's own callback URL, not the app's URL. The correct redirect URI to add in Google Cloud Console is:
```
https://YOUR_PROJECT_ID.supabase.co/auth/v1/callback
```
This URL is shown directly in Supabase under **Authentication → Providers → Google**.

---

### 2. Build failing on Vercel — `Invalid supabaseUrl`

**Problem:** Vercel build kept failing with `Error: Invalid supabaseUrl: Must be a valid HTTP or HTTPS URL` because Next.js tries to prerender pages at build time, and the Supabase client throws immediately if env vars are missing.

**Solution:** Moved the Supabase client creation inside the click handler using a dynamic import, so it only runs in the browser at runtime — never at build time. Also added the real env vars in Vercel's project settings before redeploying.

---

### 3. After login, user stayed on the login page

**Problem:** After Google OAuth completed successfully, the app redirected back to `/login` instead of the home page. The middleware that should redirect authenticated users to `/` wasn't running at all.

**Solution:** Next.js 16 deprecated `middleware.ts` and replaced it with `proxy.ts`. The exported function also needs to be renamed from `middleware` to `proxy`. Once I renamed the file and the function, the redirect worked correctly.

---

### 4. Real-time updates not working across tabs (hardest problem)

**Problem:** Adding a bookmark in one tab didn't appear in the second tab without a page refresh. The Supabase Realtime subscription was set up correctly in code, but cross-tab updates simply weren't firing.

**Root cause:** Two issues combined — Supabase Realtime wasn't enabled on the `bookmarks` table in the dashboard (Database → Replication), and the `filter` parameter on the subscription (`user_id=eq.${userId}`) was too restrictive and blocked events from coming through.

**Solution:** 
1. Enabled Realtime on the `bookmarks` table in Supabase Dashboard → Database → Replication
2. Removed the filter from the Realtime subscription (RLS already ensures users only see their own data)
3. Added a 3-second polling fallback as a safety net — every 3 seconds the app refetches bookmarks from Supabase, guaranteeing cross-tab sync even if Realtime has a hiccup

---

### 5. Bookmark list not updating after adding (same tab)

**Problem:** After adding a bookmark, the list didn't update unless the page was refreshed — even in the same tab.

**Solution:** Refactored the components so `AddBookmarkForm` returns the inserted row from Supabase (using `.select().single()`) and passes it up via an `onAdd` callback to a shared `BookmarksContainer` state. This gives an instant optimistic update with zero delay.
