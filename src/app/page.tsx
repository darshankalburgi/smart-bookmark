import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import BookmarkList from './components/BookmarkList'
import AddBookmarkForm from './components/AddBookmarkForm'

export default async function Home() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: bookmarks } = await supabase
    .from('bookmarks')
    .select('*')
    .order('created_at', { ascending: false })

  const handleSignOut = async () => {
    'use server'
    const supabase = await createClient()
    await supabase.auth.signOut()
    redirect('/login')
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/20 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
            </div>
            <span className="text-white font-semibold">Smart Bookmark</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              {user.user_metadata?.avatar_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={user.user_metadata.avatar_url}
                  alt="avatar"
                  className="w-7 h-7 rounded-full border border-white/20"
                />
              )}
              <span className="text-slate-400 text-sm hidden sm:block">
                {user.user_metadata?.full_name || user.email}
              </span>
            </div>
            <form action={handleSignOut}>
              <button
                type="submit"
                className="text-slate-400 hover:text-white text-sm px-3 py-1.5 rounded-lg hover:bg-white/10 transition-all"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* Main content */}
      <div className="max-w-2xl mx-auto px-4 py-8 flex flex-col gap-6">
        <AddBookmarkForm />

        <div>
          <h2 className="text-white font-semibold text-lg mb-4">
            Your Bookmarks
            <span className="ml-2 text-sm font-normal text-slate-500">
              ({bookmarks?.length ?? 0})
            </span>
          </h2>
          <BookmarkList
            initialBookmarks={bookmarks ?? []}
            userId={user.id}
          />
        </div>
      </div>
    </main>
  )
}
