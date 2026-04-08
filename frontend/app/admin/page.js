'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { adminApi, documentsApi, paymentsApi, subjectsApi } from '@/lib/api'
import { useAuth } from '@/lib/auth-context'
import toast from 'react-hot-toast'
import {
  LayoutDashboard, FileText, AlertCircle, CheckCircle2,
  XCircle, Users, BarChart2, Settings, Shield, Eye,
  Download, Upload, Search, Filter, ChevronDown,
  Loader2, RefreshCw, TrendingUp, AlertTriangle,
  BookOpen, Clock, Ban, Edit2, Save, X, Menu,
  DollarSign, Activity, BookMarked, ClipboardList,
  GraduationCap, Calendar
} from 'lucide-react'

// ── Sidebar nav items ────────────────────────
const NAV = [
  { key: 'dashboard',  label: 'Dashboard',      icon: LayoutDashboard },
  { key: 'upload',     label: 'Upload document',icon: Upload },
  { key: 'queue',      label: 'Review queue',   icon: Clock,          badge: true },
  { key: 'documents',  label: 'All documents',  icon: FileText },
  { key: 'duplicates', label: 'Duplicate log',  icon: AlertTriangle },
  { key: 'users',      label: 'Users',          icon: Users },
  { key: 'revenue',    label: 'Revenue',        icon: BarChart2 },
  { key: 'settings',   label: 'Settings',       icon: Settings },
]

// ── Constants ────────────────────────────────
const LEVELS = [
  { value: 'primary',    label: 'Primary',    sub: 'Std 1–8' },
  { value: 'jce',        label: 'JCE',        sub: 'Form 1–2' },
  { value: 'msce',       label: 'MSCE',       sub: 'Form 3–4' },
  { value: 'tvet',       label: 'TVET',       sub: 'Technical/Vocational' },
  { value: 'university', label: 'University', sub: 'Degree level' },
]

const DOC_TYPES = [
  { value: 'past_paper',     label: 'Past Paper',     icon: FileText },
  { value: 'notes',          label: 'Notes',          icon: BookOpen },
  { value: 'textbook',       label: 'Textbook',       icon: BookMarked },
  { value: 'marking_scheme', label: 'Marking Scheme', icon: ClipboardList },
  { value: 'revision_guide', label: 'Revision Guide', icon: GraduationCap },
  { value: 'assignment',     label: 'Assignment',     icon: FileText },
  { value: 'syllabus',       label: 'Syllabus',       icon: BookOpen },
  { value: 'school_calendar',label: 'School Calendar',icon: Calendar },
]

const YEARS = Array.from({ length: 15 }, (_, i) => String(2024 - i))

// ── Status badge ─────────────────────────────
function StatusBadge({ status }) {
  const map = {
    pending:     'bg-amber-50 text-amber-700 border-amber-100',
    approved:    'bg-green-50 text-green-700 border-green-100',
    rejected:    'bg-red-50 text-red-600 border-red-100',
    flagged:     'bg-orange-50 text-orange-700 border-orange-100',
    unpublished: 'bg-gray-50 text-gray-500 border-gray-100',
    active:      'bg-green-50 text-green-700 border-green-100',
    suspended:   'bg-red-50 text-red-600 border-red-100',
    completed:   'bg-green-50 text-green-700 border-green-100',
    failed:      'bg-red-50 text-red-600 border-red-100',
  }
  return (
    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border capitalize ${map[status] || 'bg-gray-50 text-gray-500 border-gray-100'}`}>
      {status}
    </span>
  )
}

// ── Stat card ─────────────────────────────────
function StatCard({ icon: Icon, label, value, sub, color }) {
  const colors = {
    green:  ['bg-green-50',  'text-green-600'],
    amber:  ['bg-amber-50',  'text-amber-600'],
    blue:   ['bg-blue-50',   'text-blue-600'],
    red:    ['bg-red-50',    'text-red-600'],
    purple: ['bg-purple-50', 'text-purple-600'],
  }
  const [bg, text] = colors[color] || colors.green
  return (
    <div className={`rounded-2xl p-4 ${bg} border border-opacity-30`}
      style={{ borderColor: 'rgba(0,0,0,0.06)' }}>
      <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center mb-3`}
        style={{ background: 'rgba(255,255,255,0.6)' }}>
        <Icon size={18} className={text} />
      </div>
      <p className="text-2xl font-bold text-gray-900">{value ?? '—'}</p>
      <p className="text-sm font-medium text-gray-700 mt-0.5">{label}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  )
}

