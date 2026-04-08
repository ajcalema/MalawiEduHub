'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'
import { authApi, documentsApi, paymentsApi } from '@/lib/api'
import { useAuth } from '@/lib/auth-context'
import toast from 'react-hot-toast'
import {
  Upload, Download, BookOpen, Star, Clock, CheckCircle2,
  AlertCircle, FileText, Loader2, ChevronRight, Calendar,
  Smartphone, CreditCard, RefreshCw, ExternalLink, User,
  TrendingUp, Award, Zap
} from 'lucide-react'

// ── Stat card ────────────────────────────────
function StatCard({ icon: Icon, label, value, sub, accent }) {
  const accents = {
    green:  'bg-green-50 border-green-100 text-green-600',
    amber:  'bg-amber-50 border-amber-100 text-amber-600',
    blue:   'bg-blue-50 border-blue-100 text-blue-600',
    purple: 'bg-purple-50 border-purple-100 text-purple-600',
  }
  return (
    <div className={`rounded-2xl border p-4 ${accents[accent] || accents.green}`}>
      <div className="flex items-start justify-between mb-3">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center
          ${accent === 'green'  ? 'bg-green-100'  : ''}
          ${accent === 'amber'  ? 'bg-amber-100'  : ''}
          ${accent === 'blue'   ? 'bg-blue-100'   : ''}
          ${accent === 'purple' ? 'bg-purple-100' : ''}
        `}>
          <Icon size={18} />
        </div>
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-sm font-medium text-gray-700 mt-0.5">{label}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  )
}

// ── Subscription status card ─────────────────
function SubscriptionCard({ subscription, uploadProgress, onGetAccess }) {
  const hasActive = subscription && new Date(subscription.expires_at) > new Date()
  const expiresAt = subscription ? new Date(subscription.expires_at) : null
  const daysLeft  = expiresAt
    ? Math.max(0, Math.ceil((expiresAt - new Date()) / (1000 * 60 * 60 * 24)))
    : 0

  const PLAN_LABELS = { daily: 'Daily pass', weekly: 'Weekly pass', monthly: 'Monthly plan', upload_pass: 'Upload pass' }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
          <Zap size={16} className="text-amber-500" /> Access status
        </h2>
        {!hasActive && (
          <button onClick={onGetAccess}
            className="text-xs font-semibold text-green-600 hover:underline">
            Get access →
          </button>
        )}
      </div>

      {hasActive ? (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3 p-3 bg-green-50 rounded-xl border border-green-100">
            <div className="w-9 h-9 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
              <CheckCircle2 size={18} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-green-900">
                {PLAN_LABELS[subscription.plan] || subscription.plan}
                {subscription.is_upload_pass && <span className="ml-1 text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-semibold">Free</span>}
              </p>
              <p className="text-xs text-green-600 mt-0.5">
                {daysLeft === 0 ? 'Expires today' : `${daysLeft} day${daysLeft !== 1 ? 's' : ''} remaining`}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-400">Expires</p>
              <p className="text-xs font-semibold text-gray-700">
                {expiresAt?.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
              </p>
            </div>
          </div>
          <p className="text-xs text-gray-400 flex items-center gap-1">
            <CheckCircle2 size={11} className="text-green-500" />
            Unlimited downloads until expiry
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
            <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
              <AlertCircle size={18} className="text-gray-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-600">No active subscription</p>
              <p className="text-xs text-gray-400 mt-0.5">Subscribe or upload to access documents</p>
            </div>
          </div>

          {/* Upload progress toward free pass */}
          {uploadProgress && (
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-100">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-amber-900 flex items-center gap-1">
                  <Upload size={12} /> Upload progress
                </p>
                <span className="text-xs font-bold text-amber-700">
                  {uploadProgress.approved_count} / {uploadProgress.threshold}
                </span>
              </div>
              <div className="h-2 bg-amber-100 rounded-full overflow-hidden">
                <div className="h-full bg-amber-400 rounded-full transition-all duration-700"
                  style={{ width: `${uploadProgress.pct}%` }} />
              </div>
              <p className="text-[11px] text-amber-700 mt-1.5">
                {uploadProgress.remaining > 0
                  ? `Upload ${uploadProgress.remaining} more approved doc${uploadProgress.remaining !== 1 ? 's' : ''} for a free 1-day pass`
                  : '🎉 Threshold reached! Admin reviewing your uploads.'}
              </p>
            </div>
          )}

          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'Daily', price: 'MWK 300' },
              { label: 'Weekly', price: 'MWK 1,000' },
              { label: 'Monthly', price: 'MWK 2,500' },
            ].map(p => (
              <button key={p.label} onClick={onGetAccess}
                className="py-2.5 px-2 rounded-xl border-2 border-gray-100 hover:border-green-300 hover:bg-green-50
                  text-center transition-all group">
                <p className="text-xs font-semibold text-gray-700 group-hover:text-green-700">{p.label}</p>
                <p className="text-[11px] text-gray-400 mt-0.5 group-hover:text-green-600">{p.price}</p>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Download history row ──────────────────────
function DownloadRow({ download }) {
  const date = new Date(download.downloaded_at)
  const LEVEL = { primary:'Primary', jce:'JCE', msce:'MSCE', university:'Uni' }
  return (
    <div className="flex items-center gap-3 py-3 border-b border-gray-50 last:border-0 group">
      <div className="w-9 h-10 bg-gray-50 rounded-lg border border-gray-100 flex items-center justify-center flex-shrink-0 group-hover:bg-green-50 group-hover:border-green-100 transition-colors">
        <FileText size={15} className="text-gray-400 group-hover:text-green-500 transition-colors" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-800 truncate group-hover:text-green-700 transition-colors">
          {download.document_title || 'Untitled document'}
        </p>
        <p className="text-xs text-gray-400 mt-0.5">
          {download.subject_name} · {LEVEL[download.level] || download.level}
          {download.year ? ` · ${download.year}` : ''}
        </p>
      </div>
      <div className="text-right flex-shrink-0">
        <p className="text-xs text-gray-400">{date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</p>
        <p className="text-[11px] text-gray-300 mt-0.5">{date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</p>
      </div>
    </div>
  )
}

// ── Upload history row ────────────────────────
function UploadRow({ doc }) {
  const STATUS = {
    pending:     { label: 'Pending review', color: 'bg-amber-50 text-amber-700 border-amber-100' },
    approved:    { label: 'Published',      color: 'bg-green-50 text-green-700 border-green-100' },
    rejected:    { label: 'Rejected',       color: 'bg-red-50 text-red-600 border-red-100' },
    flagged:     { label: 'Flagged',        color: 'bg-orange-50 text-orange-700 border-orange-100' },
    unpublished: { label: 'Unpublished',    color: 'bg-gray-50 text-gray-500 border-gray-100' },
  }
  const s = STATUS[doc.status] || STATUS.pending
  const date = new Date(doc.created_at)

  return (
    <div className="flex items-center gap-3 py-3 border-b border-gray-50 last:border-0 group">
      <div className="w-9 h-10 bg-gray-50 rounded-lg border border-gray-100 flex items-center justify-center flex-shrink-0">
        <Upload size={15} className="text-gray-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-800 truncate">{doc.title}</p>
        <p className="text-xs text-gray-400 mt-0.5">
          {doc.subject_name} · {doc.year || '—'}
          {doc.download_count > 0 && <span className="ml-1">· {doc.download_count} downloads</span>}
        </p>
      </div>
      <div className="flex-shrink-0 flex items-center gap-2">
        <span className={`text-[11px] font-semibold px-2 py-1 rounded-lg border ${s.color}`}>
          {s.label}
        </span>
        {doc.status === 'rejected' && doc.rejection_reason && (
          <span title={doc.rejection_reason}>
            <AlertCircle size={13} className="text-red-400" />
          </span>
        )}
      </div>
    </div>
  )
}

// ── Payment history row ───────────────────────
function PaymentRow({ payment }) {
  const date = new Date(payment.initiated_at)
  const STATUS_COLOR = {
    completed: 'text-green-600',
    pending:   'text-amber-600',
    failed:    'text-red-500',
  }
  const METHOD_LABEL = { airtel_money: 'Airtel Money', tnm_mpamba: 'TNM Mpamba', manual: 'Manual' }
  const TYPE_LABEL   = { subscription: 'Subscription', per_download: 'Per download' }

  return (
    <div className="flex items-center gap-3 py-3 border-b border-gray-50 last:border-0">
      <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0
        ${payment.status === 'completed' ? 'bg-green-50' : payment.status === 'failed' ? 'bg-red-50' : 'bg-amber-50'}`}>
        <CreditCard size={15} className={STATUS_COLOR[payment.status] || 'text-gray-400'} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-800">
          {TYPE_LABEL[payment.payment_type]} · {METHOD_LABEL[payment.payment_method] || payment.payment_method}
        </p>
        <p className="text-xs text-gray-400 mt-0.5">
          {date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
        </p>
      </div>
      <div className="text-right flex-shrink-0">
        <p className={`text-sm font-bold ${STATUS_COLOR[payment.status]}`}>
          MWK {parseFloat(payment.amount_mwk).toLocaleString()}
        </p>
        <p className={`text-[11px] capitalize mt-0.5 ${STATUS_COLOR[payment.status]}`}>
          {payment.status}
        </p>
      </div>
    </div>
  )
}

