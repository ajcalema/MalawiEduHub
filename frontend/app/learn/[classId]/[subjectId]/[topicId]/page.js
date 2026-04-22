'use client'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'
import AccessModal from '@/components/documents/AccessModal'
import { learnApi, documentsApi } from '@/lib/api'
import { useAuth } from '@/lib/auth-context'
import {
  ChevronLeft, ChevronRight, CheckCircle2, Download,
  FileText, BookOpen, BookMarked, ClipboardList,
  GraduationCap, Loader2, Eye, ArrowRight
} from 'lucide-react'
import toast from 'react-hot-toast'

const TYPE_LABELS = {
  past_paper: 'Past Paper', notes: 'Notes', textbook: 'Textbook',
  marking_scheme: 'Marking Scheme', revision_guide: 'Revision Guide',
}
const TYPE_ICONS = {
  past_paper: FileText, notes: BookOpen, textbook: BookMarked,
  marking_scheme: ClipboardList, revision_guide: GraduationCap,
}
const TYPE_COLORS = {
  past_paper:     'bg-orange-50 text-orange-700',
  notes:          'bg-gray-50 text-gray-600',
  textbook:       'bg-teal-50 text-teal-700',
  marking_scheme: 'bg-pink-50 text-pink-700',
  revision_guide: 'bg-indigo-50 text-indigo-700',
}

// Group resources by type for cleaner display
function groupResources(resources) {
  const order = ['notes', 'revision_guide', 'textbook', 'past_paper', 'marking_scheme']
  const groups = {}
  resources.forEach(r => {
    const k = r.doc_type || 'other'
    if (!groups[k]) groups[k] = []
    groups[k].push(r)
  })
  const result = []
  order.forEach(k => { if (groups[k]) result.push({ type: k, items: groups[k] }) })
  Object.keys(groups).forEach(k => { if (!order.includes(k)) result.push({ type: k, items: groups[k] }) })
  return result
}

