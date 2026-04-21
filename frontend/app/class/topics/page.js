'use client'
import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { classApi, documentsApi } from '@/lib/api'
import { useAuth } from '@/lib/auth-context'
import toast from 'react-hot-toast'
import {
  GraduationCap, ArrowLeft, ArrowRight, BookOpen, Loader2, RefreshCw, CheckCircle, Circle, Download
} from 'lucide-react'

export default function TopicsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()

  const [topics, setTopics] = useState([])
  const [loading, setLoading] = useState(true)
  const [classInfo, setClassInfo] = useState(null)
  const [subjectInfo, setSubjectInfo] = useState(null)

  const subjectId = searchParams.get('subject')

  useEffect(() => {
    if (!user || !subjectId) return
    loadData()
  }, [user, subjectId])

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

      // Get topics for this subject + class
      const { data } = await classApi.getTopics(subjectId)
      setTopics(data || [])

      // Get subject info (from subjects table)
      const subjectRes = await documentsApi.browse({ 
        limit: 1, 
        scope: 'all',
        subject: subjectId
      })
      // We need subject name from a different approach
      // For now, just use 'Subject' as placeholder - will be enhanced
      setSubjectInfo({ id: subjectId, name: 'Subject' })
    } catch (err) {
      console.error('Failed to load topics:', err)
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

  const handleSelectTopic = (topicId) => {
    router.push(`/class/room/${topicId}`)
  }

  const handleBack = () => {
    router.push('/class/subjects')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 size={32} className="text-green-500 animate-spin" />
      </div>
    )
  }

  const completedCount = topics.filter(t => t.is_completed).length

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-5 py-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button 
                onClick={handleBack}
                className="p-2 rounded-xl hover:bg-gray-100"
              >
                <ArrowLeft size={20} className="text-gray-600" />
              </button>
              <div className="w-10 h-10 rounded-xl bg-green-500 flex items-center justify-center">
                <GraduationCap size={20} className="text-white" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">MY CLASS - Choose Topic</h1>
                <p className="text-sm text-gray-500">Select a topic to study</p>
              </div>
            </div>
            <button onClick={loadData} className="p-2 rounded-xl hover:bg-gray-100">
              <RefreshCw size={18} className="text-gray-500" />
            </button>
          </div>
        </div>
      </header>

      {/* Progress bar */}
      <div className="bg-white border-b border-gray-50 px-5 py-3">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="text-gray-500">Progress</span>
            <span className="font-semibold text-green-600">
              {completedCount} / {topics.length} completed
            </span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-green-500 rounded-full transition-all"
              style={{ width: `${topics.length ? (completedCount / topics.length) * 100 : 0}%` }}
            />
          </div>
        </div>
      </div>

      {/* Progress steps */}
      <div className="bg-white border-b border-gray-50 px-5 py-3">
        <div className="max-w-2xl mx-auto flex items-center gap-2 text-xs">
          <span className="font-semibold text-green-600">1. Class</span>
          <span className="text-gray-300">→</span>
          <span className="font-semibold text-green-600">2. Subject</span>
          <span className="text-gray-300">→</span>
          <span className="font-semibold text-green-600">3. Topic</span>
          <span className="text-gray-300">→</span>
          <span className="text-gray-400">4. Study</span>
        </div>
      </div>

      {/* Main content */}
      <main className="flex-1 p-5">
        <div className="max-w-2xl mx-auto space-y-3">
          {topics.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
              <BookOpen size={40} className="text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500">
                No topics available for this subject yet.
                <br />
                Check back soon as we add more content!
              </p>
            </div>
          ) : (
            topics.map((topic, index) => (
              <button
                key={topic.id}
                onClick={() => handleSelectTopic(topic.id)}
                className={`flex items-center gap-4 p-4 bg-white rounded-2xl border-2 transition-all w-full text-left group
                  ${topic.is_completed 
                    ? 'border-green-200 bg-green-50' 
                    : 'border-gray-100 hover:border-green-300 hover:bg-green-50'
                  }`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0
                  ${topic.is_completed ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-400'}`}>
                  {topic.is_completed ? (
                    <CheckCircle size={18} />
                  ) : (
                    <span className="text-sm font-semibold">{index + 1}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-base font-semibold truncate
                    ${topic.is_completed ? 'text-green-800' : 'text-gray-900'}`}>
                    {topic.name}
                  </p>
                  {topic.description && (
                    <p className="text-xs text-gray-500 mt-0.5 truncate">
                      {topic.description}
                    </p>
                  )}
                </div>
                <ArrowRight size={18} className="text-gray-300 group-hover:text-green-500 transition-colors flex-shrink-0" />
              </button>
            ))
          )}
        </div>
      </main>
    </div>
  )
}