'use client'
import { useState, useEffect, Suspense } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'
import { learnApi, subjectsApi } from '@/lib/api'
import { useAuth } from '@/lib/auth-context'
import {
  ArrowLeft, Save, GraduationCap, BookOpen,
  Loader2, Trash2
} from 'lucide-react'
import toast from 'react-hot-toast'

function TopicEditorContent() {
  const searchParams = useSearchParams()
  const topicId = searchParams.get('topicId')
  const { user } = useAuth()
  const router = useRouter()

  const [classes, setClasses] = useState([])
  const [subjects, setSubjects] = useState([])
  const [form, setForm] = useState({
    class_id: '',
    subject_id: '',
    title: '',
    description: '',
    sort_order: 0,
    is_active: true
  })
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  useEffect(() => {
    if (user === null) {
      router.push('/auth/login')
      return
    }

    // Load classes and subjects
    Promise.all([
      learnApi.adminClasses(),
      subjectsApi.list()
    ]).then(([classesRes, subjectsRes]) => {
      setClasses(classesRes.data || [])
      setSubjects(subjectsRes.data || [])
    }).catch(() => {
      toast.error('Failed to load data.')
    })

    // Load topic if editing
    if (topicId) {
      learnApi.adminTopics({})
        .then(({ data }) => {
          const topic = data.find(t => t.id === parseInt(topicId))
          if (topic) {
            setForm({
              class_id: topic.class_id,
              subject_id: topic.subject_id,
              title: topic.title || '',
              description: topic.description || '',
              sort_order: topic.sort_order || 0,
              is_active: topic.is_active !== false
            })
          }
        })
        .catch(() => toast.error('Failed to load topic.'))
    }

    setLoading(false)
  }, [topicId, user])

  const handleSave = async () => {
    if (!form.class_id || !form.subject_id || !form.title.trim()) {
      toast.error('Class, subject, and title are required.')
      return
    }
    setSaving(true)
    try {
      if (topicId) {
        await learnApi.adminUpdateTopic(topicId, form)
        toast.success('Topic updated successfully!')
      } else {
        await learnApi.adminCreateTopic(form)
        toast.success('Topic created successfully!')
      }
      // Go back to learning room
      setTimeout(() => router.push('/admin'), 1000)
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Failed to save topic.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!topicId) return
    if (!confirm('Are you sure you want to delete this topic? This will also remove all lessons, quizzes, and resources.')) return
    try {
      await learnApi.adminDeleteTopic(topicId)
      toast.success('Topic deleted.')
      router.push('/admin')
    } catch {
      toast.error('Failed to delete topic.')
    }
  }

  if (loading) {
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
        {/* Header */}
        <div className="mb-6">
          <Link href="/admin" 
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-green-700 bg-green-50 hover:bg-green-100 border border-green-200 rounded-lg transition-all group mb-4">
            <ArrowLeft size={18} className="group-hover:-translate-x-0.5 transition-transform" />
            <span>Back to Admin</span>
          </Link>
          <h1 className="text-2xl font-serif font-bold text-gray-900">
            {topicId ? 'Edit Topic' : 'Create New Topic'}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {topicId ? 'Update topic details and settings' : 'Add a new topic to the Learning Room'}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
              <h2 className="text-sm font-semibold text-gray-900 mb-6 flex items-center gap-2">
                <GraduationCap size={16} className="text-green-600" />
                Topic Details
              </h2>
              
              <div className="space-y-5">
                {/* Class and Subject */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-green-700 uppercase tracking-wider block mb-2">
                      Class *
                    </label>
                    <select value={form.class_id} onChange={e => set('class_id', e.target.value)}
                      className="w-full px-4 py-3 text-sm rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:border-green-400 focus:bg-white">
                      <option value="">Select class</option>
                      {classes.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-green-700 uppercase tracking-wider block mb-2">
                      Subject *
                    </label>
                    <select value={form.subject_id} onChange={e => set('subject_id', e.target.value)}
                      className="w-full px-4 py-3 text-sm rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:border-green-400 focus:bg-white">
                      <option value="">Select subject</option>
                      {subjects.map(s => (
                        <option key={s.id} value={s.id}>{s.icon_emoji} {s.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Title */}
                <div>
                  <label className="text-xs font-semibold text-green-700 uppercase tracking-wider block mb-2">
                    Topic Title *
                  </label>
                  <input value={form.title} onChange={e => set('title', e.target.value)}
                    placeholder="e.g. Cell Structure and Function"
                    className="w-full px-4 py-3 text-sm rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:border-green-400 focus:bg-white" />
                </div>

                {/* Description */}
                <div>
                  <label className="text-xs font-semibold text-green-700 uppercase tracking-wider block mb-2">
                    Description (Optional)
                  </label>
                  <textarea value={form.description || ''} onChange={e => set('description', e.target.value)}
                    placeholder="Brief description of what this topic covers..."
                    rows={4}
                    className="w-full px-4 py-3 text-sm rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:border-green-400 focus:bg-white" />
                </div>

                {/* Sort Order */}
                <div>
                  <label className="text-xs font-semibold text-green-700 uppercase tracking-wider block mb-2">
                    Display Order
                  </label>
                  <input type="number" value={form.sort_order} onChange={e => set('sort_order', parseInt(e.target.value) || 0)}
                    placeholder="0"
                    className="w-full px-4 py-3 text-sm rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:border-green-400 focus:bg-white text-center max-w-xs" />
                  <p className="text-xs text-gray-400 mt-1">Lower numbers appear first</p>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Save Actions */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm sticky top-24">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Actions</h3>
              <div className="space-y-3">
                <button onClick={handleSave} disabled={saving}
                  className="w-full flex items-center justify-center gap-2 px-5 py-3 text-sm font-semibold text-white 
                    bg-green-500 rounded-xl hover:bg-green-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all">
                  {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  {topicId ? 'Save Changes' : 'Create Topic'}
                </button>
                
                {topicId && (
                  <button onClick={handleDelete}
                    className="w-full flex items-center justify-center gap-2 px-5 py-3 text-sm font-semibold text-red-600 
                      bg-red-50 rounded-xl hover:bg-red-100 transition-all border border-red-100">
                    <Trash2 size={16} />
                    Delete Topic
                  </button>
                )}
              </div>
            </div>

            {/* Help Card */}
            <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-2xl border border-green-100 p-5">
              <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-3 flex items-center gap-2">
                <BookOpen size={14} className="text-green-600" />
                What's Next?
              </h3>
              <ul className="space-y-2 text-xs text-gray-600">
                <li className="flex items-start gap-2">
                  <span className="text-green-600 font-bold mt-0.5">1.</span>
                  <span>Create this topic</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 font-bold mt-0.5">2.</span>
                  <span>Add lessons with teaching notes</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 font-bold mt-0.5">3.</span>
                  <span>Add supporting materials</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 font-bold mt-0.5">4.</span>
                  <span>Create quizzes for assessment</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 font-bold mt-0.5">5.</span>
                  <span>Attach documents as resources</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function TopicEditorPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Navbar />
        <Loader2 size={32} className="text-green-500 animate-spin" />
      </div>
    }>
      <TopicEditorContent />
    </Suspense>
  )
}
