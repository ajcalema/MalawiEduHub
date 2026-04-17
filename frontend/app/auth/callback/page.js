'use client'

import { useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import toast from 'react-hot-toast'
import { Loader2 } from 'lucide-react'

function CallbackHandler() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { setTokens } = useAuth()

  useEffect(() => {
    const token = searchParams.get('token')
    const refresh = searchParams.get('refresh')
    const error = searchParams.get('error')

    if (error) {
      toast.error('Google sign-in failed. Please try again.')
      router.push('/auth/login')
      return
    }

    if (token && refresh) {
      // Store tokens
      setTokens(token, refresh)
      toast.success('Successfully signed in with Google!')
      router.push('/browse')
    } else {
      toast.error('Authentication failed. Please try again.')
      router.push('/auth/login')
    }
  }, [searchParams, router, setTokens])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <Loader2 size={48} className="text-green-500 animate-spin mx-auto mb-4" />
        <h1 className="text-xl font-semibold text-gray-800 mb-2">Completing sign in...</h1>
        <p className="text-gray-500">Please wait while we authenticate you.</p>
      </div>
    </div>
  )
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 size={48} className="text-green-500 animate-spin mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-gray-800 mb-2">Loading...</h1>
        </div>
      </div>
    }>
      <CallbackHandler />
    </Suspense>
  )
}
