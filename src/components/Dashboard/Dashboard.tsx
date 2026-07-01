import { useState, useEffect, useRef } from 'react'
import UserManagement from '../UserManagement/UserManagement'
import Kanban from '../Kanban/Kanban'
import Requests from '../Requests/Requests'
import Chatbot from '../Chatbot/Chatbot'
import genieIcon from '../Chatbot/genie-icon.svg'
import { BRANDS } from '../../brands/brands'
import { useAuth } from '../../auth/AuthContext'
import {
  SquaresFour,
  ChartBar,
  FileText,
  Users,
  Gear,
  MagnifyingGlass,
  Sun,
  Moon,
  Bell,
  CaretLeft,
  CaretDown,
  CaretUp,
  List,
  House,
  CurrencyDollar,
  UserPlus,
  ShoppingCart,
  SmileyWink,
  ArrowsDownUp,
  User,
  SignOut,
  X,
  Kanban as KanbanIcon,
  Ticket,
} from '@phosphor-icons/react'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import './Dashboard.css'

// ── Data ─────────────────────────────────────────────────────────────────────

const statCards = [
  { label: 'Revenue', value: '$53,000', change: '+55%', positive: true, Icon: CurrencyDollar, accent: 'blue' },
  { label: 'New Users', value: '2,300', change: '+5%', positive: true, Icon: UserPlus, accent: 'green' },
  { label: 'New Orders', value: '1,462', change: '-14%', positive: false, Icon: ShoppingCart, accent: 'orange' },
  { label: 'Satisfaction', value: '87%', change: '+3%', positive: true, Icon: SmileyWink, accent: 'purple' },
]

const tableData = [
  { country: 'United States', revenue: '$32,400', orders: 820, conversion: '4.2%' },
  { country: 'Germany', revenue: '$12,700', orders: 312, conversion: '3.8%' },
  { country: 'United Kingdom', revenue: '$9,800', orders: 241, conversion: '3.5%' },
  { country: 'France', revenue: '$7,200', orders: 178, conversion: '3.1%' },
  { country: 'Canada', revenue: '$5,600', orders: 134, conversion: '2.9%' },
  { country: 'Australia', revenue: '$4,300', orders: 102, conversion: '2.6%' },
]

const barData = [
  { month: 'Jan', users: 1200 },
  { month: 'Feb', users: 1900 },
  { month: 'Mar', users: 1600 },
  { month: 'Apr', users: 2100 },
  { month: 'May', users: 1800 },
  { month: 'Jun', users: 2400 },
  { month: 'Jul', users: 2200 },
  { month: 'Aug', users: 2800 },
  { month: 'Sep', users: 2600 },
  { month: 'Oct', users: 3100 },
  { month: 'Nov', users: 2900 },
  { month: 'Dec', users: 3400 },
]

const lineData = [
  { month: 'Jan', sales: 4200, target: 5000 },
  { month: 'Feb', sales: 5800, target: 5000 },
  { month: 'Mar', sales: 4900, target: 5500 },
  { month: 'Apr', sales: 6300, target: 5500 },
  { month: 'May', sales: 5700, target: 6000 },
  { month: 'Jun', sales: 7100, target: 6000 },
  { month: 'Jul', sales: 6500, target: 6500 },
  { month: 'Aug', sales: 8200, target: 6500 },
  { month: 'Sep', sales: 7600, target: 7000 },
  { month: 'Oct', sales: 9100, target: 7000 },
  { month: 'Nov', sales: 8700, target: 7500 },
  { month: 'Dec', sales: 10400, target: 7500 },
]

type SortKey = 'country' | 'revenue' | 'orders' | 'conversion'
type SortDir = 'asc' | 'desc'

// ── Component ────────────────────────────────────────────────────────────────

type Page = 'dashboard' | 'users' | 'kanban' | 'requests'

