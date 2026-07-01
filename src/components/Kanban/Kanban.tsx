import { useMemo, useState } from 'react'
import {
  MagnifyingGlass,
  Plus,
  House,
  Kanban as KanbanIcon,
  ListBullets,
  DotsThree,
  CheckSquareOffset,
  X,
  PaperPlaneTilt,
} from '@phosphor-icons/react'
import './Kanban.css'

// ── Types ────────────────────────────────────────────────────────────────────

type Priority = 'Low' | 'Medium' | 'High' | 'Critical'
type Status = 'todo' | 'in-progress' | 'in-review' | 'done'

type Assignee = { name: string; color: string }

type Project = {
  id: string
  title: string
  code: string
  priority: Priority
  status: Status
  assignees: Assignee[]
  subTasks: { total: number; done: number }
}

// ── Seed data ────────────────────────────────────────────────────────────────

const COLUMNS: { key: Status; label: string }[] = [
  { key: 'todo', label: 'To Do' },
  { key: 'in-progress', label: 'In Progress' },
  { key: 'in-review', label: 'In Review' },
  { key: 'done', label: 'Done' },
]

const SEED: Project[] = [
  {
    id: 'p1',
    title: 'Design system audit',
    code: 'BRA-101',
    priority: 'High',
    status: 'todo',
    assignees: [
      { name: 'Vivka', color: 'var(--bs-blue-500)' },
      { name: 'Liam', color: 'var(--bs-brand-colors-magenta-500, var(--bs-blue-400))' },
    ],
    subTasks: { total: 8, done: 2 },
  },
  {
    id: 'p2',
    title: 'Token migration plan',
    code: 'BRA-102',
    priority: 'Medium',
    status: 'todo',
    assignees: [{ name: 'Mei', color: 'var(--bs-blue-700)' }],
    subTasks: { total: 5, done: 0 },
  },
  {
    id: 'p3',
    title: 'Kanban board implementation',
    code: 'BRA-201',
    priority: 'Critical',
    status: 'in-progress',
    assignees: [
      { name: 'Vivka', color: 'var(--bs-blue-500)' },
      { name: 'Anya', color: 'var(--bs-blue-300)' },
      { name: 'Pat', color: 'var(--bs-blue-800)' },
    ],
    subTasks: { total: 12, done: 7 },
  },
  {
    id: 'p4',
    title: 'Accessibility sweep — Q2',
    code: 'BRA-203',
    priority: 'High',
    status: 'in-progress',
    assignees: [{ name: 'Jordan', color: 'var(--bs-blue-600)' }],
    subTasks: { total: 9, done: 4 },
  },
  {
    id: 'p5',
    title: 'Dashboard chart refactor',
    code: 'BRA-305',
    priority: 'Medium',
    status: 'in-review',
    assignees: [
      { name: 'Rae', color: 'var(--bs-blue-400)' },
      { name: 'Sam', color: 'var(--bs-blue-700)' },
    ],
    subTasks: { total: 6, done: 6 },
  },
  {
    id: 'p6',
    title: 'Login flow polish',
    code: 'BRA-410',
    priority: 'Low',
    status: 'done',
    assignees: [{ name: 'Vivka', color: 'var(--bs-blue-500)' }],
    subTasks: { total: 4, done: 4 },
  },
  {
    id: 'p7',
    title: 'Avatar component rollout',
    code: 'BRA-412',
    priority: 'Medium',
    status: 'done',
    assignees: [
      { name: 'Kai', color: 'var(--bs-blue-600)' },
      { name: 'Mei', color: 'var(--bs-blue-700)' },
    ],
    subTasks: { total: 3, done: 3 },
  },
]

