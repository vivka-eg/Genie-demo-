import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import {
  Plus,
  ClockCounterClockwise,
  X,
  PaperPlaneRight,
  ThumbsUp,
  ThumbsDown,
  Copy,
  Check,
  Checks,
  Database,
  WarningCircle,
  Warning,
  UserSwitch,
  CaretDown,
  Export,
  Headset,
  Ticket,
  ChatCenteredDots,
} from '@phosphor-icons/react'
import type { Icon } from '@phosphor-icons/react'
import genieIcon from './genie-icon.svg'
import './Chatbot.css'

type Role = 'user' | 'bot'
type WidgetKind = 'bar' | 'line' | 'table'
type Confidence = 'verified' | 'high' | 'review' | 'limited' | 'escalated'
type Message = { id: number; role: Role; text: string; widget?: WidgetKind; confidence?: Confidence; sources?: string[] }
type Answer = { text: string; widget?: WidgetKind; confidence?: Confidence; sources?: string[] }

// Confidence badge styling per level (see ConfidenceBadge).
const CONFIDENCE: Record<Confidence, { label: string; tone: string; Icon: Icon }> = {
  verified: { label: 'Verified', tone: 'green', Icon: Check },
  high: { label: 'Highly Confident', tone: 'green', Icon: Checks },
  review: { label: 'Requires review', tone: 'red', Icon: WarningCircle },
  limited: { label: 'Limited', tone: 'amber', Icon: Warning },
  escalated: { label: 'Escalated', tone: 'blue', Icon: UserSwitch },
}

function ConfidenceBadge({ level }: { level: Confidence }) {
  const c = CONFIDENCE[level]
  const Icon = c.Icon
  return (
    <span className={`gn-badge gn-badge--${c.tone}`}>
      <Icon size={13} weight="bold" />
      {c.label}
    </span>
  )
}

// Datasets rendered by in-chat widgets.
const REGION_ROWS = [
  { country: 'United States', revenue: '$32,400', orders: 820, conversion: '4.2%' },
  { country: 'Germany', revenue: '$12,700', orders: 312, conversion: '3.8%' },
  { country: 'United Kingdom', revenue: '$9,800', orders: 241, conversion: '3.5%' },
  { country: 'France', revenue: '$7,200', orders: 178, conversion: '3.1%' },
  { country: 'Canada', revenue: '$5,600', orders: 134, conversion: '2.9%' },
]
const USERS_SERIES = [
  { month: 'Jul', users: 2200 }, { month: 'Aug', users: 2800 }, { month: 'Sep', users: 2600 },
  { month: 'Oct', users: 3100 }, { month: 'Nov', users: 2900 }, { month: 'Dec', users: 3400 },
]
const SALES_SERIES = [
  { month: 'Jul', sales: 6500, target: 6500 }, { month: 'Aug', sales: 8200, target: 6500 },
  { month: 'Sep', sales: 7600, target: 7000 }, { month: 'Oct', sales: 9100, target: 7000 },
  { month: 'Nov', sales: 8700, target: 7500 }, { month: 'Dec', sales: 10400, target: 7500 },
]

