'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'
import { authApi, documentsApi, paymentsApi } from '@/lib/api'
import api from '@/lib/api'
import { useAuth } from '@/lib/auth-context'
import toast from 'react-hot-toast'
import {
  Upload, Download, BookOpen, Star, Clock, CheckCircle2,
  AlertCircle, FileText, Loader2, ChevronRight, Calendar,
  Smartphone, CreditCard, RefreshCw, ExternalLink, User,
  TrendingUp, Award, Zap, Monitor, LogOut, Plus, Search
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
function SubscriptionCard({ subscription, uploadProgress, onGetAccess, prices, pricesLoading }) {
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
              { label: 'Daily', price: pricesLoading ? '...' : `MWK ${parseInt(prices.daily).toLocaleString()}` },
              { label: 'Weekly', price: pricesLoading ? '...' : `MWK ${parseInt(prices.weekly).toLocaleString()}` },
              { label: 'Monthly', price: pricesLoading ? '...' : `MWK ${parseInt(prices.monthly).toLocaleString()}` },
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
    <div className="flex items-center gap-2 py-2 border-b border-gray-50 last:border-0 group">
      <div className="w-8 h-8 bg-gray-50 rounded-lg border border-gray-100 flex items-center justify-center flex-shrink-0 group-hover:bg-green-50 group-hover:border-green-100 transition-colors">
        <FileText size={12} className="text-gray-400 group-hover:text-green-500 transition-colors" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-gray-800 truncate group-hover:text-green-700 transition-colors">
          {download.document_title || 'Untitled'}
        </p>
        <p className="text-[10px] text-gray-400">
          {download.subject_name} · {LEVEL[download.level] || download.level}
        </p>
      </div>
      <div className="text-right flex-shrink-0">
        <p className="text-[10px] text-gray-400">{date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</p>
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
    <div className="flex items-center gap-2 py-2 border-b border-gray-50 last:border-0 group">
      <div className="w-8 h-8 bg-gray-50 rounded-lg border border-gray-100 flex items-center justify-center flex-shrink-0">
        <Upload size={12} className="text-gray-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-gray-800 truncate">{doc.title}</p>
        <p className="text-[10px] text-gray-400">
          {doc.subject_name} · {doc.year || '—'}
        </p>
      </div>
      <div className="flex-shrink-0">
        <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded border ${s.color}`}>
          {s.label}
        </span>
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
    { key: 'requests', label: 'Requests', icon: Search },
    { key: 'payments',  label: 'Payments',  icon: CreditCard },
    { key: 'security',  label: 'Security',  icon: Monitor },
  ]
  return (
    <div className="overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
      <div className="flex flex-wrap gap-1 bg-gray-100 p-1 rounded-2xl mb-4">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => onChange(key)}
            className={`flex-1 sm:flex-none min-w-[80px] flex items-center justify-center gap-1.5 px-2 py-2 text-xs font-semibold rounded-xl transition-all
              ${active === key ? 'bg-white text-green-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            <Icon size={14} />
            <span>{label}</span>
          </button>
        ))}
      </div>
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
  const [prices,     setPrices]     = useState(() => {
    // Try to load cached prices from localStorage
    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem('mh_prices')
      console.log('Dashboard - Cached prices:', cached)
      if (cached) {
        try {
          const parsed = JSON.parse(cached)
          if (parsed.daily && parsed.weekly && parsed.monthly) {
            console.log('Dashboard - Using cached prices:', parsed)
            return parsed
          }
        } catch (e) {
          console.error('Dashboard - Failed to parse cached prices:', e)
        }
      }
    }
    console.log('Dashboard - Using default prices')
    return { daily: '300', weekly: '1000', monthly: '2500' }
  })
  const [pricesLoading, setPricesLoading] = useState(() => {
    // If we have cached prices, don't show loading state
    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem('mh_prices')
      return !cached
    }
    return true
  })

  useEffect(() => {
    if (user === null) { router.push('/auth/login'); return }
    loadAll()
    fetchPrices()
  }, [user])

  const fetchPrices = async () => {
    setPricesLoading(true)
    try {
      const { data } = await api.get('/admin/settings/public')
      console.log('Fetched prices:', data)
      if (data.price_daily_mwk) {
        const newPrices = {
          daily: data.price_daily_mwk,
          weekly: data.price_weekly_mwk,
          monthly: data.price_monthly_mwk
        }
        setPrices(newPrices)
        // Cache prices in localStorage
        localStorage.setItem('mh_prices', JSON.stringify(newPrices))
        console.log('Dashboard - Saved prices to cache:', newPrices)
      }
    } catch (err) {
      console.error('Failed to fetch prices:', err)
    } finally {
      setPricesLoading(false)
    }
  }

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
        <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-4
          shadow-[0_4px_24px_rgba(0,0,0,0.04)]">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-xl bg-green-500 flex items-center justify-center
              text-white text-lg font-bold flex-shrink-0">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h1 className="font-serif text-lg text-gray-900">{user.full_name}</h1>
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
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <StatCard icon={Upload}   label="Documents uploaded"  value={profile?.approved_upload_count || 0} sub="approved by admin" accent="green" />
              <StatCard icon={Download} label="Total downloads"     value={downloads.length || 0}              sub="all time"          accent="blue" />
              <StatCard icon={Award}    label="Upload pass progress" value={`${uploadProgress?.pct || 0}%`}    sub={`${uploadProgress?.approved_count || 0} of ${uploadProgress?.threshold || 5}`} accent="amber" />
              <StatCard icon={Star}     label="Subscription"        value={hasAccess ? 'Active' : 'None'}      sub={hasAccess ? sub?.plan : 'Subscribe to download'} accent="purple" />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              {/* Subscription card */}
              <SubscriptionCard
                subscription={sub}
                uploadProgress={uploadProgress}
                onGetAccess={() => router.push('/browse')}
                prices={prices}
                pricesLoading={pricesLoading}
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
            <div className="grid md:grid-cols-2 gap-4">

              {/* Recent uploads */}
              <div className="bg-white rounded-2xl border border-gray-100 p-4">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                    <Upload size={16} className="text-green-500" /> Uploads
                  </h2>
                  <button onClick={() => setTab('uploads')} className="text-xs text-green-600 hover:underline">View all</button>
                </div>
                {uploads.length === 0 ? (
                  <EmptyState icon={Upload} message="No uploads yet" action="Upload document" href="/upload" />
                ) : (
                  <div className="space-y-0">
                    {uploads.slice(0, 3).map(doc => <UploadRow key={doc.id} doc={doc} />)}
                  </div>
                )}
              </div>

              {/* Recent downloads */}
              <div className="bg-white rounded-2xl border border-gray-100 p-4">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                    <Download size={16} className="text-blue-500" /> Downloads
                  </h2>
                  <button onClick={() => setTab('downloads')} className="text-xs text-green-600 hover:underline">View all</button>
                </div>
                {downloads.length === 0 ? (
                  <EmptyState icon={Download} message="No downloads yet" action="Browse library" href="/browse" />
                ) : (
                  <div className="space-y-0">
                    {downloads.slice(0, 3).map(d => <DownloadRow key={d.id} download={d} />)}
                  </div>
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
                    { label: 'Daily',   price: pricesLoading ? '...' : `MWK ${parseInt(prices.daily).toLocaleString()}`,   period: '24 hours' },
                    { label: 'Weekly',  price: pricesLoading ? '...' : `MWK ${parseInt(prices.weekly).toLocaleString()}`, period: '7 days',  pop: true },
                    { label: 'Monthly', price: pricesLoading ? '...' : `MWK ${parseInt(prices.monthly).toLocaleString()}`, period: '30 days' },
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

        {/* ── REQUESTS TAB ── */}
        {tab === 'requests' && (
          <RequestsTab />
        )}

        {/* ── SECURITY TAB ── */}
        {tab === 'security' && (
          <SecurityTab />
        )}

      </div>
    </div>
  )
}