// ── Sidebar ───────────────────────────────────
function Sidebar({ active, onChange, pendingCount, mobile, onClose }) {
  return (
    <aside className={`
      ${mobile ? 'fixed inset-y-0 left-0 z-50 w-60 shadow-2xl' : 'hidden lg:flex w-56 flex-shrink-0'}
      bg-gray-900 flex flex-col
    `}>
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 h-16 border-b border-gray-800 flex-shrink-0">
        <div className="w-8 h-8 rounded-xl bg-green-500 flex items-center justify-center">
          <Shield size={16} className="text-white" />
        </div>
        <div>
          <p className="text-sm font-semibold text-white">Admin Panel</p>
          <p className="text-[10px] text-gray-500">MalawiEduHub</p>
        </div>
        {mobile && (
          <button onClick={onClose} className="ml-auto text-gray-500 hover:text-white">
            <X size={18} />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-3">
        {NAV.map(({ key, label, icon: Icon, badge }) => (
          <button key={key} onClick={() => { onChange(key); onClose?.() }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
              transition-all mb-0.5 text-left
              ${active === key
                ? 'bg-green-600 text-white'
                : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}>
            <Icon size={16} className="flex-shrink-0" />
            <span className="flex-1">{label}</span>
            {badge && pendingCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                {pendingCount > 9 ? '9+' : pendingCount}
              </span>
            )}
          </button>
        ))}
      </nav>

      {/* Bottom */}
      <div className="px-3 py-3 border-t border-gray-800">
        <Link href="/browse"
          className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-gray-500 hover:bg-gray-800 hover:text-white transition-all no-underline">
          <BookOpen size={14} /> View site
        </Link>
      </div>
    </aside>
  )
}

// ── Dashboard tab ─────────────────────────────
function TabDashboard({ stats, onTabChange }) {
  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <StatCard icon={FileText}   label="Total documents"   value={stats?.total_documents?.toLocaleString()}  sub="approved" color="green" />
        <StatCard icon={Users}      label="Active users"      value={stats?.active_users?.toLocaleString()}     sub="registered" color="blue" />
        <StatCard icon={Download}   label="Downloads today"   value={stats?.downloads_today?.toLocaleString()}  color="purple" />
        <StatCard icon={DollarSign} label="Revenue (30 days)" value={stats ? `MWK ${Math.round(stats.revenue_30d_mwk / 1000)}K` : '—'} color="amber" />
        <StatCard icon={Clock}      label="Pending review"    value={stats?.pending_review}                     sub="awaiting action" color="red" />
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Quick actions</h2>
          <div className="flex flex-col gap-2">
            {[
              { icon: Clock,         label: 'Review pending documents', sub: `${stats?.pending_review || 0} awaiting review`, tab: 'queue',     accent: '#0d7a55' },
              { icon: AlertTriangle, label: 'Check duplicate log',      sub: 'Review blocked uploads',          tab: 'duplicates', accent: '#d97706' },
              { icon: Users,         label: 'Manage users',             sub: `${stats?.active_users || 0} active users`,  tab: 'users',      accent: '#2563eb' },
              { icon: BarChart2,     label: 'View revenue',             sub: 'Payments and earnings',           tab: 'revenue',    accent: '#7c3aed' },
            ].map(({ icon: Icon, label, sub, tab, accent }) => (
              <button key={tab} onClick={() => onTabChange(tab)}
                className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-gray-200 hover:bg-gray-50 transition-all text-left w-full">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: accent + '15', color: accent }}>
                  <Icon size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800">{label}</p>
                  <p className="text-xs text-gray-400">{sub}</p>
                </div>
                <ChevronDown size={14} className="text-gray-300 rotate-[-90deg]" />
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Activity size={16} className="text-green-500" /> Platform health
          </h2>
          <div className="flex flex-col gap-3">
            {[
              { label: 'Duplicate rejection rate', value: '8%', sub: 'of all uploads blocked', good: true },
              { label: 'Avg admin review time',    value: '4h', sub: 'pending → approved',     good: true },
              { label: 'Documents pending',        value: stats?.pending_review || 0, sub: 'need your review', good: stats?.pending_review === 0 },
              { label: 'Active subscriptions',     value: '—',  sub: 'paying members',         good: true },
            ].map(({ label, value, sub, good }) => (
              <div key={label} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div>
                  <p className="text-sm text-gray-700">{label}</p>
                  <p className="text-xs text-gray-400">{sub}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-gray-900">{value}</span>
                  {good
                    ? <CheckCircle2 size={14} className="text-green-500" />
                    : <AlertCircle size={14} className="text-amber-500" />
                  }
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Review Queue tab ──────────────────────────
function TabQueue({ queue, onApprove, onReject, loading }) {
  const [rejectId,     setRejectId]     = useState(null)
  const [rejectReason, setRejectReason] = useState('')

  const submitReject = async (id) => {
    await onReject(id, rejectReason)
    setRejectId(null)
    setRejectReason('')
  }

  if (loading) return <LoadingSpinner />

  return (
    <div className="flex flex-col gap-3">
      {queue.length === 0 ? (
        <EmptyPanel icon={CheckCircle2} title="Queue is clear" sub="All documents have been reviewed." />
      ) : queue.map(doc => (
        <div key={doc.id}
          className={`bg-white rounded-2xl border p-5 transition-all
            ${doc.status === 'flagged' ? 'border-orange-200 bg-orange-50/30' : 'border-gray-100'}`}>
          <div className="flex items-start gap-4">
            {/* Doc icon */}
            <div className={`w-10 h-12 rounded-xl flex items-center justify-center flex-shrink-0
              ${doc.status === 'flagged' ? 'bg-orange-100' : 'bg-gray-100'}`}>
              <FileText size={18} className={doc.status === 'flagged' ? 'text-orange-600' : 'text-gray-500'} />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start gap-2 flex-wrap mb-1">
                <h3 className="text-sm font-semibold text-gray-900 flex-1">{doc.title}</h3>
                <StatusBadge status={doc.status} />
              </div>
              <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-400">
                <span>{doc.subject_name}</span>
                <span>·</span>
                <span className="uppercase">{doc.level}</span>
                <span>·</span>
                <span className="capitalize">{doc.doc_type?.replace('_', ' ')}</span>
                {doc.year && <><span>·</span><span>{doc.year}</span></>}
                <span>·</span>
                <span>by <strong className="text-gray-600">{doc.uploader_name}</strong></span>
                <span>·</span>
                <span>{new Date(doc.uploaded_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
              </div>
              {doc.status === 'flagged' && (
                <p className="text-xs text-orange-600 mt-2 flex items-center gap-1">
                  <AlertTriangle size={11} /> Flagged: content similarity detected. Review carefully before approving.
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-2 flex-shrink-0 flex-wrap">
              <button onClick={() => window.open(`/browse/${doc.id}`, '_blank')}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-blue-600
                  bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors border border-blue-100">
                <Eye size={13} /> Preview
              </button>
              <button onClick={() => onApprove(doc.id)}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-green-700
                  bg-green-50 rounded-xl hover:bg-green-100 transition-colors border border-green-100">
                <CheckCircle2 size={13} /> Approve
              </button>
              <button onClick={() => setRejectId(doc.id)}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-red-600
                  bg-red-50 rounded-xl hover:bg-red-100 transition-colors border border-red-100">
                <XCircle size={13} /> Reject
              </button>
            </div>
          </div>

          {/* Reject reason form */}
          {rejectId === doc.id && (
            <div className="mt-4 pt-4 border-t border-gray-100 flex gap-2">
              <input
                value={rejectReason} onChange={e => setRejectReason(e.target.value)}
                placeholder="Reason for rejection (optional)…"
                className="flex-1 px-3 py-2 text-sm rounded-xl border border-gray-200 bg-gray-50
                  focus:outline-none focus:border-red-300"
              />
              <button onClick={() => submitReject(doc.id)}
                className="px-4 py-2 text-xs font-semibold text-white bg-red-500 rounded-xl hover:bg-red-600">
                Confirm reject
              </button>
              <button onClick={() => setRejectId(null)}
                className="px-3 py-2 text-xs font-semibold text-gray-500 bg-gray-100 rounded-xl hover:bg-gray-200">
                Cancel
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

// ── Documents tab ─────────────────────────────
function TabDocuments({ documents, loading, onUpdate, onDelete }) {
  const [search,  setSearch]  = useState('')
  const [editId,  setEditId]  = useState(null)
  const [editForm,setEditForm] = useState({})

  const filtered = documents.filter(d =>
    !search || d.title?.toLowerCase().includes(search.toLowerCase())
  )

  const startEdit = (doc) => {
    setEditId(doc.id)
    setEditForm({ title: doc.title, status: doc.status, price_mwk: doc.price_mwk })
  }

  const saveEdit = async (id) => {
    const payload = {
      title: editForm.title?.trim(),
      status: editForm.status,
    }
    const raw = editForm.price_mwk
    if (raw !== '' && raw !== undefined && raw !== null) {
      const n = parseFloat(raw)
      if (!Number.isNaN(n)) payload.price_mwk = n
    }
    await onUpdate(id, payload)
    setEditId(null)
  }

  if (loading) return <LoadingSpinner />

  return (
    <div className="flex flex-col gap-3">
      <div className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search documents…"
          className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-gray-200 bg-white
            focus:outline-none focus:border-green-400 focus:shadow-[0_0_0_3px_rgba(13,122,85,0.1)]" />
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-50">
              {['Document', 'Subject / Level', 'Status', 'Downloads', 'Price (MWK)', 'Actions'].map(h => (
                <th key={h} className="text-left text-xs font-semibold text-gray-400 px-4 py-3 uppercase tracking-wider">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.slice(0, 50).map(doc => (
              <tr key={doc.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors">
                <td className="px-4 py-3 max-w-[220px]">
                  {editId === doc.id ? (
                    <input value={editForm.title} onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))}
                      className="w-full px-2 py-1 text-xs rounded-lg border border-gray-200 focus:outline-none focus:border-green-400" />
                  ) : (
                    <p className="text-sm font-medium text-gray-800 truncate">{doc.title}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-0.5 truncate">{doc.uploader_name}</p>
                </td>
                <td className="px-4 py-3">
                  <p className="text-xs font-medium text-gray-700">{doc.subject_name}</p>
                  <p className="text-xs text-gray-400 uppercase">{doc.level} · {doc.year}</p>
                </td>
                <td className="px-4 py-3">
                  {editId === doc.id ? (
                    <select value={editForm.status} onChange={e => setEditForm(f => ({ ...f, status: e.target.value }))}
                      className="text-xs px-2 py-1 rounded-lg border border-gray-200 focus:outline-none">
                      {['pending', 'flagged', 'approved', 'rejected', 'unpublished'].map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  ) : (
                    <StatusBadge status={doc.status} />
                  )}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">{doc.download_count || 0}</td>
                <td className="px-4 py-3">
                  {editId === doc.id ? (
                    <input type="number" value={editForm.price_mwk}
                      onChange={e => setEditForm(f => ({ ...f, price_mwk: e.target.value }))}
                      className="w-20 px-2 py-1 text-xs rounded-lg border border-gray-200 focus:outline-none" />
                  ) : (
                    <span className="text-sm text-gray-700">
                      {doc.is_free ? 'Free' : parseFloat(doc.price_mwk || 0).toLocaleString()}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    {editId === doc.id ? (
                      <>
                        <button onClick={() => saveEdit(doc.id)}
                          className="p-1.5 rounded-lg bg-green-50 text-green-600 hover:bg-green-100">
                          <Save size={13} />
                        </button>
                        <button onClick={() => setEditId(null)}
                          className="p-1.5 rounded-lg bg-gray-100 text-gray-500 hover:bg-gray-200">
                          <X size={13} />
                        </button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => startEdit(doc)}
                          className="p-1.5 rounded-lg bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors">
                          <Edit2 size={13} />
                        </button>
                        {['unpublished', 'rejected'].includes(doc.status) && (
                          <button onClick={() => onDelete(doc.id)}
                            className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors">
                            <X size={13} />
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="py-12 text-center text-gray-400 text-sm">No documents found.</div>
        )}
      </div>
    </div>
  )
}

// ── Duplicate log tab ─────────────────────────
function TabDuplicates({ logs, loading }) {
  const LAYER_COLOR = {
    hash:     'bg-red-50 text-red-700 border-red-100',
    metadata: 'bg-orange-50 text-orange-700 border-orange-100',
    content:  'bg-amber-50 text-amber-700 border-amber-100',
    image:    'bg-purple-50 text-purple-700 border-purple-100',
  }
  if (loading) return <LoadingSpinner />
  return (
    <div className="flex flex-col gap-3">
      {/* Summary strip */}
      <div className="grid grid-cols-4 gap-3">
        {['hash','metadata','content','image'].map(layer => {
          const count = logs.filter(l => l.detection_layer === layer).length
          return (
            <div key={layer} className={`rounded-xl p-3 border text-center ${LAYER_COLOR[layer]}`}>
              <p className="text-lg font-bold">{count}</p>
              <p className="text-xs font-semibold capitalize">{layer}</p>
            </div>
          )
        })}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-50">
              {['File attempted', 'Uploader', 'Matched document', 'Layer', 'Similarity', 'Date'].map(h => (
                <th key={h} className="text-left text-xs font-semibold text-gray-400 px-4 py-3 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 ? (
              <tr><td colSpan={6} className="py-12 text-center text-gray-400 text-sm">No duplicate attempts logged.</td></tr>
            ) : logs.map(log => (
              <tr key={log.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50">
                <td className="px-4 py-3 max-w-[160px]">
                  <p className="text-xs font-medium text-gray-700 truncate">{log.attempted_file_name}</p>
                </td>
                <td className="px-4 py-3">
                  <p className="text-xs text-gray-600">{log.uploader_name}</p>
                  <p className="text-[10px] text-gray-400">{log.uploader_email}</p>
                </td>
                <td className="px-4 py-3 max-w-[160px]">
                  <p className="text-xs text-gray-600 truncate">{log.matched_doc_title || '—'}</p>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border capitalize ${LAYER_COLOR[log.detection_layer] || 'bg-gray-50 text-gray-500 border-gray-100'}`}>
                    {log.detection_layer}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden w-16">
                      <div className="h-full bg-red-400 rounded-full"
                        style={{ width: `${log.similarity_score || 100}%` }} />
                    </div>
                    <span className="text-xs font-bold text-red-600">{log.similarity_score || 100}%</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-xs text-gray-400">
                  {new Date(log.blocked_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── Users tab ─────────────────────────────────
function TabUsers({ users, loading, onSuspend }) {
  const [search, setSearch] = useState('')
  const filtered = users.filter(u =>
    !search || u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  )
  if (loading) return <LoadingSpinner />
  return (
    <div className="flex flex-col gap-3">
      <div className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search users by name or email…"
          className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-gray-200 bg-white
            focus:outline-none focus:border-green-400" />
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-50">
              {['User', 'Role', 'Uploads', 'Status', 'Last login', 'Actions'].map(h => (
                <th key={h} className="text-left text-xs font-semibold text-gray-400 px-4 py-3 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={6} className="py-12 text-center text-gray-400 text-sm">No users found.</td></tr>
            ) : filtered.map(u => (
              <tr key={u.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-xs font-bold text-green-700 flex-shrink-0">
                      {u.full_name?.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{u.full_name}</p>
                      <p className="text-xs text-gray-400 truncate">{u.email || u.phone}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border capitalize
                    ${u.role === 'admin' ? 'bg-purple-50 text-purple-700 border-purple-100' : 'bg-gray-50 text-gray-600 border-gray-100'}`}>
                    {u.role}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">{u.approved_upload_count || 0}</td>
                <td className="px-4 py-3"><StatusBadge status={u.status} /></td>
                <td className="px-4 py-3 text-xs text-gray-400">
                  {u.last_login_at ? new Date(u.last_login_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : 'Never'}
                </td>
                <td className="px-4 py-3">
                  {u.role !== 'admin' && u.status === 'active' && (
                    <button onClick={() => onSuspend(u.id)}
                      className="flex items-center gap-1 px-2 py-1 text-[11px] font-semibold text-red-600
                        bg-red-50 rounded-lg hover:bg-red-100 transition-colors border border-red-100">
                      <Ban size={11} /> Suspend
                    </button>
                  )}
                  {u.status === 'suspended' && (
                    <span className="text-xs text-gray-400">Suspended</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function dayKey(d) {
  if (d == null) return ''
  if (typeof d === 'string') return d.slice(0, 10)
  try {
    return new Date(d).toISOString().slice(0, 10)
  } catch {
    return ''
  }
}

function revenueForToday(daily) {
  if (!daily?.length) return 0
  const today = new Date().toISOString().slice(0, 10)
  return daily
    .filter((row) => dayKey(row.day) === today)
    .reduce((sum, row) => sum + (Number(row.total_mwk) || 0), 0)
}

// ── Revenue tab ───────────────────────────────
function TabRevenue({ revenue, loading }) {
  if (loading) return <LoadingSpinner />
  const todayMw = revenueForToday(revenue?.daily)
  const periodMw = Number(revenue?.total_mwk) || 0
  const txCount = Number(revenue?.transactions) || 0
  return (
    <div className="flex flex-col gap-5">
      {/* Period selector */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Today (completed)', val: todayMw, isMoney: true },
          { label: `Period (${revenue?.period || 'month'})`, val: periodMw, isMoney: true },
          { label: 'Transactions', val: txCount, isMoney: false },
        ].map(({ label, val, isMoney }) => (
          <div key={label} className="bg-white rounded-2xl border border-gray-100 p-4 text-center">
            <p className="text-xl font-bold text-gray-900">
              {isMoney ? `MWK ${Math.round(val).toLocaleString()}` : val.toLocaleString()}
            </p>
            <p className="text-xs text-gray-500 mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* By type */}
      {revenue?.by_type?.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Revenue breakdown</h2>
          <div className="flex flex-col gap-3">
            {revenue.by_type.map(row => {
              const total = Number(revenue.total_mwk) || 1
              const rowM = Number(row.total_mwk) || 0
              const pct   = Math.round((rowM / total) * 100)
              return (
                <div key={row.payment_type}>
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="text-sm text-gray-700 capitalize">{row.payment_type?.replace('_', ' ')}</p>
                    <p className="text-sm font-bold text-gray-900">MWK {Math.round(rowM).toLocaleString()}</p>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-green-500 rounded-full transition-all duration-700"
                      style={{ width: `${pct}%` }} />
                  </div>
                  <p className="text-xs text-gray-400 mt-1">{Number(row.count) || 0} transactions · {pct}%</p>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Daily table */}
      {revenue?.daily?.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-50">
            <h2 className="text-sm font-semibold text-gray-900">Daily revenue</h2>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-50">
                {['Date', 'Type', 'Transactions', 'Revenue (MWK)'].map(h => (
                  <th key={h} className="text-left text-xs font-semibold text-gray-400 px-4 py-3 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {revenue.daily.slice(0, 14).map((row, i) => (
                <tr key={i} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50">
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {new Date(row.day).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs text-gray-500 capitalize">{row.payment_type?.replace('_', ' ')}</span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">{Number(row.transactions) || 0}</td>
                  <td className="px-4 py-3 text-sm font-semibold text-green-700">
                    {Math.round(Number(row.total_mwk) || 0).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {(!revenue?.daily?.length) && (
        <EmptyPanel icon={DollarSign} title="No revenue data" sub="Payments will appear here once transactions are made." />
      )}
    </div>
  )
}

// ── Settings tab ──────────────────────────────
function TabSettings({ settings, loading, onSave }) {
  const [form, setForm] = useState({})
  const [saving, setSaving] = useState({})

  useEffect(() => {
    if (settings) {
      const map = {}
      settings.forEach(s => { map[s.key] = s.value })
      setForm(map)
    }
  }, [settings])

  const handleSave = async (key) => {
    setSaving(s => ({ ...s, [key]: true }))
    await onSave(key, form[key])
    setSaving(s => ({ ...s, [key]: false }))
  }

  const DISPLAY_KEYS = [
    { key: 'upload_pass_min_threshold',  label: 'Upload pass threshold',       desc: 'Min uploads needed for free 1-day pass',    type: 'number' },
    { key: 'upload_pass_duration_hours', label: 'Upload pass duration (hours)',desc: 'How long the upload-earned pass lasts',      type: 'number' },
    { key: 'dup_auto_reject_threshold',  label: 'Auto-reject threshold (%)',   desc: 'Similarity above this % = auto reject',     type: 'number' },
    { key: 'dup_flag_threshold',         label: 'Flag threshold (%)',          desc: 'Similarity above this % = flag for review', type: 'number' },
    { key: 'price_daily_mwk',            label: 'Daily plan price (MWK)',      desc: 'Daily subscription price',                  type: 'number' },
    { key: 'price_weekly_mwk',           label: 'Weekly plan price (MWK)',     desc: 'Weekly subscription price',                 type: 'number' },
    { key: 'price_monthly_mwk',          label: 'Monthly plan price (MWK)',    desc: 'Monthly subscription price',                type: 'number' },
    { key: 'price_per_download_default', label: 'Default download price (MWK)',desc: 'Default pay-per-download price',            type: 'number' },
    { key: 'max_file_size_mb',           label: 'Max file size (MB)',          desc: 'Maximum upload file size',                  type: 'number' },
    { key: 'maintenance_mode',           label: 'Maintenance mode',            desc: 'Set to true to show maintenance page',      type: 'text' },
  ]
  const metaByKey = Object.fromEntries(DISPLAY_KEYS.map((d) => [d.key, d]))

  const sortedSettings = [...(settings || [])].sort((a, b) => {
    const ia = DISPLAY_KEYS.findIndex((d) => d.key === a.key)
    const ib = DISPLAY_KEYS.findIndex((d) => d.key === b.key)
    if (ia === -1 && ib === -1) return a.key.localeCompare(b.key)
    if (ia === -1) return 1
    if (ib === -1) return -1
    return ia - ib
  })

  if (loading) return <LoadingSpinner />

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-50">
        <h2 className="text-sm font-semibold text-gray-900">System settings</h2>
        <p className="text-xs text-gray-400 mt-0.5">Changes take effect immediately</p>
      </div>
      <div className="divide-y divide-gray-50">
        {sortedSettings.length === 0 ? (
          <div className="px-5 py-12 text-center text-sm text-gray-400">No settings loaded. Check the API and database seed.</div>
        ) : sortedSettings.map((row) => {
          const meta = metaByKey[row.key] || { label: row.key, desc: row.description || '', type: 'text' }
          return (
            <div key={row.key} className="flex flex-col sm:flex-row sm:items-center gap-4 px-5 py-4">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800">{meta.label}</p>
                <p className="text-xs text-gray-400 mt-0.5">{meta.desc}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <input
                  type={meta.type}
                  value={form[row.key] ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, [row.key]: e.target.value }))}
                  className="w-full sm:w-36 px-3 py-1.5 text-sm rounded-xl border border-gray-200 bg-gray-50
                    focus:outline-none focus:border-green-400 text-center"
                />
                <button
                  type="button"
                  onClick={() => handleSave(row.key)}
                  disabled={saving[row.key]}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white
                    bg-green-500 rounded-xl hover:bg-green-400 transition-all disabled:opacity-50"
                >
                  {saving[row.key] ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                  Save
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Upload tab ───────────────────────────────
function TabUpload({ onUploadSuccess }) {
  const [file, setFile] = useState(null)
  const [form, setForm] = useState({
    title: '',
    subject_name: '',
    level: '',
    doc_type: '',
    year: String(new Date().getFullYear()),
    description: '',
    price_mwk: '',
  })
  const [errors, setErrors] = useState({})
  const [uploading, setUploading] = useState(false)
  const [suggestions, setSuggestions] = useState([])
  const [hintsOpen, setHintsOpen] = useState(false)
  const inputRef = useRef(null)

  const set = (k, v) => { setForm(f => ({ ...f, [k]: v })); setErrors(e => ({ ...e, [k]: '' })) }

  useEffect(() => {
    const q = form.subject_name.trim()
    if (q.length < 1) {
      setSuggestions([])
      return
    }
    const t = setTimeout(() => {
      subjectsApi
        .list({ q })
        .then((r) => setSuggestions(Array.isArray(r.data) ? r.data : []))
        .catch(() => setSuggestions([]))
    }, 280)
    return () => clearTimeout(t)
  }, [form.subject_name])

  const handleFileSelect = (selectedFile) => {
    if (!selectedFile) return
    const allowed = ['application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation']
    if (!allowed.includes(selectedFile.type)) {
      toast.error('Only PDF, DOCX, and PPTX files are allowed.')
      return
    }
    if (selectedFile.size > 20 * 1024 * 1024) {
      toast.error('File too large. Maximum size is 20MB.')
      return
    }
    setFile(selectedFile)
    set('title', selectedFile.name?.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ') || '')
  }

  const validate = () => {
    const e = {}
    if (!file) e.file = 'Please select a file.'
    if (!form.title.trim()) e.title = 'Document title is required.'
    const sub = form.subject_name.trim()
    if (!sub) e.subject_name = 'Enter a subject name.'
    else if (sub.length < 2) e.subject_name = 'Subject name must be at least 2 characters.'
    if (!form.level) e.level = 'Select an education level.'
    if (!form.doc_type) e.doc_type = 'Select a document type.'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('title', form.title.trim())
      formData.append('subject_name', form.subject_name.trim())
      formData.append('level', form.level)
      formData.append('doc_type', form.doc_type)
      formData.append('year', form.year)
      if (form.description.trim()) formData.append('description', form.description.trim())
      if (form.price_mwk && !isNaN(parseFloat(form.price_mwk))) {
        formData.append('price_mwk', parseFloat(form.price_mwk))
      }

      const { data } = await documentsApi.uploadAdmin(formData)
      toast.success('Document uploaded and approved successfully!')

      // Reset form
      setFile(null)
      setForm({
        title: '',
        subject_name: '',
        level: '',
        doc_type: '',
        year: String(new Date().getFullYear()),
        description: '',
        price_mwk: '',
      })
      setErrors({})

      if (onUploadSuccess) onUploadSuccess()
    } catch (err) {
      console.error(err)
      const msg = err.response?.data?.error || err.response?.data?.message || 'Upload failed.'
      toast.error(msg)
    } finally {
      setUploading(false)
    }
  }

  const fc = (err) => `w-full px-4 py-3 text-sm rounded-xl border bg-gray-50 transition-all
    focus:outline-none focus:bg-white placeholder:text-gray-400
    ${err ? 'border-red-300' : 'border-gray-200 focus:border-green-400 focus:shadow-[0_0_0_3px_rgba(13,122,85,0.1)]'}`

  return (
    <div className="max-w-2xl">
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
            <Upload size={20} className="text-green-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Upload Document</h2>
            <p className="text-sm text-gray-500">Add documents directly to the library (auto-approved)</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* File selection */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-green-700 uppercase tracking-wider">
              File <span className="text-red-400">*</span>
            </label>
            {!file ? (
              <div
                onClick={() => inputRef.current?.click()}
                className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center cursor-pointer hover:border-green-300 transition-colors"
              >
                <input ref={inputRef} type="file" accept=".pdf,.docx,.pptx" onChange={e => handleFileSelect(e.target.files[0])} className="hidden" />
                <Upload size={24} className="text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600 mb-1">Click to select file</p>
                <p className="text-xs text-gray-400">PDF, DOCX, PPTX • Max 20MB</p>
              </div>
            ) : (
              <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-xl">
                <FileText size={20} className="text-green-600 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-green-900 truncate">{file.name}</p>
                  <p className="text-xs text-green-600">{(file.size / 1048576).toFixed(1)} MB</p>
                </div>
                <button type="button" onClick={() => setFile(null)} className="text-green-600 hover:text-red-500">
                  <X size={16} />
                </button>
              </div>
            )}
            {errors.file && <p className="text-xs text-red-500">⚠ {errors.file}</p>}
          </div>

          {/* Title */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-green-700 uppercase tracking-wider">
              Title <span className="text-red-400">*</span>
            </label>
            <input value={form.title} onChange={e => set('title', e.target.value)}
              placeholder="e.g. MSCE Biology Paper 1 2023" className={fc(errors.title)} />
            {errors.title && <p className="text-xs text-red-500">⚠ {errors.title}</p>}
          </div>

          {/* Subject */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-green-700 uppercase tracking-wider">
              Subject <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                autoComplete="off"
                value={form.subject_name}
                onChange={(e) => set('subject_name', e.target.value)}
                onFocus={() => setHintsOpen(true)}
                onBlur={() => { setTimeout(() => setHintsOpen(false), 180) }}
                placeholder="e.g. Chemistry, Mathematics"
                className={fc(errors.subject_name)}
              />
              {hintsOpen && suggestions.length > 0 && (
                <ul className="absolute z-20 left-0 right-0 mt-1 max-h-48 overflow-auto rounded-xl border border-gray-200 bg-white shadow-lg py-1">
                  {suggestions.map((s) => (
                    <li key={s.id}>
                      <button type="button" className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-green-50 flex items-center gap-2"
                        onMouseDown={(ev) => { ev.preventDefault(); set('subject_name', s.name); setHintsOpen(false) }}>
                        <span>{s.icon_emoji || '📚'}</span>
                        <span>{s.name}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            {errors.subject_name && <p className="text-xs text-red-500">⚠ {errors.subject_name}</p>}
          </div>

          {/* Level and Type */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-green-700 uppercase tracking-wider">
                Level <span className="text-red-400">*</span>
              </label>
              <select value={form.level} onChange={e => set('level', e.target.value)} className={fc(errors.level)}>
                <option value="">Select level</option>
                {LEVELS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
              </select>
              {errors.level && <p className="text-xs text-red-500">⚠ {errors.level}</p>}
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-green-700 uppercase tracking-wider">
                Type <span className="text-red-400">*</span>
              </label>
              <select value={form.doc_type} onChange={e => set('doc_type', e.target.value)} className={fc(errors.doc_type)}>
                <option value="">Select type</option>
                {DOC_TYPES.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
              </select>
              {errors.doc_type && <p className="text-xs text-red-500">⚠ {errors.doc_type}</p>}
            </div>
          </div>

          {/* Year and Price */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-green-700 uppercase tracking-wider">Year</label>
              <select value={form.year} onChange={e => set('year', e.target.value)} className={fc()}>
                {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-green-700 uppercase tracking-wider">Price (MWK)</label>
              <input type="number" value={form.price_mwk} onChange={e => set('price_mwk', e.target.value)}
                placeholder="Leave empty for default" className={fc()} />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-green-700 uppercase tracking-wider">Description</label>
            <textarea value={form.description} onChange={e => set('description', e.target.value)}
              placeholder="Optional description..." rows={3} className={fc()} />
          </div>

          {/* Submit */}
          <button type="submit" disabled={uploading}
            className="w-full py-3 px-4 bg-green-500 text-white font-semibold rounded-xl hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
            {uploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
            {uploading ? 'Uploading...' : 'Upload Document'}
          </button>
        </form>
      </div>
    </div>
  )
}

// ── Helpers ───────────────────────────────────
function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-20">
      <Loader2 size={28} className="text-green-500 animate-spin" />
    </div>
  )
}
function EmptyPanel({ icon: Icon, title, sub }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 py-16 flex flex-col items-center text-center">
      <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center mb-3">
        <Icon size={22} className="text-gray-300" />
      </div>
      <p className="text-sm font-semibold text-gray-600">{title}</p>
      {sub && <p className="text-xs text-gray-400 mt-1 max-w-xs">{sub}</p>}
    </div>
  )
}

// ── Main admin page ───────────────────────────
export default function AdminPage() {
  const { user, isAdmin } = useAuth()
  const router = useRouter()

  const [tab,       setTab]       = useState('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [loading,   setLoading]   = useState(true)

  // Data state
  const [stats,     setStats]     = useState(null)
  const [queue,     setQueue]     = useState([])
  const [documents, setDocuments] = useState([])
  const [dupLogs,   setDupLogs]   = useState([])
  const [users,     setUsers]     = useState([])
  const [revenue,   setRevenue]   = useState(null)
  const [settings,  setSettings]  = useState([])

  useEffect(() => {
    if (user === null) { router.push('/auth/login'); return }
    if (user && !isAdmin) { router.push('/browse'); return }
    loadData()
  }, [user, isAdmin])

  const loadData = async (opts = {}) => {
    const silent = opts.silent === true
    if (!silent) setLoading(true)
    try {
      const [statsRes, queueRes, docsRes, dupRes, usersRes, revRes, settingsRes] =
        await Promise.allSettled([
          adminApi.stats(),
          documentsApi.queue(),
          documentsApi.browse({ limit: 200, scope: 'all' }),
          documentsApi.duplicateLog(),
          adminApi.users(),
          paymentsApi.revenue({ period: 'month' }),
          adminApi.settings(),
        ])

      if (statsRes.status === 'fulfilled') setStats(statsRes.value.data)
      else if (!silent) toast.error('Could not load dashboard stats.')

      if (queueRes.status === 'fulfilled') {
        const q = queueRes.value.data
        setQueue(Array.isArray(q) ? q : [])
      } else if (!silent) toast.error('Could not load review queue.')

      if (docsRes.status === 'fulfilled') {
        const payload = docsRes.value.data
        const list = Array.isArray(payload?.documents) ? payload.documents : (Array.isArray(payload) ? payload : [])
        setDocuments(list)
      } else {
        console.error('Admin documents load failed:', docsRes.reason)
        if (!silent) toast.error('Could not load all documents.')
      }

      if (dupRes.status === 'fulfilled') {
        const logs = dupRes.value.data
        setDupLogs(Array.isArray(logs) ? logs : [])
      } else if (!silent) toast.error('Could not load duplicate log.')

      if (usersRes.status === 'fulfilled') {
        const u = usersRes.value.data
        setUsers(Array.isArray(u) ? u : [])
      } else if (!silent) toast.error('Could not load users.')

      if (revRes.status === 'fulfilled') setRevenue(revRes.value.data)
      else if (!silent) toast.error('Could not load revenue.')

      if (settingsRes.status === 'fulfilled') {
        const s = settingsRes.value.data
        setSettings(Array.isArray(s) ? s : [])
      } else if (!silent) toast.error('Could not load settings.')
    } catch (e) {
      console.error(e)
      if (!silent) toast.error('Failed to refresh admin data.')
    } finally {
      if (!silent) setLoading(false)
    }
  }

  const handleApprove = async (id) => {
    try {
      await documentsApi.approve(id)
      toast.success('Document approved.')
      await loadData({ silent: true })
    } catch (e) {
      console.error(e)
      toast.error(e?.response?.data?.error || 'Failed to approve.')
    }
  }

  const handleReject = async (id, reason) => {
    try {
      await documentsApi.reject(id, reason)
      toast.success('Document rejected.')
      await loadData({ silent: true })
    } catch (e) {
      console.error(e)
      toast.error(e?.response?.data?.error || 'Failed to reject.')
    }
  }

  const handleUpdate = async (id, data) => {
    try {
      const { data: res } = await documentsApi.update(id, data)
      toast.success('Document updated.')
      const doc = res?.document
      if (doc) {
        setDocuments((docs) => docs.map((d) => (d.id === id ? { ...d, ...doc } : d)))
      } else {
        await loadData({ silent: true })
      }
    } catch (e) {
      console.error(e)
      toast.error(e?.response?.data?.error || 'Failed to update.')
    }
  }

  const handleDelete = async (id) => {
    // Temporarily remove confirmation for testing
    // if (!confirm('Are you sure you want to delete this document? This action cannot be undone.')) return
    try {
      await documentsApi.delete(id)
      toast.success('Document deleted.')
      setDocuments((docs) => docs.filter((d) => d.id !== id))
    } catch (e) {
      console.error(e)
      toast.error(e?.response?.data?.error || e?.response?.data?.details || 'Failed to delete document.')
    }
  }

  const handleSuspend = async (id) => {
    if (!confirm('Are you sure you want to suspend this user?')) return
    try {
      await adminApi.suspendUser(id)
      toast.success('User suspended.')
      setUsers((u) => u.map((usr) => (usr.id === id ? { ...usr, status: 'suspended' } : usr)))
      await loadData({ silent: true })
    } catch (e) {
      console.error(e)
      toast.error(e?.response?.data?.error || 'Failed to suspend user.')
    }
  }

  const handleSaveSetting = async (key, value) => {
    try {
      await adminApi.updateSetting(key, value)
      toast.success('Setting saved.')
    } catch { toast.error('Failed to save setting.') }
  }

  if (!user || !isAdmin) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <Loader2 size={32} className="text-green-500 animate-spin" />
    </div>
  )

  const pendingCount = stats?.pending_review || queue.length

  return (
    <div className="min-h-screen bg-gray-50 flex">

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
          <Sidebar active={tab} onChange={setTab} pendingCount={pendingCount}
            mobile onClose={() => setSidebarOpen(false)} />
        </>
      )}

      {/* Desktop sidebar */}
      <Sidebar active={tab} onChange={setTab} pendingCount={pendingCount} />

      {/* Main content */}
      <div className="flex-1 min-w-0 flex flex-col">

        {/* Top bar */}
        <header className="h-16 bg-white border-b border-gray-100 flex items-center px-5 gap-4 flex-shrink-0">
          <button onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded-xl hover:bg-gray-100 text-gray-500">
            <Menu size={20} />
          </button>
          <div className="flex-1">
            <h1 className="text-sm font-semibold text-gray-900 capitalize">
              {NAV.find(n => n.key === tab)?.label || 'Admin'}
            </h1>
            <p className="text-xs text-gray-400">MalawiEduHub admin</p>
          </div>
          <button onClick={loadData}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-gray-500
              hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors">
            <RefreshCw size={13} /> Refresh
          </button>
          <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white text-xs font-bold">
            {user.full_name?.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase()}
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-5 sm:p-6">
          {tab === 'dashboard'  && <TabDashboard  stats={stats} onTabChange={setTab} />}
          {tab === 'upload'     && <TabUpload      onUploadSuccess={() => loadData({ silent: true })} />}
          {tab === 'queue'      && <TabQueue       queue={queue} onApprove={handleApprove} onReject={handleReject} loading={loading} />}
          {tab === 'documents'  && <TabDocuments   documents={documents} loading={loading} onUpdate={handleUpdate} onDelete={handleDelete} />}
          {tab === 'duplicates' && <TabDuplicates  logs={dupLogs} loading={loading} />}
          {tab === 'users'      && <TabUsers       users={users} loading={loading} onSuspend={handleSuspend} />}
          {tab === 'revenue'    && <TabRevenue     revenue={revenue} loading={loading} />}
          {tab === 'settings'   && <TabSettings    settings={settings} loading={loading} onSave={handleSaveSetting} />}
        </main>
      </div>
    </div>
  )
}
