'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { authApi } from '@/lib/api'
import toast from 'react-hot-toast'
import { Loader2, Lock, ArrowLeft, CheckCircle, Eye, EyeOff } from 'lucide-react'

function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (!token) {
      toast.error('Invalid or missing reset token')
    }
  }, [token])

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!token) {
      toast.error('Invalid reset token')
      return
    }

    if (password.length < 8) {
      toast.error('Password must be at least 8 characters')
      return
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    setLoading(true)
    try {
      const { data } = await authApi.resetPassword(token, password)
      setSuccess(true)
      toast.success(data.message)
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to reset password')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={32} className="text-green-500" />
            </div>
            <h1 className="text-xl font-bold text-gray-900 mb-2">Password Reset!</h1>
            <p className="text-gray-600 mb-6">
              Your password has been reset successfully. You can now log in with your new password.
            </p>
            <Link
              href="/auth/login"
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-green-500 text-white font-medium rounded-xl hover:bg-green-600"
            >
              Go to Login
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (!token) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
            <h1 className="text-xl font-bold text-gray-900 mb-2">Invalid Link</h1>
            <p className="text-gray-600 mb-6">
              This password reset link is invalid or has expired.
            </p>
            <Link
              href="/auth/forgot-password"
              className="inline-flex items-center gap-2 text-green-600 hover:text-green-700 font-medium"
            >
              Request New Link
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Reset Password</h1>
            <p className="text-gray-500 mt-1">
              Enter your new password below.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter new password"
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-gray-200 focus:border-green-400 focus:outline-none"
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">Must be at least 8 characters</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:border-green-400 focus:outline-none"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-green-500 text-white font-medium rounded-xl hover:bg-green-600 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : null}
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link
              href="/auth/login"
              className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
            >
              <ArrowLeft size={14} />
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 size={32} className="text-green-500 animate-spin" />
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  )
}
