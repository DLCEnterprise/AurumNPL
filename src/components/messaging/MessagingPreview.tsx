'use client'

import { useState } from 'react'
import { ScrollReveal } from '@/components/ui/ScrollReveal'

const CONVERSATIONS = [
  {
    id: '1',
    initials: 'PC',
    name: 'Pacific Capital Group',
    preview: "We'd like to review the tape data…",
    time: '2m',
    unread: 3,
  },
  {
    id: '2',
    initials: 'HS',
    name: 'Harbor Stone Advisors',
    preview: "What's the current bid deadline?",
    time: '1h',
    unread: 0,
  },
  {
    id: '3',
    initials: 'VR',
    name: 'Vanguard Resolution',
    preview: 'NDA signed. Sending diligence…',
    time: '3h',
    unread: 0,
  },
  {
    id: '4',
    initials: 'BM',
    name: 'Blackmoor Investments',
    preview: 'Interested in the FL residential…',
    time: '1d',
    unread: 0,
  },
]

type Message = { type: 'sent' | 'received'; text: string; time: string }

const MESSAGES: Record<string, { date: string; messages: Message[] }> = {
  '1': {
    date: 'Today',
    messages: [
      { type: 'received', text: 'Hello — we reviewed the Southeast Residential Portfolio listing and are very interested. Could you share the full tape data and servicing notes?', time: '10:24 AM' },
      { type: 'received', text: "We've completed preliminary pricing and would like to move to diligence quickly if the numbers align.", time: '10:25 AM' },
      { type: 'sent', text: "Thank you for your interest. I'll have the data room access sent to your team within the hour. The servicing transfer memo is also available upon NDA execution.", time: '10:31 AM' },
      { type: 'received', text: "We'd like to review the tape data for the FL subset specifically. Is a breakout available?", time: '10:48 AM' },
    ],
  },
  '2': {
    date: 'Today',
    messages: [
      { type: 'received', text: "Quick question — what's the current bid deadline for the Midwest CRE portfolio?", time: '9:12 AM' },
      { type: 'sent', text: 'Hi there. The initial bid deadline is March 28. We can accommodate late bids on a case‑by‑case basis with pre‑qualification.', time: '9:30 AM' },
    ],
  },
  '3': {
    date: 'Yesterday',
    messages: [
      { type: 'received', text: "NDA has been signed and returned. We're ready to begin diligence on the consumer auto pool.", time: '4:15 PM' },
      { type: 'sent', text: 'Confirmed. Data room credentials have been sent to your team lead. Let me know if you need any collateral files.', time: '4:42 PM' },
    ],
  },
  '4': {
    date: 'Monday',
    messages: [
      { type: 'received', text: "We're interested in the FL residential subset of your Southeast portfolio. Is that available as a carve‑out?", time: '2:00 PM' },
      { type: 'sent', text: 'We can discuss a carve‑out. The FL subset represents approximately $5.8M in UPB across 47 loans. Happy to set up a call to discuss terms.', time: '3:15 PM' },
    ],
  },
}

export function MessagingPreview() {
  const [activeId, setActiveId] = useState('1')
  const [readIds, setReadIds] = useState<Set<string>>(new Set())

  const handleSelect = (id: string) => {
    setActiveId(id)
    setReadIds((prev) => new Set([...prev, id]))
  }

  const active = CONVERSATIONS.find((c) => c.id === activeId)!
  const convo = MESSAGES[activeId]

  return (
    <ScrollReveal className="messaging__app glass-card">
      {/* Sidebar */}
      <div className="messaging__sidebar">
        <div className="messaging__sidebar-header">
          <h4>Conversations</h4>
          <button className="messaging__compose-btn" title="New message">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5v14M5 12h14" />
            </svg>
          </button>
        </div>
        <div className="messaging__search">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
          <input type="text" placeholder="Search conversations…" />
        </div>
        <div className="messaging__conversations">
          {CONVERSATIONS.map((convo) => (
            <div
              key={convo.id}
              className={`messaging__conversation${activeId === convo.id ? ' active' : ''}`}
              onClick={() => handleSelect(convo.id)}
            >
              <div className="messaging__avatar">{convo.initials}</div>
              <div className="messaging__convo-info">
                <span className="messaging__convo-name">{convo.name}</span>
                <span className="messaging__convo-preview">{convo.preview}</span>
              </div>
              <div className="messaging__convo-meta">
                <span className="messaging__convo-time">{convo.time}</span>
                {convo.unread > 0 && !readIds.has(convo.id) && (
                  <span className="messaging__unread">{convo.unread}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chat window */}
      <div className="messaging__chat">
        <div className="messaging__chat-header">
          <div className="messaging__chat-user">
            <div className="messaging__avatar">{active.initials}</div>
            <div>
              <span className="messaging__chat-name">{active.name}</span>
              <span className="messaging__chat-status">
                <span className="messaging__online-dot" /> Online
              </span>
            </div>
          </div>
          <div className="messaging__chat-actions">
            <button title="Attach file">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" />
              </svg>
            </button>
            <button title="More options">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="1" />
                <circle cx="12" cy="5" r="1" />
                <circle cx="12" cy="19" r="1" />
              </svg>
            </button>
          </div>
        </div>

        <div className="messaging__messages">
          <div className="convo-messages">
            <div className="messaging__date-divider">
              <span>{convo.date}</span>
            </div>
            {convo.messages.map((msg, i) => (
              <div
                key={i}
                className={`messaging__msg messaging__msg--${msg.type}`}
              >
                <div className="messaging__msg-bubble">{msg.text}</div>
                <span className="messaging__msg-time">{msg.time}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="messaging__input-area">
          <button className="messaging__input-attach" title="Attach">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5v14M5 12h14" />
            </svg>
          </button>
          <input type="text" className="messaging__input" placeholder="Type a message…" />
          <button className="messaging__send-btn" title="Send">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 2L11 13M22 2l-7 20-4-9-9-4z" />
            </svg>
          </button>
        </div>
      </div>
    </ScrollReveal>
  )
}
