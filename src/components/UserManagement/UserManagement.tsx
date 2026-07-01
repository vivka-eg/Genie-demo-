import { useState, useRef, useEffect } from 'react'
import {
  MagnifyingGlass,
  UserPlus,
  DotsThreeVertical,
  PencilSimple,
  Prohibit,
  Trash,
  House,
  CaretLeft,
  CaretRight,
  X,
} from '@phosphor-icons/react'
import './UserManagement.css'

// ── Types ─────────────────────────────────────────────────────────────────────

type Role = 'Admin' | 'Editor' | 'Viewer'
type Status = 'Active' | 'Inactive' | 'Pending'

interface User {
  id: number
  name: string
  email: string
  role: Role
  status: Status
  lastLogin: string
  initials: string
  color: string
}

// ── Data ─────────────────────────────────────────────────────────────────────

const AVATAR_COLORS: Record<string, { bg: string; text: string }> = {
  blue:   { bg: '#dbeafe', text: '#1d4ed8' },
  green:  { bg: '#dcfce7', text: '#15803d' },
  purple: { bg: '#ede9fe', text: '#6d28d9' },
  orange: { bg: '#ffedd5', text: '#c2410c' },
  pink:   { bg: '#fce7f3', text: '#be185d' },
  teal:   { bg: '#ccfbf1', text: '#0f766e' },
  red:    { bg: '#fee2e2', text: '#b91c1c' },
  yellow: { bg: '#fef9c3', text: '#a16207' },
}

const ALL_USERS: User[] = [
  { id: 1,  name: 'Alice Johnson',   email: 'alice@eg.dk',    role: 'Admin',  status: 'Active',   lastLogin: '2026-05-13', initials: 'AJ', color: 'blue'   },
  { id: 2,  name: 'Bob Smith',       email: 'bob@eg.dk',      role: 'Editor', status: 'Active',   lastLogin: '2026-05-12', initials: 'BS', color: 'green'  },
  { id: 3,  name: 'Clara Müller',    email: 'clara@eg.dk',    role: 'Viewer', status: 'Pending',  lastLogin: '—',          initials: 'CM', color: 'purple' },
  { id: 4,  name: 'David Park',      email: 'david@eg.dk',    role: 'Editor', status: 'Active',   lastLogin: '2026-05-11', initials: 'DP', color: 'orange' },
  { id: 5,  name: 'Eva Larsen',      email: 'eva@eg.dk',      role: 'Viewer', status: 'Inactive', lastLogin: '2026-04-02', initials: 'EL', color: 'pink'   },
  { id: 6,  name: 'Frank Nielsen',   email: 'frank@eg.dk',    role: 'Admin',  status: 'Active',   lastLogin: '2026-05-13', initials: 'FN', color: 'teal'   },
  { id: 7,  name: 'Grace Chen',      email: 'grace@eg.dk',    role: 'Editor', status: 'Pending',  lastLogin: '—',          initials: 'GC', color: 'red'    },
  { id: 8,  name: 'Hans Eriksson',   email: 'hans@eg.dk',     role: 'Viewer', status: 'Active',   lastLogin: '2026-05-10', initials: 'HE', color: 'yellow' },
  { id: 9,  name: 'Iris Patel',      email: 'iris@eg.dk',     role: 'Editor', status: 'Active',   lastLogin: '2026-05-09', initials: 'IP', color: 'blue'   },
  { id: 10, name: 'James Olsen',     email: 'james@eg.dk',    role: 'Viewer', status: 'Inactive', lastLogin: '2026-03-15', initials: 'JO', color: 'green'  },
  { id: 11, name: 'Katrine Berg',    email: 'katrine@eg.dk',  role: 'Admin',  status: 'Active',   lastLogin: '2026-05-13', initials: 'KB', color: 'purple' },
  { id: 12, name: 'Luca Romano',     email: 'luca@eg.dk',     role: 'Editor', status: 'Active',   lastLogin: '2026-05-08', initials: 'LR', color: 'orange' },
]

const PAGE_SIZE = 8
const TABS = ['All', 'Active', 'Inactive', 'Pending'] as const
type Tab = typeof TABS[number]
const ROLES: ('All Roles' | Role)[] = ['All Roles', 'Admin', 'Editor', 'Viewer']

// ── Avatar ────────────────────────────────────────────────────────────────────

