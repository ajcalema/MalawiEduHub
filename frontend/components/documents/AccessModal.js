'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { paymentsApi } from '@/lib/api'
import Button from '@/components/ui/Button'
import toast from 'react-hot-toast'
import { X, Upload, CreditCard, Smartphone, CheckCircle2, Loader2 } from 'lucide-react'

const PLANS = [
  { key: 'daily',   label: 'Daily pass',    price: 'MWK 300',  period: '24 hours',  popular: false },
  { key: 'monthly', label: 'Monthly plan',  price: 'MWK 2,500',period: '30 days',   popular: true  },
  { key: 'weekly',  label: 'Weekly pass',   price: 'MWK 1,000',period: '7 days',    popular: false },
]

export default function AccessModal({ doc, onClose, onSuccess }) {
  const { user } = useAuth()
  const router   = useRouter()
  const [tab,       setTab]       = useState('subscribe') // 'subscribe' | 'buy'
  const [plan,      setPlan]      = useState('monthly')
  const [method,    setMethod]    = useState('airtel_money')
  const [phone,     setPhone]     = useState(user?.phone || '')
  const [loading,   setLoading]   = useState(false)
  const [polling,   setPolling]   = useState(false)
  const [paymentId, setPaymentId] = useState(null)

  if (!user) {
    return (
      <Overlay onClose={onClose}>
        <div className="text-center py-4">
          <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 size={28} className="text-green-500" />
          </div>
          <h3 className="font-serif text-xl text-gray-900 mb-2">Sign in to download</h3>
          <p className="text-sm text-gray-500 mb-6">Create a free account or sign in to access this document.</p>
          <div className="flex gap-3">
            <Button variant="ghost" className="flex-1" onClick={onClose}>Cancel</Button>
            <Button className="flex-1" onClick={() => router.push('/auth/register')}>Create account</Button>
          </div>
        </div>
      </Overlay>
    )
  }

  const pollPayment = async (pid) => {
    setPolling(true)
    let attempts = 0
    const interval = setInterval(async () => {
      attempts++
      try {
        const { data } = await paymentsApi.checkStatus(pid)
        if (data.status === 'completed') {
          clearInterval(interval)
          setPolling(false)
          toast.success('Payment confirmed! Downloading…')
          onSuccess?.()
          onClose()
        } else if (data.status === 'failed' || attempts > 30) {
          clearInterval(interval)
          setPolling(false)
          if (attempts > 30) toast.error('Payment timed out. Please try again.')
          else toast.error('Payment failed.')
        }
      } catch { clearInterval(interval); setPolling(false) }
    }, 3000)
  }

  const handlePay = async () => {
    if (!phone.trim()) { toast.error('Enter your mobile number.'); return }
    setLoading(true)
    try {
      const payload = { mobile_number: phone.trim(), payment_method: method }
      let data
      if (tab === 'subscribe') {
        data = (await paymentsApi.subscribe({ ...payload, plan })).data
      } else {
        data = (await paymentsApi.perDownload({ ...payload, document_id: doc.id })).data
      }
      setPaymentId(data.payment_id)
      setLoading(false)
      toast.success('Payment prompt sent to your phone!')
      pollPayment(data.payment_id)
    } catch (err) {
      setLoading(false)
      toast.error(err?.response?.data?.error || 'Payment initiation failed.')
    }
  }

  if (polling) {
    return (
      <Overlay onClose={onClose}>
        <div className="text-center py-6">
          <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Smartphone size={28} className="text-green-500" />
          </div>
          <h3 className="font-serif text-xl text-gray-900 mb-2">Check your phone</h3>
          <p className="text-sm text-gray-500 mb-2">A payment prompt has been sent to</p>
          <p className="font-semibold text-gray-900 mb-6">{phone}</p>
          <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
            <Loader2 size={16} className="animate-spin" />
            Waiting for confirmation…
          </div>
          <button onClick={onClose} className="mt-6 text-xs text-gray-400 hover:text-gray-600 hover:underline">
            Cancel
          </button>
        </div>
      </Overlay>
    )
  }

  return (
    <Overlay onClose={onClose}>
      {/* Doc info header */}
      <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl mb-5">
        <div className="w-10 h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
          <svg viewBox="0 0 16 20" fill="none" width="16" height="20">
            <path d="M2 2h8l4 4v12a2 2 0 01-2 2H2a2 2 0 01-2-2V4a2 2 0 012-2z" stroke="#0d7a55" strokeWidth="1.3"/>
            <path d="M10 2v4h4" stroke="#0d7a55" strokeWidth="1.3"/>
          </svg>
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-900 line-clamp-1">{doc?.title}</p>
          <p className="text-xs text-gray-400 mt-0.5">
            {doc?.subject_name} · {doc?.level?.toUpperCase()} · {doc?.year}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex rounded-xl bg-gray-100 p-1 mb-5">
        {[
          { key: 'subscribe', label: 'Subscribe', icon: CreditCard },
          { key: 'buy',       label: 'Buy this doc', icon: Upload },
        ].map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setTab(key)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-semibold rounded-lg transition-all ${
              tab === key ? 'bg-white text-green-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}>
            <Icon size={14} /> {label}
          </button>
        ))}
      </div>

      {tab === 'subscribe' ? (
        <div className="flex flex-col gap-3 mb-5">
          {PLANS.map(p => (
            <button key={p.key} onClick={() => setPlan(p.key)}
              className={`relative flex items-center justify-between p-4 rounded-xl border-2 transition-all text-left ${
                plan === p.key ? 'border-green-500 bg-green-50' : 'border-gray-100 hover:border-gray-200'
              }`}>
              {p.popular && (
                <span className="absolute -top-2.5 left-4 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-400 text-amber-900">
                  MOST POPULAR
                </span>
              )}
              <div>
                <p className={`text-sm font-semibold ${plan === p.key ? 'text-green-800' : 'text-gray-800'}`}>{p.label}</p>
                <p className={`text-xs mt-0.5 ${plan === p.key ? 'text-green-600' : 'text-gray-400'}`}>Unlimited downloads · {p.period}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`font-bold text-sm ${plan === p.key ? 'text-green-700' : 'text-gray-700'}`}>{p.price}</span>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                  plan === p.key ? 'border-green-500 bg-green-500' : 'border-gray-300'
                }`}>
                  {plan === p.key && <div className="w-2 h-2 bg-white rounded-full" />}
                </div>
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div className="mb-5 p-4 rounded-xl border-2 border-green-500 bg-green-50">
          <p className="text-sm font-semibold text-green-800">Pay per download</p>
          <p className="text-xs text-green-600 mt-0.5">One-time purchase for this document only</p>
          <p className="text-xl font-bold text-green-700 mt-2">MWK {parseFloat(doc?.price_mwk || 200).toLocaleString()}</p>
        </div>
      )}

      {/* Free upload option */}
      <div className="flex items-start gap-3 p-3 bg-amber-50 rounded-xl border border-amber-100 mb-5">
        <Upload size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-amber-800 leading-relaxed">
          <span className="font-semibold">Upload 5 documents for free access.</span>{' '}
          Share your notes or past papers and earn a 1-day pass — no payment needed.{' '}
          <a href="/upload" className="underline font-semibold">Upload now →</a>
        </p>
      </div>

      {/* Payment method + phone */}
      <div className="flex flex-col gap-3 mb-5">
        <div className="flex gap-2">
          {[
            { key: 'airtel_money', label: 'Airtel Money' },
            { key: 'tnm_mpamba',   label: 'TNM Mpamba' },
          ].map(m => (
            <button key={m.key} onClick={() => setMethod(m.key)}
              className={`flex-1 py-2.5 text-xs font-semibold rounded-xl border-2 transition-all ${
                method === m.key ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-100 text-gray-500 hover:border-gray-200'
              }`}>
              {m.label}
            </button>
          ))}
        </div>
        <div className="relative">
          <Smartphone size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={phone} onChange={e => setPhone(e.target.value)}
            placeholder="+265 999 123 456"
            className="w-full pl-9 py-3 text-sm rounded-xl border border-gray-200 focus:outline-none focus:border-green-400 bg-gray-50"
          />
        </div>
      </div>

      <Button loading={loading} className="w-full" size="lg" onClick={handlePay}>
        {loading ? 'Initiating payment…' : `Pay & download`}
      </Button>
    </Overlay>
  )
}

function Overlay({ children, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.45)' }}>
      <div className="relative bg-white rounded-3xl w-full max-w-md max-h-[90vh] overflow-y-auto p-6 animate-fade-up">
        <button onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
          <X size={18} />
        </button>
        {children}
      </div>
    </div>
  )
}
