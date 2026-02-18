'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function AddBookmarkForm() {
    const [url, setUrl] = useState('')
    const [title, setTitle] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const supabase = createClient()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')

        // Basic URL validation
        try {
            new URL(url)
        } catch {
            setError('Please enter a valid URL (include https://)')
            return
        }

        if (!title.trim()) {
            setError('Please enter a title')
            return
        }

        setLoading(true)
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            setError('Not authenticated')
            setLoading(false)
            return
        }

        const { error: insertError } = await supabase
            .from('bookmarks')
            .insert({ url: url.trim(), title: title.trim(), user_id: user.id })

        if (insertError) {
            setError(insertError.message)
        } else {
            setUrl('')
            setTitle('')
        }
        setLoading(false)
    }

    return (
        <form onSubmit={handleSubmit} className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col gap-4">
            <h2 className="text-white font-semibold text-lg">Add Bookmark</h2>

            <div className="flex flex-col gap-3">
                <input
                    type="text"
                    placeholder="Title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="bg-white/10 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
                    disabled={loading}
                />
                <input
                    type="text"
                    placeholder="URL (https://...)"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="bg-white/10 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
                    disabled={loading}
                />
            </div>

            {error && (
                <p className="text-red-400 text-sm">{error}</p>
            )}

            <button
                type="submit"
                disabled={loading}
                className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white font-medium py-3 px-4 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 shadow-lg shadow-violet-900/30"
            >
                {loading ? (
                    <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Saving...
                    </span>
                ) : (
                    '+ Add Bookmark'
                )}
            </button>
        </form>
    )
}
