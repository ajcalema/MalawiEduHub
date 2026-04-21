'use client'
export const dynamic = 'force-dynamic'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { classApi } from '@/lib/api'
import { useAuth } from '@/lib/auth-context'
import toast from 'react-hot-toast'
import {
  GraduationCap, ArrowLeft, ArrowRight, Loader2, RefreshCw, BookOpen, CheckCircle, Trophy
} from 'lucide-react'

function TopicsContent() {
  const { user } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()

  const [topics, setTopics] = useState([])
  const [loading, setLoading] = useState(true)
  const [classInfo, setClassInfo] = useState(null)

  const subjectId = searchParams.get('subject')

  useEffect(() => {
    if (!user || !subjectId) return
    loadData()
  }, [user, subjectId])

  const loadData = async () => {
    setLoading(true)
    try {
      const myClassRes = await classApi.getMyClass()
      if (!myClassRes.data?.selected) {
        router.push('/class')
        return
      }
      
      setClassInfo(myClassRes.data)

      const { data } = await classApi.getTopics(subjectId)
      setTopics(data || [])
    } catch (err) {
      const msg = err?.response?.data?.error || 'Failed to load topics'
      if (msg.includes('class')) {
        router.push('/class')
      } else {
        toast.error(msg)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleSelectTopic = (topic) => {
    router.push(`/class/room/${topic.id}`)
  }

  const handleBack = () => {
    router.push('/class/subjects')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfeff 100%)'}}>
        <Loader2 size={40} className="text-green-500 animate-spin" />
      </div>
    )
  }

  const completedCount = topics.filter(t => t.is_completed).length
  const progress = topics.length ? Math.round((completedCount / topics.length) * 100) : 0

  return (
    <div className="min-h-screen flex flex-col" style={{background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfeff 100%)'}}>
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-100 px-5 py-4">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button 
                onClick={handleBack}
                className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
              >
                <ArrowLeft size={20} className="text-gray-600" />
              </button>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                <GraduationCap size={24} className="text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">MY CLASS</h1>
                <p className="text-sm text-gray-500">Choose a Topic</p>
              </div>
            </div>
            <button onClick={loadData} className="p-2 rounded-xl hover:bg-gray-100">
              <RefreshCw size={18} className="text-gray-500" />
            </button>
          </div>
        </div>
      </header>

      {/* Progress bar */}
      <div className="bg-white/50 border-b border-gray-50 px-5 py-4">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Your Progress</span>
            <span className="text-sm font-bold text-green-600">{completedCount} / {topics.length} completed</span>
          </div>
          <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          {completedCount === topics.length && topics.length > 0 && (
            <div className="mt-3 flex items-center gap-2 text-amber-600 bg-amber-50 px-3 py-2 rounded-xl">
              <Trophy size={16} />
              <span className="text-sm font-medium">Congratulations! All topics completed!</span>
            </div>
          )}
        </div>
      </div>

      {/* Progress steps */}
      <div className="bg-white/50 border-b border-gray-50 px-5 py-3">
        <div className="max-w-3xl mx-auto flex items-center gap-2 text-xs">
          <span className="px-2 py-1 bg-green-500 text-white rounded-full font-medium">1</span>
          <span className="text-gray-400">→</span>
          <span className="px-2 py-1 bg-green-500 text-white rounded-full font-medium">2</span>
          <span className="text-gray-400">→</span>
          <span className="px-2 py-1 bg-green-500 text-white rounded-full font-medium">3</span>
          <span className="text-gray-400">→</span>
          <span className="px-2 py-1 bg-gray-200 text-gray-500 rounded-full">4</span>
          <span className="ml-2 text-gray-500">Class → Subject → Topic → Study</span>
        </div>
      </div>

      {/* Topics list */}
      <main className="flex-1 p-6">
        <div className="max-w-3xl mx-auto">
          {topics.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
              <BookOpen size={48} className="text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 mb-2">No topics available yet</p>
              <p className="text-sm text-gray-400">Check back soon!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {topics.map((topic, index) => (
                <button
                  key={topic.id}
                  onClick={() => handleSelectTopic(topic)}
                  className={`w-full group flex items-center gap-4 p-4 bg-white rounded-2xl border-2 transition-all duration-200 text-left hover:shadow-lg hover:-translate-y-0.5
                    ${topic.is_completed 
                      ? 'border-green-200 bg-green-50/50' 
                      : 'border-gray-100 hover:border-green-300'
                    }`}
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0
                    ${topic.is_completed 
                      ? 'bg-gradient-to-br from-green-500 to-emerald-500 text-white' 
                      : 'bg-gray-100 text-gray-400 group-hover:bg-green-100 group-hover:text-green-600'
                    }`}>
                    {topic.is_completed ? (
                      <CheckCircle size={24} />
                    ) : (
                      <span className="text-lg font-bold">{index + 1}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className={`font-bold text-base mb-1
                      ${topic.is_completed ? 'text-green-800' : 'text-gray-900'}`}>
                      {topic.name}
                    </h3>
                    {topic.description && (
                      <p className="text-xs text-gray-500 line-clamp-1">{topic.description}</p>
                    )}
                  </div>
                  {topic.is_completed ? (
                    <span className="px-3 py-1 bg-green-500 text-white text-xs font-medium rounded-full">
                      Done
                    </span>
                  ) : (
                    <ArrowRight size={18} className="text-gray-300 group-hover:text-green-500 group-hover:translate-x-1 transition-all flex-shrink-0" />
                  )}
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

export default function TopicsPage() {
  return (
    <Suspense fallback={<Loading />}>
      <TopicsContent />
    </Suspense>
  )
}