export default function LearningRoomPage() {
  const { classId, subjectId, topicId } = useParams()
  const { user, hasAccess } = useAuth()
  const router = useRouter()

  const [data,      setData]      = useState(null)   // { topic, resources }
  const [allTopics, setAllTopics] = useState([])
  const [completed, setCompleted] = useState(false)
  const [loading,   setLoading]   = useState(true)
  const [marking,   setMarking]   = useState(false)
  const [accessDoc, setAccessDoc] = useState(null)

  useEffect(() => {
    if (user === null) { router.push('/auth/login'); return }
    Promise.all([
      learnApi.getResources(topicId),
      learnApi.getTopics(classId, subjectId),
    ]).then(([res, topics]) => {
      setData(res.data)
      setAllTopics(topics.data)
      const thisTopic = topics.data.find(t => String(t.id) === String(topicId))
      if (thisTopic) setCompleted(!!thisTopic.completed)
    }).catch(() => toast.error('Failed to load topic.'))
    .finally(() => setLoading(false))
  }, [topicId, classId, subjectId, user])

  const currentIndex = allTopics.findIndex(t => String(t.id) === String(topicId))
  const prevTopic    = currentIndex > 0 ? allTopics[currentIndex - 1] : null
  const nextTopic    = currentIndex < allTopics.length - 1 ? allTopics[currentIndex + 1] : null

  const handleMarkComplete = async () => {
    setMarking(true)
    try {
      const newVal = !completed
      await learnApi.markProgress(topicId, newVal)
      setCompleted(newVal)
      if (newVal) {
        toast.success('Topic marked as completed! 🎉')
        if (nextTopic) {
          setTimeout(() => router.push(`/learn/${classId}/${subjectId}/${nextTopic.id}`), 1200)
        }
      } else {
        toast.success('Topic marked as incomplete.')
      }
    } catch { toast.error('Failed to save progress.') }
    finally { setMarking(false) }
  }

  const handleDownload = async (doc) => {
    if (!hasAccess()) { setAccessDoc(doc); return }
    try {
      const { data } = await documentsApi.download(doc.id)
      window.open(data.download_url, '_blank')
    } catch (err) {
      if (err?.response?.status === 403) setAccessDoc(doc)
      else toast.error('Download failed.')
    }
  }

  if (!user || loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <Navbar />
      <Loader2 size={32} className="text-green-500 animate-spin" />
    </div>
  )

  if (!data) return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 pt-28 text-center">
        <p className="text-gray-500">Topic not found.</p>
        <Link href={`/learn/${classId}/${subjectId}`} className="text-green-600 text-sm hover:underline">← Back to topics</Link>
      </div>
    </div>
  )

  const { topic, resources } = data
  const grouped = groupResources(resources)

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-24 pb-16">

        {/* Back button + Breadcrumb */}
        <div className="mb-6">
          <button onClick={() => router.back()} className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-green-600 transition-colors mb-4 group">
            <ChevronLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
            <span>Back</span>
          </button>
          <div className="flex items-center gap-1.5 text-xs text-gray-400 flex-wrap">
            <Link href="/learn" className="hover:text-green-600 no-underline transition-colors">Learning Room</Link>
            <ChevronRight size={12} />
            <Link href={`/learn/${classId}`} className="hover:text-green-600 no-underline transition-colors">{topic.class_name}</Link>
            <ChevronRight size={12} />
            <Link href={`/learn/${classId}/${subjectId}`} className="hover:text-green-600 no-underline transition-colors">
              {topic.subject_icon} {topic.subject_name}
            </Link>
            <ChevronRight size={12} />
            <span className="text-gray-600 font-medium truncate max-w-[140px]">{topic.title}</span>
          </div>
        </div>

        {/* Topic header card */}
        <div className={`rounded-2xl border p-6 mb-6 transition-all
          ${completed ? 'bg-green-50 border-green-200' : 'bg-white border-gray-100 shadow-sm'}`}>
          <div className="flex items-start gap-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl flex-shrink-0
              ${completed ? 'bg-green-500' : 'bg-green-50'}`}>
              {completed
                ? <CheckCircle2 size={24} className="text-white" />
                : <span>{topic.subject_icon}</span>}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="text-xs font-semibold text-green-600 uppercase tracking-wider">
                  {topic.class_name} · {topic.subject_name}
                </span>
                {completed && (
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                    Completed
                  </span>
                )}
              </div>
              <h1 className="font-serif text-2xl text-gray-900">{topic.title}</h1>
              {topic.description && (
                <p className="text-sm text-gray-500 mt-1 leading-relaxed">{topic.description}</p>
              )}
            </div>
          </div>

          {/* Topic progress in subject */}
          {allTopics.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-xs text-gray-400">Topic {currentIndex + 1} of {allTopics.length}</p>
                <p className="text-xs text-green-600 font-semibold">
                  {allTopics.filter(t => t.completed).length} / {allTopics.length} done
                </p>
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-green-500 rounded-full transition-all duration-500"
                  style={{ width: `${Math.round((allTopics.filter(t => t.completed).length / allTopics.length) * 100)}%` }} />
              </div>
            </div>
          )}
        </div>

        {/* Resources */}
        {resources.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center mb-6">
            <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-3">
              <BookOpen size={22} className="text-gray-300" />
            </div>
            <p className="text-sm font-semibold text-gray-500 mb-1">No resources yet</p>
            <p className="text-xs text-gray-400">Admin is still adding materials for this topic.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4 mb-6">
            {grouped.map(({ type, items }) => {
              const Icon = TYPE_ICONS[type] || FileText
              return (
                <div key={type} className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                  <div className="px-5 py-3 border-b border-gray-50 flex items-center gap-2">
                    <Icon size={15} className="text-gray-400" />
                    <h2 className="text-sm font-semibold text-gray-700">
                      {TYPE_LABELS[type] || type}
                      <span className="ml-1.5 text-xs font-normal text-gray-400">({items.length})</span>
                    </h2>
                  </div>
                  <div className="divide-y divide-gray-50">
                    {items.map(doc => {
                      const DocIcon = TYPE_ICONS[doc.doc_type] || FileText
                      return (
                        <div key={doc.id}
                          className="flex items-center gap-3 px-5 py-4 hover:bg-gray-50 transition-colors group">
                          <div className="w-9 h-10 bg-green-50 rounded-lg border border-green-100
                            flex items-center justify-center flex-shrink-0">
                            <DocIcon size={15} className="text-green-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-800 truncate group-hover:text-green-700 transition-colors">
                              {doc.title}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className={`text-[11px] font-semibold px-1.5 py-0.5 rounded ${TYPE_COLORS[doc.doc_type] || 'bg-gray-50 text-gray-500'}`}>
                                {TYPE_LABELS[doc.doc_type] || doc.doc_type}
                              </span>
                              {doc.year && <span className="text-xs text-gray-400">{doc.year}</span>}
                              <span className="text-xs text-gray-400 flex items-center gap-0.5">
                                <Download size={10} /> {doc.download_count || 0}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className="text-xs font-semibold text-green-600 hidden sm:block">
                              {doc.is_free ? 'Free' : `MWK ${parseFloat(doc.price_mwk).toLocaleString()}`}
                            </span>
                            <Link href={`/browse/${doc.id}`}
                              className="p-2 rounded-xl border border-gray-200 text-gray-400
                                hover:border-blue-200 hover:text-blue-600 transition-colors no-underline"
                              title="Preview">
                              <Eye size={14} />
                            </Link>
                            <button onClick={() => handleDownload(doc)}
                              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold
                                text-white bg-green-500 rounded-xl hover:bg-green-400 transition-all
                                hover:-translate-y-0.5">
                              <Download size={13} /> Download
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Mark complete button */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-6 shadow-sm">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <p className="text-sm font-semibold text-gray-800">
                {completed ? 'You have completed this topic' : 'Done studying this topic?'}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                {completed
                  ? 'Your progress has been saved. Click to undo.'
                  : 'Mark it complete to track your progress and unlock the next topic.'}
              </p>
            </div>
            <button onClick={handleMarkComplete} disabled={marking}
              className={`flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-xl
                transition-all hover:-translate-y-0.5 disabled:opacity-50 flex-shrink-0
                ${completed
                  ? 'bg-green-500 text-white hover:bg-green-400'
                  : 'border-2 border-green-500 text-green-700 hover:bg-green-50'}`}>
              {marking
                ? <Loader2 size={15} className="animate-spin" />
                : <CheckCircle2 size={15} />}
              {completed ? 'Completed ✓' : 'Mark as complete'}
            </button>
          </div>
        </div>

        {/* Prev / Next navigation */}
        <div className="grid grid-cols-2 gap-3">
          {prevTopic ? (
            <Link href={`/learn/${classId}/${subjectId}/${prevTopic.id}`}
              className="flex items-center gap-3 p-4 bg-white rounded-2xl border border-gray-100
                hover:border-green-200 hover:shadow-sm transition-all no-underline group">
              <ChevronLeft size={18} className="text-gray-400 group-hover:text-green-600 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-[10px] text-gray-400 uppercase tracking-wider">Previous</p>
                <p className="text-sm font-semibold text-gray-700 truncate group-hover:text-green-700 transition-colors">
                  {prevTopic.title}
                </p>
              </div>
            </Link>
          ) : <div />}

          {nextTopic ? (
            <Link href={`/learn/${classId}/${subjectId}/${nextTopic.id}`}
              className="flex items-center gap-3 p-4 bg-white rounded-2xl border border-gray-100
                hover:border-green-200 hover:shadow-sm transition-all no-underline group text-right">
              <div className="min-w-0 flex-1">
                <p className="text-[10px] text-gray-400 uppercase tracking-wider">Next</p>
                <p className="text-sm font-semibold text-gray-700 truncate group-hover:text-green-700 transition-colors">
                  {nextTopic.title}
                </p>
              </div>
              <ChevronRight size={18} className="text-gray-400 group-hover:text-green-600 flex-shrink-0" />
            </Link>
          ) : (
            <Link href={`/learn/${classId}/${subjectId}`}
              className="flex items-center justify-end gap-3 p-4 bg-green-50 rounded-2xl border-2 border-green-200
                hover:bg-green-100 transition-all no-underline group">
              <div className="min-w-0 flex-1 text-right">
                <p className="text-[10px] text-green-600 uppercase tracking-wider font-semibold">Subject complete!</p>
                <p className="text-sm font-semibold text-green-700">Back to topics</p>
              </div>
              <ArrowRight size={18} className="text-green-500 flex-shrink-0" />
            </Link>
          )}
        </div>

      </div>

      {accessDoc && (
        <AccessModal
          doc={accessDoc}
          onClose={() => setAccessDoc(null)}
          onSuccess={() => { setAccessDoc(null); handleDownload(accessDoc) }}
        />
      )}
    </div>
  )
}