// ── Requests tab ───────────────────────────────
function RequestsTab() {
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ title: '', subject_name: '', description: '', level: '', year: '' })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => { loadRequests() }, [])

  const loadRequests = async () => {
    try {
      const { data } = await documentsApi.myRequests()
      setRequests(data || [])
    } catch {}
    finally { setLoading(false) }
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    if (!form.title.trim()) return
    setSubmitting(true)
    try {
      await documentsApi.createRequest(form)
      toast.success('Request submitted! We will notify you when available.')
      setShowForm(false)
      setForm({ title: '', subject_name: '', description: '', level: '', year: '' })
      loadRequests()
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Failed to submit request.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-sm font-semibold text-gray-900">Document requests</h2>
        <button onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-green-500 rounded-xl hover:bg-green-400">
          <Plus size={13} /> Request
        </button>
      </div>

      {showForm && (
        <form onSubmit={onSubmit} className="p-4 bg-gray-50 rounded-xl mb-4">
          <div className="grid grid-cols-2 gap-3">
            <input
              type="text" name="title" placeholder="What document do you need?" value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              className="col-span-2 px-3 py-2 rounded-lg border border-gray-200 text-sm"
            />
            <input
              type="text" name="subject_name" placeholder="Subject (e.g. Biology)" value={form.subject_name}
              onChange={e => setForm(f => ({ ...f, subject_name: e.target.value }))}
              className="px-3 py-2 rounded-lg border border-gray-200 text-sm"
            />
            <select
              name="level" value={form.level} onChange={e => setForm(f => ({ ...f, level: e.target.value }))}
              className="px-3 py-2 rounded-lg border border-gray-200 text-sm">
              <option value="">Select level</option>
              <option value="primary">Primary</option>
              <option value="jce">JCE</option>
              <option value="msce">MSCE</option>
              <option value="tvet">TVET</option>
              <option value="university">University</option>
            </select>
            <input
              type="number" name="year" placeholder="Year (optional)" value={form.year}
              onChange={e => setForm(f => ({ ...f, year: e.target.value }))}
              className="px-3 py-2 rounded-lg border border-gray-200 text-sm"
            />
            <textarea
              name="description" placeholder="Additional details (optional)" value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              className="col-span-2 px-3 py-2 rounded-lg border border-gray-200 text-sm" rows={2}
            />
          </div>
          <div className="flex gap-2 mt-3">
            <button type="button" onClick={() => setShowForm(false)}
              className="px-4 py-2 text-sm text-gray-600">Cancel</button>
            <button type="submit" disabled={submitting}
              className="px-4 py-2 text-sm bg-green-500 text-white rounded-lg disabled:opacity-50">
              {submitting ? 'Submitting...' : 'Submit request'}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <Loader2 size={20} className="mx-auto text-gray-300 animate-spin" />
      ) : requests.length === 0 ? (
        <EmptyState icon={Search} message="No requests yet" action="Request a document you need" onClick={() => setShowForm(true)} />
      ) : (
        requests.map(req => (
          <div key={req.id} className="flex items-center gap-3 py-3 border-b border-gray-50 last:border-0">
            <div className="w-9 h-9 bg-amber-50 rounded-lg border border-amber-100 flex items-center justify-center">
              <Search size={15} className="text-amber-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-800">{req.title}</p>
              <p className="text-xs text-gray-400">
                {req.subject_name} {req.level && `· ${req.level}`} {req.year && `· ${req.year}`}
              </p>
            </div>
            <div className="flex-shrink-0">
              <span className={`text-[11px] font-semibold px-2 py-1 rounded-lg border
                ${req.status === 'fulfilled' ? 'bg-green-50 text-green-700 border-green-100' :
                  req.status === 'cancelled' ? 'bg-red-50 text-red-600 border-red-100' :
                  'bg-amber-50 text-amber-700 border-amber-100'}`}>
                {req.status}
              </span>
            </div>
          </div>
        ))
      )}
    </div>
  )
}