const PRIORITY_TONE: Record<Priority, string> = {
  Low: 'bs-badge--neutral-c',
  Medium: 'bs-badge--info-c',
  High: 'bs-badge--warning-c',
  Critical: 'bs-badge--error-c',
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function initials(name: string) {
  return name
    .split(/\s+/)
    .map(s => s[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

function nextProjectCode(items: Project[]) {
  const max = items.reduce((acc, p) => {
    const n = parseInt(p.code.split('-')[1] || '0', 10)
    return Number.isFinite(n) ? Math.max(acc, n) : acc
  }, 100)
  return `BRA-${max + 1}`
}

// ── Component ────────────────────────────────────────────────────────────────

type ViewMode = 'kanban' | 'table'

export default function Kanban() {
  const [projects, setProjects] = useState<Project[]>(SEED)
  const [view, setView] = useState<ViewMode>('kanban')
  const [query, setQuery] = useState('')
  const [dragId, setDragId] = useState<string | null>(null)
  const [dragOverCol, setDragOverCol] = useState<Status | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [draft, setDraft] = useState<{
    title: string
    priority: Priority
    status: Status
    assignee: string
  }>({ title: '', priority: 'Medium', status: 'todo', assignee: '' })

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return projects
    return projects.filter(
      p =>
        p.title.toLowerCase().includes(q) ||
        p.code.toLowerCase().includes(q) ||
        p.assignees.some(a => a.name.toLowerCase().includes(q)),
    )
  }, [projects, query])

  const byStatus = useMemo(() => {
    const map: Record<Status, Project[]> = {
      todo: [],
      'in-progress': [],
      'in-review': [],
      done: [],
    }
    filtered.forEach(p => map[p.status].push(p))
    return map
  }, [filtered])

  function handleDrop(target: Status) {
    if (!dragId) return
    setProjects(prev => prev.map(p => (p.id === dragId ? { ...p, status: target } : p)))
    setDragId(null)
    setDragOverCol(null)
  }

  function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    const title = draft.title.trim()
    if (!title) return
    const newProj: Project = {
      id: `p${Date.now()}`,
      title,
      code: nextProjectCode(projects),
      priority: draft.priority,
      status: draft.status,
      assignees: draft.assignee.trim()
        ? [{ name: draft.assignee.trim(), color: 'var(--bs-blue-600)' }]
        : [],
      subTasks: { total: 0, done: 0 },
    }
    setProjects(prev => [newProj, ...prev])
    setDraft({ title: '', priority: 'Medium', status: 'todo', assignee: '' })
    setModalOpen(false)
  }

  return (
    <div className="kb-page">
      {/* Breadcrumb */}
      <div className="kb-breadcrumb">
        <House size={13} />
        <span className="kb-breadcrumb__sep">/</span>
        <span>Project Management</span>
        <span className="kb-breadcrumb__sep">/</span>
        <span className="kb-breadcrumb__current">Kanban Board</span>
      </div>

      <div className="kb-header">
        <div>
          <h2 className="kb-page-title">Projects</h2>
          <p className="kb-page-subtitle">Track work by status, priority, and owner.</p>
        </div>

        <button
          type="button"
          className="bs-btn bs-btn-primary kb-new-btn"
          onClick={() => setModalOpen(true)}
        >
          <Plus size={16} weight="bold" />
          New Project
        </button>
      </div>

      {/* Toolbar */}
      <div className="kb-toolbar">
        <div className="kb-search">
          <MagnifyingGlass size={16} className="kb-search__icon" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search projects, owners, codes…"
            aria-label="Search projects"
          />
        </div>

        <div className="kb-view-toggle" role="group" aria-label="View mode">
          <button
            type="button"
            className={`kb-view-toggle__btn${view === 'kanban' ? ' kb-view-toggle__btn--active' : ''}`}
            onClick={() => setView('kanban')}
            aria-pressed={view === 'kanban'}
          >
            <KanbanIcon size={14} weight="bold" /> Kanban
          </button>
          <button
            type="button"
            className={`kb-view-toggle__btn${view === 'table' ? ' kb-view-toggle__btn--active' : ''}`}
            onClick={() => setView('table')}
            aria-pressed={view === 'table'}
          >
            <ListBullets size={14} weight="bold" /> Table
          </button>
        </div>
      </div>

      {/* Body */}
      {view === 'kanban' ? (
        <div className="kb-board" role="list">
          {COLUMNS.map(col => {
            const items = byStatus[col.key]
            const isOver = dragOverCol === col.key
            return (
              <section
                key={col.key}
                className={`kb-column${isOver ? ' kb-column--drop' : ''}`}
                onDragOver={e => {
                  e.preventDefault()
                  setDragOverCol(col.key)
                }}
                onDragLeave={() => setDragOverCol(prev => (prev === col.key ? null : prev))}
                onDrop={() => handleDrop(col.key)}
                aria-label={`${col.label} — ${items.length} projects`}
              >
                <header className="kb-column__header">
                  <span className={`kb-column__dot kb-column__dot--${col.key}`} aria-hidden="true" />
                  <h3 className="kb-column__title">{col.label}</h3>
                  <span className="bs-badge bs-badge--tab bs-badge--neutral-c">{items.length}</span>
                </header>

                <div className="kb-column__list">
                  {items.length === 0 ? (
                    <p className="kb-empty">
                      {query ? 'No matches' : 'Drop a card here'}
                    </p>
                  ) : (
                    items.map(p => (
                      <article
                        key={p.id}
                        className={`kb-card${dragId === p.id ? ' kb-card--dragging' : ''}`}
                        draggable
                        onDragStart={() => setDragId(p.id)}
                        onDragEnd={() => {
                          setDragId(null)
                          setDragOverCol(null)
                        }}
                        aria-grabbed={dragId === p.id}
                      >
                        <header className="kb-card__top">
                          <span className="kb-card__code">{p.code}</span>
                          <button
                            type="button"
                            className="kb-card__menu"
                            aria-label="Card actions"
                          >
                            <DotsThree size={16} weight="bold" />
                          </button>
                        </header>

                        <h4 className="kb-card__title">{p.title}</h4>

                        <span
                          className={`bs-badge bs-badge--tab ${PRIORITY_TONE[p.priority]} kb-card__priority`}
                        >
                          {p.priority}
                        </span>

                        <footer className="kb-card__footer">
                          <span className="kb-card__sub">
                            <CheckSquareOffset size={14} weight="regular" />
                            {p.subTasks.done}/{p.subTasks.total}
                          </span>
                          <div className="kb-avatar-stack" aria-label={`${p.assignees.length} assignees`}>
                            {p.assignees.slice(0, 3).map((a, i) => (
                              <span
                                key={a.name + i}
                                className="kb-avatar"
                                style={{ background: a.color, zIndex: 10 - i }}
                                title={a.name}
                                aria-label={a.name}
                              >
                                {initials(a.name)}
                              </span>
                            ))}
                            {p.assignees.length > 3 && (
                              <span className="kb-avatar kb-avatar--more">
                                +{p.assignees.length - 3}
                              </span>
                            )}
                          </div>
                        </footer>
                      </article>
                    ))
                  )}
                </div>
              </section>
            )
          })}
        </div>
      ) : (
        <div className="kb-table-card">
          <table className="kb-table">
            <thead>
              <tr>
                <th>Project</th>
                <th>Code</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Subtasks</th>
                <th>Assignees</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="kb-table__empty">No projects match your search.</td>
                </tr>
              ) : (
                filtered.map((p, i) => (
                  <tr key={p.id} className={i % 2 === 1 ? 'kb-table__row--alt' : ''}>
                    <td>{p.title}</td>
                    <td className="kb-table__code">{p.code}</td>
                    <td>
                      <span className={`bs-badge bs-badge--tab ${PRIORITY_TONE[p.priority]}`}>
                        {p.priority}
                      </span>
                    </td>
                    <td>
                      <span className="kb-status-pill">
                        <span className={`kb-column__dot kb-column__dot--${p.status}`} aria-hidden />
                        {COLUMNS.find(c => c.key === p.status)?.label}
                      </span>
                    </td>
                    <td>{p.subTasks.done}/{p.subTasks.total}</td>
                    <td>
                      <div className="kb-avatar-stack">
                        {p.assignees.slice(0, 3).map((a, idx) => (
                          <span
                            key={a.name + idx}
                            className="kb-avatar"
                            style={{ background: a.color, zIndex: 10 - idx }}
                            title={a.name}
                          >
                            {initials(a.name)}
                          </span>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ── New Project modal ────────────────────────────────────────────── */}
      {modalOpen && (
        <div
          className="kb-modal-overlay"
          onClick={() => setModalOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Create new project"
        >
          <form
            className="kb-modal"
            onClick={e => e.stopPropagation()}
            onSubmit={handleCreate}
          >
            <header className="kb-modal__header">
              <h3 className="kb-modal__title">New Project</h3>
              <button
                type="button"
                className="kb-modal__close"
                onClick={() => setModalOpen(false)}
                aria-label="Close"
              >
                <X size={18} weight="bold" />
              </button>
            </header>

            <div className="kb-modal__body">
              <label className="kb-field">
                <span className="kb-field__label">Project name <span className="kb-field__req">*</span></span>
                <input
                  type="text"
                  value={draft.title}
                  onChange={e => setDraft(d => ({ ...d, title: e.target.value }))}
                  placeholder="Eg. Onboarding redesign"
                  required
                  autoFocus
                />
              </label>

              <div className="kb-field-row">
                <label className="kb-field">
                  <span className="kb-field__label">Priority</span>
                  <select
                    value={draft.priority}
                    onChange={e => setDraft(d => ({ ...d, priority: e.target.value as Priority }))}
                  >
                    <option>Low</option>
                    <option>Medium</option>
                    <option>High</option>
                    <option>Critical</option>
                  </select>
                </label>

                <label className="kb-field">
                  <span className="kb-field__label">Status</span>
                  <select
                    value={draft.status}
                    onChange={e => setDraft(d => ({ ...d, status: e.target.value as Status }))}
                  >
                    {COLUMNS.map(c => (
                      <option key={c.key} value={c.key}>{c.label}</option>
                    ))}
                  </select>
                </label>
              </div>

              <label className="kb-field">
                <span className="kb-field__label">Lead assignee</span>
                <input
                  type="text"
                  value={draft.assignee}
                  onChange={e => setDraft(d => ({ ...d, assignee: e.target.value }))}
                  placeholder="Eg. Vivka"
                />
              </label>
            </div>

            <footer className="kb-modal__footer">
              <button
                type="button"
                className="bs-btn bs-btn-neutral"
                onClick={() => setModalOpen(false)}
              >
                Cancel
              </button>
              <button type="submit" className="bs-btn bs-btn-primary">
                <PaperPlaneTilt size={14} weight="bold" />
                Create
              </button>
            </footer>
          </form>
        </div>
      )}
    </div>
  )
}