// Canned analytics answers, keyed by question (mock — swap for a real API call later).
const ANSWERS: Record<string, Answer> = {
  'How is revenue performing?': {
    widget: 'line',
    confidence: 'high',
    sources: ['Dashboard · Revenue KPI', 'Sales Overview chart', 'Sales by Region table'],
    text: `Revenue is **$53,000** this period — up **55%**, your fastest-growing metric.

- **Trend** - +55% vs the previous period
- **Top market** - United States at $32,400 (about 61% of total)
- **Momentum** - Sales Overview is running ~4% above target`,
  },

  'How is user growth trending?': {
    widget: 'bar',
    confidence: 'high',
    sources: ['Dashboard · New Users KPI', 'Active Users chart'],
    text: `User growth is healthy — **2,300 new users** (**+5%**), with monthly active users up **23% year-over-year**.

- **New users** - 2,300 this period (+5%)
- **Active users** - climbing steadily into Q4
- **Peak** - December at ~3,400 active users`,
  },

  'Which regions drive the most sales?': {
    widget: 'table',
    confidence: 'verified',
    sources: ['Sales by Region table'],
    text: `Sales are led by a handful of markets — here's the full "Sales by Region" breakdown:`,
  },

  'Are we hitting our sales target?': {
    widget: 'line',
    confidence: 'verified',
    sources: ['Sales Overview chart', 'Monthly target plan'],
    text: `Yes — you're **~4% above target** on the Sales Overview chart.

- **Latest** - sales are running ahead of the target line
- **Best month** - December at $10,400 vs a $7,500 target
- **Consistency** - sales beat target in most months this year`,
  },

  'Why did new orders drop?': {
    widget: 'table',
    confidence: 'review',
    sources: ['Dashboard · New Orders KPI', 'Sales by Region table'],
    text: `New orders came in at **1,462**, down **14%** — the only KPI trending down. The *cause* isn't conclusive from the dashboard alone, so this may need a closer look. Orders by region:`,
  },

  "What's the customer satisfaction score?": {
    confidence: 'verified',
    sources: ['Dashboard · Satisfaction KPI'],
    text: `Customer satisfaction is at **87%**, up **+3%** this period.

- **Trend** - steady improvement
- **Context** - of your four headline KPIs, only new orders are down
- **Takeaway** - experience quality is holding up as you scale`,
  },

  'Which region has the best conversion?': {
    widget: 'table',
    confidence: 'verified',
    sources: ['Sales by Region table'],
    text: `The **United States** leads on conversion at **4.2%**, ahead of every other market:`,
  },

  'Compare this month to last month': {
    widget: 'bar',
    confidence: 'high',
    sources: ['Dashboard · KPI cards', 'Active Users chart'],
    text: `Month-over-month, most metrics are up:

- **Revenue** - +55%, the standout gain
- **New users** - +5%, steady growth
- **New orders** - −14%, the one metric to watch`,
  },
}

const DEFAULT_ANSWER: Answer = {
  confidence: 'limited',
  sources: ['Dashboard overview'],
  text: `I don't have a confident answer for that yet, but here's the current snapshot from your dashboard:

- **Revenue** - $53,000 (+55%)
- **New users** - 2,300 (+5%)
- **New orders** - 1,462 (−14%)
- **Satisfaction** - 87% (+3%)

If you need specifics I can't cover, I can hand this to a human specialist.`,
}

// Responses after a human escalation (personalised to the active brand).
function liveAgentAnswer(brandName: string): Answer {
  return {
    confidence: 'escalated',
    text: `Connecting you to a live agent on the ${brandName} team.

- **Status** - you're in the queue; an agent will join this chat shortly
- **Context shared** - your question and this conversation are attached
- **Meanwhile** - you can keep chatting with me`,
  }
}

function ticketAnswer(brandName: string): Answer {
  return {
    confidence: 'escalated',
    text: `I've created a support ticket for the ${brandName} team.

- **Ticket** - your question and this conversation have been logged
- **Response time** - the team typically replies within a few hours
- **Updates** - you'll be notified by email as it progresses`,
  }
}

// Starter prompts shown in the empty state — click to ask.
const SUGGESTIONS = [
  'How is revenue performing?',
  'How is user growth trending?',
  'Which regions drive the most sales?',
  'Are we hitting our sales target?',
]

// Follow-up prompts offered after a response, to keep the conversation going.
const FOLLOW_UPS = [
  'Why did new orders drop?',
  "What's the customer satisfaction score?",
  'Which region has the best conversion?',
  'Compare this month to last month',
]

// Inline **bold** → <strong>.
function renderInline(text: string) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith('**') && part.endsWith('**')
      ? <strong key={i}>{part.slice(2, -2)}</strong>
      : <span key={i}>{part}</span>,
  )
}

