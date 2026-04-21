'use client'
import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { classApi, documentsApi } from '@/lib/api'
import { useAuth } from '@/lib/auth-context'
import toast from 'react-hot-toast'
import {
  GraduationCap, ArrowLeft, ArrowRight, BookOpen, Loader2, RefreshCw, 
  CheckCircle, Circle, Download, Eye, FileText, Play
} from 'lucide-react'

export default function LearningRoomPage() {
  const { user } = useAuth()
  const router = useRouter()
  const params = useParams()
  const topicId = params.topicId

  const [roomData, setRoomData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [completing, setCompleting] = useState(false)
  const [nextTopic, setNextTopic] = useState(null)

  useEffect(() => {
    if (!user || !topicId) return
    loadData()
  }, [user, topicId])

  const loadData = async () => {
    setLoading(true)
    try {
      // Check if user has a class selected
      const myClassRes = await classApi.getMyClass()
      if (!myClassRes.data?.selected) {
        router.push('/class')
        return
      }

      // Get learning room data
      const { data } = await classApi.getLearningRoom(topicId)
      setRoomData(data)

      // Get next topic
      try {
        const nextRes = await classApi.getNextTopic(topicId)
        setNextTopic(nextRes.data?.next)
      } catch {}
    } catch (err) {
      console.error('Failed to load learning room:', err)
      const msg = err?.response?.data?.error || 'Failed to load learning room'
      if (msg.includes('not found')) {
        router.push('/class/topics')
      } else if (msg.includes('class')) {
        router.push('/class')
      } else {
        toast.error(msg)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleMarkComplete = async () => {
    setCompleting(true)
    try {
      await classApi.completeTopic(topicId)
      toast.success('Topic marked as completed!')
      loadData()
    } catch (err) {
      const msg = err?.response?.data?.error || 'Failed to mark complete'
      toast.error(msg)
    } finally {
      setCompleting(false)
    }
  }

  const handleNextTopic = () => {
    if (nextTopic) {
      router.push(`/class/room/${nextTopic.id}`)
    }
  }

  const handleBack = () => {
    router.push(`/class/topics?subject=${roomData?.topic?.subject_id}`)
  }

  const handleViewDocument = async (docId) => {
    router.push(`/browse/${docId}`)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 size={32} className="text-green-500 animate-spin" />
      </div>
    )
  }

  if (!roomData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500">Topic not found</p>
          <button onClick={handleBack} className="text-green-600 mt-2">
            Go back
          </button>
        </div>
      </div>
    )
  }

  const { topic, progress, completed_count, total_count, documents } = roomData
  const isCompleted = progress?.is_completed

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-5 py-4">
        <div className="max-w-3xl mx-auto">
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
                <h1 className="text-lg font-semibold text-gray-900">MY CLASS - Learning Room</h1>
                <p className="text-sm text-gray-500">{topic.class_name} • {topic.subject_name}</p>
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
        <div className="max-w-3xl mx-auto flex items-center gap-2 text-xs">
          <span className="font-semibold text-green-600">1. Class</span>
          <span className="text-gray-300">→</span>
          <span className="font-semibold text-green-600">2. Subject</span>
          <span className="text-gray-300">→</span>
          <span className="font-semibold text-green-600">3. Topic</span>
          <span className="text-gray-300">→</span>
          <span className="font-semibold text-green-600">4. Study</span>
        </div>
      </div>

      {/* Main content */}
      <main className="flex-1 p-5">
        <div className="max-w-3xl mx-auto space-y-5">
          
          {/* Topic header */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  {isCompleted ? (
                    <span className="flex items-center gap-1 text-xs font-semibold text-green-600 bg-green-50 px-2 py-1 rounded-full">
                      <CheckCircle size={12} /> Completed
                    </span>
                  ) : (
                    <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-1 rounded-full">
                      In Progress
                    </span>
                  )}
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">{topic.name}</h2>
                {topic.description && (
                  <p className="text-sm text-gray-600">{topic.description}</p>
                )}
              </div>
              
              {/* Mark complete button */}
              {!isCompleted ? (
                <button
                  onClick={handleMarkComplete}
                  disabled={completing}
                  className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-xl font-semibold hover:bg-green-600 disabled:opacity-50"
                >
                  {completing ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <CheckCircle size={16} />
                  )}
                  Mark Complete
                </button>
              ) : (
                <div className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-xl font-semibold">
                  <CheckCircle size={16} />
                  Completed
                </div>
              )}
            </div>

            {/* Progress bar */}
            <div className="mt-4 pt-4 border-t border-gray-50">
              <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                <span>Subject Progress</span>
                <span>{completed_count} / {total_count} topics</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-green-500 rounded-full transition-all"
                  style={{ width: `${total_count ? (completed_count / total_count) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>

          {/* Learning resources */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <BookOpen size={18} className="text-green-500" />
              Learning Resources
            </h3>

            {documents && documents.length > 0 ? (
              <div className="space-y-3">
                {documents.map((doc) => (
                  <div 
                    key={doc.id}
                    className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl hover:bg-green-50 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-lg bg-white border border-gray-200 flex items-center justify-center">
                      <FileText size={18} className="text-gray-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{doc.title}</p>
                      <p className="text-xs text-gray-500">
                        {doc.doc_type?.replace('_', ' ')} • {doc.year} • 
                        {doc.is_free ? ' Free' : ` MWK ${doc.price_mwk}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleViewDocument(doc.id)}
                        className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100"
                      >
                        <Eye size={12} />
                        View
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <BookOpen size={32} className="text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">
                  No resources available for this topic yet.
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Browse the full library for related content.
                </p>
                <button 
                  onClick={() => router.push('/browse')}
                  className="mt-3 text-sm text-green-600 font-medium hover:underline"
                >
                  Browse Full Library →
                </button>
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between gap-4">
            <button
              onClick={handleBack}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-white border-2 border-gray-200 rounded-xl font-semibold text-gray-600 hover:border-gray-300 hover:bg-gray-50"
            >
              <ArrowLeft size={18} />
              Back to Topics
            </button>

            {nextTopic ? (
              <button
                onClick={handleNextTopic}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-500 text-white rounded-xl font-semibold hover:bg-green-600"
              >
                Next Topic
                <ArrowRight size={18} />
              </button>
            ) : (
              <button
                onClick={() => router.push('/class/subjects')}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-500 text-white rounded-xl font-semibold hover:bg-green-600"
              >
                Back to Subjects
                <ArrowRight size={18} />
              </button>
            )}
          </div>

          {/* Next topic preview */}
          {nextTopic && (
            <div className="bg-green-50 rounded-xl p-4 text-center">
              <p className="text-xs text-green-700 mb-1">Up Next</p>
              <p className="text-sm font-semibold text-green-800">{nextTopic.name}</p>
            </div>
          )}

        </div>
      </main>
    </div>
  )
}