function Avatar({ initials, color, size = 'md' }: { initials: string; color: string; size?: 'sm' | 'md' }) {
  const c = AVATAR_COLORS[color] ?? AVATAR_COLORS.blue
  return (
    <div
      className={`um-avatar um-avatar--${size}`}
      style={{ background: c.bg, color: c.text }}
      aria-label={initials}
      role="img"
    >
      {initials}
    </div>
  )
}

// ── Status chip ───────────────────────────────────────────────────────────────

function StatusChip({ status }: { status: Status }) {
  const map: Record<Status, string> = {
    Active:   'bs-chip bs-chip-success',
    Inactive: 'bs-chip bs-chip-neutral',
    Pending:  'bs-chip bs-chip-warning',
  }
  return <span className={map[status]}>{status}</span>
}

// ── Role chip ─────────────────────────────────────────────────────────────────

function RoleChip({ role }: { role: Role }) {
  const map: Record<Role, string> = {
    Admin:  'bs-chip bs-chip-primary',
    Editor: 'bs-chip bs-chip-outlined',
    Viewer: 'bs-chip bs-chip-neutral',
  }
  return <span className={map[role]}>{role}</span>
}

// ── Row actions menu ──────────────────────────────────────────────────────────

function RowMenu({ onClose }: { onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onClose])

  return (
    <div className="um-row-menu" ref={ref} role="menu">
      <button className="um-row-menu__item" role="menuitem">
        <PencilSimple size={14} /> Edit
      </button>
      <button className="um-row-menu__item" role="menuitem">
        <Prohibit size={14} /> Deactivate
      </button>
      <div className="um-row-menu__divider" />
      <button className="um-row-menu__item um-row-menu__item--danger" role="menuitem">
        <Trash size={14} /> Delete
      </button>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function UserManagement() {
  const [activeTab, setActiveTab] = useState<Tab>('All')
  const [roleFilter, setRoleFilter] = useState<'All Roles' | Role>('All Roles')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [openMenu, setOpenMenu] = useState<number | null>(null)
  const [page, setPage] = useState(1)

  // Filter users
  const filtered = ALL_USERS.filter(u => {
    const matchTab  = activeTab === 'All' || u.status === activeTab
    const matchRole = roleFilter === 'All Roles' || u.role === roleFilter
    const q = search.toLowerCase()
    const matchSearch = !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
    return matchTab && matchRole && matchSearch
  })

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage   = Math.min(page, totalPages)
  const pageUsers  = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  const allPageSelected = pageUsers.length > 0 && pageUsers.every(u => selected.has(u.id))

  function toggleAll() {
    setSelected(prev => {
      const next = new Set(prev)
      if (allPageSelected) pageUsers.forEach(u => next.delete(u.id))
      else                  pageUsers.forEach(u => next.add(u.id))
      return next
    })
  }

  function toggleRow(id: number) {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function handleTabChange(tab: Tab) {
    setActiveTab(tab)
    setPage(1)
    setSelected(new Set())
  }

  function handleRoleFilter(role: typeof roleFilter) {
    setRoleFilter(role)
    setPage(1)
  }

  function handleSearch(v: string) {
    setSearch(v)
    setPage(1)
  }

  // Tab counts
  const counts: Record<Tab, number> = {
    All:      ALL_USERS.length,
    Active:   ALL_USERS.filter(u => u.status === 'Active').length,
    Inactive: ALL_USERS.filter(u => u.status === 'Inactive').length,
    Pending:  ALL_USERS.filter(u => u.status === 'Pending').length,
  }

  return (
    <div className="um-root">
      {/* Breadcrumb */}
      <div className="db-breadcrumb">
        <House size={13} />
        <span className="db-breadcrumb__sep">/</span>
        <span>Admin</span>
        <span className="db-breadcrumb__sep">/</span>
        <span className="db-breadcrumb__current">User Management</span>
      </div>

      {/* Page header */}
      <div className="um-page-header">
        <div>
          <h2 className="db-page-title">User Management</h2>
          <p className="um-page-subtitle">{ALL_USERS.length} total users</p>
        </div>
        <button className="um-btn-primary">
          <UserPlus size={16} weight="bold" /> Invite User
        </button>
      </div>

      {/* Card */}
      <div className="db-card um-card">

        {/* Tabs */}
        <div className="bs-tabs um-tabs" role="tablist">
          {TABS.map(tab => (
            <button
              key={tab}
              role="tab"
              aria-selected={activeTab === tab}
              className={`bs-tab${activeTab === tab ? ' bs-tab--active' : ''}`}
              onClick={() => handleTabChange(tab)}
            >
              {tab}
              <span className={`um-tab-badge${activeTab === tab ? ' um-tab-badge--active' : ''}`}>
                {counts[tab]}
              </span>
            </button>
          ))}
        </div>

        {/* Toolbar */}
        <div className="um-toolbar">
          <div className="um-toolbar__left">
            {/* Search */}
            <div className="um-search">
              <MagnifyingGlass size={15} className="um-search__icon" />
              <input
                type="text"
                className="um-search__input"
                placeholder="Search users…"
                value={search}
                onChange={e => handleSearch(e.target.value)}
              />
              {search && (
                <button className="um-search__clear" onClick={() => handleSearch('')} aria-label="Clear search">
                  <X size={13} />
                </button>
              )}
            </div>

            {/* Role filter chips */}
            <div className="um-filter-chips">
              {ROLES.map(role => (
                <button
                  key={role}
                  className={`bs-chip um-filter-chip${roleFilter === role ? ' bs-chip-primary' : ' bs-chip-neutral'}`}
                  onClick={() => handleRoleFilter(role)}
                >
                  {role}
                </button>
              ))}
            </div>
          </div>

          {/* Bulk action bar */}
          {selected.size > 0 && (
            <div className="um-bulk-bar">
              <span className="um-bulk-bar__count">{selected.size} selected</span>
              <button className="um-bulk-btn">Deactivate</button>
              <button className="um-bulk-btn um-bulk-btn--danger">Delete</button>
              <button className="um-icon-btn" onClick={() => setSelected(new Set())} aria-label="Clear selection">
                <X size={14} />
              </button>
            </div>
          )}
        </div>

        {/* Table */}
        <div className="um-table-wrap">
          <table className="um-table">
            <thead>
              <tr>
                <th className="um-th-check">
                  <input
                    type="checkbox"
                    className="um-checkbox"
                    checked={allPageSelected}
                    onChange={toggleAll}
                    aria-label="Select all"
                  />
                </th>
                <th>User</th>
                <th>Role</th>
                <th>Status</th>
                <th>Last Login</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {pageUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="um-empty">
                    <p>No users match your filters.</p>
                  </td>
                </tr>
              ) : (
                pageUsers.map((user, i) => (
                  <tr
                    key={user.id}
                    className={[
                      i % 2 === 1 ? 'db-table__row--alt' : '',
                      selected.has(user.id) ? 'um-row--selected' : '',
                    ].join(' ')}
                  >
                    <td className="um-td-check">
                      <input
                        type="checkbox"
                        className="um-checkbox"
                        checked={selected.has(user.id)}
                        onChange={() => toggleRow(user.id)}
                        aria-label={`Select ${user.name}`}
                      />
                    </td>
                    <td>
                      <div className="um-user-cell">
                        <Avatar initials={user.initials} color={user.color} />
                        <div className="um-user-cell__info">
                          <span className="um-user-cell__name">{user.name}</span>
                          <span className="um-user-cell__email">{user.email}</span>
                        </div>
                      </div>
                    </td>
                    <td><RoleChip role={user.role} /></td>
                    <td><StatusChip status={user.status} /></td>
                    <td className="um-last-login">{user.lastLogin}</td>
                    <td className="um-td-actions">
                      <div className="um-actions-wrapper">
                        <button
                          className="um-icon-btn"
                          onClick={() => setOpenMenu(openMenu === user.id ? null : user.id)}
                          aria-label={`Actions for ${user.name}`}
                          aria-haspopup="menu"
                          aria-expanded={openMenu === user.id}
                        >
                          <DotsThreeVertical size={16} weight="bold" />
                        </button>
                        {openMenu === user.id && (
                          <RowMenu onClose={() => setOpenMenu(null)} />
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="um-pagination">
          <span className="um-pagination__info">
            Showing {filtered.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, filtered.length)} of {filtered.length}
          </span>
          <div className="um-pagination__controls">
            <button
              className="um-pag-btn"
              disabled={safePage <= 1}
              onClick={() => setPage(p => p - 1)}
              aria-label="Previous page"
            >
              <CaretLeft size={14} weight="bold" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
              <button
                key={p}
                className={`um-pag-btn${p === safePage ? ' um-pag-btn--active' : ''}`}
                onClick={() => setPage(p)}
                aria-label={`Page ${p}`}
                aria-current={p === safePage ? 'page' : undefined}
              >
                {p}
              </button>
            ))}
            <button
              className="um-pag-btn"
              disabled={safePage >= totalPages}
              onClick={() => setPage(p => p + 1)}
              aria-label="Next page"
            >
              <CaretRight size={14} weight="bold" />
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}