export default function Dashboard() {
  const { user, logout } = useAuth()
  const [page, setPage] = useState<Page>('dashboard')
  const [genieOpen, setGenieOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [darkMode, setDarkMode] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [brandId, setBrandId] = useState(BRANDS[0].id)
  const [brandMenuOpen, setBrandMenuOpen] = useState(false)
  const [pagesExpanded, setPagesExpanded] = useState(true)
  const brandRef = useRef<HTMLDivElement>(null)
  const brand = BRANDS.find(b => b.id === brandId) ?? BRANDS[0]
  const [sortKey, setSortKey] = useState<SortKey>('revenue')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const profileRef = useRef<HTMLDivElement>(null)

  // Apply dark mode to document root
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light')
  }, [darkMode])

  // Apply the selected brand's palette to the whole app
  useEffect(() => {
    document.documentElement.setAttribute('data-brand', brand.palette)
  }, [brand.palette])

  // Close brand menu on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (brandRef.current && !brandRef.current.contains(e.target as Node)) {
        setBrandMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Close profile dropdown on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir('desc')
    }
  }

  const sortedTable = [...tableData].sort((a, b) => {
    const aVal = a[sortKey]
    const bVal = b[sortKey]
    const numA = parseFloat(String(aVal).replace(/[^0-9.-]/g, ''))
    const numB = parseFloat(String(bVal).replace(/[^0-9.-]/g, ''))
    const cmp = isNaN(numA) ? String(aVal).localeCompare(String(bVal)) : numA - numB
    return sortDir === 'asc' ? cmp : -cmp
  })

  function SortBtn({ col }: { col: SortKey }) {
    const active = sortKey === col
    return (
      <button
        className={`sort-btn${active ? ' sort-btn--active' : ''}`}
        onClick={() => handleSort(col)}
        aria-label={`Sort by ${col}`}
      >
        <ArrowsDownUp size={12} weight={active ? 'bold' : 'regular'} />
      </button>
    )
  }

  return (
    <div className="db-root">
      {/* Mobile overlay */}
      {mobileSidebarOpen && (
        <div
          className="db-mobile-overlay"
          onClick={() => setMobileSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ── Sidebar ────────────────────────────────────────────────────────── */}
      <aside
        className={`db-sidebar${sidebarCollapsed ? ' db-sidebar--collapsed' : ''}${mobileSidebarOpen ? ' db-sidebar--mobile-open' : ''}`}
        id="sidebar"
      >
        {/* Brand switcher */}
        <div className="db-sidebar__header">
          <div className="db-brand-wrapper" ref={brandRef}>
            <button
              className="db-brand"
              onClick={() => setBrandMenuOpen(o => !o)}
              aria-expanded={brandMenuOpen}
              aria-label={`Brand: ${brand.name}. Change brand`}
            >
              {sidebarCollapsed ? (
                <img src={brand.icon} alt={brand.name} className="db-brand__icon" />
              ) : (
                <>
                  <img src={brand.logo} alt={brand.name} className="db-brand__logo" />
                  <CaretDown size={12} weight="bold" className="db-brand__caret" />
                </>
              )}
            </button>
            {brandMenuOpen && (
              <div className="db-brand-menu">
                {BRANDS.map(b => (
                  <button
                    key={b.id}
                    className={`db-brand-menu__item${b.id === brandId ? ' db-brand-menu__item--active' : ''}`}
                    onClick={() => { setBrandId(b.id); setBrandMenuOpen(false) }}
                    aria-label={b.name}
                  >
                    <img src={b.logo} alt={b.name} className="db-brand-menu__logo" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Collapse toggle */}
        <button
          className="db-sidebar__collapse-toggle"
          onClick={() => setSidebarCollapsed(c => !c)}
          aria-expanded={!sidebarCollapsed}
          aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {!sidebarCollapsed && <span className="db-sidebar__collapse-label">Menu</span>}
          <span className="db-sidebar__chevron">
            <CaretLeft size={14} weight="bold" style={{ transform: sidebarCollapsed ? 'rotate(180deg)' : 'none', transition: 'transform 200ms' }} />
          </span>
        </button>

        {/* Nav */}
        <nav className="db-sidebar__nav">
          <a
            href="#"
            className={`db-nav-item${page === 'dashboard' ? ' db-nav-item--active' : ''}`}
            onClick={e => { e.preventDefault(); setPage('dashboard'); setMobileSidebarOpen(false) }}
          >
            <SquaresFour size={18} weight="bold" className="db-nav-icon" />
            {!sidebarCollapsed && <span className="db-nav-label">Dashboard</span>}
          </a>

          {!sidebarCollapsed && <p className="db-nav-group-label">PAGES</p>}

          {/* Expandable section */}
          <div className="db-nav-section">
            <button
              className="db-nav-item db-nav-item--parent"
              onClick={() => setPagesExpanded(e => !e)}
              aria-expanded={pagesExpanded}
            >
              <FileText size={18} weight="bold" className="db-nav-icon" />
              {!sidebarCollapsed && (
                <>
                  <span className="db-nav-label">Analytics</span>
                  <span className="db-nav-expand-icon">
                    {pagesExpanded ? <CaretUp size={12} /> : <CaretDown size={12} />}
                  </span>
                </>
              )}
            </button>
            {pagesExpanded && !sidebarCollapsed && (
              <div className="db-nav-submenu">
                <a href="#" className="db-nav-item db-nav-item--child">Overview</a>
                <a href="#" className="db-nav-item db-nav-item--child">Reports</a>
              </div>
            )}
          </div>

          <a href="#" className="db-nav-item">
            <ChartBar size={18} weight="bold" className="db-nav-icon" />
            {!sidebarCollapsed && <span className="db-nav-label">Charts</span>}
          </a>
          <a
            href="#"
            className={`db-nav-item${page === 'kanban' ? ' db-nav-item--active' : ''}`}
            onClick={e => { e.preventDefault(); setPage('kanban'); setMobileSidebarOpen(false) }}
          >
            <KanbanIcon size={18} weight="bold" className="db-nav-icon" />
            {!sidebarCollapsed && <span className="db-nav-label">Projects</span>}
          </a>
          <a
            href="#"
            className={`db-nav-item${page === 'requests' ? ' db-nav-item--active' : ''}`}
            onClick={e => { e.preventDefault(); setPage('requests'); setMobileSidebarOpen(false) }}
          >
            <Ticket size={18} weight="bold" className="db-nav-icon" />
            {!sidebarCollapsed && <span className="db-nav-label">Requests</span>}
          </a>
          <a
            href="#"
            className={`db-nav-item${page === 'users' ? ' db-nav-item--active' : ''}`}
            onClick={e => { e.preventDefault(); setPage('users'); setMobileSidebarOpen(false) }}
          >
            <Users size={18} weight="bold" className="db-nav-icon" />
            {!sidebarCollapsed && <span className="db-nav-label">Users</span>}
          </a>
          <a href="#" className="db-nav-item">
            <Gear size={18} weight="bold" className="db-nav-icon" />
            {!sidebarCollapsed && <span className="db-nav-label">Settings</span>}
          </a>
        </nav>
      </aside>

      {/* ── Main ────────────────────────────────────────────────────────────── */}
      <main className="db-main">

        {/* Top nav */}
        <nav className="db-topnav">
          <button
            className="db-topnav__hamburger"
            onClick={() => setMobileSidebarOpen(o => !o)}
            aria-label="Toggle sidebar"
            aria-expanded={mobileSidebarOpen}
          >
            {mobileSidebarOpen ? <X size={20} weight="bold" /> : <List size={20} weight="bold" />}
          </button>

          <div className="db-topnav__search">
            <MagnifyingGlass size={16} className="db-topnav__search-icon" />
            <input type="text" className="db-topnav__search-input" placeholder="Search…" />
          </div>

          <div className="db-topnav__actions">
            {/* Genie assistant launcher — opens the chat as a right nav column */}
            <button
              className="db-icon-btn db-genie-btn"
              onClick={() => setGenieOpen(o => !o)}
              aria-label="Open Genie assistant"
              aria-expanded={genieOpen}
            >
              <img src={genieIcon} alt="" className="db-genie-btn__img" aria-hidden="true" />
            </button>
            <button
              className="db-icon-btn"
              onClick={() => setDarkMode(d => !d)}
              aria-label="Toggle theme"
            >
              {darkMode ? <Sun size={18} weight="bold" /> : <Moon size={18} weight="bold" />}
            </button>
            <button className="db-icon-btn" aria-label="Notifications">
              <Bell size={18} weight="bold" />
              <span className="db-notif-dot" />
            </button>

            {/* User avatar / dropdown */}
            <div className="db-profile-wrapper" ref={profileRef}>
              <button
                className="db-avatar-btn"
                onClick={() => setProfileOpen(o => !o)}
                aria-label="User menu"
                aria-expanded={profileOpen}
              >
                <img
                  src="https://ui-avatars.com/api/?name=Vivka&background=0073E1&color=fff&size=32"
                  alt="User avatar"
                  className="db-avatar-img"
                />
              </button>
              {profileOpen && (
                <div className="db-dropdown">
                  <div className="db-dropdown__header">
                    <p className="db-dropdown__name">{user?.name ?? 'Guest'}</p>
                    <p className="db-dropdown__email">{user?.email ?? ''}</p>
                  </div>
                  <div className="db-dropdown__divider" />
                  <button className="db-dropdown__item">
                    <User size={15} /> Profile
                  </button>
                  <button className="db-dropdown__item">
                    <Gear size={15} /> Settings
                  </button>
                  <div className="db-dropdown__divider" />
                  <button
                    className="db-dropdown__item db-dropdown__item--danger"
                    onClick={() => {
                      setProfileOpen(false)
                      logout()
                    }}
                  >
                    <SignOut size={15} /> Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </nav>

        {/* ── Content ─────────────────────────────────────────────────────── */}
        {page === 'users' ? <UserManagement /> : page === 'kanban' ? <Kanban /> : page === 'requests' ? <Requests /> : <div className="db-content">

          {/* Breadcrumb */}
          <div className="db-breadcrumb">
            <House size={13} />
            <span className="db-breadcrumb__sep">/</span>
            <span>Analytics</span>
            <span className="db-breadcrumb__sep">/</span>
            <span className="db-breadcrumb__current">Dashboard</span>
          </div>

          <h2 className="db-page-title">Dashboard</h2>

          {/* ── Stat cards ────────────────────────────────────────────────── */}
          <div className="db-stats-row">
            {statCards.map(({ label, value, change, positive, Icon, accent }) => (
              <div key={label} className="db-stat-card">
                <div className="db-stat-card__body">
                  <p className="db-stat-card__label">{label}</p>
                  <div className="db-stat-card__value-row">
                    <span className="db-stat-card__value">{value}</span>
                    <span className={`db-stat-card__change${positive ? ' db-stat-card__change--pos' : ' db-stat-card__change--neg'}`}>
                      {change}
                    </span>
                  </div>
                </div>
                <div className={`db-stat-card__icon db-stat-card__icon--${accent}`}>
                  <Icon size={22} weight="bold" />
                </div>
              </div>
            ))}
          </div>

          {/* ── Table ─────────────────────────────────────────────────────── */}
          <div className="db-card db-table-card">
            <div className="db-table-toolbar">
              <h3 className="db-card-title">Sales by Region</h3>
              <span className="db-table-toolbar__count">{tableData.length} entries</span>
            </div>
            <div className="db-table-wrapper">
              <table className="db-table">
                <thead>
                  <tr>
                    <th>Country <SortBtn col="country" /></th>
                    <th>Revenue <SortBtn col="revenue" /></th>
                    <th>Orders <SortBtn col="orders" /></th>
                    <th>Conversion <SortBtn col="conversion" /></th>
                  </tr>
                </thead>
                <tbody>
                  {sortedTable.map((row, i) => (
                    <tr key={row.country} className={i % 2 === 1 ? 'db-table__row--alt' : ''}>
                      <td>{row.country}</td>
                      <td>{row.revenue}</td>
                      <td>{row.orders}</td>
                      <td>
                        <span className="db-conversion-badge">{row.conversion}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* ── Charts row ────────────────────────────────────────────────── */}
          <div className="db-charts-row">

            {/* Bar chart — Active Users */}
            <div className="db-card db-chart-card">
              <div className="db-chart-header">
                <div>
                  <h3 className="db-card-title">Active Users</h3>
                  <p className="db-chart-subtitle">Monthly active users (+23% vs last year)</p>
                </div>
              </div>
              <div className="db-chart-wrap">
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={barData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--bs-border-default)" vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--bs-text-secondary)' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: 'var(--bs-text-secondary)' }} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{ background: 'var(--bs-surface-raised)', border: '1px solid var(--bs-border-default)', borderRadius: 8, fontSize: 12 }}
                      labelStyle={{ color: 'var(--bs-text-default)', fontWeight: 600 }}
                      cursor={{ fill: 'var(--bs-surface-hover)' }}
                    />
                    <Bar dataKey="users" fill="var(--bs-color-primary-default)" radius={[4, 4, 0, 0]} name="Active Users" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Line chart — Sales Overview */}
            <div className="db-card db-chart-card">
              <div className="db-chart-header">
                <div>
                  <h3 className="db-card-title">Sales Overview</h3>
                  <p className="db-chart-subtitle db-chart-subtitle--pos">▲ 4% above target</p>
                </div>
              </div>
              <div className="db-chart-wrap">
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={lineData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--bs-border-default)" vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--bs-text-secondary)' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: 'var(--bs-text-secondary)' }} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{ background: 'var(--bs-surface-raised)', border: '1px solid var(--bs-border-default)', borderRadius: 8, fontSize: 12 }}
                      labelStyle={{ color: 'var(--bs-text-default)', fontWeight: 600 }}
                    />
                    <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                    <Line type="monotone" dataKey="sales" stroke="var(--bs-color-primary-default)" strokeWidth={2} dot={false} name="Sales" />
                    <Line type="monotone" dataKey="target" stroke="var(--bs-color-success-default)" strokeWidth={2} dot={false} strokeDasharray="5 4" name="Target" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>
        </div>}
      </main>

      {/* Genie assistant — embedded right nav column, launched from the header logo */}
      <Chatbot open={genieOpen} onClose={() => setGenieOpen(false)} brandName={brand.name} />
    </div>
  )
}