// ── Tab nav ──────────────────────────────────
function Tabs({ active, onChange }) {
  const tabs = [
    { key: 'overview',  label: 'Overview',  icon: TrendingUp },
    { key: 'downloads', label: 'Downloads', icon: Download },
    { key: 'uploads',   label: 'My uploads',icon: Upload },
    { key: 'payments',  label: 'Payments',  icon: CreditCard },
  ]
  return (
    <div className="flex gap-1 bg-gray-100 p-1 rounded-2xl mb-6">
      {tabs.map(({ key, label, icon: Icon }) => (
        <button key={key} onClick={() => onChange(key)}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs sm:text-sm font-semibold rounded-xl transition-all
            ${active === key ? 'bg-white text-green-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
          <Icon size={14} className="hidden sm:block" />
          {label}
        </button>
      ))}
    </div>
  )
}

// ── Main page ────────────────────────────────
export default function DashboardPage() {
  const { user, refreshProfile } = useAuth()
  const router = useRouter()

  const [profile,    setProfile]    = useState(null)
  const [downloads,  setDownloads]  = useState([])
  const [uploads,    setUploads]    = useState([])
  const [payments,   setPayments]   = useState([])
  const [loading,    setLoading]    = useState(true)
  const [tab,        setTab]        = useState('overview')
  const [showModal,  setShowModal]  = useState(false)

  useEffect(() => {
    if (user === null) { router.push('/auth/login'); return }
    loadAll()
  }, [user])

  const loadAll = async () => {
    setLoading(true)
    try {
      const [profileRes, downloadsRes, uploadsRes, paymentsRes] = await Promise.allSettled([
        authApi.profile(),
        fetchDownloads(),
        fetchUploads(),
        fetchPayments(),
      ])
      if (profileRes.status === 'fulfilled') setProfile(profileRes.value.data)
      if (downloadsRes.status === 'fulfilled') setDownloads(downloadsRes.value)
      if (uploadsRes.status === 'fulfilled')   setUploads(uploadsRes.value)
      if (paymentsRes.status === 'fulfilled')  setPayments(paymentsRes.value)
    } catch {}
    finally { setLoading(false) }
  }

  // Fetch user's recent downloads from documents API
  const fetchDownloads = async () => {
    try {
      const { data } = await documentsApi.downloads()
      return data || []
    } catch { return [] }
  }

  const fetchUploads = async () => {
    try {
      const { data } = await documentsApi.browse({ uploader: 'me', limit: 20 })
      return data.documents || []
    } catch { return [] }
  }

  const fetchPayments = async () => {
    // In production: GET /api/payments/history
    return []
  }

  if (!user || loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <Navbar />
      <Loader2 size={32} className="text-green-500 animate-spin" />
    </div>
  )

  const sub      = profile?.active_subscription
  const hasAccess = sub && new Date(sub.expires_at) > new Date()
  const uploadProgress = profile ? {
    approved_count: profile.approved_upload_count || 0,
    threshold:      profile.upload_pass_threshold || 5,
    remaining:      Math.max(0, (profile.upload_pass_threshold || 5) - (profile.approved_upload_count || 0)),
    pct:            profile.upload_progress_pct || 0,
  } : null

  const initials = user.full_name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0,2) || '?'

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-24 pb-12">

        {/* Profile header */}
        <div className="bg-white rounded-3xl border border-gray-100 p-6 mb-6
          shadow-[0_4px_24px_rgba(0,0,0,0.04)]">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl bg-green-500 flex items-center justify-center
              text-white text-xl font-bold flex-shrink-0">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h1 className="font-serif text-2xl text-gray-900">{user.full_name}</h1>
                  <p className="text-sm text-gray-400 mt-0.5 flex items-center gap-2">
                    <span className="capitalize">{user.role}</span>
                    {profile?.school && <><span>·</span><span>{profile.school}</span></>}
                  </p>
                </div>
                <Link href="/browse"
                  className="hidden sm:flex items-center gap-1.5 px-4 py-2 text-sm font-semibold
                    text-white bg-green-500 rounded-xl hover:bg-green-400 transition-all
                    hover:-translate-y-0.5 no-underline">
                  <BookOpen size={15} /> Browse library
                </Link>
              </div>

              {/* Quick stats row */}
              <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-gray-50">
                {[
                  { label: 'Uploads',   value: uploads.length || profile?.approved_upload_count || 0 },
                  { label: 'Downloads', value: downloads.length || 0 },
                  { label: 'Member since', value: new Date(user.created_at || Date.now()).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }) },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <p className="text-xs text-gray-400">{label}</p>
                    <p className="text-sm font-bold text-gray-800 mt-0.5">{value}</p>
                  </div>
                ))}
                {hasAccess && (
                  <div className="ml-auto">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl
                      bg-green-50 border border-green-100 text-xs font-semibold text-green-700">
                      <Zap size={12} /> Active subscription
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs active={tab} onChange={setTab} />

        {/* ── OVERVIEW TAB ── */}
        {tab === 'overview' && (
          <div className="flex flex-col gap-5">

            {/* Stats grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <StatCard icon={Upload}   label="Documents uploaded"  value={profile?.approved_upload_count || 0} sub="approved by admin" accent="green" />
              <StatCard icon={Download} label="Total downloads"     value={downloads.length || 0}              sub="all time"          accent="blue" />
              <StatCard icon={Award}    label="Upload pass progress" value={`${uploadProgress?.pct || 0}%`}    sub={`${uploadProgress?.approved_count || 0} of ${uploadProgress?.threshold || 5}`} accent="amber" />
              <StatCard icon={Star}     label="Subscription"        value={hasAccess ? 'Active' : 'None'}      sub={hasAccess ? sub?.plan : 'Subscribe to download'} accent="purple" />
            </div>

            <div className="grid lg:grid-cols-2 gap-5">
              {/* Subscription card */}
              <SubscriptionCard
                subscription={sub}
                uploadProgress={uploadProgress}
                onGetAccess={() => router.push('/browse')}
              />

              {/* Quick actions */}
              <div className="bg-white rounded-2xl border border-gray-100 p-5">
                <h2 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <RefreshCw size={16} className="text-blue-500" /> Quick actions
                </h2>
                <div className="flex flex-col gap-2">
                  {[
                    { href: '/upload',     icon: Upload,       label: 'Upload a document',     sub: 'Contribute & earn free access',  accent: 'green' },
                    { href: '/browse',     icon: BookOpen,     label: 'Browse library',         sub: 'Search past papers and notes',   accent: 'blue' },
                    { href: '/browse',     icon: Download,     label: 'Download documents',     sub: 'Access your subscribed content', accent: 'purple' },
                  ].map(({ href, icon: Icon, label, sub, accent }) => (
                    <Link key={label} href={href}
                      className={`flex items-center gap-3 p-3 rounded-xl border transition-all no-underline group
                        hover:border-${accent}-200 hover:bg-${accent}-50`}
                      style={{ borderColor: '#f0f0f0' }}>
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0
                        bg-${accent}-50 text-${accent}-600 group-hover:bg-${accent}-100 transition-colors`}
                        style={{
                          background: accent === 'green' ? '#e6f7f1' : accent === 'blue' ? '#eff6ff' : '#f5f3ff',
                          color: accent === 'green' ? '#0d7a55' : accent === 'blue' ? '#1d4ed8' : '#7c3aed',
                        }}>
                        <Icon size={16} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800">{label}</p>
                        <p className="text-xs text-gray-400">{sub}</p>
                      </div>
                      <ChevronRight size={16} className="text-gray-300 group-hover:text-gray-400 transition-colors" />
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            {/* Recent activity */}
            <div className="grid lg:grid-cols-2 gap-5">

              {/* Recent uploads */}
              <div className="bg-white rounded-2xl border border-gray-100 p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                    <Upload size={16} className="text-green-500" /> Recent uploads
                  </h2>
                  <button onClick={() => setTab('uploads')} className="text-xs text-green-600 hover:underline">View all</button>
                </div>
                {uploads.length === 0 ? (
                  <EmptyState icon={Upload} message="No uploads yet" action="Upload your first document" href="/upload" />
                ) : (
                  uploads.slice(0, 4).map(doc => <UploadRow key={doc.id} doc={doc} />)
                )}
              </div>

              {/* Recent downloads */}
              <div className="bg-white rounded-2xl border border-gray-100 p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                    <Download size={16} className="text-blue-500" /> Recent downloads
                  </h2>
                  <button onClick={() => setTab('downloads')} className="text-xs text-green-600 hover:underline">View all</button>
                </div>
                {downloads.length === 0 ? (
                  <EmptyState icon={Download} message="No downloads yet" action="Browse the library" href="/browse" />
                ) : (
                  downloads.slice(0, 4).map(d => <DownloadRow key={d.id} download={d} />)
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── DOWNLOADS TAB ── */}
        {tab === 'downloads' && (
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-sm font-semibold text-gray-900">Download history</h2>
              <Link href="/browse"
                className="text-xs font-semibold text-green-600 hover:underline no-underline flex items-center gap-1">
                Browse more <ExternalLink size={11} />
              </Link>
            </div>
            {downloads.length === 0 ? (
              <EmptyState icon={Download} message="No downloads yet" action="Browse the library to download documents" href="/browse" large />
            ) : (
              downloads.map(d => <DownloadRow key={d.id} download={d} />)
            )}
          </div>
        )}

        {/* ── UPLOADS TAB ── */}
        {tab === 'uploads' && (
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-sm font-semibold text-gray-900">My uploads</h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  {profile?.approved_upload_count || 0} approved · {uploads.filter(u => u.status === 'pending').length} pending review
                </p>
              </div>
              <Link href="/upload"
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white
                  bg-green-500 rounded-xl hover:bg-green-400 transition-all no-underline">
                <Upload size={13} /> Upload new
              </Link>
            </div>

            {/* Upload pass progress */}
            {uploadProgress && !hasAccess && (
              <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl mb-5">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold text-amber-900">Progress toward free 1-day pass</p>
                  <span className="text-xs font-bold text-amber-700">{uploadProgress.approved_count}/{uploadProgress.threshold}</span>
                </div>
                <div className="h-2.5 bg-amber-100 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-400 rounded-full transition-all duration-700" style={{ width: `${uploadProgress.pct}%` }} />
                </div>
                <p className="text-xs text-amber-700 mt-2">
                  {uploadProgress.remaining > 0
                    ? `${uploadProgress.remaining} more approved upload${uploadProgress.remaining !== 1 ? 's' : ''} needed`
                    : '🎉 Pass earned! Admin is reviewing your uploads.'}
                </p>
              </div>
            )}

            {uploads.length === 0 ? (
              <EmptyState icon={Upload} message="No uploads yet" action="Upload your first document and start earning access" href="/upload" large />
            ) : (
              uploads.map(doc => <UploadRow key={doc.id} doc={doc} />)
            )}
          </div>
        )}

        {/* ── PAYMENTS TAB ── */}
        {tab === 'payments' && (
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-sm font-semibold text-gray-900">Payment history</h2>
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <Smartphone size={13} />
                Airtel Money · TNM Mpamba
              </div>
            </div>

            {/* Current plan banner */}
            {hasAccess && (
              <div className="p-4 bg-green-50 border border-green-100 rounded-xl mb-5 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-green-900">
                    {sub?.plan?.charAt(0).toUpperCase() + sub?.plan?.slice(1)} plan · Active
                  </p>
                  <p className="text-xs text-green-600 mt-0.5">
                    Expires {new Date(sub.expires_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                </div>
                <CheckCircle2 size={20} className="text-green-500" />
              </div>
            )}

            {payments.length === 0 ? (
              <EmptyState icon={CreditCard} message="No payments yet" action="Subscribe to get unlimited access to documents" href="/browse" large />
            ) : (
              payments.map(p => <PaymentRow key={p.id} payment={p} />)
            )}

            {!hasAccess && (
              <div className="mt-6 pt-5 border-t border-gray-50">
                <p className="text-xs text-gray-500 mb-3 font-medium">Subscribe to access all documents</p>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: 'Daily',   price: 'MWK 300',   period: '24 hours' },
                    { label: 'Weekly',  price: 'MWK 1,000', period: '7 days',  pop: true },
                    { label: 'Monthly', price: 'MWK 2,500', period: '30 days' },
                  ].map(p => (
                    <button key={p.label} onClick={() => router.push('/browse')}
                      className={`py-3 px-2 rounded-xl border-2 text-center transition-all hover:-translate-y-0.5
                        ${p.pop ? 'border-green-500 bg-green-50' : 'border-gray-100 hover:border-green-300'}`}>
                      <p className={`text-xs font-semibold ${p.pop ? 'text-green-800' : 'text-gray-700'}`}>{p.label}</p>
                      <p className={`text-sm font-bold mt-0.5 ${p.pop ? 'text-green-700' : 'text-gray-800'}`}>{p.price}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">{p.period}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  )
}

// ── Empty state helper ───────────────────────
function EmptyState({ icon: Icon, message, action, href, large }) {
  return (
    <div className={`flex flex-col items-center justify-center text-center ${large ? 'py-12' : 'py-6'}`}>
      <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center mb-3">
        <Icon size={22} className="text-gray-300" />
      </div>
      <p className="text-sm font-medium text-gray-500 mb-1">{message}</p>
      <Link href={href} className="text-xs text-green-600 hover:underline no-underline">{action} →</Link>
    </div>
  )
}
