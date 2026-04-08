'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import AuthLayout from '@/components/auth/AuthLayout'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import toast from 'react-hot-toast'
import { User, Mail, Phone, Lock, Eye, EyeOff, School, CheckCircle2 } from 'lucide-react'

// ── Left panel branding ───────────────────────
const BrandSide = () => {
  const perks = [
    'Download past papers & notes',
    'Upload documents to earn free access',
    'Pay with Airtel Money or TNM Mpamba',
    'MSCE, JCE, Primary & University content',
  ]
  return (
    <div className="animate-fade-up">
      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-6"
        style={{ background: 'rgba(26,171,120,0.12)', border: '1px solid rgba(26,171,120,0.25)' }}>
        <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
        <span className="text-xs font-semibold text-green-400 tracking-widest uppercase">Join free</span>
      </div>
      <h2 className="font-serif text-4xl text-white leading-tight mb-4">
        Malawi&apos;s<br /><em className="text-green-400">knowledge hub</em>
      </h2>
      <p className="text-white/50 text-sm leading-relaxed mb-8">
        Create your free account and access thousands of educational materials.
      </p>
      <div className="flex flex-col gap-3">
        {perks.map((perk) => (
          <div key={perk} className="flex items-center gap-3">
            <CheckCircle2 size={16} className="text-green-400 flex-shrink-0" />
            <span className="text-sm text-white/70">{perk}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Password strength indicator ───────────────
const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong']
const strengthColor = ['', 'bg-red-400', 'bg-orange-400', 'bg-yellow-400', 'bg-green-500']

function passwordStrength(pw) {
  if (!pw) return 0
  let score = 0
  if (pw.length >= 8)       score++
  if (/[A-Z]/.test(pw))     score++
  if (/[0-9]/.test(pw))     score++
  if (/[^A-Za-z0-9]/.test(pw)) score++
  return score
}

export default function RegisterPage() {
  const { register } = useAuth()
  const router       = useRouter()

  const [form, setForm] = useState({
    full_name: '', email: '', phone: '',
    password: '', confirmPassword: '',
    role: 'student', school: '',
  })
  const [showPw, setShowPw]   = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors,  setErrors]  = useState({})
  const [step, setStep]       = useState(1)  // 1 = personal info, 2 = password

  const pwStrength = passwordStrength(form.password)

  const onChange = (e) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
    setErrors(err => ({ ...err, [e.target.name]: '' }))
  }

  const validateStep1 = () => {
    const e = {}
    if (!form.full_name.trim() || form.full_name.trim().length < 2)
      e.full_name = 'Full name must be at least 2 characters.'
    if (!form.email && !form.phone)
      e.email = 'Enter either email or phone number.'
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      e.email = 'Enter a valid email address.'
    if (form.phone && !/^\+?265[0-9]{9}$/.test(form.phone.replace(/\s/g,'')))
      e.phone = 'Enter a valid Malawian phone number (+265...).'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const validateStep2 = () => {
    const e = {}
    if (!form.password || form.password.length < 8)
      e.password = 'Password must be at least 8 characters.'
    if (form.password !== form.confirmPassword)
      e.confirmPassword = 'Passwords do not match.'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const nextStep = (e) => {
    e.preventDefault()
    if (validateStep1()) setStep(2)
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    if (!validateStep2()) return
    setLoading(true)
    try {
      const payload = {
        full_name: form.full_name.trim(),
        email:     form.email   || undefined,
        phone:     form.phone   || undefined,
        password:  form.password,
        role:      form.role,
        school:    form.school  || undefined,
      }
      const user = await register(payload)
      toast.success(`Welcome to MalawiEduHub, ${user.full_name.split(' ')[0]}!`)
      router.push('/browse')
    } catch (err) {
      const msg = err?.response?.data?.error || 'Registration failed.'
      if (msg.includes('already registered')) {
        setErrors({ email: 'This email or phone is already registered.' })
        setStep(1)
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
        <div className="mb-6">
          <h1 className="font-serif text-3xl text-gray-900 mb-2">Create account</h1>
          <p className="text-sm text-gray-500">
            Already have an account?{' '}
            <Link href="/auth/login" className="text-green-600 font-semibold hover:underline">
              Sign in
            </Link>
          </p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-3 mb-6">
          {[1, 2].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`
                w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold
                transition-all duration-300
                ${s === step
                  ? 'bg-green-500 text-white scale-110'
                  : s < step
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-400'}
              `}>
                {s < step ? '✓' : s}
              </div>
              <span className={`text-xs font-medium ${s === step ? 'text-green-700' : 'text-gray-400'}`}>
                {s === 1 ? 'Personal info' : 'Set password'}
              </span>
              {s < 2 && <div className="w-8 h-px bg-gray-200 mx-1" />}
            </div>
          ))}
        </div>

        {/* Step 1 — Personal info */}
        {step === 1 && (
          <form onSubmit={nextStep} className="flex flex-col gap-4" noValidate>

            <Input
              label="Full name"
              id="full_name" name="full_name"
              value={form.full_name} onChange={onChange}
              placeholder="e.g. Chisomo Banda"
              error={errors.full_name}
              icon={User} required
            />

            {/* Role selector */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-green-600 uppercase tracking-wider">
                I am a
              </label>
              <div className="grid grid-cols-2 gap-2">
                {['student', 'teacher'].map((r) => (
                  <button
                    key={r} type="button"
                    onClick={() => setForm(f => ({ ...f, role: r }))}
                    className={`
                      py-2.5 px-4 rounded-xl border text-sm font-medium capitalize
                      transition-all duration-200
                      ${form.role === r
                        ? 'bg-green-500 text-white border-green-500'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-green-300'}
                    `}
                  >
                    {r === 'student' ? '🎓 Student' : '📚 Teacher'}
                  </button>
                ))}
              </div>
            </div>

            <Input
              label="School or institution (optional)"
              id="school" name="school"
              value={form.school} onChange={onChange}
              placeholder="e.g. Kamuzu Secondary School"
              icon={School}
            />

            <div className="border-t border-gray-100 pt-4 mt-1">
              <p className="text-xs text-gray-500 mb-3 font-medium">
                Enter at least one of the following:
              </p>
              <div className="flex flex-col gap-3">
                <Input
                  label="Email address"
                  id="email" name="email" type="email"
                  value={form.email} onChange={onChange}
                  placeholder="you@example.com"
                  error={errors.email}
                  icon={Mail}
                />
                <Input
                  label="Phone number"
                  id="phone" name="phone" type="tel"
                  value={form.phone} onChange={onChange}
                  placeholder="+265 999 123 456"
                  hint="Used for Airtel Money / TNM Mpamba payments"
                  error={errors.phone}
                  icon={Phone}
                />
              </div>
            </div>

            <Button type="submit" size="lg" className="w-full mt-2">
              Continue →
            </Button>
          </form>
        )}

        {/* Step 2 — Password */}
        {step === 2 && (
          <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>

            {/* Summary of step 1 */}
            <div className="rounded-xl p-3 bg-green-50 border border-green-100 flex items-center gap-3 mb-1">
              <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                {form.full_name.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-semibold text-green-900">{form.full_name}</p>
                <p className="text-xs text-green-600">{form.email || form.phone}</p>
              </div>
              <button
                type="button" onClick={() => setStep(1)}
                className="ml-auto text-xs text-green-600 hover:underline"
              >
                Edit
              </button>
            </div>

            {/* Password field */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="password" className="text-xs font-semibold text-green-600 uppercase tracking-wider">
                Password <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-green-400 pointer-events-none">
                  <Lock size={16} />
                </div>
                <input
                  id="password" name="password"
                  type={showPw ? 'text' : 'password'}
                  value={form.password} onChange={onChange}
                  placeholder="At least 8 characters"
                  className={`
                    w-full rounded-xl border bg-white px-4 py-3 pl-10 pr-10 text-sm
                    transition-all duration-200 placeholder:text-gray-400
                    ${errors.password ? 'border-red-300' : 'border-gray-200 focus:border-green-500 focus:shadow-[0_0_0_3px_rgba(13,122,85,0.12)]'}
                  `}
                  required
                />
                <button
                  type="button" onClick={() => setShowPw(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {/* Strength bar */}
              {form.password && (
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex gap-1 flex-1">
                    {[1,2,3,4].map((i) => (
                      <div key={i}
                        className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                          i <= pwStrength ? strengthColor[pwStrength] : 'bg-gray-100'
                        }`}
                      />
                    ))}
                  </div>
                  <span className={`text-xs font-medium ${
                    pwStrength <= 1 ? 'text-red-500' :
                    pwStrength === 2 ? 'text-orange-500' :
                    pwStrength === 3 ? 'text-yellow-600' : 'text-green-600'
                  }`}>
                    {strengthLabel[pwStrength]}
                  </span>
                </div>
              )}
              {errors.password && <p className="text-xs text-red-500">⚠ {errors.password}</p>}
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="confirmPassword" className="text-xs font-semibold text-green-600 uppercase tracking-wider">
                Confirm password <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-green-400 pointer-events-none">
                  <Lock size={16} />
                </div>
                <input
                  id="confirmPassword" name="confirmPassword"
                  type="password"
                  value={form.confirmPassword} onChange={onChange}
                  placeholder="Repeat your password"
                  className={`
                    w-full rounded-xl border bg-white px-4 py-3 pl-10 text-sm
                    transition-all duration-200 placeholder:text-gray-400
                    ${errors.confirmPassword ? 'border-red-300' : 'border-gray-200 focus:border-green-500 focus:shadow-[0_0_0_3px_rgba(13,122,85,0.12)]'}
                  `}
                  required
                />
                {form.confirmPassword && form.confirmPassword === form.password && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500">
                    <CheckCircle2 size={16} />
                  </div>
                )}
              </div>
              {errors.confirmPassword && <p className="text-xs text-red-500">⚠ {errors.confirmPassword}</p>}
            </div>

            {/* Terms */}
            <p className="text-xs text-gray-400 leading-relaxed">
              By creating an account you agree to our{' '}
              <Link href="/terms" className="text-green-600 hover:underline">Terms of Use</Link>{' '}
              and{' '}
              <Link href="/privacy" className="text-green-600 hover:underline">Privacy Policy</Link>.
            </p>

            <div className="flex gap-3">
              <Button
                type="button" variant="ghost" size="lg"
                onClick={() => setStep(1)}
                className="flex-1"
              >
                ← Back
              </Button>
              <Button type="submit" loading={loading} size="lg" className="flex-[2]">
                {loading ? 'Creating account…' : 'Create account'}
              </Button>
            </div>
          </form>
        )}

      </div>
    </AuthLayout>
  )
}
