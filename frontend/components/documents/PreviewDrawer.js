'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import {
  X, Download, Eye, ExternalLink, FileText, BookOpen, BookMarked,
  ClipboardList, GraduationCap, Calendar, User, Tag, TrendingUp
} from 'lucide-react'

const LEVEL_LABELS = { primary:'Primary', jce:'JCE', msce:'MSCE', university:'University', other:'Other' }
const TYPE_LABELS  = { past_paper:'Past Paper', notes:'Notes', textbook:'Textbook', marking_scheme:'Marking Scheme', revision_guide:'Revision Guide', assignment:'Assignment', other:'Other' }
const LEVEL_COLORS = { primary:'bg-blue-50 text-blue-700', jce:'bg-amber-50 text-amber-700', msce:'bg-green-50 text-green-700', university:'bg-purple-50 text-purple-700', other:'bg-gray-50 text-gray-600' }
const TYPE_COLORS  = { past_paper:'bg-orange-50 text-orange-700', notes:'bg-gray-50 text-gray-600', textbook:'bg-teal-50 text-teal-700', marking_scheme:'bg-pink-50 text-pink-700', revision_guide:'bg-indigo-50 text-indigo-700', assignment:'bg-red-50 text-red-600', other:'bg-gray-50 text-gray-600' }
const TYPE_ICONS   = { past_paper:FileText, notes:BookOpen, textbook:BookMarked, marking_scheme:ClipboardList, revision_guide:GraduationCap, assignment:ClipboardList, other:FileText }

export default function PreviewDrawer({ doc, onClose, onDownload }) {
  const router = useRouter()
  const { user, hasAccess } = useAuth()

  // Close on Escape key
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  // Lock body scroll while open
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  if (!doc) return null

  const Icon = TYPE_ICONS[doc.doc_type] || FileText

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Drawer panel */}
      <div className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md bg-white shadow-2xl
        flex flex-col animate-slide-in overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Document preview</p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push(`/browse/${doc.id}`)}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-500
                hover:text-green-600 rounded-lg hover:bg-green-50 transition-colors"
            >
              <ExternalLink size={13} />
              Full page
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto">

          {/* Doc hero */}
          <div className="p-5 border-b border-gray-50">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-green-50 flex items-center justify-center flex-shrink-0">
                <Icon size={24} className="text-green-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap gap-1 mb-2">
                  <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${LEVEL_COLORS[doc.level] || 'bg-gray-50 text-gray-600'}`}>
                    {LEVEL_LABELS[doc.level] || doc.level}
                  </span>
                  <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${TYPE_COLORS[doc.doc_type] || 'bg-gray-50 text-gray-600'}`}>
                    {TYPE_LABELS[doc.doc_type] || doc.doc_type}
                  </span>
                </div>
                <h2 className="font-serif text-xl text-gray-900 leading-tight">{doc.title}</h2>
              </div>
            </div>
          </div>

          {/* Description */}
          {doc.description && (
            <div className="px-5 py-4 border-b border-gray-50">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">About this document</p>
              <p className="text-sm text-gray-600 leading-relaxed">{doc.description}</p>
            </div>
          )}

          {/* Metadata grid */}
          <div className="px-5 py-4 border-b border-gray-50">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Details</p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { icon: Tag,       label: 'Subject',  value: `${doc.subject_icon || ''} ${doc.subject_name}` },
                { icon: Calendar,  label: 'Year',     value: doc.year || '—' },
                { icon: Download,  label: 'Downloads',value: (doc.download_count || 0).toLocaleString() },
                { icon: Eye,       label: 'Views',    value: (doc.view_count || 0).toLocaleString() },
                { icon: User,      label: 'Uploaded', value: doc.uploader_name || 'Community' },
                { icon: TrendingUp,label: 'Price',    value: doc.is_free ? 'Free' : `MWK ${parseFloat(doc.price_mwk || 200).toLocaleString()}` },
              ].map(({ icon: MetaIcon, label, value }) => (
                <div key={label} className="flex items-center gap-2 p-2.5 bg-gray-50 rounded-xl">
                  <MetaIcon size={13} className="text-gray-400 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">{label}</p>
                    <p className="text-xs font-medium text-gray-700 truncate">{value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Access status */}
          <div className="px-5 py-4">
            {user && hasAccess() ? (
              <div className="flex items-center gap-3 p-3 bg-green-50 rounded-xl border border-green-100">
                <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                  <svg viewBox="0 0 14 14" fill="none" width="14" height="14">
                    <path d="M2.5 7l3 3 6-6" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div>
                  <p className="text-xs font-semibold text-green-800">Active subscription</p>
                  <p className="text-xs text-green-600">You can download this for free</p>
                </div>
              </div>
            ) : !user ? (
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-100 text-center">
                <p className="text-xs font-semibold text-amber-800 mb-1">Sign in to download</p>
                <p className="text-xs text-amber-700">Create a free account to get started.</p>
              </div>
            ) : (
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                <p className="text-xs font-semibold text-gray-700 mb-2">Get access</p>
                <div className="flex flex-col gap-1.5 text-xs text-gray-600">
                  <div className="flex justify-between items-center">
                    <span>Monthly subscription</span>
                    <span className="font-bold text-green-700">MWK 2,500</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Pay per download</span>
                    <span className="font-bold text-gray-700">MWK {parseFloat(doc.price_mwk || 200).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center text-amber-700">
                    <span>Upload 5 docs</span>
                    <span className="font-bold">Free 1-day pass</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer action buttons — sticky */}
        <div className="flex-shrink-0 p-4 border-t border-gray-100 bg-white flex gap-3">
          <button
            onClick={() => router.push(`/browse/${doc.id}`)}
            className="flex-1 py-3 text-sm font-semibold text-gray-600 rounded-xl
              border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors"
          >
            View details
          </button>
          <button
            onClick={() => { onClose(); onDownload?.(doc) }}
            className="flex-[2] py-3 text-sm font-semibold text-white bg-green-500 rounded-xl
              hover:bg-green-400 transition-all flex items-center justify-center gap-2"
          >
            <Download size={15} />
            Download
          </button>
        </div>
      </div>
    </>
  )
}
