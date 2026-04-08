'use client'
import { X } from 'lucide-react'

const LEVELS = [
  { value: '', label: 'All levels' },
  { value: 'primary',    label: 'Primary (Std 1–8)' },
  { value: 'jce',        label: 'JCE (Form 1–2)' },
  { value: 'msce',       label: 'MSCE (Form 3–4)' },
  { value: 'university', label: 'University' },
]

const DOC_TYPES = [
  { value: '', label: 'All types' },
  { value: 'past_paper',     label: 'Past Papers' },
  { value: 'notes',          label: 'Notes' },
  { value: 'textbook',       label: 'Textbooks' },
  { value: 'marking_scheme', label: 'Marking Schemes' },
  { value: 'revision_guide', label: 'Revision Guides' },
]

const YEARS = ['', ...Array.from({ length: 15 }, (_, i) => String(2024 - i))]

export default function FilterSidebar({ filters, onChange, subjects, onClose }) {
  const set = (key, val) => onChange({ ...filters, [key]: val, page: 1 })

  const activeCount = [
    filters.subject, filters.level,
    filters.doc_type, filters.year,
  ].filter(Boolean).length

  return (
    <aside className="w-full lg:w-60 flex-shrink-0">
      <div className="bg-white rounded-2xl border border-gray-100 p-5 sticky top-24">

        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-gray-900">Filters</h2>
            {activeCount > 0 && (
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                {activeCount}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {activeCount > 0 && (
              <button
                onClick={() => onChange({ subject: '', level: '', doc_type: '', year: '', page: 1 })}
                className="text-xs text-gray-400 hover:text-red-500 transition-colors">
                Clear all
              </button>
            )}
            {onClose && (
              <button onClick={onClose} className="lg:hidden p-1 rounded-lg hover:bg-gray-100">
                <X size={16} className="text-gray-400" />
              </button>
            )}
          </div>
        </div>

        {/* Subject filter */}
        <FilterSection label="Subject">
          <div className="flex flex-col gap-1">
            <button
              onClick={() => set('subject', '')}
              className={`text-left text-sm px-3 py-2 rounded-xl transition-colors ${
                !filters.subject ? 'bg-green-50 text-green-700 font-semibold' : 'text-gray-600 hover:bg-gray-50'
              }`}>
              All subjects
            </button>
            {subjects?.map(s => (
              <button key={s.slug}
                onClick={() => set('subject', s.slug)}
                className={`text-left text-sm px-3 py-2 rounded-xl transition-colors flex items-center justify-between ${
                  filters.subject === s.slug ? 'bg-green-50 text-green-700 font-semibold' : 'text-gray-600 hover:bg-gray-50'
                }`}>
                <span>{s.icon_emoji} {s.name}</span>
                <span className="text-xs text-gray-400">{s.document_count}</span>
              </button>
            ))}
          </div>
        </FilterSection>

        {/* Level filter */}
        <FilterSection label="Level">
          <div className="flex flex-col gap-1">
            {LEVELS.map(l => (
              <button key={l.value}
                onClick={() => set('level', l.value)}
                className={`text-left text-sm px-3 py-2 rounded-xl transition-colors ${
                  filters.level === l.value ? 'bg-green-50 text-green-700 font-semibold' : 'text-gray-600 hover:bg-gray-50'
                }`}>
                {l.label}
              </button>
            ))}
          </div>
        </FilterSection>

        {/* Document type filter */}
        <FilterSection label="Type">
          <div className="flex flex-col gap-1">
            {DOC_TYPES.map(t => (
              <button key={t.value}
                onClick={() => set('doc_type', t.value)}
                className={`text-left text-sm px-3 py-2 rounded-xl transition-colors ${
                  filters.doc_type === t.value ? 'bg-green-50 text-green-700 font-semibold' : 'text-gray-600 hover:bg-gray-50'
                }`}>
                {t.label}
              </button>
            ))}
          </div>
        </FilterSection>

        {/* Year filter */}
        <FilterSection label="Year" last>
          <select
            value={filters.year}
            onChange={e => set('year', e.target.value)}
            className="w-full text-sm px-3 py-2 rounded-xl border border-gray-200 bg-gray-50
              focus:outline-none focus:border-green-400 text-gray-700">
            {YEARS.map(y => (
              <option key={y} value={y}>{y || 'All years'}</option>
            ))}
          </select>
        </FilterSection>

      </div>
    </aside>
  )
}

function FilterSection({ label, children, last }) {
  return (
    <div className={`${last ? '' : 'border-b border-gray-50 mb-4 pb-4'}`}>
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">{label}</p>
      {children}
    </div>
  )
}
