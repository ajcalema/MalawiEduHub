'use client'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'
import { learnApi } from '@/lib/api'
import { useAuth } from '@/lib/auth-context'
import {
  ChevronRight, ChevronLeft, CheckCircle2, Circle,
  BookOpen, Loader2, GraduationCap, Lock
} from 'lucide-react'

export default function TopicsPage() {
  const { classId, subjectId } = useParams()
  const { user } = useAuth()
  const router = useRouter()

  const [topics, setTopics] = useState([])
  const [meta, setMeta] = useState({ class_name: '', subject_name: '', subject_icon: '' })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user === null) { router.push('/auth/login'); return }
    learnApi.getTopics(classId, subjectId)
      .then(r => {
        setTopics(r.data || [])
        if (r.data?.[0]) setMeta({
          class_name: r.data[0].class_name || '',
          subject_name: r.data[0].subject_name || '',
          subject_icon: r.data[0].subject_icon || '📚',
        })
      })
      .finally(() => setLoading(false))
  }, [classId, subjectId, user])

  const completedCount = topics.filter(t => t.completed).length
  const pct = topics.length ? Math.round((completedCount / topics.length) * 100) : 0

  if (!user || loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <Navbar />
      <Loader2 size={32} className="text-green-500 animate-spin" />
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-24 pb-16">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-400 mb-8 flex-wrap">
          <Link href="/learn" className="hover:text-green-600 no-underline flex items-center gap-1 transition-colors">
            <GraduationCap size={14} /> Learning Room
          </Link>
          <ChevronRight size={14} />
          <Link href={`/learn/${classId}`} className="hover:text-green-600 no-underline transition-colors">
            {meta.class_name}
          </Link>
          <ChevronRight size={14} />
          <span className="text-gray-700 font-medium">{meta.subject_icon} {meta.subject_name}</span>
        </div>

        {/* Header + progress */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6 shadow-sm">
          <div className="flex items-start gap-4 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-green-50 flex items-center justify-center text-2xl flex-shrink-0">
              {meta.subject_icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-green-600 uppercase tracking-wider mb-0.5">{meta.class_name}</p>
              <h1 className="font-serif text-2xl text-gray-900">{meta.subject_name}</h1>
            </div>
          </div>

          {topics.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-gray-500 font-medium">Your progress</p>
                <span className="text-xs font-bold text-green-600">{completedCount}/{topics.length} completed</span>
              </div>
              <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-green-500 rounded-full transition-all duration-700"
                  style={{ width: `${pct}%` }} />
              </div>
              {pct === 100 && (
                <p className="text-xs text-green-600 font-semibold mt-2 flex items-center gap-1">
                  <CheckCircle2 size={12} /> All topics completed! Great work.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Topic list */}
        {topics.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
            <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <BookOpen size={26} className="text-gray-300" />
            </div>
            <p className="font-semibold text-gray-600 mb-1">No topics yet</p>
            <p className="text-sm text-gray-400">Admin is still adding topics for this subject.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {topics.map((topic, i) => {
              const isCompleted = topic.completed
              const isLocked = i > 0 && !topics[i - 1].completed && !isCompleted

              return (
                <Link key={topic.id}
                  href={isLocked ? '#' : `/learn/${classId}/${subjectId}/${topic.id}`}
                  className={`group block no-underline ${isLocked ? 'cursor-not-allowed opacity-60' : ''}`}
                  onClick={isLocked ? e => e.preventDefault() : undefined}>
                  <div className={`flex items-center gap-4 p-4 rounded-2xl border transition-all duration-200
                    ${isCompleted
                      ? 'bg-green-50 border-green-200'
                      : isLocked
                        ? 'bg-gray-50 border-gray-100'
                        : 'bg-white border-gray-100 hover:border-green-200 hover:shadow-sm hover:-translate-y-0.5'
                    }`}>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-sm
                      ${isCompleted ? 'bg-green-500 text-white' : isLocked ? 'bg-gray-200 text-gray-400' : 'bg-green-50 text-green-700 border-2 border-green-200'}`}>
                      {isCompleted
                        ? <CheckCircle2 size={18} />
                        : isLocked
                          ? <Lock size={14} />
                          : <span>{String(i + 1).padStart(2, '0')}</span>
                      }
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className={`font-semibold text-sm truncate
                        ${isCompleted ? 'text-green-800' : isLocked ? 'text-gray-400' : 'text-gray-800 group-hover:text-green-700'}`}>
                        {topic.title}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {topic.resource_count || 0} resource{(topic.resource_count || 0) !== 1 ? 's' : ''}
                        {isCompleted && topic.completed_at && (
                          <span className="ml-2 text-green-600">
                            · Completed {new Date(topic.completed_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                          </span>
                        )}
                        {isLocked && <span className="ml-2 text-amber-600">· Complete previous topic first</span>}
                      </p>
                    </div>

                    {!isLocked && (
                      <ChevronRight size={16}
                        className={`flex-shrink-0 transition-transform group-hover:translate-x-1
                          ${isCompleted ? 'text-green-400' : 'text-gray-300'}`} />
                    )}
                  </div>
                </Link>
              )
            })}
          </div>
        )}

        <div className="mt-6">
          <Link href={`/learn/${classId}`}
            className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-green-600 transition-colors no-underline">
            <ChevronLeft size={15} /> Back to subjects
          </Link>
        </div>
      </div>
    </div>
  )
}