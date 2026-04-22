'use client'
import { useState, useEffect, Suspense } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'
import { lessonsApi, documentsApi } from '@/lib/api'
import { useAuth } from '@/lib/auth-context'
import {
  ArrowLeft, Save, BookOpen, FileText, Video, ListChecks,
  Loader2, Upload, X, ChevronDown, Layers, Eye, Copy
} from 'lucide-react'
import toast from 'react-hot-toast'

// Helper function to format inline markdown (bold, italic, code)
function formatInlineMarkdown(text) {
  if (!text) return null
  
  const parts = []
  let remaining = text
  let keyIndex = 0
  
  while (remaining.length > 0) {
    // Bold: **text**
    const boldMatch = remaining.match(/^\*\*(.+?)\*\*/)
    if (boldMatch) {
      parts.push(<strong key={keyIndex++} className="font-bold text-gray-900">{boldMatch[1]}</strong>)
      remaining = remaining.slice(boldMatch[0].length)
      continue
    }
    
    // Italic: *text*
    const italicMatch = remaining.match(/^\*(.+?)\*/)
    if (italicMatch) {
      parts.push(<em key={keyIndex++} className="italic">{italicMatch[1]}</em>)
      remaining = remaining.slice(italicMatch[0].length)
      continue
    }
    
    // Inline code: `text`
    const codeMatch = remaining.match(/^`(.+?)`/)
    if (codeMatch) {
      parts.push(
        <code key={keyIndex++} className="bg-gray-100 px-1.5 py-0.5 rounded text-sm font-mono text-pink-600">
          {codeMatch[1]}
        </code>
      )
      remaining = remaining.slice(codeMatch[0].length)
      continue
    }
    
    // Regular text
    parts.push(remaining[0])
    remaining = remaining.slice(1)
  }
  
  return <>{parts}</>
}

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
  const [allLessons, setAllLessons] = useState([]) // All lessons in this topic for sidebar context
  const [uploadProgress, setUploadProgress] = useState(0) // File upload progress
  const [lastSaved, setLastSaved] = useState(null) // Timestamp of last auto-save
  const [isDraft, setIsDraft] = useState(false) // Whether current content is from draft
  const [showPreview, setShowPreview] = useState(false) // Preview modal

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  // Auto-save draft to localStorage every 30 seconds
  useEffect(() => {
    const draftKey = `lesson-draft-${topicId}-${lessonId || 'new'}`
    
    // Load draft on mount (only for new lessons or if no lesson loaded yet)
    if (!lessonId) {
      const savedDraft = localStorage.getItem(draftKey)
      if (savedDraft) {
        try {
          const draft = JSON.parse(savedDraft)
          // Only load if draft is less than 24 hours old
          const draftAge = Date.now() - draft.timestamp
          if (draftAge < 24 * 60 * 60 * 1000) {
            setForm({
              topic_id: topicId,
              title: draft.title || '',
              content: draft.content || '',
              content_html: draft.content_html || '',
              video_url: draft.video_url || '',
              sort_order: draft.sort_order || 0,
              duration_minutes: draft.duration_minutes
            })
            setIsDraft(true)
            toast.success('Draft restored from previous session')
          } else {
            localStorage.removeItem(draftKey)
          }
        } catch (e) {
          console.error('Failed to load draft:', e)
        }
      }
    }

    // Auto-save interval
    const interval = setInterval(() => {
      if (form.title || form.content) {
        const draftData = {
          ...form,
          timestamp: Date.now()
        }
        localStorage.setItem(draftKey, JSON.stringify(draftData))
        setLastSaved(new Date())
      }
    }, 30000) // Every 30 seconds

    return () => clearInterval(interval)
  }, [topicId, lessonId])

  // Clear draft after successful save
  useEffect(() => {
    if (lessonId && isDraft) {
      const draftKey = `lesson-draft-${topicId}-${lessonId || 'new'}`
      localStorage.removeItem(draftKey)
      setIsDraft(false)
    }
  }, [lessonId])

  useEffect(() => {
    if (user === null) {
      router.push('/auth/login')
      return
    }

    // Load all lessons for this topic (for sidebar context)
    lessonsApi.adminGetLessons(topicId)
      .then(({ data }) => {
        setAllLessons(data || [])
        
        // Load lesson if editing
        if (lessonId) {
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
        }
      })
      .catch(() => toast.error('Failed to load lessons.'))

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
        // Clear draft after successful update
        const draftKey = `lesson-draft-${topicId}-${lessonId}`
        localStorage.removeItem(draftKey)
        setIsDraft(false)
        // Stay on edit page after update
      } else {
        const { data } = await lessonsApi.adminCreateLesson(form)
        toast.success('Lesson created successfully!')
        // Clear draft after successful creation
        const draftKey = `lesson-draft-${topicId}-new`
        localStorage.removeItem(draftKey)
        setIsDraft(false)
        // Redirect to edit the newly created lesson
        setTimeout(() => router.push(`/admin/lessons/${topicId}?lessonId=${data.id}`), 500)
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
      setUploadProgress(0)
      try {
        const formData = new FormData()
        formData.append('file', selectedFile)
        formData.append('title', newMaterial.title.trim())
        formData.append('subject_name', 'Mathematics') // Use valid subject from database
        formData.append('level', 'other') // Valid doc_level enum value
        formData.append('doc_type', 'notes')
        formData.append('year', String(new Date().getFullYear()))
        formData.append('description', `Supporting material for lesson`)
        
        const { data } = await documentsApi.uploadAdmin(formData, (progress) => {
          setUploadProgress(progress)
        })
        documentId = data.document.id
        setUploadProgress(100)
        toast.success('File uploaded successfully!')
      } catch (err) {
        console.error('Upload error:', err)
        console.error('Error response:', err?.response?.data)
        const errorMsg = err?.response?.data?.error || err?.message || 'File upload failed. Try adding a link or text material instead.'
        toast.error(errorMsg)
        setUploadingFile(false)
        setUploadProgress(0)
        return
      } finally {
        setUploadingFile(false)
        setUploadProgress(0)
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

  const handleDuplicateLesson = async () => {
    if (!lessonId) {
      toast.error('Please save the lesson first before duplicating.')
      return
    }
    try {
      // Create a copy with "(Copy)" appended to title
      const duplicateData = {
        ...form,
        title: `${form.title} (Copy)`,
        sort_order: form.sort_order + 1
      }
      const { data } = await lessonsApi.adminCreateLesson(duplicateData)
      toast.success('Lesson duplicated!')
      // Redirect to edit the duplicated lesson
      setTimeout(() => router.push(`/admin/lessons/${topicId}?lessonId=${data.id}`), 500)
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Failed to duplicate lesson.')
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

      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-24 pb-16">
        {/* Breadcrumb Navigation */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            <Link href="/admin" 
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg transition-all">
              <span>Admin</span>
            </Link>
            <span className="text-xs text-gray-400">/</span>
            <button 
              onClick={() => router.push('/admin')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-green-700 bg-green-50 hover:bg-green-100 border border-green-200 rounded-lg transition-all group">
              <ChevronDown size={14} className="group-hover:-translate-x-0.5 transition-transform rotate-90" />
              <span>Learning Room</span>
            </button>
            {topic && (
              <>
                <span className="text-xs text-gray-400">/</span>
                <span className="text-xs text-gray-600 font-medium flex items-center gap-1">
                  <Layers size={12} />
                  {topic.title}
                </span>
              </>
            )}
          </div>
          
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-serif font-bold text-gray-900">
                {lessonId ? 'Edit Lesson' : 'Create New Lesson'}
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                {lessonId ? 'Update your lesson content and materials' : 'Add a new lesson with teaching notes and materials'}
              </p>
              {topic && (
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-1 rounded-md border border-blue-100">
                    Topic: {topic.title}
                  </span>
                  <span className="text-xs text-gray-500">
                    {allLessons.length} lesson{allLessons.length !== 1 ? 's' : ''} in this topic
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Content - Teaching Notes */}
          <div className="lg:col-span-3 space-y-6">
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

            {/* Supporting Materials - Moved to main content for better visibility */}
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
                
                {/* Helpful Tip */}
                <div className="mb-4 p-3 bg-blue-50 border border-blue-100 rounded-lg">
                  <p className="text-xs text-blue-800">
                    <strong>💡 Tip:</strong> If file upload fails, you can add materials as:
                    <br/>• <strong>Video Link</strong> - YouTube/Vimeo URLs
                    <br/>• <strong>External Link</strong> - Any website URL
                    <br/>• <strong>Text Note</strong> - Inline text content
                  </p>
                </div>

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
                            <div className="space-y-3">
                              <div className="flex items-center gap-3">
                                <div className="flex-1 text-left">
                                  <p className="text-xs font-semibold text-green-700 truncate">{selectedFile.name}</p>
                                  <p className="text-[10px] text-gray-400">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                                </div>
                                {!uploadingFile && (
                                  <button 
                                    onClick={() => setSelectedFile(null)}
                                    className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500">
                                    <X size={14} />
                                  </button>
                                )}
                              </div>
                              
                              {/* Upload Progress Bar */}
                              {uploadingFile && (
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between text-xs">
                                    <span className="text-gray-600 font-medium">Uploading...</span>
                                    <span className="text-green-600 font-bold">{uploadProgress}%</span>
                                  </div>
                                  <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                                    <div 
                                      className="bg-gradient-to-r from-green-500 to-green-400 h-2 rounded-full transition-all duration-300"
                                      style={{ width: `${uploadProgress}%` }}
                                    ></div>
                                  </div>
                                </div>
                              )}
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
                
                {/* Done Button - Clear way out */}
                <div className="mt-6 pt-4 border-t border-gray-100">
                  <button 
                    onClick={() => router.push('/admin')}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold text-gray-700 
                      bg-gray-100 rounded-xl hover:bg-gray-200 transition-all">
                    <ArrowLeft size={16} />
                    Done - Back to Admin
                  </button>
                  <p className="text-[10px] text-gray-400 text-center mt-2">
                    Your lesson has been saved. You can return anytime to edit it.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar - Lessons List & Actions */}
          <div className="space-y-6">
            {/* Lessons in Topic Sidebar */}
            {allLessons.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Layers size={14} className="text-blue-600" />
                  Lessons in This Topic
                </h3>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {allLessons.sort((a, b) => a.sort_order - b.sort_order).map((lesson, idx) => {
                    const isCurrentLesson = lessonId && lesson.id === parseInt(lessonId)
                    return (
                      <button
                        key={lesson.id}
                        onClick={() => {
                          if (lesson.id !== parseInt(lessonId)) {
                            router.push(`/admin/lessons/${topicId}?lessonId=${lesson.id}`)
                          }
                        }}
                        className={`w-full text-left p-3 rounded-xl border transition-all ${
                          isCurrentLesson
                            ? 'bg-blue-50 border-blue-200 border-l-4 border-l-blue-500'
                            : 'bg-gray-50 border-gray-100 hover:bg-gray-100'
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          <div className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                            isCurrentLesson ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600'
                          }`}>
                            {idx + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-xs font-medium truncate ${
                              isCurrentLesson ? 'text-blue-900' : 'text-gray-700'
                            }`}>
                              {lesson.title}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              {lesson.duration_minutes && (
                                <span className="text-[10px] text-gray-400">{lesson.duration_minutes} min</span>
                              )}
                              {lesson.material_count > 0 && (
                                <span className="text-[10px] text-green-600 font-semibold">{lesson.material_count} materials</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Save Actions */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm sticky top-24">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Actions</h3>
              
              {/* Auto-save indicator */}
              {lastSaved && !lessonId && (
                <div className="mb-4 p-3 bg-blue-50 border border-blue-100 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                    <p className="text-xs text-blue-700 font-medium">Auto-saving enabled</p>
                  </div>
                  <p className="text-[10px] text-blue-600 mt-1">
                    Last saved: {lastSaved.toLocaleTimeString()}
                  </p>
                </div>
              )}
              
              <div className="space-y-3">
                <button onClick={handleSave} disabled={saving}
                  className="w-full flex items-center justify-center gap-2 px-5 py-3 text-sm font-semibold text-white 
                    bg-blue-500 rounded-xl hover:bg-blue-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all">
                  {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  {lessonId ? 'Update Lesson' : 'Create Lesson'}
                </button>
                
                {/* Preview Button */}
                {(form.title || form.content) && (
                  <button 
                    onClick={() => setShowPreview(true)}
                    className="w-full flex items-center justify-center gap-2 px-5 py-3 text-sm font-semibold text-purple-700 
                      bg-purple-50 rounded-xl hover:bg-purple-100 transition-all border border-purple-200">
                    <Eye size={16} />
                    Preview Lesson
                  </button>
                )}
                
                {/* Save & Add Another Button */}
                {!lessonId && (
                  <button 
                    onClick={async () => {
                      if (!form.title.trim()) {
                        toast.error('Lesson title is required.')
                        return
                      }
                      setSaving(true)
                      try {
                        const { data } = await lessonsApi.adminCreateLesson(form)
                        toast.success('Lesson created!')
                        // Redirect to edit the newly created lesson
                        setTimeout(() => router.push(`/admin/lessons/${topicId}?lessonId=${data.id}`), 500)
                      } catch (err) {
                        toast.error(err?.response?.data?.error || 'Failed to save lesson.')
                      } finally {
                        setSaving(false)
                      }
                    }} 
                    disabled={saving}
                    className="w-full flex items-center justify-center gap-2 px-5 py-3 text-sm font-semibold text-green-700 
                      bg-green-50 rounded-xl hover:bg-green-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all border border-green-200">
                    <Save size={16} />
                    Save & Add Another
                  </button>
                )}
                
                {lessonId && (
                  <button 
                    onClick={() => router.push(`/admin/lessons/${topicId}`)}
                    className="w-full flex items-center justify-center gap-2 px-5 py-3 text-sm font-semibold text-green-700 
                      bg-green-50 rounded-xl hover:bg-green-100 transition-all border border-green-200">
                    + Create New Lesson
                  </button>
                )}
                
                {lessonId && (
                  <button 
                    onClick={handleDuplicateLesson}
                    className="w-full flex items-center justify-center gap-2 px-5 py-3 text-sm font-semibold text-indigo-700 
                      bg-indigo-50 rounded-xl hover:bg-indigo-100 transition-all border border-indigo-200">
                    <Copy size={16} />
                    Duplicate Lesson
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div>
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Eye size={20} className="text-purple-600" />
                  Lesson Preview
                </h2>
                <p className="text-xs text-gray-500 mt-1">How students will see this lesson</p>
              </div>
              <button 
                onClick={() => setShowPreview(false)}
                className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
                <X size={20} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="overflow-y-auto max-h-[calc(90vh-80px)] p-6">
              {/* Lesson Title */}
              {form.title && (
                <h1 className="text-3xl font-serif font-bold text-gray-900 mb-4">{form.title}</h1>
              )}

              {/* Lesson Meta */}
              <div className="flex items-center gap-3 mb-6 pb-6 border-b border-gray-100">
                {form.duration_minutes && (
                  <span className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-lg">
                    ⏱️ {form.duration_minutes} minutes
                  </span>
                )}
                {form.video_url && (
                  <span className="text-sm text-gray-600 bg-red-50 text-red-700 px-3 py-1 rounded-lg border border-red-100">
                    🎥 Video included
                  </span>
                )}
              </div>

              {/* Lesson Content - Markdown Preview */}
              {form.content ? (
                <div className="prose prose-lg max-w-none">
                  {/* Simple markdown rendering */}
                  {form.content.split('\n').map((line, idx) => {
                    // Headings
                    if (line.startsWith('# ')) {
                      return <h1 key={idx} className="text-3xl font-bold text-gray-900 mt-8 mb-4">{line.replace('# ', '')}</h1>
                    }
                    if (line.startsWith('## ')) {
                      return <h2 key={idx} className="text-2xl font-bold text-gray-800 mt-6 mb-3">{line.replace('## ', '')}</h2>
                    }
                    if (line.startsWith('### ')) {
                      return <h3 key={idx} className="text-xl font-bold text-gray-800 mt-4 mb-2">{line.replace('### ', '')}</h3>
                    }
                    
                    // Empty lines
                    if (line.trim() === '') {
                      return <div key={idx} className="h-4"></div>
                    }
                    
                    // Bullet points
                    if (line.startsWith('- ') || line.startsWith('* ')) {
                      const content = line.replace(/^[-*] /, '')
                      return (
                        <li key={idx} className="ml-6 text-gray-700 mb-2">
                          {formatInlineMarkdown(content)}
                        </li>
                      )
                    }
                    
                    // Numbered lists
                    if (/^\d+\.\s/.test(line)) {
                      const content = line.replace(/^\d+\.\s/, '')
                      return (
                        <li key={idx} className="ml-6 text-gray-700 mb-2 list-decimal">
                          {formatInlineMarkdown(content)}
                        </li>
                      )
                    }
                    
                    // Regular paragraphs
                    return (
                      <p key={idx} className="text-gray-700 leading-relaxed mb-4">
                        {formatInlineMarkdown(line)}
                      </p>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-12 bg-gray-50 rounded-xl">
                  <BookOpen size={48} className="text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No content yet</p>
                </div>
              )}

              {/* Video Section */}
              {form.video_url && (
                <div className="mt-8 p-6 bg-gray-50 rounded-xl border border-gray-100">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <Video size={16} className="text-red-600" />
                    Supplementary Video
                  </h3>
                  <p className="text-xs text-gray-500 break-all">{form.video_url}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
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
