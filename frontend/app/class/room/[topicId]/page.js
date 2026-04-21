'use client'
export const dynamic = 'force-dynamic'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'
import { learnApi } from '@/lib/api'
import { useAuth } from '@/lib/auth-context'
import toast from 'react-hot-toast'
import {
  ChevronRight, ChevronLeft, CheckCircle2, Circle,
  BookOpen, Loader2, GraduationCap, FileText, Eye
} from 'lucide-react'

function RoomContent() {
  const { user } = useAuth()
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const topicId = params.topicId

  const [roomData, setRoomData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [completing, setCompleting] = useState(false)

  const classId = searchParams.get('class')
  const subjectId = searchParams.get('subject')

  useEffect(() => {
    if (user === null) {
      router.push('/auth/login')
      return
    }
    if (!topicId) return
    loadData()
  }, [user, topicId])

  const loadData = async () => {
    setLoading(true)
    try {
      const { data } = await learnApi.getResources(topicId)
      setRoomData(data)
    } catch (err) {
      console.error('Failed to load learning room:', err)
      const msg = err?.response?.data?.error || 'Failed to load learning room'
      if (msg.includes('not found')) {
        router.push(`/class/topics?class=${classId}&subject=${subjectId}`)
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
      const isCompleted = roomData?.topic?.completed
      await learnApi.markProgress(topicId, !isCompleted)
      toast.success(isCompleted ? 'Marked as incomplete' : 'Great job! Topic completed!')
      loadData()
    } catch (err) {
      const msg = err?.response?.data?.error || 'Failed to update progress'
      toast.error(msg)
    } finally {
      setCompleting(false)
    }
  }

  const handleViewDocument = (docId) => {
    router.push(`/browse/${docId}`)
  }

  if (!user || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Navbar />
        <Loader2 size={32} className="text-green-500 animate-spin" />
      </div>
    )
  }

  if (!roomData) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <p className="text-gray-500">Topic not found</p>
            <Link href={`/class/topics?class=${classId}&subject=${subjectId}`} className="text-green-600 mt-2 inline-block">
              Go back
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const { topic, resources } = roomData
  const isCompleted = topic?.completed

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-24 pb-16">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-400 mb-8 flex-wrap">
          <Link href="/class" className="hover:text-green-600 no-underline flex items-center gap-1 transition-colors">
            <GraduationCap size={14} /> Learning Room
          </Link>
          <ChevronRight size={14} />
          <Link href={`/class/subjects?class=${classId}`} className="hover:text-green-600 no-underline transition-colors">
            {topic.class_name}
          </Link>
          <ChevronRight size={14} />
          <Link href={`/class/topics?class=${classId}&subject=${subjectId}`} className="hover:text-green-600 no-underline transition-colors">
            {topic.subject_name}
          </Link>
          <ChevronRight size={14} />
          <span className="text-gray-700 font-medium truncate">{topic.title}</span>
        </div>

        {/* Topic header */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                {isCompleted ? (
                  <span className="flex items-center gap-1 text-xs font-semibold text-green-600 bg-green-50 px-2 py-1 rounded-full">
                    <CheckCircle2 size={12} /> Completed
                  </span>
                ) : (
                  <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-1 rounded-full">
                    In Progress
                  </span>
                )}
              </div>
              <h1 className="font-serif text-2xl text-gray-900 mb-2">{topic.title}</h1>
              {topic.description && (
                <p className="text-sm text-gray-600">{topic.description}</p>
              )}
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
            <p className="text-xs text-gray-500">{resources?.length || 0} resource{(resources?.length || 0) !== 1 ? 's' : ''} available</p>
            <button
              onClick={handleMarkComplete}
              disabled={completing}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm transition-all
                ${isCompleted
                  ? 'bg-green-50 text-green-700 hover:bg-green-100 border border-green-200'
                  : 'bg-green-500 text-white hover:bg-green-600'
                } disabled:opacity-50`}
            >
              {completing ? (
                <Loader2 size={14} className="animate-spin" />
              ) : isCompleted ? (
                <Circle size={14} />
              ) : (
                <CheckCircle2 size={14} />
              )}
              {isCompleted ? 'Mark Incomplete' : 'Mark Complete'}
            </button>
          </div>
        </div>

        {/* Learning resources */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6 shadow-sm">
          <h3 className="font-serif text-lg text-gray-900 mb-4 flex items-center gap-2">
            <BookOpen size={18} className="text-green-500" />
            Learning Resources
          </h3>

          {resources && resources.length > 0 ? (
            <div className="flex flex-col gap-3">
              {resources.map((doc) => (
                <div 
                  key={doc.id}
                  className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl hover:bg-green-50 transition-colors"
                >
                  <div className="w-10 h-10 rounded-lg bg-white border border-gray-200 flex items-center justify-center flex-shrink-0">
                    <FileText size={18} className="text-gray-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{doc.title}</p>
                    <p className="text-xs text-gray-500">
                      {doc.doc_type?.replace('_', ' ')} • {doc.year} • 
                      {doc.is_free ? ' Free' : ` MWK ${doc.price_mwk}`}
                    </p>
                  </div>
                  <button
                    onClick={() => handleViewDocument(doc.id)}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    <Eye size={12} />
                    View
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <BookOpen size={32} className="text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500">No resources available for this topic yet.</p>
              <Link 
                href="/browse"
                className="mt-3 text-sm text-green-600 font-medium hover:underline inline-block"
              >
                Browse Full Library →
              </Link>
            </div>
          )}
        </div>

        {/* Back button */}
        <div>
          <Link href={`/class/topics?class=${classId}&subject=${subjectId}`}
            className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-green-600 transition-colors no-underline">
            <ChevronLeft size={15} /> Back to topics
          </Link>
        </div>
      </div>
    </div>
  )
}

function Loading() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <Loader2 size={32} className="text-green-500 animate-spin" />
    </div>
  )
}

export default function LearningRoomPage() {
  return (
    <Suspense fallback={<Loading />}>
      <RoomContent />
    </Suspense>
  )
}