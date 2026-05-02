'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { ChevronUp, ChevronDown } from 'lucide-react';

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  user: {
    name: string;
    image?: string;
  };
}

interface ShiftCommentBoxProps {
  shiftId: string;
}

export function ShiftCommentBox({ shiftId }: ShiftCommentBoxProps) {
  const { data: session } = useSession();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newContent, setNewContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  const fetchComments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/chatmessages?shiftId=${shiftId}`);
      if (!res.ok) throw new Error('Failed to fetch comments');
      const data = await res.json();
      setComments(data);
    } catch (err) {
      console.error(err);
      setError('Failed to load comments');
    } finally {
      setLoading(false);
    }
  }, [shiftId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContent.trim() || !session?.user) return;

    setLoading(true);
    try {
      const res = await fetch('/api/chatmessages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          shiftId,
          content: newContent,
        }),
      });

      if (!res.ok) throw new Error('Failed to post comment');

      const newComment = await res.json();
      setComments((prev) => [newComment, ...prev]);
      setNewContent('');
    } catch (err) {
      console.error(err);
      setError('Failed to post comment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-backgroundSecondary text-sm font-medium text-foregroundPrimary">
        <div className="flex items-center gap-2">
          <svg className="h-4 w-4 text-foregroundSecondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <span>Kommentare</span>
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-xs text-foregroundSecondary hover:text-foregroundPrimary transition-colors"
        >
          {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        </button>
      </div>

      {/* Comments list */}
      <div className={expanded ? 'max-h-60 overflow-y-auto' : 'hidden'}>
        {loading && comments.length === 0 && (
          <div className="px-4 py-2 text-xs text-foregroundSecondary">
            Laden...
          </div>
        )}
        {error && (
          <div className="px-4 py-2 text-xs text-red text-redForeground">
            {error}
          </div>
        )}
        {comments.length === 0 && !loading && !error && (
          <div className="px-4 py-2 text-xs text-foregroundSecondary">
            Noch keine Kommentare
          </div>
        )}
        {comments.map((comment) => (
          <div key={comment.id} className="flex items-start px-4 py-3 border-t border-border/50">
{comment.user.image ? (
  // eslint-disable-next-line @next/next/no-img-element
  <img
    src={comment.user.image}
    alt={comment.user.name}
    className="h-8 w-8 rounded-full flex-shrink-0"
  />
) : (
              <div className="h-8 w-8 rounded-full bg-backgroundSecondary flex items-center justify-center text-xs font-medium text-foregroundSecondary">
                {comment.user.name.slice(0, 2).toUpperCase()}
              </div>
            )}
            <div className="ml-3 flex-1 space-y-1">
              <p className="text-xs font-medium text-foregroundPrimary">
                {comment.user.name}
              </p>
              <p className="text-xs text-foregroundSecondary break-words">
                {comment.content}
              </p>
              <time className="text-xs text-foregroundTertiary">
                {new Date(comment.createdAt).toLocaleString([], { hour: '2-digit', minute: '2-digit' })}
              </time>
            </div>
          </div>
        ))}
      </div>

      {/* Add comment form */}
      {!expanded && (
        <div className="px-4 py-3 border-t border-border/50">
          <form onSubmit={handleSubmit} className="flex items-center gap-2">
            <textarea
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              placeholder="Kommentar hinzufügen..."
              className="flex-1 min-h-[36px] rounded-md border border-border bg-background px-3 py-2 text-xs text-foregroundPrimary focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-50"
              disabled={!session?.user || loading}
              rows={1}
            ></textarea>
            <button
              type="submit"
              disabled={!newContent.trim() || !session?.user || loading}
              className={`px-3 py-2 text-xs font-medium rounded-md transition-colors ${
                !newContent.trim() || !session?.user
                  ? 'bg-backgroundSecondary text-foregroundTertiary cursor-not-allowed'
                  : 'bg-blue text-blueForeground hover:bg-blue/80'
              }`}
            >
              Senden
            </button>
          </form>
        </div>
      )}
    </div>
  );
}