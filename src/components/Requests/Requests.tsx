import { useMemo, useState } from 'react'
import {
  House,
  MagnifyingGlass,
  Plus,
  CaretRight,
  CaretDown,
  ArrowLeft,
  Star,
  CheckCircle,
  PaperPlaneTilt,
  ChatCircleText,
  Tray,
} from '@phosphor-icons/react'
import {
  SEED_REQUESTS,
  CATEGORIES,
  PRIORITIES,
  STATUSES,
  STATUS_TAG,
  PRIORITY_TAG,
  nextRef,
  type ServiceRequest,
  type RequestStatus,
  type RequestPriority,
  type RequestCategory,
} from './data'
import './Requests.css'

// ── View state ────────────────────────────────────────────────────────────────

type View = 'list' | 'create' | 'detail' | 'feedback'

type Draft = {
  title: string
  description: string
  category: RequestCategory
  priority: RequestPriority
}

const EMPTY_DRAFT: Draft = {
  title: '',
  description: '',
  category: 'IT Support',
  priority: 'Medium',
}

// ── Reusable design-system field primitives (BrandSync component CSS) ─────────────

function Tag({ tone, children }: { tone: string; children: React.ReactNode }) {
  return (
    <span className={`bs-tag ${tone}`}>
      <span className="bs-tag-dot" aria-hidden="true" />
      {children}
    </span>
  )
}

// ── Component ──────────────────────────────────────────────────────────────────

