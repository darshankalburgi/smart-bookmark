'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Bookmark = {
    id: string
    url: string
    title: string
    created_at: string
    user_id: string
}

type Props = {
    initialBookmarks: Bookmark[]
    userId: string
}

export default function BookmarkList({ initialBookmarks, userId }: Props) {
    const [bookmarks, setBookmarks] = useState<Bookmark[]>(initialBookmarks)
    const [deletingId, setDeletingId] = useState<string | null>(null)
    const supabase = createClient()

    useEffect(() => {
        // Subscribe to real-time changes on the bookmarks table for this user
        const channel = supabase
            .channel('bookmarks-realtime')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'bookmarks',
                    filter: `user_id=eq.${userId}`,
                },
                (payload) => {
                    setBookmarks((prev) => {
                        // Avoid duplicates
                        if (prev.find((b) => b.id === payload.new.id)) return prev
                        return [payload.new as Bookmark, ...prev]
                    })
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'DELETE',
                    schema: 'public',
                    table: 'bookmarks',
                    filter: `user_id=eq.${userId}`,
                },
                (payload) => {
                    setBookmarks((prev) => prev.filter((b) => b.id !== payload.old.id))
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [supabase, userId])

    const handleDelete = async (id: string) => {
        setDeletingId(id)
        await supabase.from('bookmarks').delete().eq('id', id).eq('user_id', userId)
        setDeletingId(null)
    }

    const getFavicon = (url: string) => {
        try {
            const domain = new URL(url).hostname
            return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`
        } catch {
            return null
        }
    }

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        })
    }

    if (bookmarks.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                    </svg>
                </div>
                <p className="text-slate-400 font-medium">No bookmarks yet</p>
                <p className="text-slate-600 text-sm mt-1">Add your first bookmark above</p>
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-3">
            {bookmarks.map((bookmark) => (
                <div
                    key={bookmark.id}
                    className="group bg-white/5 hover:bg-white/8 border border-white/10 hover:border-white/20 rounded-2xl p-4 flex items-center gap-4 transition-all duration-200"
                >
                    {/* Favicon */}
                    <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0 overflow-hidden">
                        {getFavicon(bookmark.url) ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                                src={getFavicon(bookmark.url)!}
                                alt=""
                                className="w-5 h-5"
                                onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = 'none'
                                }}
                            />
                        ) : (
                            <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                            </svg>
                        )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                        <a
                            href={bookmark.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-white font-medium hover:text-violet-300 transition-colors truncate block"
                        >
                            {bookmark.title}
                        </a>
                        <p className="text-slate-500 text-sm truncate">{bookmark.url}</p>
                        <p className="text-slate-600 text-xs mt-0.5">{formatDate(bookmark.created_at)}</p>
                    </div>

                    {/* Delete button */}
                    <button
                        onClick={() => handleDelete(bookmark.id)}
                        disabled={deletingId === bookmark.id}
                        className="opacity-0 group-hover:opacity-100 w-8 h-8 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 flex items-center justify-center text-red-400 hover:text-red-300 transition-all duration-200 flex-shrink-0 disabled:opacity-50"
                        title="Delete bookmark"
                    >
                        {deletingId === bookmark.id ? (
                            <svg className="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                        ) : (
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        )}
                    </button>
                </div>
            ))}
        </div>
    )
}
