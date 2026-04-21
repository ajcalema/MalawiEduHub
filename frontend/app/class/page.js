'use client'
export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { classApi } from '@/lib/api'
import { useAuth } from '@/lib/auth-context'
import toast from 'react-hot-toast'
import {
  GraduationCap, ArrowRight, Loader2, BookOpen, Users, Trophy
} from 'lucide-react'

const CLASSES = [
  { id: 1, name: 'Form 1', display: 'Form 1', subtitle: 'Junior Certificate (JCE)', icon: '📚', color: 'from-green-500 to-emerald-600' },
  { id: 2, name: 'Form 2', display: 'Form 2', subtitle: 'Junior Certificate (JCE)', icon: '📖', color: 'from-blue-500 to-cyan-600' },
  { id: 3, name: 'Form 3', display: 'Form 3', subtitle: 'Malawi School Certificate (MSCE)', icon: '🎓', color: 'from-purple-500 to-violet-600' },
  { id: 4, name: 'Form 4', display: 'Form 4', subtitle: 'Malawi School Certificate (MSCE)', icon: '🎒', color: 'from-amber-500 to-orange-600' },
]

export default function ClassSelectionPage() {
  const { user } = useAuth()
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [selectedClass, setSelectedClass] = useState(null)
  const [selecting, setSelecting] = useState(false)

  useEffect(() => {
    if (!user) return
    loadClasses()
  }, [user])

  const loadClasses = async () => {
    try {
      const { data } = await classApi.getClasses()
      
      const myClassRes = await classApi.getMyClass()
      if (myClassRes.data?.selected) {
        router.push('/class/subjects')
      }
    } catch (err) {
      console.error('Failed to load classes:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSelectClass = async (classId) => {
    setSelecting(classId)
    try {
      await classApi.selectClass(classId)
      toast.success('Welcome to MY CLASS!')
      router.push('/class/subjects')
    } catch (err) {
      const msg = err?.response?.data?.error || 'Failed to select class'
      toast.error(msg)
    } finally {
      setSelecting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfeff 100%)'}}>
        <Loader2 size={40} className="text-green-500 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col" style={{background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfeff 100%)'}}>
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-100 px-5 py-6">
        <div className="max-w-3xl mx-auto text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center mx-auto mb-4">
            <GraduationCap size={32} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">MY CLASS</h1>
          <p className="text-gray-600 text-lg">Select your class to start learning</p>
        </div>
      </header>

      {/* Class Cards */}
      <main className="flex-1 p-6">
        <div className="max-w-3xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {CLASSES.map((cls) => (
              <button
                key={cls.id}
                onClick={() => handleSelectClass(cls.id)}
                disabled={selecting}
                className="group relative overflow-hidden bg-white rounded-2xl border-2 border-gray-100 p-6 text-left hover:border-green-300 hover:shadow-xl transition-all duration-300 disabled:opacity-50"
              >
                {/* Gradient accent */}
                <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-br ${cls.color}`} style={{opacity: 0.05}} />
                
                <div className="relative flex items-start gap-4">
                  <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${cls.color} flex items-center justify-center text-2xl shadow-lg`}>
                    {cls.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900">{cls.display}</h3>
                    <p className="text-sm text-gray-500 mt-1">{cls.subtitle}</p>
                  </div>
                  <ArrowRight size={20} className="text-gray-300 group-hover:text-green-500 group-hover:translate-x-1 transition-all" />
                </div>

                {/* Progress bar */}
                <div className="mt-4 pt-4 border-t border-gray-50">
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                      <BookOpen size={12} /> 10 topics
                    </span>
                    <span className="text-green-600 font-medium">Start Learning →</span>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Info card */}
          <div className="mt-8 bg-white/60 backdrop-blur-sm rounded-2xl border border-gray-100 p-5">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                <Trophy size={20} className="text-amber-600" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Why select your class?</h4>
                <p className="text-sm text-gray-600">
                  MY CLASS shows you topics that match your curriculum. Form 1-2 students see JCE content, 
                  while Form 3-4 see MSCE content. This ensures you're studying the right material for your exams.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Loading overlay */}
      {selecting && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 flex items-center gap-3 shadow-xl">
            <Loader2 size={24} className="text-green-500 animate-spin" />
            <p className="font-medium">Setting up your class...</p>
          </div>
        </div>
      )}
    </div>
  )
}