export default function Requests() {
  const [requests, setRequests] = useState<ServiceRequest[]>(SEED_REQUESTS)
  const [view, setView] = useState<View>('list')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<RequestStatus | 'All'>('All')
  const [snackbar, setSnackbar] = useState<string | null>(null)

  const selected = requests.find(r => r.id === selectedId) ?? null

  const metrics = useMemo(
    () => ({
      total: requests.length,
      open: requests.filter(r => r.status === 'Open').length,
      inProgress: requests.filter(r => r.status === 'In Progress').length,
      done: requests.filter(r => r.status === 'Done').length,
    }),
    [requests],
  )

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return requests.filter(r => {
      if (statusFilter !== 'All' && r.status !== statusFilter) return false
      if (!q) return true
      return (
        r.title.toLowerCase().includes(q) ||
        r.ref.toLowerCase().includes(q) ||
        r.category.toLowerCase().includes(q) ||
        r.requester.toLowerCase().includes(q)
      )
    })
  }, [requests, query, statusFilter])

  function flash(msg: string) {
    setSnackbar(msg)
    window.setTimeout(() => setSnackbar(null), 3000)
  }

  function openDetail(id: string) {
    setSelectedId(id)
    setView('detail')
  }

  function handleCreate(draft: Draft) {
    const created: ServiceRequest = {
      id: `r${Date.now()}`,
      ref: nextRef(requests),
      title: draft.title.trim(),
      description: draft.description.trim(),
      category: draft.category,
      priority: draft.priority,
      status: 'Open',
      requester: 'Vivka',
      createdAt: new Date().toISOString().slice(0, 10),
    }
    setRequests(prev => [created, ...prev])
    return created
  }

  function handleUpdate(id: string, status: RequestStatus, comment: string) {
    setRequests(prev =>
      prev.map(r => (r.id === id ? { ...r, status, comment: comment.trim() || r.comment } : r)),
    )
    flash('Request updated')
  }

  function handleFeedback(id: string, rating: number, feedback: string) {
    setRequests(prev =>
      prev.map(r => (r.id === id ? { ...r, rating, feedback: feedback.trim() || undefined } : r)),
    )
  }

  return (
    <div className="rq-page">
      {/* Breadcrumb */}
      <div className="rq-breadcrumb">
        <House size={13} />
        <span className="rq-breadcrumb__sep">/</span>
        <span>Service Desk</span>
        <span className="rq-breadcrumb__sep">/</span>
        <button
          type="button"
          className={`rq-breadcrumb__crumb${view === 'list' ? ' rq-breadcrumb__current' : ''}`}
          onClick={() => setView('list')}
        >
          Requests
        </button>
        {view === 'create' && (
          <>
            <span className="rq-breadcrumb__sep">/</span>
            <span className="rq-breadcrumb__current">New Request</span>
          </>
        )}
        {(view === 'detail' || view === 'feedback') && selected && (
          <>
            <span className="rq-breadcrumb__sep">/</span>
            <span className="rq-breadcrumb__current">
              {selected.ref}
              {view === 'feedback' ? ' · Feedback' : ''}
            </span>
          </>
        )}
      </div>

      {view === 'list' && (
        <ListView
          metrics={metrics}
          requests={filtered}
          query={query}
          setQuery={setQuery}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          onNew={() => setView('create')}
          onOpen={openDetail}
        />
      )}

      {view === 'create' && (
        <CreateView
          onCancel={() => setView('list')}
          onSubmit={handleCreate}
          onDone={() => {
            setView('list')
            flash('Request submitted')
          }}
        />
      )}

      {view === 'detail' && selected && (
        <DetailView
          request={selected}
          onBack={() => setView('list')}
          onSave={(status, comment) => handleUpdate(selected.id, status, comment)}
          onFeedback={() => setView('feedback')}
        />
      )}

      {view === 'feedback' && selected && (
        <FeedbackView
          request={selected}
          onBack={() => setView('detail')}
          onSubmit={(rating, comment) => handleFeedback(selected.id, rating, comment)}
          onDone={() => {
            setView('detail')
            flash('Thanks for your feedback')
          }}
        />
      )}

      {/* Snackbar (BrandSync Snackbar — success variant) */}
      {snackbar && (
        <div className="bs-snackbar bs-snackbar--success rq-snackbar" role="status">
          <CheckCircle className="bs-snackbar__icon" size={20} weight="fill" />
          <div className="bs-snackbar__content">
            <div className="bs-snackbar__title">{snackbar}</div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── List view ──────────────────────────────────────────────────────────────────

type Metrics = { total: number; open: number; inProgress: number; done: number }

function ListView({
  metrics,
  requests,
  query,
  setQuery,
  statusFilter,
  setStatusFilter,
  onNew,
  onOpen,
}: {
  metrics: Metrics
  requests: ServiceRequest[]
  query: string
  setQuery: (v: string) => void
  statusFilter: RequestStatus | 'All'
  setStatusFilter: (v: RequestStatus | 'All') => void
  onNew: () => void
  onOpen: (id: string) => void
}) {
  const stats = [
    { label: 'Total', value: metrics.total, tone: 'neutral' },
    { label: 'Open', value: metrics.open, tone: 'primary' },
    { label: 'In Progress', value: metrics.inProgress, tone: 'warning' },
    { label: 'Done', value: metrics.done, tone: 'success' },
  ] as const

  return (
    <>
      <div className="rq-header">
        <div>
          <h2 className="rq-page-title">Requests</h2>
          <p className="rq-page-subtitle">Submit and track service requests through to resolution.</p>
        </div>
        <button type="button" className="bs-btn bs-btn-primary" onClick={onNew}>
          <Plus size={16} weight="bold" />
          New Request
        </button>
      </div>

      {/* Metrics row — bs-card stat cards */}
      <div className="rq-metrics">
        {stats.map(s => (
          <div key={s.label} className={`bs-card rq-metric rq-metric--${s.tone}`}>
            <span className="rq-metric__value">{s.value}</span>
            <span className="rq-metric__label">{s.label}</span>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="rq-toolbar">
        <div className="bs-input-wrapper rq-search">
          <div className="bs-input-container rq-search__container">
            <MagnifyingGlass size={18} className="rq-search__icon" />
            <input
              type="text"
              className="bs-input-field"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search requests, refs, owners…"
              aria-label="Search requests"
            />
          </div>
        </div>
        <div className="rq-filter" role="group" aria-label="Filter by status">
          {(['All', ...STATUSES] as const).map(s => (
            <button
              key={s}
              type="button"
              className={`rq-filter__btn${statusFilter === s ? ' rq-filter__btn--active' : ''}`}
              onClick={() => setStatusFilter(s)}
              aria-pressed={statusFilter === s}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Request list */}
      {requests.length === 0 ? (
        <div className="bs-card rq-empty">
          <Tray size={40} weight="thin" />
          <h3 className="rq-empty__title">No requests found</h3>
          <p className="rq-empty__text">Try a different search or filter, or raise a new request.</p>
          <button type="button" className="bs-btn bs-btn-primary" onClick={onNew}>
            <Plus size={16} weight="bold" />
            New Request
          </button>
        </div>
      ) : (
        <div className="rq-list" role="list">
          {requests.map(r => (
            <button
              type="button"
              key={r.id}
              className="bs-card rq-row"
              onClick={() => onOpen(r.id)}
              role="listitem"
            >
              <div className="rq-row__main">
                <div className="rq-row__heading">
                  <span className="rq-row__ref">{r.ref}</span>
                  <h4 className="rq-row__title bs-card-title">{r.title}</h4>
                </div>
                <div className="rq-row__meta bs-card-meta">
                  <span>{r.category}</span>
                  <span className="rq-row__dot" aria-hidden="true">·</span>
                  <span>{r.requester}</span>
                  <span className="rq-row__dot" aria-hidden="true">·</span>
                  <span>{r.createdAt}</span>
                </div>
              </div>
              <div className="rq-row__tags">
                <Tag tone={PRIORITY_TAG[r.priority]}>{r.priority}</Tag>
                <Tag tone={STATUS_TAG[r.status]}>{r.status}</Tag>
              </div>
              <CaretRight size={16} className="rq-row__chevron" />
            </button>
          ))}
        </div>
      )}
    </>
  )
}

// ── Radio card (BrandSync Radio Button inside a selectable card) ─────────────────

function RadioCard({
  name,
  value,
  active,
  onSelect,
}: {
  name: string
  value: string
  active: boolean
  onSelect: () => void
}) {
  return (
    <label className={`bs-radio rq-radio-card${active ? ' rq-radio-card--active' : ''}`}>
      <input type="radio" name={name} value={value} checked={active} onChange={onSelect} />
      <span className="bs-radio__circle" aria-hidden="true" />
      <span className="rq-radio-card__label">{value}</span>
    </label>
  )
}

// ── Create view ─────────────────────────────────────────────────────────────────

function CreateView({
  onCancel,
  onSubmit,
  onDone,
}: {
  onCancel: () => void
  onSubmit: (draft: Draft) => ServiceRequest
  onDone: () => void
}) {
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [created, setCreated] = useState<ServiceRequest | null>(null)

  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!draft.title.trim()) {
      setError('Please give your request a title.')
      return
    }
    if (draft.description.trim().length < 10) {
      setError('Please describe your request in a little more detail (at least 10 characters).')
      return
    }
    setError(null)
    setSubmitting(true)
    window.setTimeout(() => {
      setCreated(onSubmit(draft))
      setSubmitting(false)
    }, 600)
  }

  if (created) {
    return (
      <div className="bs-card rq-form-card rq-confirm">
        <div className="rq-confirm__icon">
          <CheckCircle size={48} weight="fill" />
        </div>
        <h2 className="rq-confirm__title">Request submitted</h2>
        <p className="rq-confirm__text">
          Your request <strong>{created.ref}</strong> has been logged and is now <em>Open</em>. You’ll
          be notified as it progresses.
        </p>
        <button type="button" className="bs-btn bs-btn-primary" onClick={onDone}>
          Back to Requests
        </button>
      </div>
    )
  }

  return (
    <form className="bs-card rq-form-card" onSubmit={submit} noValidate>
      <h2 className="bs-card-title rq-form-card__title">New Request</h2>
      <p className="bs-card-body rq-form-card__subtitle">
        Tell us what you need and we’ll route it to the right team.
      </p>

      {error && (
        <div className="bs-snackbar bs-snackbar--error rq-alert" role="alert">
          <div className="bs-snackbar__content">
            <div className="bs-snackbar__title">{error}</div>
          </div>
        </div>
      )}

      {/* Category */}
      <fieldset className="rq-fieldset">
        <legend className="rq-legend">Category</legend>
        <div className="rq-radio-cards">
          {CATEGORIES.map(c => (
            <RadioCard
              key={c}
              name="category"
              value={c}
              active={draft.category === c}
              onSelect={() => setDraft(d => ({ ...d, category: c }))}
            />
          ))}
        </div>
      </fieldset>

      {/* Priority */}
      <fieldset className="rq-fieldset">
        <legend className="rq-legend">Priority</legend>
        <div className="rq-radio-cards">
          {PRIORITIES.map(p => (
            <RadioCard
              key={p}
              name="priority"
              value={p}
              active={draft.priority === p}
              onSelect={() => setDraft(d => ({ ...d, priority: p }))}
            />
          ))}
        </div>
      </fieldset>

      {/* Title — bs-input */}
      <div className="bs-input-wrapper">
        <label className="bs-input-label" htmlFor="rq-title">
          Title <span className="rq-field__req">*</span>
        </label>
        <div className="bs-input-container">
          <input
            id="rq-title"
            type="text"
            className="bs-input-field"
            value={draft.title}
            onChange={e => setDraft(d => ({ ...d, title: e.target.value }))}
            placeholder="Eg. Laptop won’t connect to VPN"
            autoFocus
          />
        </div>
      </div>

      {/* Description — textarea styled to match bs-input */}
      <div className="bs-input-wrapper">
        <label className="bs-input-label" htmlFor="rq-desc">
          Description <span className="rq-field__req">*</span>
        </label>
        <div className="bs-input-container rq-textarea-container">
          <textarea
            id="rq-desc"
            className="bs-input-field rq-textarea"
            value={draft.description}
            onChange={e => setDraft(d => ({ ...d, description: e.target.value }))}
            placeholder="Describe the issue or what you need…"
            rows={4}
          />
        </div>
      </div>

      <div className="rq-form-card__footer">
        <button type="button" className="bs-btn bs-btn-neutral" onClick={onCancel} disabled={submitting}>
          Cancel
        </button>
        <button type="submit" className="bs-btn bs-btn-primary" disabled={submitting}>
          <PaperPlaneTilt size={14} weight="bold" />
          {submitting ? 'Submitting…' : 'Submit Request'}
        </button>
      </div>
    </form>
  )
}

// ── Detail view ─────────────────────────────────────────────────────────────────

function DetailView({
  request,
  onBack,
  onSave,
  onFeedback,
}: {
  request: ServiceRequest
  onBack: () => void
  onSave: (status: RequestStatus, comment: string) => void
  onFeedback: () => void
}) {
  const [status, setStatus] = useState<RequestStatus>(request.status)
  const [comment, setComment] = useState('')
  const dirty = status !== request.status || comment.trim().length > 0

  return (
    <div className="rq-detail">
      <button type="button" className="rq-back" onClick={onBack}>
        <ArrowLeft size={15} weight="bold" /> Back to list
      </button>

      {/* Summary card */}
      <div className="bs-card rq-detail-card">
        <div className="rq-detail-card__top">
          <div>
            <span className="rq-row__ref">{request.ref}</span>
            <h2 className="bs-card-title rq-detail-card__title">{request.title}</h2>
          </div>
          <div className="rq-row__tags">
            <Tag tone={PRIORITY_TAG[request.priority]}>{request.priority}</Tag>
            <Tag tone={STATUS_TAG[request.status]}>{request.status}</Tag>
          </div>
        </div>

        <dl className="rq-detail-meta">
          <div>
            <dt>Category</dt>
            <dd>{request.category}</dd>
          </div>
          <div>
            <dt>Requested by</dt>
            <dd>{request.requester}</dd>
          </div>
          <div>
            <dt>Date</dt>
            <dd>{request.createdAt}</dd>
          </div>
        </dl>

        <div className="rq-detail-section">
          <h3 className="rq-detail-section__title">Description</h3>
          <p className="bs-card-body rq-detail-section__body">{request.description}</p>
        </div>

        {request.comment && (
          <div className="rq-detail-section">
            <h3 className="rq-detail-section__title">
              <ChatCircleText size={15} weight="bold" /> Latest note
            </h3>
            <p className="bs-card-body rq-detail-section__body">{request.comment}</p>
          </div>
        )}

        {typeof request.rating === 'number' && (
          <div className="rq-detail-section">
            <h3 className="rq-detail-section__title">Feedback</h3>
            <div className="rq-stars rq-stars--readonly" aria-label={`Rated ${request.rating} of 5`}>
              {[1, 2, 3, 4, 5].map(n => (
                <Star key={n} size={18} weight={n <= request.rating! ? 'fill' : 'regular'} />
              ))}
            </div>
            {request.feedback && <p className="bs-card-body rq-detail-section__body">“{request.feedback}”</p>}
          </div>
        )}
      </div>

      {/* Admin panel */}
      <div className="bs-card rq-detail-card rq-admin">
        <h3 className="bs-card-title rq-admin__title">Update request</h3>

        <div className="bs-field rq-field">
          <label htmlFor="rq-status">Status</label>
          <div className="bs-select-wrapper">
            <select
              id="rq-status"
              value={status}
              onChange={e => setStatus(e.target.value as RequestStatus)}
            >
              {STATUSES.map(s => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <CaretDown size={14} className="bs-select-arrow" weight="bold" />
          </div>
        </div>

        <div className="bs-input-wrapper">
          <label className="bs-input-label" htmlFor="rq-note">
            Add a note (optional)
          </label>
          <div className="bs-input-container rq-textarea-container">
            <textarea
              id="rq-note"
              className="bs-input-field rq-textarea"
              value={comment}
              onChange={e => setComment(e.target.value)}
              placeholder="Add a comment about this update…"
              rows={3}
            />
          </div>
        </div>

        <div className="rq-admin__footer">
          <button
            type="button"
            className="bs-btn bs-btn-neutral"
            onClick={onFeedback}
            disabled={request.status !== 'Done'}
            title={request.status !== 'Done' ? 'Available once the request is Done' : undefined}
          >
            <Star size={14} weight="bold" />
            Leave Feedback
          </button>
          <button
            type="button"
            className="bs-btn bs-btn-primary"
            onClick={() => onSave(status, comment)}
            disabled={!dirty}
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Feedback view ───────────────────────────────────────────────────────────────

function FeedbackView({
  request,
  onBack,
  onSubmit,
  onDone,
}: {
  request: ServiceRequest
  onBack: () => void
  onSubmit: (rating: number, comment: string) => void
  onDone: () => void
}) {
  const [rating, setRating] = useState(request.rating ?? 0)
  const [hover, setHover] = useState(0)
  const [comment, setComment] = useState(request.feedback ?? '')
  const [submitted, setSubmitted] = useState(false)

  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (rating < 1) return
    onSubmit(rating, comment)
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <div className="bs-card rq-form-card rq-confirm rq-confirm--narrow">
        <div className="rq-confirm__icon">
          <CheckCircle size={48} weight="fill" />
        </div>
        <h2 className="rq-confirm__title">Thank you!</h2>
        <p className="rq-confirm__text">Your feedback on {request.ref} has been recorded.</p>
        <button type="button" className="bs-btn bs-btn-primary" onClick={onDone}>
          Back to request
        </button>
      </div>
    )
  }

  return (
    <form className="bs-card rq-form-card rq-form-card--narrow" onSubmit={submit}>
      <button type="button" className="rq-back" onClick={onBack}>
        <ArrowLeft size={15} weight="bold" /> Back
      </button>
      <h2 className="bs-card-title rq-form-card__title">How did we do?</h2>
      <div className="rq-feedback-summary">
        <span className="rq-row__ref">{request.ref}</span>
        <span className="rq-feedback-summary__title">{request.title}</span>
      </div>

      <fieldset className="rq-fieldset">
        <legend className="rq-legend">
          Your rating <span className="rq-field__req">*</span>
        </legend>
        <div className="rq-stars" role="radiogroup" aria-label="Rating out of 5">
          {[1, 2, 3, 4, 5].map(n => (
            <button
              type="button"
              key={n}
              className="rq-star-btn"
              onClick={() => setRating(n)}
              onMouseEnter={() => setHover(n)}
              onMouseLeave={() => setHover(0)}
              aria-label={`${n} star${n > 1 ? 's' : ''}`}
              aria-pressed={rating === n}
            >
              <Star size={28} weight={n <= (hover || rating) ? 'fill' : 'regular'} />
            </button>
          ))}
        </div>
      </fieldset>

      <div className="bs-input-wrapper">
        <label className="bs-input-label" htmlFor="rq-fb">
          Comment (optional)
        </label>
        <div className="bs-input-container rq-textarea-container">
          <textarea
            id="rq-fb"
            className="bs-input-field rq-textarea"
            value={comment}
            onChange={e => setComment(e.target.value)}
            placeholder="Tell us more about your experience…"
            rows={4}
          />
        </div>
      </div>

      <div className="rq-form-card__footer">
        <button type="submit" className="bs-btn bs-btn-primary" disabled={rating < 1}>
          <PaperPlaneTilt size={14} weight="bold" />
          Submit Feedback
        </button>
      </div>
    </form>
  )
}
