'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { getInitials, timeAgo } from '@/lib/utils'
import type { SerializedConversation, SerializedMessage } from '@/types'

interface Props {
  userId: string
  initialConvoId?: string
}

export function MessagingApp({ userId, initialConvoId }: Props) {
  const [conversations, setConversations] = useState<SerializedConversation[]>([])
  const [loaded, setLoaded] = useState(false)
  const [activeId, setActiveId] = useState<string | null>(initialConvoId ?? null)
  const [messages, setMessages] = useState<SerializedMessage[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [search, setSearch] = useState('')
  const [isConnected, setIsConnected] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const esRef = useRef<EventSource | null>(null)

  // ── Fetch conversation list ────────────────────────────────────────────
  const fetchConversations = useCallback(async () => {
    const res = await fetch('/api/messages/conversations')
    if (!res.ok) return
    const data = await res.json()
    if (data.success) {
      setConversations(data.data)
      setLoaded(true)
      // Auto-select first conversation if none active
      if (!activeId && data.data.length > 0 && !initialConvoId) {
        setActiveId(data.data[0].id)
      }
    }
  }, [activeId, initialConvoId])

  // ── Fetch messages for active conversation ─────────────────────────────
  const fetchMessages = useCallback(async () => {
    if (!activeId) return
    const res = await fetch(`/api/messages/${activeId}`)
    if (!res.ok) return
    const data = await res.json()
    if (data.success) {
      setMessages(data.data)
      // Refresh conversations to update unread counts
      fetchConversations()
    }
  }, [activeId, fetchConversations])

  // ── Initial load ───────────────────────────────────────────────────────
  useEffect(() => {
    fetchConversations()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Load messages when active conversation changes ─────────────────────
  useEffect(() => {
    fetchMessages()
  }, [activeId]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── SSE connection with polling fallback ───────────────────────────────
  useEffect(() => {
    let pollInterval: ReturnType<typeof setInterval> | null = null

    const startPolling = () => {
      if (pollInterval) return
      pollInterval = setInterval(() => {
        fetchConversations()
        if (activeId) fetchMessages()
      }, 5000)
    }

    const es = new EventSource('/api/messages/stream')
    esRef.current = es

    es.addEventListener('open', () => {
      setIsConnected(true)
    })

    es.addEventListener('message', () => {
      // New message arrived — refresh conversations
      fetchConversations()
    })

    es.onerror = () => {
      setIsConnected(false)
      // SSE failed — fall back to polling
      es.close()
      startPolling()
    }

    return () => {
      es.close()
      esRef.current = null
      setIsConnected(false)
      if (pollInterval) clearInterval(pollInterval)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Auto-scroll to bottom on new messages ─────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // ── Send message ───────────────────────────────────────────────────────
  const sendMessage = async () => {
    if (!activeId || !input.trim() || sending) return
    setSending(true)
    const content = input.trim()
    setInput('')

    // Optimistic update
    const optimistic: SerializedMessage = {
      id: `temp-${Date.now()}`,
      content,
      senderId: userId,
      receiverId: null,
      conversationId: activeId,
      readAt: null,
      createdAt: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, optimistic])

    const res = await fetch(`/api/messages/${activeId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    })

    setSending(false)
    if (res.ok) {
      fetchMessages() // Sync with server
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const activeConvo = conversations.find((c) => c.id === activeId)
  const filtered = conversations.filter((c) => {
    const name = (c.otherParticipant?.company ?? c.otherParticipant?.name ?? '').toLowerCase()
    return name.includes(search.toLowerCase())
  })

  // Group messages by date
  const groupedMessages = messages.reduce<Array<{ date: string; msgs: SerializedMessage[] }>>(
    (acc, msg) => {
      const d = new Date(msg.createdAt)
      const today = new Date()
      const yesterday = new Date(today)
      yesterday.setDate(yesterday.getDate() - 1)

      let dateLabel: string
      if (d.toDateString() === today.toDateString()) dateLabel = 'Today'
      else if (d.toDateString() === yesterday.toDateString()) dateLabel = 'Yesterday'
      else dateLabel = d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })

      const last = acc[acc.length - 1]
      if (last && last.date === dateLabel) last.msgs.push(msg)
      else acc.push({ date: dateLabel, msgs: [msg] })
      return acc
    },
    []
  )

  if (loaded && conversations.length === 0) {
    return (
      <div className="glass-card" style={{ padding: '60px 40px', textAlign: 'center' }}>
        <div style={{ color: 'var(--text-muted)', marginBottom: '16px', display: 'flex', justifyContent: 'center' }}>
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
          </svg>
        </div>
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 400, marginBottom: '8px' }}>
          No conversations yet
        </h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '20px' }}>
          Start a conversation from any listing page.
        </p>
        <Link href="/listings" className="btn btn--gold btn--sm">
          Browse Listings
        </Link>
      </div>
    )
  }

  return (
    <div className="messaging__app glass-card" style={{ height: '600px' }}>
      {/* ── Sidebar ── */}
      <div className="messaging__sidebar">
        <div className="messaging__sidebar-header">
          <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            Conversations
            {isConnected && (
              <span
                title="Live updates connected"
                style={{
                  display: 'inline-block',
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: '#22c55e',
                  flexShrink: 0,
                }}
              />
            )}
          </h4>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            {conversations.length}
          </span>
        </div>
        <div className="messaging__search">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            type="text"
            placeholder="Search conversations…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="messaging__conversations">
          {filtered.length === 0 && (
            <div style={{ padding: '24px 20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              {conversations.length === 0 ? 'No conversations yet.' : 'No results.'}
            </div>
          )}
          {filtered.map((convo) => {
            const other = convo.otherParticipant
            const name = other?.company ?? other?.name ?? 'Unknown'
            return (
              <div
                key={convo.id}
                className={`messaging__conversation${activeId === convo.id ? ' active' : ''}`}
                onClick={() => setActiveId(convo.id)}
              >
                <div className="messaging__avatar">{getInitials(name)}</div>
                <div className="messaging__convo-info">
                  <span className="messaging__convo-name">{name}</span>
                  <span className="messaging__convo-preview">
                    {convo.lastMessage?.content ?? 'No messages yet'}
                  </span>
                </div>
                <div className="messaging__convo-meta">
                  <span className="messaging__convo-time">
                    {convo.lastMessage ? timeAgo(new Date(convo.lastMessage.createdAt)) : ''}
                  </span>
                  {(convo.unreadCount ?? 0) > 0 && (
                    <span className="messaging__unread">{convo.unreadCount}</span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Chat panel ── */}
      {activeId && activeConvo ? (
        <div className="messaging__chat">
          {/* Header */}
          <div className="messaging__chat-header">
            <div className="messaging__chat-user">
              <div className="messaging__avatar">
                {getInitials(activeConvo.otherParticipant?.company ?? activeConvo.otherParticipant?.name ?? '?')}
              </div>
              <div>
                <span className="messaging__chat-name">
                  {activeConvo.otherParticipant?.company ?? activeConvo.otherParticipant?.name ?? 'Unknown'}
                </span>
                <span className="messaging__chat-status">
                  <span className="messaging__online-dot" style={{ background: 'var(--text-muted)' }} />
                  {activeConvo.otherParticipant?.name && activeConvo.otherParticipant?.company
                    ? activeConvo.otherParticipant.name
                    : 'Active'}
                </span>
              </div>
            </div>
            <div className="messaging__chat-actions">
              <button title="More options">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="1" /><circle cx="12" cy="5" r="1" /><circle cx="12" cy="19" r="1" />
                </svg>
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="messaging__messages">
            {groupedMessages.map((group) => (
              <div key={group.date} className="convo-messages">
                <div className="messaging__date-divider"><span>{group.date}</span></div>
                {group.msgs.map((msg) => {
                  const isSent = msg.senderId === userId
                  const time = new Date(msg.createdAt).toLocaleTimeString('en-US', {
                    hour: 'numeric', minute: '2-digit',
                  })
                  return (
                    <div key={msg.id} className={`messaging__msg messaging__msg--${isSent ? 'sent' : 'received'}`}>
                      <div className="messaging__msg-bubble">{msg.content}</div>
                      <span className="messaging__msg-time">{time}</span>
                    </div>
                  )
                })}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="messaging__input-area">
            <textarea
              className="messaging__input"
              placeholder="Type a message…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
              style={{ resize: 'none', overflow: 'hidden' }}
            />
            <button
              className="messaging__send-btn"
              disabled={sending || !input.trim()}
              onClick={sendMessage}
              title="Send"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 2L11 13M22 2l-7 20-4-9-9-4z" />
              </svg>
            </button>
          </div>
        </div>
      ) : (
        <div className="messaging__chat" style={{ alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" style={{ margin: '0 auto 16px', opacity: 0.3 }}>
              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
            </svg>
            <p style={{ fontSize: '0.9rem' }}>Select a conversation</p>
          </div>
        </div>
      )}
    </div>
  )
}
