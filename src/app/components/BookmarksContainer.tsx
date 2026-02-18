'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import AddBookmarkForm from './AddBookmarkForm'
import BookmarkList from './BookmarkList'

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

export default function BookmarksContainer({ initialBookmarks, userId }: Props) {
    const [bookmarks, setBookmarks] = useState<Bookmark[]>(initialBookmarks)
    const supabase = createClient()

    // Poll every 3 seconds to catch cross-tab updates reliably
    useEffect(() => {
        const poll = async () => {
            const supabase = createClient()
            const { data } = await supabase
                .from('bookmarks')
                .select('*')
                .order('created_at', { ascending: false })
            if (data) setBookmarks(data as Bookmark[])
        }

        const interval = setInterval(poll, 3000)
        return () => clearInterval(interval)
    }, [])

    // Realtime subscription (works when Supabase Realtime is enabled on the table)
    useEffect(() => {
        const channel = supabase
            .channel('bookmarks-realtime')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'bookmarks',
                },
                (payload) => {
                    if ((payload.new as { user_id: string }).user_id !== userId) return
                    setBookmarks((prev) => {
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
                },
                (payload) => {
                    setBookmarks((prev) => prev.filter((b) => b.id !== payload.old.id))
                }
            )
            .subscribe((status) => {
                console.log('Realtime status:', status)
            })

        return () => {
            supabase.removeChannel(channel)
        }
    }, [supabase, userId])

    // Called by AddBookmarkForm after a successful insert — instant update
    const handleAdd = (bookmark: Bookmark) => {
        setBookmarks((prev) => {
            if (prev.find((b) => b.id === bookmark.id)) return prev
            return [bookmark, ...prev]
        })
    }

    // Called by BookmarkList after delete
    const handleDelete = (id: string) => {
        setBookmarks((prev) => prev.filter((b) => b.id !== id))
    }

    return (
        <>
            <AddBookmarkForm userId={userId} onAdd={handleAdd} />
            <div>
                <h2 className="text-white font-semibold text-lg mb-4">
                    Your Bookmarks
                    <span className="ml-2 text-sm font-normal text-slate-500">
                        ({bookmarks.length})
                    </span>
                </h2>
                <BookmarkList
                    bookmarks={bookmarks}
                    userId={userId}
                    onDelete={handleDelete}
                />
            </div>
        </>
    )
}
