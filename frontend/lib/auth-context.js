'use client'
import { createContext, useContext, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Cookies from 'js-cookie'
import { authApi } from '@/lib/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  // Restore session on mount
  useEffect(() => {
    const stored = Cookies.get('user')
    if (stored) {
      try { setUser(JSON.parse(stored)) } catch {}
    }
    setLoading(false)
  }, [])

  const saveSession = (userData, accessToken, refreshToken) => {
    Cookies.set('accessToken',  accessToken,  { expires: 1/96 }) // 15 min
    Cookies.set('refreshToken', refreshToken, { expires: 30 })   // 30 days
    Cookies.set('user', JSON.stringify(userData), { expires: 30 })
    setUser(userData)
  }

  const login = async (identifier, password) => {
    const { data } = await authApi.login({ identifier, password })
    saveSession(data.user, data.accessToken, data.refreshToken)
    return data.user
  }

  const register = async (formData) => {
    const { data } = await authApi.register(formData)
    saveSession(data.user, data.accessToken, data.refreshToken)
    return data.user
  }

  const logout = async () => {
    try {
      const refreshToken = Cookies.get('refreshToken')
      if (refreshToken) {
        await authApi.logout({ refreshToken })
      }
    } catch (err) {
      console.error('Logout API error:', err)
      // Continue with local logout even if API fails
    }
    Cookies.remove('accessToken')
    Cookies.remove('refreshToken')
    Cookies.remove('user')
    setUser(null)
    router.push('/')
  }

  const refreshProfile = async () => {
    try {
      const { data } = await authApi.profile()
      const updated = { ...user, ...data }
      Cookies.set('user', JSON.stringify(updated), { expires: 30 })
      setUser(updated)
      return updated
    } catch {}
  }

  const isAdmin = user?.role === 'admin'

  const hasAccess = () => {
    if (!user) return false
    const sub = user.subscription || user.active_subscription
    if (!sub) return false
    return new Date(sub.expires_at) > new Date()
  }

  return (
    <AuthContext.Provider value={{
      user, loading, login, register, logout,
      refreshProfile, isAdmin, hasAccess,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
