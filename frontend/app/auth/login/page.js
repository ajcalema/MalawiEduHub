'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import AuthLayout from '@/components/auth/AuthLayout'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import toast from 'react-hot-toast'
import { Mail, Phone, Lock, Eye, EyeOff } from 'lucide-react'

// ── Left panel branding content ──────────────
const BrandSide = () => (
  <div className="animate-fade-up">
    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-6"
      style={{ background: 'rgba(26,171,120,0.12)', border: '1px solid rgba(26,171,120,0.25)' }}>
      <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
      <span className="text-xs font-semibold text-green-400 tracking-widest uppercase">Welcome back</span>
    </div>
    <h2 className="font-serif text-4xl text-white leading-tight mb-4">
      Your library<br /><em className="text-green-400">awaits you.</em>
    </h2>
    <p className="text-white/50 text-sm leading-relaxed mb-8">
      Thousands of past papers, notes and textbooks — all for Malawian students and teachers.
    </p>

    {/* Social proof stats */}
    <div className="grid grid-cols-3 gap-4">
      {[
        { val: '4,800+', label: 'Documents' },
        { val: '1,300+', label: 'Members' },
        { val: 'Free',   label: 'Upload access' },
      ].map(({ val, label }) => (
        <div key={label} className="rounded-2xl p-4"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="font-serif text-2xl text-white">{val}</div>
          <div className="text-xs text-white/40 mt-1">{label}</div>
        </div>
      ))}
    </div>
  </div>
)

export default function LoginPage() {
  const { login }  = useAuth()
  const router     = useRouter()
  const [form, setForm] = useState({ identifier: '', password: '' })
  const [showPw, setShowPw]   = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors,  setErrors]  = useState({})

  const onChange = (e) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
    setErrors(err => ({ ...err, [e.target.name]: '' }))
  }

  const validate = () => {
    const e = {}
    if (!form.identifier.trim()) e.identifier = 'Email or phone number required.'
    if (!form.password)          e.password   = 'Password required.'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    try {
      const user = await login(form.identifier.trim(), form.password)
      toast.success(`Welcome back, ${user.full_name.split(' ')[0]}!`)
      router.push(user.role === 'admin' ? '/admin' : '/browse')
    } catch (err) {
      const msg = err?.response?.data?.error || 'Login failed. Please try again.'
      if (msg.includes('credentials')) {
        setErrors({ password: 'Incorrect email/phone or password.' })
      } else if (msg.includes('suspended')) {
        toast.error('Your account has been suspended. Contact support.')
      } else {
        toast.error(msg)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout side={<BrandSide />}>
      <div className="animate-fade-up">

        {/* Header */}
        <div className="mb-8">
          <h1 className="font-serif text-3xl text-gray-900 mb-2">Sign in</h1>
          <p className="text-sm text-gray-500">
            Don&apos;t have an account?{' '}
            <Link href="/auth/register" className="text-green-600 font-semibold hover:underline">
              Create one free
            </Link>
          </p>
        </div>

        {/* Form */}
        <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>

          <Input
            label="Email or phone number"
            id="identifier"
            name="identifier"
            type="text"
            value={form.identifier}
            onChange={onChange}
            placeholder="you@example.com or +265..."
            error={errors.identifier}
            icon={Mail}
            required
          />

          <div className="flex flex-col gap-1.5">
            <label htmlFor="password" className="text-xs font-semibold text-green-600 uppercase tracking-wider">
              Password <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-green-400 pointer-events-none">
                <Lock size={16} />
              </div>
              <input
                id="password"
                name="password"
                type={showPw ? 'text' : 'password'}
                value={form.password}
                onChange={onChange}
                placeholder="Your password"
                className={`
                  w-full rounded-xl border bg-white px-4 py-3 pl-10 pr-10 text-sm
                  transition-all duration-200 placeholder:text-gray-400
                  ${errors.password
                    ? 'border-red-300 focus:border-red-400'
                    : 'border-gray-200 focus:border-green-500 focus:shadow-[0_0_0_3px_rgba(13,122,85,0.12)]'}
                `}
                required
              />
              <button
                type="button"
                onClick={() => setShowPw(s => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.password && (
              <p className="text-xs text-red-500">⚠ {errors.password}</p>
            )}
          </div>

          {/* Forgot password */}
          <div className="flex justify-end -mt-1">
            <Link href="/auth/forgot-password" className="text-xs text-green-600 hover:underline">
              Forgot password?
            </Link>
          </div>

          <Button type="submit" loading={loading} size="lg" className="w-full mt-2">
            {loading ? 'Signing in…' : 'Sign in'}
          </Button>

        </form>

        {/* Divider */}
        <div className="flex items-center gap-3 my-6">
          <div className="flex-1 h-px bg-gray-100" />
          <span className="text-xs text-gray-400">or continue with</span>
          <div className="flex-1 h-px bg-gray-100" />
        </div>

        {/* Upload pass prompt */}
        <div className="rounded-2xl p-4 flex items-start gap-3"
          style={{ background: '#fdf4dc', border: '1px solid #e8c96a' }}>
          <div className="w-8 h-8 rounded-xl flex-shrink-0 flex items-center justify-center"
            style={{ background: '#d4a017' }}>
            <svg viewBox="0 0 14 14" fill="none" width="14" height="14">
              <path d="M7 1v8M4 6l3 3 3-3M2 12h10" stroke="#0e1a14" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div>
            <p className="text-xs font-semibold text-yellow-900">Upload to access for free</p>
            <p className="text-xs text-yellow-800/70 mt-0.5 leading-relaxed">
              Upload 5–10 documents and earn a free 1-day access pass — no payment needed.
            </p>
          </div>
        </div>

      </div>
    </AuthLayout>
  )
}