// Minimal markdown: paragraphs + "- " bullet lists with inline bold.
function FormattedText({ text }: { text: string }) {
  const blocks: Array<{ type: 'p'; text: string } | { type: 'ul'; items: string[] }> = []
  let list: string[] | null = null
  for (const line of text.split('\n')) {
    const trimmed = line.trim()
    if (/^[-•]\s+/.test(trimmed)) {
      if (!list) list = []
      list.push(trimmed.replace(/^[-•]\s+/, ''))
    } else {
      if (list) { blocks.push({ type: 'ul', items: list }); list = null }
      if (trimmed) blocks.push({ type: 'p', text: trimmed })
    }
  }
  if (list) blocks.push({ type: 'ul', items: list })

  return (
    <>
      {blocks.map((b, i) =>
        b.type === 'ul' ? (
          <ul key={i} className="gn-md-list">
            {b.items.map((it, j) => <li key={j}>{renderInline(it)}</li>)}
          </ul>
        ) : (
          <p key={i} className="gn-md-p">{renderInline(b.text)}</p>
        ),
      )}
    </>
  )
}

// Shared recharts styling helpers.
const AXIS_TICK = { fontSize: 11, fill: 'var(--bs-text-secondary)' }
const TOOLTIP_STYLE = {
  background: 'var(--bs-surface-raised)',
  border: '1px solid var(--bs-border-default)',
  borderRadius: 8,
  fontSize: 12,
}

// An analytics chart/table rendered inline in a response, animated in with GSAP.
function ChatWidget({ kind }: { kind: WidgetKind }) {
  const ref = useRef<HTMLDivElement>(null)
  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ref.current,
        { autoAlpha: 0, y: 18, scale: 0.97 },
        { autoAlpha: 1, y: 0, scale: 1, duration: 0.55, ease: 'power3.out' },
      )
    }, ref)
    return () => ctx.revert()
  }, [])

  return (
    <div className="gn-widget" ref={ref}>
      {kind === 'table' ? (
        <>
          <p className="gn-widget__title">Sales by Region</p>
          <div className="gn-widget__table-wrap">
            <table className="gn-widget__table">
              <thead>
                <tr><th>Country</th><th>Revenue</th><th>Orders</th><th>Conv.</th></tr>
              </thead>
              <tbody>
                {REGION_ROWS.map(r => (
                  <tr key={r.country}>
                    <td>{r.country}</td>
                    <td>{r.revenue}</td>
                    <td>{r.orders}</td>
                    <td>{r.conversion}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : kind === 'bar' ? (
        <>
          <p className="gn-widget__title">Active Users</p>
          <ResponsiveContainer width="100%" height={190}>
            <BarChart data={USERS_SERIES} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--bs-border-default)" vertical={false} />
              <XAxis dataKey="month" tick={AXIS_TICK} axisLine={false} tickLine={false} />
              <YAxis tick={AXIS_TICK} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: 'var(--bs-surface-hover)' }} />
              <Bar dataKey="users" fill="var(--bs-color-primary-default)" radius={[4, 4, 0, 0]} name="Active Users" animationDuration={900} />
            </BarChart>
          </ResponsiveContainer>
        </>
      ) : (
        <>
          <p className="gn-widget__title">Sales Overview</p>
          <ResponsiveContainer width="100%" height={190}>
            <LineChart data={SALES_SERIES} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--bs-border-default)" vertical={false} />
              <XAxis dataKey="month" tick={AXIS_TICK} axisLine={false} tickLine={false} />
              <YAxis tick={AXIS_TICK} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
              <Line type="monotone" dataKey="sales" stroke="var(--bs-color-primary-default)" strokeWidth={2} dot={false} name="Sales" animationDuration={1100} />
              <Line type="monotone" dataKey="target" stroke="var(--bs-color-success-default)" strokeWidth={2} dot={false} strokeDasharray="5 4" name="Target" animationDuration={1100} />
            </LineChart>
          </ResponsiveContainer>
        </>
      )}
    </div>
  )
}

