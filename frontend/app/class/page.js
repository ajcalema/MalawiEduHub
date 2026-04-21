'use client'
export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'
import { learnApi } from '@/lib/api'
import { useAuth } from '@/lib/auth-context'
import toast from 'react-hot-toast'
import { BookOpen, GraduationCap, ChevronRight, Loader2, TrendingUp } from 'lucide-react'

const CLASS_COLORS = [
  { bg: '#E6F1FB', border: '#B5D4F4', text: '#0C447C', accent: '#378ADD', num: '01' },
  { bg: '#E1F5EE', border: '#9FE1CB', text: '#085041', accent: '#1D9E75', num: '02' },
  { bg: '#FAEEDA', border: '#FAC775', text: '#633806', accent: '#BA7517', num: '03' },
  { bg: '#EEEDFE', border: '#CECBF6', text: '#3C3489', accent: '#7F77DD', num: '04' },
  { bg: '#FDE8E8', border: '#F8B4B4', text: '#7F1D1D', accent: '#DC2626', num: '05' },
  { bg: '#FEF3C7', border: '#FDE68A', text: '#92400E', accent: '#D97706', num: '06' },
]

export default function ClassPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [classes, setClasses] = useState([])
  const [progress, setProgress] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user === null) {
      router.push('/auth/login')
      return
    }
    Promise.all([
      learnApi.getClasses(),
      user ? learnApi.getProgress().catch(() => ({ data: [] })) : Promise.resolve({ data: [] }),
    ]).then(([cls, prog]) => {
      setClasses(cls.data || [])
      setProgress(prog.data || [])
    }).catch(err => {
      console.error('Failed to load:', err)
    }).finally(() => setLoading(false))
  }, [user])

  const completedByClass = progress.reduce((acc, p) => {
    if (p.completed) acc[p.class_name] = (acc[p.class_name] || 0) + 1
    return acc
  }, {})

  if (!user || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Navbar />
        <Loader2 size={32} className="text-green-500 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-24 pb-16">
        <div className="mb-10 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-4"
            style={{ background: '#E1F5EE', border: '1px solid #9FE1CB' }}>
            <GraduationCap size={14} className="text-green-600" />
            <span className="text-xs font-semibold text-green-700 uppercase tracking-wider">Learning Room</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl text-gray-900 mb-3">
            Welcome, {user.full_name?.split(' ')[0] || 'Student'}
          </h1>
          <p className="text-gray-500 text-sm max-w-md mx-auto leading-relaxed">
            Select your class to start your structured learning journey.
            Follow the path: Class → Subject → Topic → Resources.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-5 mb-8">
          {classes.map((cls, i) => {
            const colors = CLASS_COLORS[i % CLASS_COLORS.length]
            const completed = completedByClass[cls.name] || 0

            return (
              <Link key={cls.id} href={`/class/subjects?class=${cls.id}`}
                className="group block no-underline">
                <div className="rounded-2xl border-2 p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
                  style={{ background: colors.bg, borderColor: colors.border }}>
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center font-serif text-xl font-bold"
                      style={{ background: colors.accent + '20', color: colors.accent }}>
                      {colors.num}
                    </div>
                    <ChevronRight size={20} style={{ color: colors.accent }}
                      className="group-hover:translate-x-1 transition-transform" />
                  </div>

                  <h2 className="font-serif text-2xl mb-1" style={{ color: colors.text }}>{cls.name}</h2>
                  {cls.description && (
                    <p className="text-sm mb-3 opacity-70" style={{ color: colors.text }}>{cls.description}</p>
                  )}

                  {completed > 0 && (
                    <div className="mt-3 pt-3" style={{ borderTop: `1px solid ${colors.border}` }}>
                      <div className="flex items-center gap-2">
                        <TrendingUp size={12} style={{ color: colors.accent }} />
                        <span className="text-xs font-semibold" style={{ color: colors.text }}>
                          {completed} topic{completed !== 1 ? 's' : ''} completed
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </Link>
            )
          })}
        </div>

        <div className="text-center">
          <p className="text-sm text-gray-400 mb-3">Looking for something specific?</p>
          <Link href="/browse"
            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-green-700 border-2 border-green-200 rounded-xl hover:bg-green-50 transition-all no-underline">
            <BookOpen size={15} /> Browse all documents
          </Link>
        </div>
      </div>
    </div>
  )
}