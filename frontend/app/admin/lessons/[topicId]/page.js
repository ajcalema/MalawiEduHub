'use client'
import { useState, useEffect, Suspense } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'
import { lessonsApi, documentsApi } from '@/lib/api'
import { useAuth } from '@/lib/auth-context'
import {
  ArrowLeft, Save, BookOpen, FileText, Video, ListChecks,
  Loader2, Trash2, Upload, X
} from 'lucide-react'
import toast from 'react-hot-toast'

function LessonEditorContent() {
  const { topicId } = useParams()
  const searchParams = useSearchParams()
  const lessonId = searchParams.get('lessonId')
  const { user } = useAuth()
  const router = useRouter()

  const [topic, setTopic] = useState(null)
  const [form, setForm] = useState({
    topic_id: topicId,
    title: '',
    content: '',
    content_html: '',
    video_url: '',
    sort_order: 0,
    duration_minutes: null
  })
  const [materials, setMaterials] = useState([])
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [showMaterialForm, setShowMaterialForm] = useState(false)
  const [newMaterial, setNewMaterial] = useState({ 
    title: '', 
    material_type: 'document', 
    content: '', 
    document_id: '' 
  })
  const [uploadingFile, setUploadingFile] = useState(false)
  const [selectedFile, setSelectedFile] = useState(null)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  useEffect(() => {
    if (user === null) {
      router.push('/auth/login')
      return
    }

    // Load lesson if editing
    if (lessonId) {
      lessonsApi.adminGetLessons(topicId)
        .then(({ data }) => {
          const lesson = data.find(l => l.id === parseInt(lessonId))
          if (lesson) {
            setForm({
              topic_id: lesson.topic_id,
              title: lesson.title || '',
              content: lesson.content || '',
              content_html: lesson.content_html || '',
              video_url: lesson.video_url || '',
              sort_order: lesson.sort_order || 0,
              duration_minutes: lesson.duration_minutes
            })
          }
        })
        .catch(() => toast.error('Failed to load lesson.'))
    }

    // Load topic info
    setTopic({ id: topicId })
    setLoading(false)
  }, [topicId, lessonId, user])

  useEffect(() => {
    if (lessonId) {
      lessonsApi.adminGetMaterials(lessonId)
        .then(({ data }) => setMaterials(data || []))
        .catch(() => {})
    }
  }, [lessonId])

  const handleSave = async () => {
    if (!form.title.trim()) {
      toast.error('Lesson title is required.')
      return
    }
    setSaving(true)
    try {
      if (lessonId) {
        await lessonsApi.adminUpdateLesson(lessonId, form)
        toast.success('Lesson updated successfully!')
        // Stay on edit page after update
      } else {
        const { data } = await lessonsApi.adminCreateLesson(form)
        toast.success('Lesson created successfully!')
        // Redirect to edit mode for the new lesson
        setTimeout(() => router.push(`/admin/lessons/${topicId}?lessonId=${data.id}`), 1000)
        return
      }
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Failed to save lesson.')
    } finally {
      setSaving(false)
    }
  }

  const handleAddMaterial = async () => {
    if (!newMaterial.title.trim()) {
      toast.error('Material title is required.')
      return
    }
    if (!lessonId) {
      toast.error('Please save the lesson first before adding materials.')
      return
    }
    
    // If a file is selected, upload it first
    let documentId = newMaterial.document_id
    if (selectedFile) {
      setUploadingFile(true)
      try {
        const formData = new FormData()
        formData.append('file', selectedFile)
        formData.append('title', newMaterial.title.trim())
        formData.append('subject_name', 'Learning Room')
        formData.append('level', 'learning-room')
        formData.append('doc_type', 'notes')
        formData.append('year', String(new Date().getFullYear()))
        formData.append('description', `Supporting material for lesson`)
        
        const { data } = await documentsApi.uploadAdmin(formData)
        documentId = data.document.id
        toast.success('File uploaded successfully!')
      } catch (err) {
        toast.error(err?.response?.data?.error || 'File upload failed.')
        setUploadingFile(false)
        return
      } finally {
        setUploadingFile(false)
      }
    }
    
    try {
      await lessonsApi.adminCreateMaterial(lessonId, {
        title: newMaterial.title.trim(),
        material_type: newMaterial.material_type,
        content: newMaterial.content || null,
        document_id: documentId || null
      })
      toast.success('Material added.')
      const { data } = await lessonsApi.adminGetMaterials(lessonId)
      setMaterials(data || [])
      setNewMaterial({ title: '', material_type: 'document', content: '', document_id: '' })
      setSelectedFile(null)
      setShowMaterialForm(false)
    } catch (err) {
      toast.error('Failed to add material.')
    }
  }

  const handleDeleteMaterial = async (materialId) => {
    if (!confirm('Delete this material?')) return
    try {
      await lessonsApi.adminDeleteMaterial(lessonId, materialId)
      toast.success('Material deleted.')
      const { data } = await lessonsApi.adminGetMaterials(lessonId)
      setMaterials(data || [])
    } catch {
      toast.error('Failed to delete material.')
    }
  }

  const handleDeleteLesson = async () => {
    if (!lessonId) return
    if (!confirm('Are you sure you want to delete this lesson? This cannot be undone.')) return
    try {
      await lessonsApi.adminDeleteLesson(lessonId)
      toast.success('Lesson deleted.')
      router.push('/admin')
    } catch {
      toast.error('Failed to delete lesson.')
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

      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-24 pb-16">
        {/* Header */}
        <div className="mb-6">
          <Link href="/admin" 
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-green-700 bg-green-50 hover:bg-green-100 border border-green-200 rounded-lg transition-all group mb-4">
            <ArrowLeft size={18} className="group-hover:-translate-x-0.5 transition-transform" />
            <span>Back to Admin</span>
          </Link>
          <h1 className="text-2xl font-serif font-bold text-gray-900">
            {lessonId ? 'Edit Lesson' : 'Create New Lesson'}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {lessonId ? 'Update your lesson content and materials' : 'Add a new lesson with teaching notes and materials'}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content - Teaching Notes */}
          <div className="lg:col-span-2 space-y-6">
            {/* Lesson Info */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
              <h2 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <BookOpen size={16} className="text-blue-600" />
                Lesson Information
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-green-700 uppercase tracking-wider block mb-2">
                    Lesson Title *
                  </label>
                  <input value={form.title} onChange={e => set('title', e.target.value)}
                    placeholder="e.g. Introduction to Cell Biology"
                    className="w-full px-4 py-3 text-sm rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:border-green-400 focus:bg-white" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-green-700 uppercase tracking-wider block mb-2">
                      Reading Time (minutes)
                    </label>
                    <input type="number" value={form.duration_minutes || ''} 
                      onChange={e => set('duration_minutes', e.target.value ? parseInt(e.target.value) : null)}
                      placeholder="15"
                      className="w-full px-4 py-3 text-sm rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:border-green-400 focus:bg-white text-center" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-green-700 uppercase tracking-wider block mb-2">
                      Lesson Order
                    </label>
                    <input type="number" value={form.sort_order} 
                      onChange={e => set('sort_order', parseInt(e.target.value) || 0)}
                      placeholder="1"
                      className="w-full px-4 py-3 text-sm rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:border-green-400 focus:bg-white text-center" />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-green-700 uppercase tracking-wider block mb-2">
                    Video URL (Optional)
                  </label>
                  <input value={form.video_url || ''} onChange={e => set('video_url', e.target.value)}
                    placeholder="https://youtube.com/watch?v=..."
                    className="w-full px-4 py-3 text-sm rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:border-green-400 focus:bg-white" />
                  <p className="text-xs text-gray-400 mt-1">Add a YouTube or Vimeo video to supplement the lesson</p>
                </div>
              </div>
            </div>

            {/* Teaching Notes */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
              <h2 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <BookOpen size={16} className="text-green-600" />
                Teaching Notes (Lesson Content)
              </h2>
              <p className="text-xs text-gray-500 mb-3">
                This is what students will read and learn from. Write your complete lesson content here.
              </p>
              <textarea value={form.content || ''} onChange={e => set('content', e.target.value)}
                placeholder={`Example:

# Introduction to Cells

Cells are the basic building blocks of all living things. Every organism is made of cells, from the smallest bacteria to the largest whale.

## Types of Cells

There are two main types of cells:

1. **Plant Cells** - Have cell walls and chloroplasts
2. **Animal Cells** - Do not have cell walls

## Key Points

- All living organisms are made of cells
- Cells carry out all life processes
- Cells come from pre-existing cells

**Important:** Remember to review the diagram in the supporting materials!`}
                rows={16}
                className="w-full px-4 py-3 text-sm rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:border-green-400 focus:bg-white font-mono leading-relaxed" />
              <p className="text-xs text-gray-400 mt-2">
                💡 Tip: Use # for headings, ## for subheadings, ** for bold, * for italic, - for bullet points, 1. 2. 3. for numbered lists
              </p>
            </div>
          </div>

          {/* Sidebar - Supporting Materials */}
          <div className="space-y-6">
            {/* Save Actions */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm sticky top-24">
              <div className="space-y-3">
                <button onClick={handleSave} disabled={saving}
                  className="w-full flex items-center justify-center gap-2 px-5 py-3 text-sm font-semibold text-white 
                    bg-blue-500 rounded-xl hover:bg-blue-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all">
                  {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  {lessonId ? 'Save Changes' : 'Create Lesson'}
                </button>
                
                {lessonId && (
                  <button onClick={handleDeleteLesson}
                    className="w-full flex items-center justify-center gap-2 px-5 py-3 text-sm font-semibold text-red-600 
                      bg-red-50 rounded-xl hover:bg-red-100 transition-all border border-red-100">
                    <Trash2 size={16} />
                    Delete Lesson
                  </button>
                )}
              </div>
            </div>

            {/* Supporting Materials */}
            {lessonId && (
              <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                    <FileText size={16} className="text-green-600" />
                    Supporting Materials
                  </h2>
                  <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-1 rounded-lg">
                    {materials.length}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mb-4">
                  PDFs, past papers, diagrams, or other downloadable resources
                </p>

                {/* Add Material Button */}
                <button onClick={() => setShowMaterialForm(!showMaterialForm)}
                  className={`w-full px-4 py-2.5 text-xs font-semibold rounded-xl transition-all mb-4 ${
                    showMaterialForm 
                      ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      : 'bg-green-500 text-white hover:bg-green-400'
                  }`}>
                  {showMaterialForm ? 'Cancel' : '+ Add Material'}
                </button>

                {/* Add Material Form */}
                {showMaterialForm && (
                  <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-4 mb-4 border border-green-100">
                    <div className="space-y-3">
                      <input value={newMaterial.title} onChange={e => setNewMaterial({...newMaterial, title: e.target.value})}
                        placeholder="Material title (e.g. 'Chapter Summary PDF')"
                        className="w-full px-3 py-2.5 text-sm rounded-lg border border-gray-200 bg-white" />
                      
                      {/* Material Type Selector */}
                      <select value={newMaterial.material_type} onChange={e => setNewMaterial({...newMaterial, material_type: e.target.value})}
                        className="w-full px-3 py-2.5 text-sm rounded-lg border border-gray-200 bg-white">
                        <option value="document">📄 Document (Upload File)</option>
                        <option value="video">🎥 Video Link</option>
                        <option value="link">🔗 External Link</option>
                        <option value="text">📝 Text Note</option>
                      </select>
                      
                      {/* File Upload Section */}
                      {newMaterial.material_type === 'document' && (
                        <div className="bg-white rounded-lg border-2 border-dashed border-gray-300 p-4 text-center hover:border-green-400 transition-colors">
                          {!selectedFile ? (
                            <label className="cursor-pointer block">
                              <input 
                                type="file" 
                                accept=".pdf,.docx,.pptx"
                                onChange={(e) => {
                                  const file = e.target.files[0]
                                  if (file) {
                                    if (file.size > 20 * 1024 * 1024) {
                                      toast.error('File too large. Maximum 20MB.')
                                      return
                                    }
                                    setSelectedFile(file)
                                    if (!newMaterial.title) {
                                      setNewMaterial({...newMaterial, title: file.name.replace(/\.[^/.]+$/, '')})
                                    }
                                  }
                                }}
                                className="hidden" 
                              />
                              <Upload size={24} className="mx-auto text-gray-400 mb-2" />
                              <p className="text-xs font-semibold text-gray-700 mb-1">Click to upload file</p>
                              <p className="text-[10px] text-gray-400">PDF, DOCX, PPTX (max 20MB)</p>
                            </label>
                          ) : (
                            <div className="flex items-center gap-3">
                              <div className="flex-1 text-left">
                                <p className="text-xs font-semibold text-green-700 truncate">{selectedFile.name}</p>
                                <p className="text-[10px] text-gray-400">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                              </div>
                              <button 
                                onClick={() => setSelectedFile(null)}
                                className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500">
                                <X size={14} />
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                      
                      {/* URL/Content Input (for non-document types) */}
                      {newMaterial.material_type !== 'document' && (
                        <input value={newMaterial.content} onChange={e => setNewMaterial({...newMaterial, content: e.target.value})}
                          placeholder={newMaterial.material_type === 'link' || newMaterial.material_type === 'video' ? 'https://...' : 'Type your note here...'}
                          className="w-full px-3 py-2.5 text-sm rounded-lg border border-gray-200 bg-white" />
                      )}
                      
                      <button onClick={handleAddMaterial} disabled={uploadingFile}
                        className="w-full px-3 py-2.5 text-xs font-semibold text-white bg-green-500 rounded-lg hover:bg-green-400 disabled:opacity-50 disabled:cursor-not-allowed">
                        {uploadingFile ? (
                          <span className="flex items-center justify-center gap-2">
                            <Loader2 size={14} className="animate-spin" />
                            Uploading...
                          </span>
                        ) : (
                          '✓ Add Material'
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {/* Materials List */}
                {materials.length > 0 && (
                  <div className="space-y-2">
                    {materials.map(mat => (
                      <div key={mat.id} className="flex items-center gap-2 p-3 bg-gray-50 border border-gray-100 rounded-lg">
                        <FileText size={14} className="text-green-600 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-gray-700 truncate">{mat.title}</p>
                          <p className="text-[10px] text-gray-400 capitalize">{mat.material_type}</p>
                        </div>
                        <button onClick={() => handleDeleteMaterial(mat.id)}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500">
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {materials.length === 0 && !showMaterialForm && (
                  <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                    <FileText size={24} className="text-gray-300 mx-auto mb-2" />
                    <p className="text-xs text-gray-500">No materials yet</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function LessonEditorPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Navbar />
        <Loader2 size={32} className="text-green-500 animate-spin" />
      </div>
    }>
      <LessonEditorContent />
    </Suspense>
  )
}