// Approximate the shape of an answer as skeleton bar widths (%), so the loading
// placeholder is about as tall as the response that's coming.
function skeletonLayout(answer: Answer): number[] {
  const widths: number[] = []
  for (const raw of answer.text.split('\n')) {
    const t = raw.trim()
    if (!t) continue
    const isBullet = /^[-•]\s+/.test(t)
    const clean = t.replace(/\*\*/g, '').replace(/^[-•]\s+/, '')
    if (isBullet) {
      // Bullets fill most of the width; only very short ones trail off.
      widths.push(clean.length > 22 ? 100 : Math.max(84, Math.min(98, Math.round((clean.length / 24) * 100))))
    } else {
      const lineCount = Math.max(1, Math.ceil(clean.length / 30))
      for (let i = 0; i < lineCount; i++) {
        const last = i === lineCount - 1
        widths.push(last ? Math.max(84, Math.min(98, Math.round(((clean.length - i * 30) / 30) * 100))) : 100)
      }
    }
  }
  return widths
}

// Column heights (%) for the chart skeleton — fixed pattern, no randomness.
const SKEL_COLS = [46, 68, 54, 82, 62, 92, 72, 100, 78, 96]

// Placeholder that mirrors the shape of the inline widget that's loading.
function SkeletonWidget({ kind }: { kind: WidgetKind }) {
  return (
    <div className="gn-skel-widget">
      <span className="gn-skel gn-skel--wtitle" />
      {kind === 'table' ? (
        <div className="gn-skel-table">
          {Array.from({ length: 5 }).map((_, r) => (
            <div className="gn-skel-row" key={r}>
              {Array.from({ length: 4 }).map((_, c) => (
                <span className="gn-skel gn-skel--cell" key={c} />
              ))}
            </div>
          ))}
        </div>
      ) : (
        <div className="gn-skel-chart">
          {SKEL_COLS.map((h, i) => (
            <span className="gn-skel gn-skel--col" key={i} style={{ height: `${h}%` }} />
          ))}
        </div>
      )}
    </div>
  )
}

let nextId = 1

type ChatbotProps = {
  open: boolean
  onClose: () => void
  brandName?: string
}

const MIN_WIDTH = 320
const MAX_WIDTH = 720

