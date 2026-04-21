'use client'
export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { classApi } from '@/lib/api'
import { useAuth } from '@/lib/auth-context'
import toast from 'react-hot-toast'
import {
  GraduationCap, ArrowLeft, ArrowRight, BookOpen, Loader2, RefreshCw
} from 'lucide-react'

export default function SubjectsPage() {
  const { user } = useAuth()
  const router = useRouter()

  const [subjects, setSubjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [classInfo, setClassInfo] = useState(null)
  const [currentClass, setCurrentClass] = useState(null)

  useEffect(() => {
    if (!user) return
    loadData()
  }, [user])

  const loadData = async () => {
    setLoading(true)
    try {
      // Check if user has a class selected
      const myClassRes = await classApi.getMyClass()
      if (!myClassRes.data?.selected) {
        router.push('/class')
        return
      }
      
      setClassInfo(myClassRes.data)
      setCurrentClass(myClassRes.data.class_id)

      // Get subjects for this class
      const { data } = await classApi.getSubjects()
      setSubjects(data || [])
    } catch (err) {
      console.error('Failed to load subjects:', err)
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

  const handleSelectSubject = (subjectId) => {
    router.push(`/class/topics?subject=${subjectId}`)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 size={32} className="text-green-500 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-5 py-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => router.push('/class')}
                className="p-2 rounded-xl hover:bg-gray-100"
              >
                <ArrowLeft size={20} className="text-gray-600" />
              </button>
              <div className="w-10 h-10 rounded-xl bg-green-500 flex items-center justify-center">
                <GraduationCap size={20} className="text-white" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">MY CLASS - Choose Subject</h1>
                <p className="text-sm text-gray-500">{classInfo?.display_name || 'Select your class'}</p>
              </div>
            </div>
            <button onClick={loadData} className="p-2 rounded-xl hover:bg-gray-100">
              <RefreshCw size={18} className="text-gray-500" />
            </button>
          </div>
        </div>
      </header>

      {/* Progress indicator */}
      <div className="bg-white border-b border-gray-50 px-5 py-3">
        <div className="max-w-2xl mx-auto flex items-center gap-2 text-xs">
          <span className="font-semibold text-green-600">1. Class</span>
          <span className="text-gray-300">→</span>
          <span className="font-semibold text-green-600">2. Subject</span>
          <span className="text-gray-300">→</span>
          <span className="text-gray-400">3. Topic</span>
          <span className="text-gray-300">→</span>
          <span className="text-gray-400">4. Study</span>
        </div>
      </div>

      {/* Main content */}
      <main className="flex-1 p-5">
        <div className="max-w-2xl mx-auto space-y-4">
          <p className="text-sm text-gray-600 mb-2">
            Select a subject to view available topics:
          </p>

          {subjects.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
              <BookOpen size={40} className="text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500">
                No subjects available for this class yet.
                <br />
                Check back soon as we add more content!
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {subjects.map((subject) => (
                <button
                  key={subject.id}
                  onClick={() => handleSelectSubject(subject.id)}
                  className="flex items-center gap-4 p-4 bg-white rounded-2xl border-2 border-gray-100 hover:border-green-300 hover:bg-green-50 transition-all w-full text-left group"
                >
                  <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center text-xl">
                    {subject.icon_emoji || '📚'}
                  </div>
                  <div className="flex-1">
                    <p className="text-base font-semibold text-gray-900">{subject.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {subject.topic_count} topic{subject.topic_count !== 1 ? 's' : ''} available
                    </p>
                  </div>
                  <ArrowRight size={18} className="text-gray-300 group-hover:text-green-500 transition-colors" />
                </button>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}