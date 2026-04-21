'use client'
export const dynamic = 'force-dynamic'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { classApi } from '@/lib/api'
import { useAuth } from '@/lib/auth-context'
import toast from 'react-hot-toast'
import {
  GraduationCap, ArrowLeft, ArrowRight, Loader2, RefreshCw, BookOpen, CheckCircle
} from 'lucide-react'

function SubjectsContent() {
  const { user } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()

  const [subjects, setSubjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [classInfo, setClassInfo] = useState(null)

  useEffect(() => {
    if (!user) return
    loadData()
  }, [user])

  const loadData = async () => {
    setLoading(true)
    try {
      const myClassRes = await classApi.getMyClass()
      if (!myClassRes.data?.selected) {
        router.push('/class')
        return
      }
      
      setClassInfo(myClassRes.data)

      const { data } = await classApi.getSubjects()
      setSubjects(data || [])
    } catch (err) {
      const msg = err?.response?.data?.error || 'Failed to load subjects'
      if (msg.includes('select a class')) {
        router.push('/class')
      } else {
        toast.error(msg)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleSelectSubject = (subject) => {
    router.push(`/class/topics?subject=${subject.id}`)
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
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-100 px-5 py-4">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => router.push('/class')}
                className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
              >
                <ArrowLeft size={20} className="text-gray-600" />
              </button>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                <GraduationCap size={24} className="text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">MY CLASS</h1>
                <p className="text-sm text-gray-500">{classInfo?.display_name || 'Select your class'}</p>
              </div>
            </div>
            <button onClick={loadData} className="p-2 rounded-xl hover:bg-gray-100">
              <RefreshCw size={18} className="text-gray-500" />
            </button>
          </div>
        </div>
      </header>

      {/* Progress */}
      <div className="bg-white/50 border-b border-gray-50 px-5 py-3">
        <div className="max-w-3xl mx-auto flex items-center gap-2 text-xs">
          <span className="px-2 py-1 bg-green-500 text-white rounded-full font-medium">1</span>
          <span className="text-gray-400">→</span>
          <span className="px-2 py-1 bg-green-500 text-white rounded-full font-medium">2</span>
          <span className="text-gray-400">→</span>
          <span className="px-2 py-1 bg-gray-200 text-gray-500 rounded-full">3</span>
          <span className="text-gray-400">→</span>
          <span className="px-2 py-1 bg-gray-200 text-gray-500 rounded-full">4</span>
          <span className="ml-2 text-gray-500">Class → Subject → Topic → Study</span>
        </div>
      </div>

      {/* Main content */}
      <main className="flex-1 p-6">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <BookOpen size={20} className="text-green-600" />
            Choose a Subject
          </h2>

          {subjects.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
              <BookOpen size={48} className="text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 mb-2">No subjects available yet</p>
              <p className="text-sm text-gray-400">Check back soon as we add more content!</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {subjects.map((subject, index) => (
                <button
                  key={subject.id}
                  onClick={() => handleSelectSubject(subject)}
                  className="group bg-white rounded-2xl border-2 border-gray-100 p-5 text-left hover:border-green-300 hover:shadow-lg hover:-translate-y-1 transition-all duration-200"
                >
                  <div className="text-3xl mb-3">{subject.icon_emoji || '📚'}</div>
                  <h3 className="font-bold text-gray-900 mb-1">{subject.name}</h3>
                  <p className="text-xs text-gray-500">
                    {subject.topic_count} topic{subject.topic_count !== 1 ? 's' : ''}
                  </p>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-xs text-green-600 font-medium group-hover:underline">
                      Start Learning
                    </span>
                    <ArrowRight size={14} className="text-gray-300 group-hover:text-green-500 group-hover:translate-x-1 transition-all" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfeff 100%)'}}>
      <Loader2 size={40} className="text-green-500 animate-spin" />
    </div>
  )
}

export default function SubjectsPage() {
  return (
    <Suspense fallback={<Loading />}>
      <SubjectsContent />
    </Suspense>
  )
}
