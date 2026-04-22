'use client'
import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { learnApi, lessonsApi, subjectsApi, documentsApi } from '@/lib/api'
import toast from 'react-hot-toast'
import {
  Plus, Trash2, Edit2, Save, X, ChevronDown, ChevronUp,
  BookOpen, GraduationCap, Loader2, Search,
  Link as LinkIcon, CheckCircle2, FileText, Video, HelpCircle,
  Layers, ListChecks
} from 'lucide-react'

// ── Small reusable pieces ─────────────────────
function Badge({ children, color = 'gray' }) {
  const map = {
    green:  'bg-green-50 text-green-700 border-green-100',
    blue:   'bg-blue-50 text-blue-700 border-blue-100',
    amber:  'bg-amber-50 text-amber-700 border-amber-100',
    gray:   'bg-gray-50 text-gray-600 border-gray-100',
  }
  return (
    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${map[color]}`}>
      {children}
    </span>
  )
}

// ── Topic form (create / edit) ────────────────
function TopicForm({ classes, subjects, initial, onSave, onCancel }) {
  const [form, setForm] = useState(
    initial || { class_id: '', subject_id: '', title: '', description: '', sort_order: 0 }
  )
  const [saving, setSaving] = useState(false)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSave = async () => {
    if (!form.class_id || !form.subject_id || !form.title.trim()) {
      toast.error('Class, subject and title are required.')
      return
    }
    setSaving(true)
    try {
      if (initial?.id) {
        await learnApi.adminUpdateTopic(initial.id, form)
        toast.success('Topic updated.')
      } else {
        await learnApi.adminCreateTopic(form)
        toast.success('Topic created.')
      }
      onSave()
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Failed to save topic.')
    } finally { setSaving(false) }
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-gray-900 mb-4">
        {initial?.id ? 'Edit topic' : 'Create new topic'}
      </h3>
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <label className="text-xs font-semibold text-green-700 uppercase tracking-wider block mb-1">Class *</label>
          <select value={form.class_id} onChange={e => set('class_id', e.target.value)}
            className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:border-green-400">
            <option value="">Select class</option>
            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold text-green-700 uppercase tracking-wider block mb-1">Subject *</label>
          <select value={form.subject_id} onChange={e => set('subject_id', e.target.value)}
            className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:border-green-400">
            <option value="">Select subject</option>
            {subjects.map(s => <option key={s.id} value={s.id}>{s.icon_emoji} {s.name}</option>)}
          </select>
        </div>
      </div>
      <div className="mb-3">
        <label className="text-xs font-semibold text-green-700 uppercase tracking-wider block mb-1">Topic title *</label>
        <input value={form.title} onChange={e => set('title', e.target.value)}
          placeholder="e.g. Cell Structure and Function"
          className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:border-green-400" />
      </div>
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="col-span-2">
          <label className="text-xs font-semibold text-green-700 uppercase tracking-wider block mb-1">Description (optional)</label>
          <input value={form.description || ''} onChange={e => set('description', e.target.value)}
            placeholder="Brief description of this topic"
            className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:border-green-400" />
        </div>
        <div>
          <label className="text-xs font-semibold text-green-700 uppercase tracking-wider block mb-1">Order</label>
          <input type="number" value={form.sort_order} onChange={e => set('sort_order', parseInt(e.target.value) || 0)}
            className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:border-green-400 text-center" />
        </div>
      </div>
      <div className="flex gap-2 justify-end">
        <button onClick={onCancel}
          className="px-4 py-2 text-xs font-semibold text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50">
          Cancel
        </button>
        <button onClick={handleSave} disabled={saving}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-green-500 rounded-xl hover:bg-green-400 disabled:opacity-50">
          {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
          {initial?.id ? 'Save changes' : 'Create topic'}
        </button>
      </div>
    </div>
  )
}

// ── Lesson form (create / edit) ────────────────
function LessonForm({ topicId, initial, onSave, onCancel }) {
  const [form, setForm] = useState(
    initial || { topic_id: topicId, title: '', content: '', content_html: '', video_url: '', sort_order: 0, duration_minutes: null }
  )
  const [saving, setSaving] = useState(false)
  const [materials, setMaterials] = useState([])
  const [showMaterialForm, setShowMaterialForm] = useState(false)
  const [newMaterial, setNewMaterial] = useState({ title: '', material_type: 'document', content: '', document_id: '' })

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  useEffect(() => {
    if (initial?.id) {
      lessonsApi.adminGetMaterials(initial.id)
        .then(r => setMaterials(r.data || []))
        .catch(() => {})
    }
  }, [initial?.id])

  const handleSave = async () => {
    if (!form.title.trim()) {
      toast.error('Lesson title is required.')
      return
    }
    setSaving(true)
    try {
      if (initial?.id) {
        await lessonsApi.adminUpdateLesson(initial.id, form)
        toast.success('Lesson updated.')
      } else {
        const { data } = await lessonsApi.adminCreateLesson(form)
        toast.success('Lesson created.')
        // If this is a new lesson, redirect to editing it
        if (onSave && onSave.redirect) {
          onSave.redirect(data.id)
          return
        }
      }
      onSave()
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Failed to save lesson.')
    } finally { setSaving(false) }
  }

  const handleAddMaterial = async () => {
    if (!newMaterial.title.trim()) {
      toast.error('Material title is required.')
      return
    }
    if (!initial?.id) {
      toast.error('Please save the lesson first before adding materials.')
      return
    }
    try {
      await lessonsApi.adminCreateMaterial(initial.id, {
        ...newMaterial,
        document_id: newMaterial.document_id || null
      })
      toast.success('Material added.')
      const { data } = await lessonsApi.adminGetMaterials(initial.id)
      setMaterials(data || [])
      setNewMaterial({ title: '', material_type: 'document', content: '', document_id: '' })
      setShowMaterialForm(false)
    } catch (err) {
      toast.error('Failed to add material.')
    }
  }

  const handleDeleteMaterial = async (materialId) => {
    if (!confirm('Delete this material?')) return
    try {
      await lessonsApi.adminDeleteMaterial(initial.id, materialId)
      toast.success('Material deleted.')
      const { data } = await lessonsApi.adminGetMaterials(initial.id)
      setMaterials(data || [])
    } catch {
      toast.error('Failed to delete material.')
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <BookOpen size={15} className="text-blue-600" />
        {initial?.id ? 'Edit Lesson' : 'Create New Lesson'}
      </h3>
      
      {/* Lesson Title */}
      <div className="mb-4">
        <label className="text-xs font-semibold text-green-700 uppercase tracking-wider block mb-2">Lesson Title *</label>
        <input value={form.title} onChange={e => set('title', e.target.value)}
          placeholder="e.g. Introduction to Cell Biology"
          className="w-full px-4 py-3 text-sm rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:border-green-400 focus:bg-white" />
      </div>
      
      {/* Teaching Notes - Main Content */}
      <div className="mb-4">
        <label className="text-xs font-semibold text-green-700 uppercase tracking-wider block mb-2">
          Teaching Notes (Lesson Content) *
        </label>
        <p className="text-xs text-gray-500 mb-2">This is what students will read and learn from. Write your full lesson content here.</p>
        <textarea value={form.content || ''} onChange={e => set('content', e.target.value)}
          placeholder={`Example:\n\n# Introduction to Cells\n\nCells are the basic building blocks of all living things. ...\n\n## Types of Cells\n\n1. Plant Cells\n2. Animal Cells\n\n**Key Points:**\n- All living organisms are made of cells\n- Cells carry out all life processes`}
          rows={12}
          className="w-full px-4 py-3 text-sm rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:border-green-400 focus:bg-white font-mono leading-relaxed" />
        <p className="text-xs text-gray-400 mt-1">💡 Tip: Use # for headings, ## for subheadings, ** for bold, * for italic, - for bullet points</p>
      </div>
      
      {/* Video URL (Optional) */}
      <div className="mb-4">
        <label className="text-xs font-semibold text-green-700 uppercase tracking-wider block mb-2">
          Video URL (Optional)
        </label>
        <input value={form.video_url || ''} onChange={e => set('video_url', e.target.value)}
          placeholder="https://youtube.com/watch?v=... or https://vimeo.com/..."
          className="w-full px-4 py-3 text-sm rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:border-green-400 focus:bg-white" />
        <p className="text-xs text-gray-400 mt-1">Add a YouTube or Vimeo video link to supplement the lesson</p>
      </div>
      
      {/* Duration and Order */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div>
          <label className="text-xs font-semibold text-green-700 uppercase tracking-wider block mb-2">Reading Time (minutes)</label>
          <input type="number" value={form.duration_minutes || ''} onChange={e => set('duration_minutes', e.target.value ? parseInt(e.target.value) : null)}
            placeholder="15"
            className="w-full px-4 py-3 text-sm rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:border-green-400 focus:bg-white text-center" />
        </div>
        <div>
          <label className="text-xs font-semibold text-green-700 uppercase tracking-wider block mb-2">Lesson Order</label>
          <input type="number" value={form.sort_order} onChange={e => set('sort_order', parseInt(e.target.value) || 0)}
            placeholder="1"
            className="w-full px-4 py-3 text-sm rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:border-green-400 focus:bg-white text-center" />
        </div>
      </div>
      
      {/* Supporting Materials Section */}
      {initial?.id && (
        <div className="border-t-2 border-dashed border-gray-200 pt-5 mb-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wider flex items-center gap-2">
                <FileText size={13} className="text-green-600" />
                Supporting Materials ({materials.length})
              </h4>
              <p className="text-xs text-gray-500 mt-1">PDFs, past papers, diagrams, or other documents students can download</p>
            </div>
            <button onClick={() => setShowMaterialForm(!showMaterialForm)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                showMaterialForm 
                  ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  : 'bg-green-500 text-white hover:bg-green-400'
              }`}>
              {showMaterialForm ? 'Cancel' : '+ Add Material'}
            </button>
          </div>
          
          {/* Add Material Form */}
          {showMaterialForm && (
            <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-4 mb-4 border border-green-100">
              <p className="text-xs font-semibold text-gray-700 mb-3">Add Supporting Material</p>
              <div className="space-y-2">
                <input value={newMaterial.title} onChange={e => setNewMaterial({...newMaterial, title: e.target.value})}
                  placeholder="Material title (e.g. 'Cell Structure Diagram PDF')"
                  className="w-full px-3 py-2.5 text-sm rounded-lg border border-gray-200 bg-white" />
                <select value={newMaterial.material_type} onChange={e => setNewMaterial({...newMaterial, material_type: e.target.value})}
                  className="w-full px-3 py-2.5 text-sm rounded-lg border border-gray-200 bg-white">
                  <option value="document">📄 Document (PDF, DOCX)</option>
                  <option value="video">🎥 Video Link</option>
                  <option value="link">🔗 External Link</option>
                  <option value="text">📝 Text Note</option>
                </select>
                <input value={newMaterial.content} onChange={e => setNewMaterial({...newMaterial, content: e.target.value})}
                  placeholder={newMaterial.material_type === 'link' || newMaterial.material_type === 'video' ? 'https://...' : 'Description or URL'}
                  className="w-full px-3 py-2.5 text-sm rounded-lg border border-gray-200 bg-white" />
                <button onClick={handleAddMaterial}
                  className="w-full px-3 py-2.5 text-xs font-semibold text-white bg-green-500 rounded-lg hover:bg-green-400">
                  ✓ Add Material
                </button>
              </div>
            </div>
          )}
          
          {/* Materials List */}
          {materials.length > 0 && (
            <div className="space-y-2">
              {materials.map(mat => (
                <div key={mat.id} className="flex items-center gap-3 p-3 bg-white border border-gray-100 rounded-lg hover:bg-gray-50">
                  <div className="w-8 h-8 rounded-lg bg-green-50 border border-green-100 flex items-center justify-center flex-shrink-0">
                    <FileText size={13} className="text-green-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-700 truncate">{mat.title}</p>
                    <p className="text-[10px] text-gray-400 capitalize">{mat.material_type === 'document' ? 'Document' : mat.material_type === 'video' ? 'Video' : mat.material_type === 'link' ? 'Link' : 'Text'}</p>
                  </div>
                  <button onClick={() => handleDeleteMaterial(mat.id)}
                    className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors">
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
          
          {materials.length === 0 && !showMaterialForm && (
            <div className="text-center py-6 bg-gray-50 rounded-lg border border-dashed border-gray-200">
              <FileText size={24} className="text-gray-300 mx-auto mb-2" />
              <p className="text-xs text-gray-500">No supporting materials yet</p>
              <p className="text-[10px] text-gray-400 mt-1">Click "+ Add Material" to add PDFs, diagrams, or other resources</p>
            </div>
          )}
        </div>
      )}
      
      {/* Save/Cancel Buttons */}
      <div className="flex gap-2 justify-end pt-3 border-t border-gray-100">
        <button onClick={onCancel}
          className="px-5 py-2.5 text-xs font-semibold text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50">
          Cancel
        </button>
        <button onClick={handleSave} disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-blue-500 rounded-xl hover:bg-blue-400 disabled:opacity-50 disabled:cursor-not-allowed">
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          {initial?.id ? 'Save Changes' : 'Create Lesson'}
        </button>
      </div>
    </div>
  )
}

// ── Resource linker for a topic ───────────────
function ResourceLinker({ topicId, onClose }) {
  const [search,    setSearch]    = useState('')
  const [results,   setResults]   = useState([])
  const [attached,  setAttached]  = useState([])
  const [searching, setSearching] = useState(false)

  useEffect(() => {
    // Load already attached resources
    learnApi.getResources(topicId)
      .then(r => setAttached(r.data.resources || []))
      .catch(() => {})
  }, [topicId])

  const doSearch = async () => {
    if (!search.trim()) return
    setSearching(true)
    try {
      const { data } = await documentsApi.browse({ search, limit: 10 })
      setResults(data.documents || [])
    } catch { toast.error('Search failed.') }
    finally { setSearching(false) }
  }

  const attach = async (doc) => {
    try {
      await learnApi.adminAddResource(topicId, doc.id)
      setAttached(a => [...a, doc])
      toast.success(`"${doc.title}" added to topic.`)
    } catch { toast.error('Failed to attach resource.') }
  }

  const detach = async (docId) => {
    try {
      await learnApi.adminRemoveResource(topicId, docId)
      setAttached(a => a.filter(d => d.id !== docId))
      toast.success('Resource removed.')
    } catch { toast.error('Failed to remove resource.') }
  }

  const attachedIds = new Set(attached.map(d => d.id))

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
          <LinkIcon size={15} className="text-green-600" /> Manage resources for this topic
        </h3>
        <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
          <X size={15} />
        </button>
      </div>

      {/* Currently attached */}
      {attached.length > 0 && (
        <div className="mb-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Attached resources ({attached.length})</p>
          <div className="flex flex-col gap-1.5">
            {attached.map(doc => (
              <div key={doc.id} className="flex items-center gap-3 p-2.5 bg-green-50 border border-green-100 rounded-xl">
                <CheckCircle2 size={14} className="text-green-600 flex-shrink-0" />
                <p className="text-xs font-medium text-green-800 flex-1 truncate">{doc.title}</p>
                <span className="text-[10px] text-green-600 capitalize hidden sm:block">
                  {doc.doc_type?.replace('_', ' ')}
                </span>
                <button onClick={() => detach(doc.id)}
                  className="p-1 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors">
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search & add */}
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Add a document</p>
      <div className="flex gap-2 mb-3">
        <input value={search} onChange={e => setSearch(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && doSearch()}
          placeholder="Search approved documents by title…"
          className="flex-1 px-3 py-2.5 text-sm rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:border-green-400" />
        <button onClick={doSearch} disabled={searching}
          className="px-4 py-2.5 text-xs font-semibold text-white bg-green-500 rounded-xl hover:bg-green-400 disabled:opacity-50 flex items-center gap-1.5">
          {searching ? <Loader2 size={13} className="animate-spin" /> : <Search size={13} />}
          Search
        </button>
      </div>

      {results.length > 0 && (
        <div className="flex flex-col gap-1.5 max-h-52 overflow-y-auto">
          {results.map(doc => (
            <div key={doc.id} className="flex items-center gap-3 p-2.5 bg-gray-50 border border-gray-100 rounded-xl">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-gray-800 truncate">{doc.title}</p>
                <p className="text-[10px] text-gray-400">{doc.subject_name} · {doc.level?.toUpperCase()} · {doc.year}</p>
              </div>
              {attachedIds.has(doc.id) ? (
                <Badge color="green">Added</Badge>
              ) : (
                <button onClick={() => attach(doc)}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-green-700
                    bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors">
                  <Plus size={11} /> Add
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Main Learning Room admin tab ──────────────
export default function TabLearningRoom() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [classes,    setClasses]    = useState([])
  const [subjects,   setSubjects]   = useState([])
  const [topics,     setTopics]     = useState([])
  const [loading,    setLoading]    = useState(true)
  const [showForm,   setShowForm]   = useState(false)
  const [editTopic,  setEditTopic]  = useState(null)
  const [linkTopic,  setLinkTopic]  = useState(null)
  const [filterClass,setFilterClass] = useState('')
  const [filterSubj, setFilterSubj]  = useState('')
  const [manageTopic, setManageTopic] = useState(null) // Topic being managed for lessons/quizzes
  const [lessons, setLessons] = useState([])
  const [quizzes, setQuizzes] = useState([])
  const [activeTab, setActiveTab] = useState('lessons')
  const [showLessonForm, setShowLessonForm] = useState(false)
  const [editLesson, setEditLesson] = useState(null)

  // Auto-open topic management if URL has manageTopic parameter
  useEffect(() => {
    const topicId = searchParams.get('manageTopic')
    if (topicId && topics.length > 0) {
      const topic = topics.find(t => t.id === parseInt(topicId))
      if (topic) {
        handleOpenManageTopic(topic)
      }
    }
  }, [topics, searchParams])
  
  const [showQuizForm, setShowQuizForm] = useState(false)
  const [editQuiz, setEditQuiz] = useState(null)

  const loadAll = async () => {
    setLoading(true)
    try {
      const [clsRes, subjRes, topRes] = await Promise.all([
        learnApi.adminClasses().catch(e => { console.error('adminClasses error:', e); throw e }),
        subjectsApi.list().catch(e => { console.error('subjectsApi error:', e); throw e }),
        learnApi.adminTopics({ class_id: filterClass || undefined, subject_id: filterSubj || undefined }).catch(e => { console.error('adminTopics error:', e); throw e }),
      ])
      console.log('adminClasses:', clsRes.data)
      console.log('subjectsApi:', subjRes.data)
      console.log('adminTopics:', topRes.data)
      setClasses(clsRes.data || [])
      setSubjects(subjRes.data || [])
      setTopics(topRes.data || [])
    } catch (err) { 
      console.error('loadAll error:', err)
      toast.error('Failed to load learning data.') 
    }
    finally { setLoading(false) }
  }

  useEffect(() => { loadAll() }, [filterClass, filterSubj])

  const handleDelete = async (id, title) => {
    if (!confirm(`Delete topic "${title}"? This also removes all resource links for this topic.`)) return
    try {
      await learnApi.adminDeleteTopic(id)
      toast.success('Topic deleted.')
      loadAll()
    } catch { toast.error('Failed to delete.') }
  }
  
  const handleAddTopic = () => {
    router.push('/admin/topics')
  }
  
  const handleEditTopic = (topicId) => {
    router.push(`/admin/topics?topicId=${topicId}`)
  }
  
  const loadLessons = async (topicId) => {
    try {
      const { data } = await lessonsApi.adminGetLessons(topicId)
      setLessons(data || [])
    } catch (err) {
      console.error('Failed to load lessons:', err)
    }
  }
  
  const loadQuizzes = async (topicId) => {
    try {
      const { data } = await lessonsApi.adminGetQuizzes(topicId)
      setQuizzes(data || [])
    } catch (err) {
      console.error('Failed to load quizzes:', err)
    }
  }
  
  const handleOpenManageTopic = (topic) => {
    setManageTopic(topic)
    loadLessons(topic.id)
    loadQuizzes(topic.id)
    setActiveTab('lessons')
  }
  
  const handleAddLesson = (topicId) => {
    router.push(`/admin/lessons/${topicId}`)
  }
  
  const handleEditLesson = (topicId, lessonId) => {
    router.push(`/admin/lessons/${topicId}?lessonId=${lessonId}`)
  }
  
  const handleDeleteLesson = async (id, title) => {
    if (!confirm(`Delete lesson "${title}"?`)) return
    try {
      await lessonsApi.adminDeleteLesson(id)
      toast.success('Lesson deleted.')
      loadLessons(manageTopic.id)
    } catch { toast.error('Failed to delete lesson.') }
  }
  
  const handleDeleteQuiz = async (id, title) => {
    if (!confirm(`Delete quiz "${title}"?`)) return
    try {
      await lessonsApi.adminDeleteQuiz(id)
      toast.success('Quiz deleted.')
      loadQuizzes(manageTopic.id)
    } catch { toast.error('Failed to delete quiz.') }
  }

  const CLASS_COLORS = ['#E6F1FB','#E1F5EE','#FAEEDA','#EEEDFE']
  const CLASS_TEXT   = ['#0C447C','#085041','#633806','#3C3489']

  return (
    <div className="flex flex-col gap-5">

      {/* Header bar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
            <GraduationCap size={16} className="text-green-500" /> Learning Room Management
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">{topics.length} topics across all classes</p>
        </div>
        <button onClick={() => handleAddTopic()}
          className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-white
            bg-green-500 rounded-xl hover:bg-green-400 transition-all">
          <Plus size={14} /> Add topic
        </button>
      </div>

      {/* Class overview cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {classes.map((cls, i) => (
          <button key={cls.id}
            onClick={() => setFilterClass(filterClass === String(cls.id) ? '' : String(cls.id))}
            className={`rounded-xl p-3 text-left border-2 transition-all
              ${filterClass === String(cls.id) ? 'border-green-500 scale-105' : 'border-transparent'}`}
            style={{ background: CLASS_COLORS[i % 4] }}>
            <p className="text-sm font-bold" style={{ color: CLASS_TEXT[i % 4] }}>{cls.name}</p>
            <p className="text-xs mt-1" style={{ color: CLASS_TEXT[i % 4], opacity: 0.7 }}>
              {cls.topic_count || 0} topics
            </p>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <select value={filterClass} onChange={e => { setFilterClass(e.target.value); setFilterSubj('') }}
          className="px-3 py-2 text-sm rounded-xl border border-gray-200 bg-white focus:outline-none focus:border-green-400">
          <option value="">All classes</option>
          {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select value={filterSubj} onChange={e => setFilterSubj(e.target.value)}
          className="px-3 py-2 text-sm rounded-xl border border-gray-200 bg-white focus:outline-none focus:border-green-400">
          <option value="">All subjects</option>
          {subjects.map(s => <option key={s.id} value={s.id}>{s.icon_emoji} {s.name}</option>)}
        </select>
        {(filterClass || filterSubj) && (
          <button onClick={() => { setFilterClass(''); setFilterSubj('') }}
            className="px-3 py-2 text-xs text-gray-500 hover:text-red-500 border border-gray-200 rounded-xl hover:border-red-200 transition-colors">
            Clear filters
          </button>
        )}
      </div>

      {/* Resource linker */}
      {linkTopic && (
        <ResourceLinker
          topicId={linkTopic.id}
          onClose={() => setLinkTopic(null)}
        />
      )}
      
      {/* Lesson & Quiz management for a topic */}
      {manageTopic && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <Layers size={15} className="text-blue-600" />
                Manage topic: <span className="text-green-700">{manageTopic.title}</span>
              </h3>
              <p className="text-xs text-gray-400 mt-1">{lessons.length} lesson(s) · {quizzes.length} quiz(zes)</p>
            </div>
            <button onClick={() => { setManageTopic(null); setShowLessonForm(false); setEditLesson(null); setShowQuizForm(false); setEditQuiz(null) }} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
              <X size={15} />
            </button>
          </div>
          
          {/* Tabs */}
          <div className="flex gap-2 mb-4 border-b border-gray-100">
            <button onClick={() => setActiveTab('lessons')}
              className={`px-4 py-2 text-xs font-semibold rounded-t-lg transition-colors ${
                activeTab === 'lessons' 
                  ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-600' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}>
              <BookOpen size={13} className="inline mr-1" />
              Lessons
            </button>
            <button onClick={() => setActiveTab('quizzes')}
              className={`px-4 py-2 text-xs font-semibold rounded-t-lg transition-colors ${
                activeTab === 'quizzes' 
                  ? 'bg-purple-50 text-purple-700 border-b-2 border-purple-600' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}>
              <HelpCircle size={13} className="inline mr-1" />
              Quizzes
            </button>
          </div>
          
          {/* Lessons Tab */}
          {activeTab === 'lessons' && (
            <div>
              {/* Lesson form */}
              {(showLessonForm || editLesson) && (
                <div className="mb-4">
                  <LessonForm
                    topicId={manageTopic.id}
                    initial={editLesson}
                    onSave={(lessonId) => { 
                      setShowLessonForm(false); 
                      setEditLesson(null); 
                      loadLessons(manageTopic.id);
                      // If a new lesson was created, edit it
                      if (lessonId) {
                        const newLesson = lessons.find(l => l.id === lessonId)
                        if (newLesson) setEditLesson(newLesson)
                      }
                    }}
                    onCancel={() => { setShowLessonForm(false); setEditLesson(null) }}
                  />
                </div>
              )}
              
              {/* Add lesson button */}
              {!showLessonForm && !editLesson && (
                <button onClick={() => handleAddLesson(manageTopic.id)}
                  className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-white
                    bg-blue-500 rounded-xl hover:bg-blue-400 transition-all mb-4">
                  <Plus size={14} /> Add lesson
                </button>
              )}
              
              {/* Lessons list */}
              {lessons.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-xl">
                  <BookOpen size={32} className="text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">No lessons yet</p>
                  <p className="text-xs text-gray-400">Click "Add lesson" to create the first lesson.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {lessons.map((lesson) => (
                    <div key={lesson.id} className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-100 rounded-xl hover:bg-gray-100 transition-colors">
                      <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center flex-shrink-0">
                        <BookOpen size={14} className="text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">{lesson.title}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          {lesson.duration_minutes && (
                            <span className="text-[10px] text-gray-400">{lesson.duration_minutes} min</span>
                          )}
                          {lesson.material_count > 0 && (
                            <span className="text-[10px] text-green-600 font-semibold">{lesson.material_count} material(s)</span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleEditLesson(manageTopic.id, lesson.id)}
                          title="Edit lesson"
                          className="p-1.5 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors">
                          <Edit2 size={13} />
                        </button>
                        <button
                          onClick={() => handleDeleteLesson(lesson.id, lesson.title)}
                          title="Delete lesson"
                          className="p-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-colors border border-red-100">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          
          {/* Quizzes Tab */}
          {activeTab === 'quizzes' && (
            <div>
              {/* Quiz form placeholder */}
              {(showQuizForm || editQuiz) && (
                <div className="mb-4 p-6 text-center bg-gray-50 rounded-xl border border-dashed border-gray-200">
                  <HelpCircle size={32} className="text-purple-300 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-gray-700 mb-1">Quiz Builder</p>
                  <p className="text-xs text-gray-500 mb-3">Create quizzes with questions and multiple-choice answers</p>
                  <button onClick={() => { setShowQuizForm(false); setEditQuiz(null) }}
                    className="px-3 py-1.5 text-xs font-semibold text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-100">
                    Close
                  </button>
                </div>
              )}
              
              {/* Add quiz button */}
              {!showQuizForm && !editQuiz && (
                <button onClick={() => setShowQuizForm(true)}
                  className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-white
                    bg-purple-500 rounded-xl hover:bg-purple-400 transition-all mb-4">
                  <Plus size={14} /> Add quiz
                </button>
              )}
              
              {/* Quizzes list */}
              {quizzes.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-xl">
                  <HelpCircle size={32} className="text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">No quizzes yet</p>
                  <p className="text-xs text-gray-400">Click "Add quiz" to create the first quiz.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {quizzes.map((quiz) => (
                    <div key={quiz.id} className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-100 rounded-xl hover:bg-gray-100 transition-colors">
                      <div className="w-8 h-8 rounded-lg bg-purple-50 border border-purple-100 flex items-center justify-center flex-shrink-0">
                        <HelpCircle size={14} className="text-purple-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">{quiz.title}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          {quiz.question_count > 0 && (
                            <span className="text-[10px] text-purple-600 font-semibold">{quiz.question_count} question(s)</span>
                          )}
                          <span className="text-[10px] text-gray-400">Pass: {quiz.passing_score}%</span>
                          {quiz.time_limit_minutes && (
                            <span className="text-[10px] text-gray-400">{quiz.time_limit_minutes} min</span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => { setEditQuiz(quiz); setShowQuizForm(false) }}
                          title="Edit quiz"
                          className="p-1.5 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors">
                          <Edit2 size={13} />
                        </button>
                        <button
                          onClick={() => handleDeleteQuiz(quiz.id, quiz.title)}
                          title="Delete quiz"
                          className="p-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-colors border border-red-100">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Topics table */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 size={28} className="text-green-500 animate-spin" />
        </div>
      ) : topics.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 py-14 text-center">
          <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-3">
            <BookOpen size={22} className="text-gray-300" />
          </div>
          <p className="text-sm font-semibold text-gray-500">No topics yet</p>
          <p className="text-xs text-gray-400 mt-1">Click "Add topic" to create the first topic.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-50">
                {['#','Topic','Class · Subject','Resources','Status','Actions'].map(h => (
                  <th key={h} className="text-left text-xs font-semibold text-gray-400 px-4 py-3 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {topics.map(topic => (
                <tr key={topic.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors">
                  <td className="px-4 py-3 text-xs text-gray-400 font-mono">{topic.sort_order}</td>
                  <td className="px-4 py-3 max-w-[200px]">
                    <p className="text-sm font-medium text-gray-800 truncate">{topic.title}</p>
                    {topic.description && (
                      <p className="text-xs text-gray-400 truncate mt-0.5">{topic.description}</p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-xs font-semibold text-gray-700">{topic.class_name}</p>
                    <p className="text-xs text-gray-400">{topic.subject_icon} {topic.subject_name}</p>
                  </td>
                  <td className="px-4 py-3">
                    <Badge color={topic.resource_count > 0 ? 'green' : 'gray'}>
                      {topic.resource_count || 0} docs
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge color={topic.is_active ? 'green' : 'gray'}>
                      {topic.is_active ? 'Active' : 'Hidden'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleOpenManageTopic(topic)}
                        title="Manage lessons"
                        className="p-1.5 rounded-lg bg-purple-50 text-purple-600 hover:bg-purple-100 transition-colors border border-purple-100">
                        <Layers size={13} />
                      </button>
                      <button
                        onClick={() => { setLinkTopic(topic); setShowForm(false); setEditTopic(null) }}
                        title="Manage resources"
                        className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors border border-blue-100">
                        <LinkIcon size={13} />
                      </button>
                      <button
                        onClick={() => handleEditTopic(topic.id)}
                        title="Edit topic"
                        className="p-1.5 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors">
                        <Edit2 size={13} />
                      </button>
                      <button
                        onClick={() => handleDelete(topic.id, topic.title)}
                        title="Delete topic"
                        className="p-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-colors border border-red-100">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
