// ── Service Request domain model + seed data ─────────────────────────────────
// Implements the BrandSync `service-request` pattern (APT-202 handoff).

export type RequestStatus = 'Open' | 'In Progress' | 'Done'
export type RequestPriority = 'Low' | 'Medium' | 'High'
export type RequestCategory = 'IT Support' | 'Facilities' | 'HR' | 'Finance'

export type ServiceRequest = {
  id: string
  ref: string
  title: string
  description: string
  category: RequestCategory
  priority: RequestPriority
  status: RequestStatus
  requester: string
  createdAt: string // ISO date
  comment?: string // admin note added on a status update
  rating?: number // post-resolution feedback (1–5)
  feedback?: string // optional feedback comment
}

export const CATEGORIES: RequestCategory[] = ['IT Support', 'Facilities', 'HR', 'Finance']
export const PRIORITIES: RequestPriority[] = ['Low', 'Medium', 'High']
export const STATUSES: RequestStatus[] = ['Open', 'In Progress', 'Done']

// Status tag → BrandSync Tag variant (per pattern spec)
export const STATUS_TAG: Record<RequestStatus, string> = {
  Open: 'bs-tag-primary',
  'In Progress': 'bs-tag-warning',
  Done: 'bs-tag-success',
}

// Priority tag → BrandSync Tag variant (per pattern spec)
export const PRIORITY_TAG: Record<RequestPriority, string> = {
  High: 'bs-tag-error',
  Medium: 'bs-tag-warning',
  Low: 'bs-tag-primary',
}

export const SEED_REQUESTS: ServiceRequest[] = [
  {
    id: 'r1',
    ref: 'REQ-1001',
    title: 'Laptop won’t connect to VPN',
    description: 'Since the latest update the VPN client fails to authenticate from home. Error code 809.',
    category: 'IT Support',
    priority: 'High',
    status: 'Open',
    requester: 'Vivka',
    createdAt: '2026-06-10',
  },
  {
    id: 'r2',
    ref: 'REQ-1002',
    title: 'Meeting room 3B projector flickering',
    description: 'The projector in 3B flickers during presentations. Likely a loose HDMI port.',
    category: 'Facilities',
    priority: 'Medium',
    status: 'In Progress',
    requester: 'Liam',
    createdAt: '2026-06-09',
    comment: 'Facilities notified — replacement cable ordered.',
  },
  {
    id: 'r3',
    ref: 'REQ-1003',
    title: 'Update emergency contact details',
    description: 'Need to change my emergency contact on file to a new phone number.',
    category: 'HR',
    priority: 'Low',
    status: 'Done',
    requester: 'Mei',
    createdAt: '2026-06-04',
    comment: 'Records updated in the HR system.',
  },
  {
    id: 'r4',
    ref: 'REQ-1004',
    title: 'Reimbursement for conference travel',
    description: 'Submitting receipts for flights and hotel from the design conference in May.',
    category: 'Finance',
    priority: 'Medium',
    status: 'Open',
    requester: 'Anya',
    createdAt: '2026-06-12',
  },
  {
    id: 'r5',
    ref: 'REQ-1005',
    title: 'Second monitor request',
    description: 'Requesting a second monitor to improve productivity for design review work.',
    category: 'IT Support',
    priority: 'Low',
    status: 'In Progress',
    requester: 'Jordan',
    createdAt: '2026-06-11',
    comment: 'Approved — awaiting stock.',
  },
  {
    id: 'r6',
    ref: 'REQ-1006',
    title: 'Broken chair at desk 14',
    description: 'The gas lift on the chair at desk 14 has failed and it sinks to the floor.',
    category: 'Facilities',
    priority: 'High',
    status: 'Done',
    requester: 'Sam',
    createdAt: '2026-06-02',
    comment: 'Chair replaced.',
    rating: 5,
    feedback: 'Fast turnaround, thank you!',
  },
]

export function nextRef(items: ServiceRequest[]): string {
  const max = items.reduce((acc, r) => {
    const n = parseInt(r.ref.split('-')[1] || '0', 10)
    return Number.isFinite(n) ? Math.max(acc, n) : acc
  }, 1000)
  return `REQ-${max + 1}`
}
