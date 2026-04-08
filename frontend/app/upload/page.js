'use client'
import { useState, useRef, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'
import { documentsApi, subjectsApi } from '@/lib/api'
import { useAuth } from '@/lib/auth-context'
import toast from 'react-hot-toast'
import {
  Upload, FileText, CheckCircle2, AlertCircle, Loader2,
  BookOpen, BookMarked, ClipboardList, GraduationCap,
  ChevronRight, RotateCcw, ExternalLink, Info, Calendar
} from 'lucide-react'

// ── Constants ────────────────────────────────
const LEVELS = [
  { value: 'primary',    label: 'Primary',    sub: 'Std 1–8' },
  { value: 'jce',        label: 'JCE',        sub: 'Form 1–2' },
  { value: 'msce',       label: 'MSCE',       sub: 'Form 3–4' },
  { value: 'tvet',       label: 'TVET',       sub: 'Technical/Vocational' },
  { value: 'university', label: 'University', sub: 'Degree level' },
]

const DOC_TYPES = [
  { value: 'past_paper',     label: 'Past Paper',     icon: FileText },
  { value: 'notes',          label: 'Notes',          icon: BookOpen },
  { value: 'textbook',       label: 'Textbook',       icon: BookMarked },
  { value: 'marking_scheme', label: 'Marking Scheme', icon: ClipboardList },
  { value: 'revision_guide', label: 'Revision Guide', icon: GraduationCap },
  { value: 'assignment',     label: 'Assignment',     icon: FileText },
  { value: 'syllabus',       label: 'Syllabus',       icon: BookOpen },
  { value: 'school_calendar',label: 'School Calendar',icon: Calendar },
]

const YEARS = Array.from({ length: 15 }, (_, i) => String(2024 - i))

const CHECK_STEPS = [
  { key: 'upload',   label: 'Uploading file to server',          ms: 900  },
  { key: 'hash',     label: 'Checking file hash (exact match)',  ms: 700  },
  { key: 'metadata', label: 'Matching title, level and year',    ms: 900  },
  { key: 'content',  label: 'Scanning document content (NLP)',   ms: 1500 },
  { key: 'queue',    label: 'Sending to admin review queue',     ms: 600  },
]

const delay = (ms) => new Promise(r => setTimeout(r, ms))

// ── Step bar ─────────────────────────────────
function StepBar({ step }) {
  const steps = ['Select file', 'Document info', 'Verification', 'Result']
  return (
    <div className="flex items-center gap-0 mb-8">
      {steps.map((label, i) => {
        const s = i + 1
        return (
          <div key={label} className="flex items-center">
            <div className="flex flex-col items-center gap-1.5">
              <div className={`
                w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300
                ${s < step  ? 'bg-green-500 text-white scale-90' : ''}
                ${s === step ? 'bg-green-500 text-white ring-4 ring-green-100 scale-110' : ''}
                ${s > step  ? 'bg-gray-100 text-gray-400' : ''}
              `}>
                {s < step ? <CheckCircle2 size={16} /> : s}
              </div>
              <span className={`text-[11px] font-medium whitespace-nowrap hidden sm:block
                ${s === step ? 'text-green-700' : 'text-gray-400'}`}>
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={`h-px w-12 sm:w-16 mx-1 sm:mx-2 mb-4 transition-all duration-500
                ${s < step ? 'bg-green-400' : 'bg-gray-100'}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── Step 1: File selection ───────────────────
function StepSelectFile({ onFileSelected }) {
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef(null)

  const handleFile = (file) => {
    if (!file) return
    const allowed = ['application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation']
    if (!allowed.includes(file.type)) {
      toast.error('Only PDF, DOCX, and PPTX files are allowed.')
      return
    }
    if (file.size > 20 * 1024 * 1024) {
      toast.error('File too large. Maximum size is 20MB.')
      return
    }
    onFileSelected(file)
  }

  const onDrop = useCallback((e) => {
    e.preventDefault(); setDragging(false)
    handleFile(e.dataTransfer.files[0])
  }, [])

  return (
    <div className="animate-fade-up">
      <div className="flex items-start gap-3 p-4 rounded-2xl bg-amber-50 border border-amber-100 mb-6">
        <div className="w-8 h-8 rounded-xl bg-amber-400 flex items-center justify-center flex-shrink-0">
          <Upload size={15} className="text-amber-900" />
        </div>
        <div>
          <p className="text-sm font-semibold text-amber-900">Upload to access for free</p>
          <p className="text-xs text-amber-700 mt-0.5 leading-relaxed">
            Upload 5–10 approved documents and earn a free 1-day access pass.
            Duplicate documents are automatically rejected.
          </p>
        </div>
      </div>

      <div
        onDrop={onDrop}
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onClick={() => inputRef.current?.click()}
        className={`
          relative border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer
          transition-all duration-200 select-none
          ${dragging
            ? 'border-green-400 bg-green-50 scale-[1.01]'
            : 'border-gray-200 bg-gray-50 hover:border-green-300 hover:bg-green-50/50'}
        `}
      >
        <input ref={inputRef} type="file"
          accept=".pdf,.docx,.pptx"
          onChange={e => handleFile(e.target.files[0])}
          className="hidden" />

        <div className={`w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center transition-all
          ${dragging ? 'bg-green-100' : 'bg-white border border-gray-200'}`}>
          <Upload size={28} className={dragging ? 'text-green-600' : 'text-gray-400'} />
        </div>

        <p className="text-base font-semibold text-gray-700 mb-1">
          {dragging ? 'Drop it here!' : 'Drag and drop your file here'}
        </p>
        <p className="text-sm text-gray-400 mb-4">
          or <span className="text-green-600 font-semibold">browse from your device</span>
        </p>
        <div className="flex items-center justify-center gap-2 flex-wrap">
          {['PDF', 'DOCX', 'PPTX', 'Max 20MB'].map(t => (
            <span key={t} className="text-xs font-semibold px-3 py-1 rounded-full bg-white border border-gray-200 text-gray-500">{t}</span>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Step 2: Metadata form ────────────────────
function StepDocInfo({ file, onBack, onSubmit, loading }) {
  const [form, setForm] = useState({
    title:         file?.name?.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ') || '',
    subject_name:  '',
    level:         '',
    doc_type:      '',
    year:          String(new Date().getFullYear()),
    description:   '',
  })
  const [errors, setErrors] = useState({})
  const [suggestions, setSuggestions] = useState([])
  const [hintsOpen, setHintsOpen] = useState(false)

  const set = (k, v) => { setForm(f => ({ ...f, [k]: v })); setErrors(e => ({ ...e, [k]: '' })) }

  useEffect(() => {
    const q = form.subject_name.trim()
    if (q.length < 1) {
      setSuggestions([])
      return
    }
    const t = setTimeout(() => {
      subjectsApi
        .list({ q })
        .then((r) => setSuggestions(Array.isArray(r.data) ? r.data : []))
        .catch(() => setSuggestions([]))
    }, 280)
    return () => clearTimeout(t)
  }, [form.subject_name])

  const validate = () => {
    const e = {}
    if (!form.title.trim()) e.title = 'Document title is required.'
    const sub = form.subject_name.trim()
    if (!sub) e.subject_name = 'Enter a subject name.'
    else if (sub.length < 2) e.subject_name = 'Subject name must be at least 2 characters.'
    if (!form.level) e.level = 'Select an education level.'
    if (!form.doc_type) e.doc_type = 'Select a document type.'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = (e) => { e.preventDefault(); if (validate()) onSubmit(form) }

  const fc = (err) => `w-full px-4 py-3 text-sm rounded-xl border bg-gray-50 transition-all
    focus:outline-none focus:bg-white placeholder:text-gray-400
    ${err ? 'border-red-300' : 'border-gray-200 focus:border-green-400 focus:shadow-[0_0_0_3px_rgba(13,122,85,0.1)]'}`

  return (
    <div className="animate-fade-up">
      <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-100 rounded-2xl mb-6">
        <div className="w-10 h-12 bg-white rounded-lg border border-green-200 flex items-center justify-center flex-shrink-0">
          <FileText size={18} className="text-green-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-green-900 truncate">{file?.name}</p>
          <p className="text-xs text-green-600">{file?.name?.split('.').pop().toUpperCase()} · {(file?.size / 1048576).toFixed(1)} MB</p>
        </div>
        <button onClick={onBack} className="text-xs text-gray-400 hover:text-red-500 transition-colors px-2 py-1 rounded-lg hover:bg-red-50">Change</button>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
        {/* Title */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold text-green-700 uppercase tracking-wider">Document title <span className="text-red-400">*</span></label>
          <input value={form.title} onChange={e => set('title', e.target.value)}
            placeholder="e.g. MSCE Biology Paper 1 2023" className={fc(errors.title)} />
          {errors.title && <p className="text-xs text-red-500">⚠ {errors.title}</p>}
        </div>

        {/* Subject — free text; server matches existing or creates new */}
        <div className="flex flex-col gap-2">
          <label htmlFor="upload-subject" className="text-xs font-semibold text-green-700 uppercase tracking-wider">
            Subject <span className="text-red-400">*</span>
          </label>
          <p className="text-xs text-gray-500 -mt-1">
            Type the subject (e.g. Biology, Mathematics). Suggestions appear as you type. If it is not in the library yet, it will be added when you submit.
          </p>
          <div className="relative">
            <input
              id="upload-subject"
              type="text"
              autoComplete="off"
              value={form.subject_name}
              onChange={(e) => set('subject_name', e.target.value)}
              onFocus={() => setHintsOpen(true)}
              onBlur={() => { setTimeout(() => setHintsOpen(false), 180) }}
              placeholder="e.g. Chemistry, English, Computer Studies"
              className={fc(errors.subject_name)}
            />
            {hintsOpen && suggestions.length > 0 && (
              <ul
                className="absolute z-20 left-0 right-0 mt-1 max-h-48 overflow-auto rounded-xl border border-gray-200 bg-white shadow-lg py-1"
                role="listbox"
              >
                {suggestions.map((s) => (
                  <li key={s.id}>
                    <button
                      type="button"
                      className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-green-50 flex items-center gap-2"
                      onMouseDown={(ev) => {
                        ev.preventDefault()
                        set('subject_name', s.name)
                        setHintsOpen(false)
                      }}
                    >
                      <span>{s.icon_emoji || '📚'}</span>
                      <span>{s.name}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          {errors.subject_name && <p className="text-xs text-red-500">⚠ {errors.subject_name}</p>}
        </div>

        {/* Level */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold text-green-700 uppercase tracking-wider">Education level <span className="text-red-400">*</span></label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {LEVELS.map(l => (
              <button key={l.value} type="button" onClick={() => set('level', l.value)}
                className={`py-3 px-3 rounded-xl border text-center transition-all
                  ${form.level === l.value ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-green-300'}`}>
                <p className={`text-sm font-semibold ${form.level === l.value ? 'text-green-800' : 'text-gray-700'}`}>{l.label}</p>
                <p className={`text-[11px] ${form.level === l.value ? 'text-green-600' : 'text-gray-400'}`}>{l.sub}</p>
              </button>
            ))}
          </div>
          {errors.level && <p className="text-xs text-red-500">⚠ {errors.level}</p>}
        </div>

        {/* Type */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold text-green-700 uppercase tracking-wider">Document type <span className="text-red-400">*</span></label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {DOC_TYPES.map(({ value, label, icon: Icon }) => (
              <button key={value} type="button" onClick={() => set('doc_type', value)}
                className={`py-2.5 px-3 rounded-xl border text-sm font-medium flex items-center gap-2 transition-all
                  ${form.doc_type === value ? 'border-green-500 bg-green-50 text-green-800' : 'border-gray-200 text-gray-600 hover:border-green-300'}`}>
                <Icon size={14} className={form.doc_type === value ? 'text-green-600' : 'text-gray-400'} />
                {label}
              </button>
            ))}
          </div>
          {errors.doc_type && <p className="text-xs text-red-500">⚠ {errors.doc_type}</p>}
        </div>

        {/* Year */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold text-green-700 uppercase tracking-wider">Year</label>
          <select value={form.year} onChange={e => set('year', e.target.value)} className={fc(false)}>
            {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>

        {/* Description */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold text-green-700 uppercase tracking-wider">
            Description <span className="text-gray-400 normal-case tracking-normal font-normal">— optional</span>
          </label>
          <textarea value={form.description} onChange={e => set('description', e.target.value)}
            placeholder="e.g. Contains marking scheme and model answers for section A and B…"
            rows={3}
            className="w-full px-4 py-3 text-sm rounded-xl border border-gray-200 bg-gray-50
              focus:outline-none focus:border-green-400 focus:bg-white transition-all resize-none placeholder:text-gray-400" />
        </div>

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onBack}
            className="px-5 py-3 text-sm font-semibold text-gray-600 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors">
            ← Back
          </button>
          <button type="submit" disabled={loading}
            className="flex-1 py-3 text-sm font-semibold text-white bg-green-500 rounded-xl
              hover:bg-green-400 transition-all hover:-translate-y-0.5 disabled:opacity-50
              flex items-center justify-center gap-2">
            {loading
              ? <><Loader2 size={16} className="animate-spin" /> Submitting…</>
              : <>Submit document <ChevronRight size={16} /></>}
          </button>
        </div>
      </form>
    </div>
  )
}

// ── Step 3: Verification animation ───────────
function StepVerifying({ checkState }) {
  const done = checkState.filter(s => s.status === 'done').length
  const pct  = Math.round((done / checkState.length) * 100)

  return (
    <div className="animate-fade-up">
      <div className="text-center mb-8">
        <p className="text-sm font-semibold text-gray-500 mb-3">Verifying your document…</p>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full bg-green-500 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
        </div>
        <p className="text-xs text-gray-400 mt-2">{pct}% complete</p>
      </div>

      <div className="flex flex-col gap-3">
        {checkState.map(({ key, label, status }) => (
          <div key={key} className={`flex items-center gap-4 p-4 rounded-xl border transition-all duration-300
            ${status === 'running' ? 'border-blue-200 bg-blue-50' : ''}
            ${status === 'done'    ? 'border-green-100 bg-green-50' : ''}
            ${status === 'error'   ? 'border-red-200 bg-red-50' : ''}
            ${status === 'waiting' ? 'border-gray-100 bg-gray-50' : ''}
          `}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0
              ${status === 'running' ? 'bg-blue-100' : ''}
              ${status === 'done'    ? 'bg-green-100' : ''}
              ${status === 'error'   ? 'bg-red-100' : ''}
              ${status === 'waiting' ? 'bg-gray-100' : ''}
            `}>
              {status === 'running' && <Loader2 size={16} className="text-blue-500 animate-spin" />}
              {status === 'done'    && <CheckCircle2 size={16} className="text-green-600" />}
              {status === 'error'   && <AlertCircle size={16} className="text-red-500" />}
              {status === 'waiting' && <div className="w-2 h-2 rounded-full bg-gray-300" />}
            </div>
            <p className={`text-sm font-medium flex-1
              ${status === 'running' ? 'text-blue-800' : ''}
              ${status === 'done'    ? 'text-green-800' : ''}
              ${status === 'error'   ? 'text-red-800' : ''}
              ${status === 'waiting' ? 'text-gray-500' : ''}
            `}>{label}</p>
            <span className={`text-xs font-semibold
              ${status === 'running' ? 'text-blue-500' : ''}
              ${status === 'done'    ? 'text-green-600' : ''}
              ${status === 'error'   ? 'text-red-500' : ''}
              ${status === 'waiting' ? 'text-gray-400' : ''}
            `}>
              {status === 'running' ? 'Checking…' : status === 'done' ? 'Passed ✓' : status === 'error' ? 'Issue found' : 'Waiting'}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Step 4: Result ───────────────────────────
function StepResult({ result, uploadProgress, onUploadAnother, onBrowse }) {
  const isDuplicate = result?.type === 'duplicate'
  const isSuccess   = result?.type === 'success'
  const isFlagged   = result?.type === 'flagged'
  const grantedPass = result?.granted_upload_pass

  return (
    <div className="animate-fade-up flex flex-col gap-4">
      <div className={`rounded-2xl p-6 text-center border
        ${isSuccess   ? 'bg-green-50 border-green-200' : ''}
        ${isFlagged   ? 'bg-amber-50 border-amber-200' : ''}
        ${isDuplicate ? 'bg-red-50 border-red-200' : ''}
      `}>
        <div className={`w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center
          ${isSuccess   ? 'bg-green-500' : ''}
          ${isFlagged   ? 'bg-amber-400' : ''}
          ${isDuplicate ? 'bg-red-500' : ''}
        `}>
          {isSuccess   && <CheckCircle2 size={30} className="text-white" />}
          {isFlagged   && <Info size={30} className="text-white" />}
          {isDuplicate && <AlertCircle size={30} className="text-white" />}
        </div>

        <h2 className={`font-serif text-xl mb-2
          ${isSuccess ? 'text-green-900' : isFlagged ? 'text-amber-900' : 'text-red-900'}`}>
          {grantedPass ? '🎉 Upload pass earned!' : isSuccess ? 'Document submitted!' : isFlagged ? 'Flagged for review' : 'Duplicate detected'}
        </h2>
        <div className="text-sm leading-relaxed max-w-sm mx-auto
          ${isSuccess ? 'text-green-700' : isFlagged ? 'text-amber-700' : 'text-red-700'}">
          <p>
            {result?.message
              || (grantedPass && 'Congratulations! You have earned a free 1-day access pass for uploading 5 documents. You can now download files from the library.')
              || (isSuccess && !grantedPass && 'Your document is in the admin review queue and will go live once approved — usually within 24 hours.')
              || (isFlagged && 'Your document was submitted but flagged for admin review due to content similarity with an existing document.')
              || result?.reason
              || 'This document already exists in the library. Please upload a different document.'}
          </p>
          {isSuccess && !grantedPass && (
            <p className="text-sm text-green-700 mt-3">
              You can monitor its status from your dashboard and we’ll notify you once it is approved.
            </p>
          )}
        </div>

        {isDuplicate && result?.matchedDoc && (
          <div className="mt-4 p-3 bg-white rounded-xl border border-red-100 text-left">
            <p className="text-xs font-semibold text-gray-500 mb-1">Matched document</p>
            <p className="text-sm font-semibold text-gray-800">{result.matchedDoc.title}</p>
            <div className="flex items-center gap-4 mt-2">
              <span className="text-xs text-gray-500">Similarity: <strong className="text-red-600">{result.score}%</strong></span>
              <span className="text-xs text-gray-500">Detected by: <strong className="text-gray-700 capitalize">{result.layer}</strong> check</span>
            </div>
            <div className="mt-2 h-1.5 bg-red-100 rounded-full overflow-hidden">
              <div className="h-full bg-red-500 rounded-full transition-all" style={{ width: `${result.score}%` }} />
            </div>
          </div>
        )}
      </div>

      {(isSuccess || isFlagged) && uploadProgress && (
        <div className="p-4 bg-white rounded-2xl border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold text-gray-800">Upload pass progress</p>
            <span className="text-xs font-bold text-green-600">
              {uploadProgress.approved_count} / {uploadProgress.threshold}
            </span>
          </div>
          <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-green-500 rounded-full transition-all duration-700"
              style={{ width: `${uploadProgress.pct}%` }} />
          </div>
          <p className="text-xs text-gray-400 mt-2">
            {uploadProgress.remaining > 0
              ? `Upload ${uploadProgress.remaining} more approved document${uploadProgress.remaining !== 1 ? 's' : ''} to unlock your free 1-day pass`
              : '🎉 You have earned your free access pass! Check your dashboard.'}
          </p>
        </div>
      )}

      <div className="flex gap-3">
        <button onClick={onUploadAnother}
          className="flex-1 py-3 text-sm font-semibold text-green-700 rounded-xl border-2 border-green-200
            hover:bg-green-50 transition-all flex items-center justify-center gap-2">
          <RotateCcw size={15} /> Upload another
        </button>
        <button onClick={onBrowse}
          className="flex-1 py-3 text-sm font-semibold text-white bg-green-500 rounded-xl
            hover:bg-green-400 transition-all hover:-translate-y-0.5 flex items-center justify-center gap-2">
          Browse library <ExternalLink size={14} />
        </button>
      </div>
    </div>
  )
}

// ── Main page ────────────────────────────────
export default function UploadPage() {
  const { user, refreshProfile }  = useAuth()
  const router    = useRouter()

  const [step,           setStep]           = useState(1)
  const [file,           setFile]           = useState(null)
  const [loading,        setLoading]        = useState(false)
  const [result,         setResult]         = useState(null)
  const [uploadProgress, setUploadProgress] = useState(null)
  const [checkState,     setCheckState]     = useState(
    CHECK_STEPS.map(s => ({ ...s, status: 'waiting' }))
  )

  useEffect(() => {
    if (user === null) router.push('/auth/login')
  }, [user, router])

  const handleMetaSubmit = async (formData) => {
    setLoading(true)
    setStep(3)
    setCheckState(CHECK_STEPS.map(s => ({ ...s, status: 'waiting' })))

    // Build FormData
    const fd = new FormData()
    fd.append('file',       file)
    fd.append('title',      formData.title.trim())
    fd.append('subject_name', formData.subject_name.trim())
    fd.append('level',      formData.level)
    fd.append('doc_type',   formData.doc_type)
    fd.append('year',       formData.year)
    if (formData.description) fd.append('description', formData.description)

    // Fire API call immediately
    let apiData = null, apiErr = null
    const apiCall = documentsApi.upload(fd)
      .then(r => { apiData = r.data })
      .catch(e => { apiErr  = e })

    // Animate steps while waiting
    for (let i = 0; i < CHECK_STEPS.length; i++) {
      setCheckState(prev => prev.map((s, idx) => idx === i ? { ...s, status: 'running' } : s))
      // On the last step, wait for API to be done
      if (i === CHECK_STEPS.length - 1) {
        await apiCall
        if (apiErr) {
          setCheckState(prev => prev.map((s, idx) => idx === i ? { ...s, status: 'error' } : s))
          break
        }
      } else {
        await delay(CHECK_STEPS[i].ms)
      }
      setCheckState(prev => prev.map((s, idx) => idx === i ? { ...s, status: 'done' } : s))
    }

    setLoading(false)

    if (apiErr) {
      const errData = apiErr?.response?.data
      if (errData?.error === 'duplicate_detected') {
        setResult({
          type:       'duplicate',
          reason:     errData.message,
          matchedDoc: errData.matched_document,
          score:      errData.similarity_score,
          layer:      errData.layer,
        })
      } else {
        toast.error(errData?.error || 'Upload failed. Please try again.')
        setStep(2)
        return
      }
    } else {
      setResult({
        type: apiData?.document?.status === 'flagged' ? 'flagged' : 'success',
        granted_upload_pass: apiData?.granted_upload_pass || false,
        message: apiData?.message || null,
      })
      setUploadProgress(apiData?.upload_progress || null)
      if (refreshProfile) {
        await refreshProfile()
      }
      // Redirect to home if upload pass granted
      if (apiData?.granted_upload_pass) {
        setTimeout(() => router.push('/'), 3000) // Redirect after 3 seconds
      }
    }

    setStep(4)
  }

  const reset = () => {
    setStep(1); setFile(null); setResult(null); setUploadProgress(null)
    setCheckState(CHECK_STEPS.map(s => ({ ...s, status: 'waiting' })))
  }

  if (!user) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <Loader2 size={32} className="text-green-500 animate-spin" />
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-2xl mx-auto px-4 sm:px-6 pt-24 pb-12">
        <div className="mb-6">
          <Link href="/browse"
            className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-green-600 mb-4 no-underline transition-colors">
            ← Back to library
          </Link>
          <h1 className="font-serif text-3xl text-gray-900">Upload a document</h1>
          <p className="text-sm text-gray-500 mt-1">
            Share your knowledge. Earn free access. Help students across Malawi.
          </p>
        </div>

        <div className="bg-white rounded-3xl border border-gray-100 p-6 sm:p-8 shadow-[0_4px_24px_rgba(0,0,0,0.04)]">
          <StepBar step={step} />

          {step === 1 && (
            <StepSelectFile onFileSelected={(f) => { setFile(f); setStep(2) }} />
          )}
          {step === 2 && (
            <StepDocInfo
              file={file}
              loading={loading}
              onBack={() => setStep(1)}
              onSubmit={handleMetaSubmit}
            />
          )}
          {step === 3 && <StepVerifying checkState={checkState} />}
          {step === 4 && (
            <StepResult
              result={result} uploadProgress={uploadProgress}
              onUploadAnother={reset}
              onBrowse={() => router.push('/browse')}
            />
          )}
        </div>

        {step <= 2 && (
          <div className="mt-4 p-4 bg-white rounded-2xl border border-gray-100">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Upload guidelines</p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { text: 'PDF, DOCX or PPTX only', ok: true },
                { text: 'Maximum 20MB per file',  ok: true },
                { text: 'Educational content only', ok: true },
                { text: 'Fill in accurate metadata', ok: true },
                { text: 'No duplicate documents',   ok: false },
                { text: 'No copyrighted textbooks', ok: false },
              ].map(({ text, ok }) => (
                <p key={text} className={`text-xs ${ok ? 'text-green-600' : 'text-red-400'}`}>
                  {ok ? '✓' : '✗'} {text}
                </p>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
