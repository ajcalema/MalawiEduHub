'use client'
import Link from 'next/link'
import { Download, Eye, BookOpen, FileText, BookMarked, ClipboardList, GraduationCap } from 'lucide-react'

const LEVEL_LABELS = {
  primary:    'Primary',
  jce:        'JCE',
  msce:       'MSCE',
  university: 'University',
  other:      'Other',
}

const TYPE_LABELS = {
  past_paper:     'Past Paper',
  notes:          'Notes',
  textbook:       'Textbook',
  marking_scheme: 'Marking Scheme',
  revision_guide: 'Revision Guide',
  assignment:     'Assignment',
  other:          'Other',
}

const LEVEL_COLORS = {
  primary:    'bg-blue-50 text-blue-700',
  jce:        'bg-amber-50 text-amber-700',
  msce:       'bg-green-50 text-green-700',
  university: 'bg-purple-50 text-purple-700',
  other:      'bg-gray-50 text-gray-600',
}

const TYPE_COLORS = {
  past_paper:     'bg-orange-50 text-orange-700',
  notes:          'bg-gray-50 text-gray-600',
  textbook:       'bg-teal-50 text-teal-700',
  marking_scheme: 'bg-pink-50 text-pink-700',
  revision_guide: 'bg-indigo-50 text-indigo-700',
  assignment:     'bg-red-50 text-red-600',
  other:          'bg-gray-50 text-gray-600',
}

const TYPE_ICONS = {
  past_paper:     FileText,
  notes:          BookOpen,
  textbook:       BookMarked,
  marking_scheme: ClipboardList,
  revision_guide: GraduationCap,
  assignment:     ClipboardList,
  other:          FileText,
}

export default function DocumentCard({ doc, onDownload }) {
  const Icon = TYPE_ICONS[doc.doc_type] || FileText

  return (
    <div className="group bg-white rounded-2xl border border-gray-100 hover:border-green-200
      hover:shadow-[0_8px_32px_rgba(13,122,85,0.08)] transition-all duration-300 hover:-translate-y-1
      flex flex-col overflow-hidden">

      {/* Top colour strip by subject */}
      <div className="h-1 w-full bg-gradient-to-r from-green-400 to-green-600 opacity-60 group-hover:opacity-100 transition-opacity" />

      <div className="p-5 flex flex-col gap-3 flex-1">

        {/* Icon + badges row */}
        <div className="flex items-start justify-between gap-2">
          <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center flex-shrink-0 group-hover:bg-green-100 transition-colors">
            <Icon size={18} className="text-green-600" />
          </div>
          <div className="flex flex-wrap gap-1 justify-end">
            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${LEVEL_COLORS[doc.level] || 'bg-gray-50 text-gray-600'}`}>
              {LEVEL_LABELS[doc.level] || doc.level}
            </span>
            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${TYPE_COLORS[doc.doc_type] || 'bg-gray-50 text-gray-600'}`}>
              {TYPE_LABELS[doc.doc_type] || doc.doc_type}
            </span>
          </div>
        </div>

        {/* Title */}
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-gray-900 leading-snug line-clamp-2 group-hover:text-green-700 transition-colors">
            {doc.title}
          </h3>
          <p className="text-xs text-gray-400 mt-1">
            {doc.subject_icon} {doc.subject_name}
            {doc.year ? ` · ${doc.year}` : ''}
          </p>
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-3 text-xs text-gray-400 pt-1 border-t border-gray-50">
          <span className="flex items-center gap-1">
            <Download size={11} />
            {doc.download_count?.toLocaleString() || 0}
          </span>
          <span className="flex items-center gap-1">
            <Eye size={11} />
            {doc.view_count?.toLocaleString() || 0}
          </span>
          <span className="ml-auto font-semibold text-green-600 text-xs">
            {doc.is_free ? 'Free' : `MWK ${parseFloat(doc.price_mwk).toLocaleString()}`}
          </span>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 mt-1">
          <Link href={`/browse/${doc.id}`}
            className="flex-1 py-2 text-xs font-semibold text-center text-gray-600 rounded-xl border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors no-underline">
            Preview
          </Link>
          <button
            onClick={() => onDownload?.(doc)}
            className="flex-1 py-2 text-xs font-semibold text-center text-white bg-green-500 rounded-xl hover:bg-green-400 transition-all hover:-translate-y-0.5 flex items-center justify-center gap-1">
            <Download size={12} />
            Download
          </button>
        </div>
      </div>
    </div>
  )
}
