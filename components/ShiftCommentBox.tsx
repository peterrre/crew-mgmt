'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { Send, MessageCircle, Loader2 } from 'lucide-react';

interface ChatMessage {
  id: string;
  userId: string;
  shiftId: string;
  message: string;
  read: boolean;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    image: string | null;
  };
}

interface ShiftCommentBoxProps {
  shiftId: string;
  className?: string;
}

export function ShiftCommentBox({ shiftId, className = '' }: ShiftCommentBoxProps) {
  const { data: session } = useSession();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // Fetch messages
  useEffect(() => {
    let cancelled = false;
    const fetchMessages = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/chatmessages?shiftId=${shiftId}`);
        if (!res.ok) throw new Error('Fehler beim Laden');
        const data = await res.json();
        if (!cancelled) {
          setMessages(data);
          setError(null);
        }
      } catch {
        if (!cancelled) setError('Nachrichten konnten nicht geladen werden');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchMessages();
    return () => { cancelled = true; };
  }, [shiftId]);

  // Auto-scroll on new messages
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newMessage.trim();
    if (!trimmed || submitting) return;

    try {
      setSubmitting(true);
      setError(null);
      const res = await fetch(`/api/chatmessages?shiftId=${shiftId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: trimmed }),
      });
      if (!res.ok) throw new Error('Fehler beim Senden');
      const saved = await res.json();
      setMessages(prev => [...prev, saved]);
      setNewMessage('');
      if (textareaRef.current) textareaRef.current.focus();
    } catch {
      setError('Nachricht konnte nicht gesendet werden');
    } finally {
      setSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return 'Heute';
    if (date.toDateString() === yesterday.toDateString()) return 'Gestern';
    return date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: '2-digit' });
  };

  // Group messages by date
  const groupedMessages: { date: string; messages: ChatMessage[] }[] = [];
  let lastDate = '';
  for (const msg of messages) {
    const msgDate = new Date(msg.createdAt).toDateString();
    if (msgDate !== lastDate) {
      groupedMessages.push({ date: msgDate, messages: [msg] });
      lastDate = msgDate;
    } else {
      groupedMessages[groupedMessages.length - 1].messages.push(msg);
    }
  }

  const currentUserId = session?.user?.id;

  return (
    <div className={`flex flex-col bg-backgroundSecondary rounded-xl border border-border/40 overflow-hidden ${className}`}>
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border/30">
        <MessageCircle className="w-4 h-4 text-blue" />
        <h3 className="text-sm font-semibold text-foregroundPrimary">Kommentare</h3>
        {messages.length > 0 && (
          <span className="ml-auto text-xs text-foregroundTertiary">{messages.length}</span>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto max-h-[320px] min-h-[120px] p-4 space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 text-foregroundTertiary animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <p className="text-sm text-foregroundTertiary text-center py-8">
            Noch keine Kommentare — schreibe den ersten!
          </p>
        ) : (
          groupedMessages.map(group => (
            <div key={group.date}>
              {/* Date separator */}
              <div className="flex items-center gap-3 my-3">
                <div className="flex-1 h-px bg-border/30" />
                <span className="text-[10px] text-foregroundTertiary font-medium">
                  {formatDate(group.messages[0].createdAt)}
                </span>
                <div className="flex-1 h-px bg-border/30" />
              </div>

              {group.messages.map(msg => {
                const isOwn = msg.user.id === currentUserId;
                return (
                  <div
                    key={msg.id}
                    className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-2`}
                  >
                    <div
                      className={`max-w-[80%] px-3 py-2 rounded-2xl ${
                        isOwn
                          ? 'bg-blue text-white rounded-br-sm'
                          : 'bg-backgroundTertiary text-foregroundPrimary rounded-bl-sm'
                      }`}
                    >
                      {!isOwn && (
                        <p className="text-[10px] font-semibold mb-0.5 opacity-70">
                          {msg.user.name || 'Unbekannt'}
                        </p>
                      )}
                      <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                        {msg.message}
                      </p>
                      <p
                        className={`text-[10px] mt-1 ${
                          isOwn ? 'text-white/60' : 'text-foregroundTertiary'
                        } text-right`}
                      >
                        {formatTime(msg.createdAt)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Error */}
      {error && (
        <p className="px-4 py-1 text-xs text-red-500 bg-red-50">{error}</p>
      )}

      {/* Input */}
      {session ? (
        <form onSubmit={handleSubmit} className="flex items-end gap-2 p-3 border-t border-border/30">
          <textarea
            ref={textareaRef}
            value={newMessage}
            onChange={e => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Kommentar schreiben..."
            rows={1}
            maxLength={500}
            className="flex-1 resize-none rounded-xl border border-border/40 bg-backgroundPrimary px-3 py-2 text-sm text-foregroundPrimary placeholder:text-foregroundTertiary focus:ring-2 focus:ring-blue focus:ring-offset-0 focus:outline-none transition-colors"
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || submitting}
            className="flex items-center justify-center w-9 h-9 rounded-xl bg-blue text-white hover:bg-blue/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95"
            aria-label="Nachricht senden"
          >
            {submitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </form>
      ) : (
        <p className="px-4 py-3 text-xs text-foregroundTertiary text-center border-t border-border/30">
          Melde dich an, um zu kommentieren.
        </p>
      )}
    </div>
  );
}