export default function Chatbot({ open, onClose, brandName = 'Genie' }: ChatbotProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [draft, setDraft] = useState('')
  const [thinking, setThinking] = useState(false)
  const [loading, setLoading] = useState(false)
  const [pending, setPending] = useState<Answer | null>(null)
  const [kbVisible, setKbVisible] = useState(true)
  const [streaming, setStreaming] = useState(false)
  const [feedback, setFeedback] = useState<Record<number, 'up' | 'down'>>({})
  const [copiedId, setCopiedId] = useState<number | null>(null)
  const [sourcesOpen, setSourcesOpen] = useState<Record<number, boolean>>({})
  const [escalating, setEscalating] = useState(false)
  const [ended, setEnded] = useState(false)
  const [asked, setAsked] = useState<string[]>([])
  const [width, setWidth] = useState(400)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const panelRef = useRef<HTMLElement>(null)
  const resizingRef = useRef(false)
  const streamRef = useRef<number | null>(null)
  const timersRef = useRef<number[]>([])
  const prevCount = useRef(0)

  // Clear any running stream timer / pending phase timers on unmount.
  useEffect(() => () => {
    if (streamRef.current) window.clearInterval(streamRef.current)
    timersRef.current.forEach(window.clearTimeout)
  }, [])

  // Drag the left edge to resize the panel width.
  useEffect(() => {
    function onMove(e: MouseEvent) {
      if (!resizingRef.current) return
      const next = window.innerWidth - e.clientX
      const cap = Math.min(MAX_WIDTH, window.innerWidth - MIN_WIDTH)
      setWidth(Math.min(Math.max(next, MIN_WIDTH), cap))
    }
    function onUp() {
      if (!resizingRef.current) return
      resizingRef.current = false
      document.body.style.userSelect = ''
      document.body.style.cursor = ''
    }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
    return () => {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
    }
  }, [])

  function startResize(e: React.MouseEvent) {
    e.preventDefault()
    resizingRef.current = true
    document.body.style.userSelect = 'none'
    document.body.style.cursor = 'col-resize'
  }

  // Auto-scroll to the newest message (also after a widget appears post-stream).
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, thinking, loading, streaming, escalating])

  // Focus the input when the panel opens.
  useEffect(() => {
    if (open) inputRef.current?.focus()
  }, [open])

  // Close on Escape.
  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  // GSAP: slide the panel in on open, then stagger the empty-state chips.
  useLayoutEffect(() => {
    if (!open) return
    const ctx = gsap.context(() => {
      gsap.from(panelRef.current, { xPercent: 6, autoAlpha: 0, duration: 0.4, ease: 'power3.out' })
      gsap.from('.gn-empty > *', {
        autoAlpha: 0, y: 14, duration: 0.5, ease: 'power2.out', stagger: 0.08, delay: 0.15,
      })
    }, panelRef)
    return () => ctx.revert()
  }, [open])

  // GSAP: animate each newly added message into view.
  useLayoutEffect(() => {
    if (messages.length > prevCount.current) {
      const nodes = scrollRef.current?.querySelectorAll('.gn-msg')
      const last = nodes?.[nodes.length - 1]
      if (last) gsap.from(last, { autoAlpha: 0, y: 12, duration: 0.4, ease: 'power2.out' })
    }
    prevCount.current = messages.length
  }, [messages.length])

  // GSAP: stagger the follow-up chips in once a reply finishes streaming.
  useLayoutEffect(() => {
    if (streaming) return
    const ctx = gsap.context(() => {
      if (panelRef.current?.querySelector('.gn-followup')) {
        gsap.from('.gn-followup', { autoAlpha: 0, y: 8, duration: 0.35, ease: 'power2.out', stagger: 0.06 })
      }
    }, panelRef)
    return () => ctx.revert()
  }, [streaming])

  // Reveal the reply word-by-word, like a streaming response.
  function streamReply(answer: Answer) {
    const botId = nextId++
    setMessages(m => [...m, { id: botId, role: 'bot', text: '', widget: answer.widget, confidence: answer.confidence, sources: answer.sources }])
    const words = answer.text.split(' ')
    let i = 0
    streamRef.current = window.setInterval(() => {
      i += 1
      const partial = words.slice(0, i).join(' ')
      setMessages(m => m.map(msg => (msg.id === botId ? { ...msg, text: partial } : msg)))
      if (i >= words.length) {
        if (streamRef.current) window.clearInterval(streamRef.current)
        streamRef.current = null
        setStreaming(false)
      }
    }, 35)
  }

  // Loading sequence before a reply: Thinking… → skeleton → streamed answer.
  function runAnswer(answer: Answer) {
    setThinking(true)
    timersRef.current.push(window.setTimeout(() => {
      setThinking(false)
      setPending(answer)
      setLoading(true)
      timersRef.current.push(window.setTimeout(() => {
        setLoading(false)
        setPending(null)
        setStreaming(true)
        streamReply(answer)
      }, 1400))
    }, 1600))
  }

  function sendText(raw: string) {
    const text = raw.trim()
    if (!text || thinking || loading || streaming) return
    setEscalating(false)
    setMessages(m => [...m, { id: nextId++, role: 'user', text }])
    setAsked(a => (a.includes(text) ? a : [...a, text]))
    setDraft('')
    runAnswer(ANSWERS[text] ?? DEFAULT_ANSWER)
  }

  function send() {
    sendText(draft)
  }

  // Human escalation flow — open the "how would you like to continue?" card.
  function escalate() {
    if (thinking || loading || streaming) return
    setEscalating(true)
  }

  function connectLiveAgent() {
    setEscalating(false)
    setMessages(m => [...m, { id: nextId++, role: 'user', text: 'Connect me to a live agent' }])
    runAnswer(liveAgentAnswer(brandName))
  }

  function createTicket() {
    setEscalating(false)
    setMessages(m => [...m, { id: nextId++, role: 'user', text: 'Create a support ticket' }])
    runAnswer(ticketAnswer(brandName))
  }

  function endChat() {
    setEscalating(false)
    setThinking(false)
    setLoading(false)
    setStreaming(false)
    if (streamRef.current) window.clearInterval(streamRef.current)
    streamRef.current = null
    timersRef.current.forEach(window.clearTimeout)
    timersRef.current = []
    setEnded(true)
  }

  function rate(id: number, value: 'up' | 'down') {
    setFeedback(f => {
      const next = { ...f }
      if (next[id] === value) delete next[id]
      else next[id] = value
      return next
    })
  }

  function copyMessage(id: number, text: string) {
    navigator.clipboard?.writeText(text)
    setCopiedId(id)
    window.setTimeout(() => setCopiedId(c => (c === id ? null : c)), 1500)
  }

  function toggleSources(id: number) {
    setSourcesOpen(s => ({ ...s, [id]: !s[id] }))
  }

  // Tactile pop on the icon inside a feedback button (thumbs bounce directionally).
  function popIcon(btn: HTMLElement, dir: 'up' | 'down' | 'none' = 'none') {
    const icon = btn.querySelector('svg')
    if (!icon) return
    gsap.fromTo(icon, { scale: 0.5 }, { scale: 1, duration: 0.45, ease: 'back.out(4)' })
    if (dir !== 'none') {
      gsap.fromTo(icon, { y: dir === 'up' ? 6 : -6 }, { y: 0, duration: 0.45, ease: 'back.out(4)' })
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  function newChat() {
    if (streamRef.current) window.clearInterval(streamRef.current)
    streamRef.current = null
    timersRef.current.forEach(window.clearTimeout)
    timersRef.current = []
    setMessages([])
    setDraft('')
    setThinking(false)
    setLoading(false)
    setPending(null)
    setStreaming(false)
    setFeedback({})
    setCopiedId(null)
    setSourcesOpen({})
    setEscalating(false)
    setEnded(false)
    setAsked([])
    inputRef.current?.focus()
  }

  const hasMessages = messages.length > 0

  if (!open) return null

  return (
    <>
      {/* Chat panel — embedded as an in-flow right navigation column */}
      <aside
        ref={panelRef}
        className="gn-panel gn-panel--left"
        role="complementary"
        aria-label="Genie assistant"
        style={{ width }}
      >
          {/* Drag the left edge to resize */}
          <div
            className="gn-resize"
            onMouseDown={startResize}
            role="separator"
            aria-orientation="vertical"
            aria-label="Resize Genie panel"
          />
          {/* Header */}
          <header className="gn-header">
            <div className="gn-brand">
              <span className="gn-logo-tile" aria-hidden="true">
                <img className="gn-logo-tile__img" src={genieIcon} alt="" />
              </span>
              <span className="gn-brand__name">Genie</span>
            </div>
            <div className="gn-header__actions">
              <button className="gn-btn-primary" onClick={newChat}>
                <Plus size={15} weight="bold" />
                New chat
              </button>
              <button className="gn-icon-btn" aria-label="Chat history">
                <ClockCounterClockwise size={17} weight="regular" />
              </button>
              <button className="gn-icon-btn" aria-label="Close" onClick={onClose}>
                <X size={17} weight="regular" />
              </button>
            </div>
          </header>

          {/* Body */}
          <div className="gn-body" ref={scrollRef}>
            {!hasMessages ? (
              <div className="gn-empty">
                <span className="gn-logo-tile gn-logo-tile--hero" aria-hidden="true">
                  <img className="gn-logo-tile__img" src={genieIcon} alt="" />
                </span>
                <h2 className="gn-empty__title">Hi, I’m Genie.<br />How can I help?</h2>
                <p className="gn-empty__subtitle">Ask me anything about your dashboard</p>
                <div className="gn-suggestions">
                  {SUGGESTIONS.map(q => (
                    <button
                      key={q}
                      type="button"
                      className="gn-suggestion"
                      onClick={() => sendText(q)}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="gn-messages">
                {messages.map(m => {
                  if (m.role === 'user') {
                    return (
                      <div key={m.id} className="gn-msg gn-msg--user">
                        <div className="gn-msg__bubble">{m.text}</div>
                      </div>
                    )
                  }
                  const isLast = m.id === messages[messages.length - 1]?.id
                  const isStreaming = streaming && isLast
                  const followUps = isLast && !isStreaming && !thinking
                    ? FOLLOW_UPS.filter(q => !asked.includes(q)).slice(0, 3)
                    : []
                  return (
                    <div key={m.id} className="gn-turn gn-turn--bot">
                      <div className="gn-msg gn-msg--bot">
                        <div className="gn-msg__header">
                          <img className="gn-msg__avatar-img" src={genieIcon} alt="" aria-hidden="true" />
                          <span className="gn-msg__name">Genie</span>
                        </div>
                        <div className="gn-msg__bubble">
                          <FormattedText text={m.text} />
                          {isStreaming && <span className="gn-caret" aria-hidden="true" />}
                        </div>
                        {m.widget && !isStreaming && <ChatWidget kind={m.widget} />}
                        {m.confidence && !isStreaming && (
                          <div className="gn-msg__confidence">
                            <ConfidenceBadge level={m.confidence} />
                          </div>
                        )}
                        {m.sources && m.sources.length > 0 && !isStreaming && (
                          <div className="gn-sources">
                            <button
                              className="gn-sources__toggle"
                              onClick={() => toggleSources(m.id)}
                              aria-expanded={!!sourcesOpen[m.id]}
                            >
                              Sources
                              <CaretDown
                                size={13}
                                weight="bold"
                                className={`gn-sources__caret${sourcesOpen[m.id] ? ' gn-sources__caret--open' : ''}`}
                              />
                            </button>
                            {sourcesOpen[m.id] && (
                              <ul className="gn-sources__list">
                                {m.sources.map((s, i) => (
                                  <li key={i} className="gn-sources__item">
                                    <Export size={15} weight="bold" />
                                    {s}
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        )}
                      </div>
                      {!isStreaming && m.text && (
                        <div className="gn-feedback">
                          <span className="gn-feedback__label">Was this response useful?</span>
                          <div className="gn-feedback__actions">
                            <button
                              className={`gn-fb-btn${feedback[m.id] === 'up' ? ' gn-fb-btn--active' : ''}`}
                              onClick={e => { rate(m.id, 'up'); popIcon(e.currentTarget, 'up') }}
                              aria-label="Helpful"
                              aria-pressed={feedback[m.id] === 'up'}
                            >
                              <ThumbsUp size={16} weight={feedback[m.id] === 'up' ? 'fill' : 'bold'} />
                            </button>
                            <button
                              className={`gn-fb-btn${feedback[m.id] === 'down' ? ' gn-fb-btn--active' : ''}`}
                              onClick={e => { rate(m.id, 'down'); popIcon(e.currentTarget, 'down') }}
                              aria-label="Not helpful"
                              aria-pressed={feedback[m.id] === 'down'}
                            >
                              <ThumbsDown size={16} weight={feedback[m.id] === 'down' ? 'fill' : 'bold'} />
                            </button>
                            <button
                              className="gn-fb-btn"
                              onClick={e => { copyMessage(m.id, m.text); popIcon(e.currentTarget) }}
                              aria-label={copiedId === m.id ? 'Copied' : 'Copy response'}
                            >
                              {copiedId === m.id ? <Check size={16} weight="bold" /> : <Copy size={16} weight="bold" />}
                            </button>
                            {m.confidence !== 'escalated' && (
                              <button
                                className="gn-fb-btn gn-fb-btn--text"
                                onClick={e => { popIcon(e.currentTarget); escalate() }}
                                disabled={thinking || streaming}
                              >
                                <UserSwitch size={16} weight="bold" />
                                Talk to a human
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                      {!isStreaming && (m.confidence === 'review' || m.confidence === 'limited') && (
                        <div className="gn-escalate-cta">
                          <span className="gn-escalate-cta__text">
                            Not fully confident in this answer?
                          </span>
                          <button
                            className="gn-escalate-cta__btn"
                            onClick={escalate}
                            disabled={thinking || streaming}
                          >
                            <UserSwitch size={16} weight="bold" />
                            Escalate to a human
                          </button>
                        </div>
                      )}
                      {followUps.length > 0 && (
                        <div className="gn-followups">
                          <p className="gn-followups__label">Suggested follow-ups</p>
                          {followUps.map(q => (
                            <button
                              key={q}
                              type="button"
                              className="gn-followup"
                              onClick={() => sendText(q)}
                            >
                              {q}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
                {thinking && (
                  <div className="gn-msg gn-msg--bot gn-msg--thinking">
                    <div className="gn-msg__header">
                      <img className="gn-msg__avatar-img" src={genieIcon} alt="" aria-hidden="true" />
                      <span className="gn-thinking">Thinking…</span>
                    </div>
                  </div>
                )}
                {loading && pending && (
                  <div className="gn-turn gn-turn--bot">
                    <div className="gn-msg gn-msg--bot">
                      <div className="gn-msg__header">
                        <img className="gn-msg__avatar-img" src={genieIcon} alt="" aria-hidden="true" />
                        <span className="gn-msg__name">Genie</span>
                      </div>
                      <div className="gn-skel-lines" aria-hidden="true">
                        {skeletonLayout(pending).map((w, i) => (
                          <span key={i} className="gn-skel" style={{ width: `${w}%` }} />
                        ))}
                        {pending.widget && <SkeletonWidget kind={pending.widget} />}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Ended notice — replaces the composer, conversation stays visible */}
          {ended && (
            <div className="gn-ended-bar">
              <span className="gn-ended-bar__text">This chat has ended.</span>
              <button className="gn-ended-bar__btn" onClick={newChat}>
                <Plus size={14} weight="bold" />
                Start new chat
              </button>
            </div>
          )}

          {/* Composer */}
          {!ended && (
          <div className="gn-composer">
            {escalating && (
              <>
                <div className="gn-escalate-backdrop" onClick={() => setEscalating(false)} aria-hidden="true" />
                <div className="gn-escalate-card" role="dialog" aria-label="Continue options">
                  <p className="gn-escalate-card__title">How would you like to continue?</p>
                  <button className="gn-escalate-card__primary" onClick={connectLiveAgent}>
                    <Headset size={18} weight="bold" />
                    Connect to a live agent
                  </button>
                  <p className="gn-escalate-card__hint">Or continue on your own</p>
                  <button className="gn-escalate-card__option" onClick={() => setEscalating(false)}>
                    <ChatCenteredDots size={16} weight="bold" />
                    Continue chatting with Genie
                  </button>
                  <button className="gn-escalate-card__option" onClick={createTicket}>
                    <Ticket size={16} weight="bold" />
                    Create a ticket
                  </button>
                  <button className="gn-escalate-card__end" onClick={endChat}>
                    <X size={16} weight="bold" />
                    End chat
                  </button>
                </div>
              </>
            )}
            {kbVisible && (
              <div className="gn-kb">
                <span className="gn-kb__icon" aria-hidden="true">
                  <Database size={16} weight="fill" />
                </span>
                <span className="gn-kb__text">
                  Answering from <strong>{brandName}</strong> Knowledge-base
                </span>
                <button
                  className="gn-kb__close"
                  aria-label="Dismiss knowledge-base notice"
                  onClick={() => setKbVisible(false)}
                >
                  <X size={14} weight="bold" />
                </button>
              </div>
            )}
            <div className="gn-inputbox">
              <textarea
                ref={inputRef}
                className="gn-input"
                placeholder="Ask Genie something…"
                rows={2}
                value={draft}
                onChange={e => setDraft(e.target.value)}
                onKeyDown={onKeyDown}
              />
              <div className="gn-inputbox__footer">
                <button className="gn-icon-btn gn-icon-btn--plus" aria-label="Add attachment">
                  <Plus size={18} weight="bold" />
                </button>
                <button
                  className="gn-send"
                  aria-label="Send message"
                  onClick={send}
                  disabled={!draft.trim() || thinking || loading || streaming}
                >
                  <PaperPlaneRight size={16} weight="fill" />
                </button>
              </div>
            </div>
          </div>
          )}
        </aside>
    </>
  )
}