// ── Security tab ───────────────────────────────
function SecurityTab() {
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [loggingOut, setLoggingOut] = useState(false)

  useEffect(() => { loadSessions() }, [])

  const loadSessions = async () => {
    try {
      const { data } = await authApi.sessions()
      setSessions(data || [])
    } catch {}
    finally { setLoading(false) }
  }

  const logoutAll = async () => {
    if (!confirm('Log out of all devices? You will need to log in again everywhere.')) return
    setLoggingOut(true)
    try {
      await authApi.logoutAll({})
      toast.success('Logged out of all devices.')
      setSessions([])
      // Redirect to login
      window.location.href = '/auth/login'
    } catch (err) {
      toast.error('Failed to logout.')
    } finally {
      setLoggingOut(false)
    }
  }

  const formatDate = (d) => new Date(d).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
  })

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-sm font-semibold text-gray-900">Active sessions</h2>
        <button onClick={logoutAll} disabled={loggingOut}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-xl disabled:opacity-50">
          <LogOut size={13} /> Logout all
        </button>
      </div>

      {loading ? (
        <Loader2 size={20} className="mx-auto text-gray-300 animate-spin" />
      ) : sessions.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-4">No active sessions</p>
      ) : (
        sessions.map(session => (
          <div key={session.id} className="flex items-center gap-3 py-3 border-b border-gray-50 last:border-0">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0
              ${session.device_name === 'Mobile' ? 'bg-blue-50' : 'bg-gray-100'}`}>
              {session.device_name === 'Mobile' ? (
                <Smartphone size={15} className="text-blue-500" />
              ) : (
                <Monitor size={15} className="text-gray-500" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-800">{session.device_name || 'Unknown'}</p>
              <p className="text-xs text-gray-400">{session.ip_address || 'Unknown IP'} · {formatDate(session.created_at)}</p>
            </div>
          </div>
        ))
      )}

      <div className="mt-6 pt-4 border-t border-gray-100">
        <h3 className="text-xs font-semibold text-gray-500 uppercase mb-3">Security tips</h3>
        <ul className="text-xs text-gray-400 space-y-2">
          <li>• Use a strong, unique password</li>
          <li>• Enable email verification (coming soon)</li>
          <li>• Logout from shared devices</li>
        </ul>
      </div>
    </div>
  )
}

// ── Empty state helper ───────────────────────
function EmptyState({ icon: Icon, message, action, href, large, onClick }) {
  return (
    <div className={`flex flex-col items-center justify-center text-center ${large ? 'py-12' : 'py-6'}`}>
      <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center mb-3">
        <Icon size={22} className="text-gray-300" />
      </div>
      <p className="text-sm font-medium text-gray-500 mb-1">{message}</p>
      {href && <Link href={href} className="text-xs text-green-600 hover:underline no-underline">{action} →</Link>}
      {onClick && <button onClick={onClick} className="text-xs text-green-600 hover:underline">{action}</button>}
    </div>
  )
}
