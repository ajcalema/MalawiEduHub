'use client'

const SUBJECT_THEMES = {
  mathematics:      { bg: 'from-blue-600 to-blue-800',   light: 'bg-blue-50',   text: 'text-blue-700',   emoji: '📐' },
  biology:          { bg: 'from-green-600 to-green-800',  light: 'bg-green-50',  text: 'text-green-700',  emoji: '🔬' },
  chemistry:        { bg: 'from-purple-600 to-purple-800',light: 'bg-purple-50', text: 'text-purple-700', emoji: '⚗️'  },
  physics:          { bg: 'from-indigo-600 to-indigo-800',light: 'bg-indigo-50', text: 'text-indigo-700', emoji: '⚡' },
  english:          { bg: 'from-rose-600 to-rose-800',    light: 'bg-rose-50',   text: 'text-rose-700',   emoji: '📖' },
  chichewa:         { bg: 'from-orange-600 to-orange-800',light: 'bg-orange-50', text: 'text-orange-700', emoji: '🗣️'  },
  history:          { bg: 'from-amber-600 to-amber-800',  light: 'bg-amber-50',  text: 'text-amber-700',  emoji: '📜' },
  geography:        { bg: 'from-teal-600 to-teal-800',    light: 'bg-teal-50',   text: 'text-teal-700',   emoji: '🌍' },
  agriculture:      { bg: 'from-lime-600 to-lime-800',    light: 'bg-lime-50',   text: 'text-lime-700',   emoji: '🌿' },
  'computer-studies': { bg: 'from-slate-600 to-slate-800',light: 'bg-slate-50', text: 'text-slate-700',  emoji: '💻' },
  'business-studies': { bg: 'from-cyan-600 to-cyan-800',  light: 'bg-cyan-50',  text: 'text-cyan-700',   emoji: '📊' },
  'religious-education': { bg: 'from-stone-600 to-stone-800',light:'bg-stone-50',text:'text-stone-700',   emoji: '✝️'  },
}

const DEFAULT_THEME = { bg: 'from-green-600 to-green-800', light: 'bg-green-50', text: 'text-green-700', emoji: '📚' }

// ── Subject quick-browse grid (shown when no subject is selected) ──
export function SubjectGrid({ subjects, activeSubject, onSelect }) {
  if (!subjects?.length) return null

  return (
    <div className="mb-6">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Browse by subject</p>
      <div className="flex flex-wrap gap-2">
        {subjects.map(s => {
          const theme = SUBJECT_THEMES[s.slug] || DEFAULT_THEME
          const active = activeSubject === s.slug
          return (
            <button
              key={s.slug}
              onClick={() => onSelect(active ? '' : s.slug)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold
                transition-all duration-200 border
                ${active
                  ? `${theme.light} ${theme.text} border-current`
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
            >
              <span>{s.icon_emoji || theme.emoji}</span>
              {s.name}
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${active ? 'bg-white/60' : 'bg-gray-100 text-gray-400'}`}>
                {s.document_count}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ── Active subject hero banner ──
export function SubjectHero({ subject, subjects, docCount, onClear }) {
  if (!subject) return null

  const subjectData = subjects?.find(s => s.slug === subject)
  const theme = SUBJECT_THEMES[subject] || DEFAULT_THEME

  return (
    <div className={`relative rounded-2xl bg-gradient-to-r ${theme.bg} overflow-hidden mb-6`}>
      {/* Subtle pattern */}
      <div className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.4) 1px, transparent 1px)',
          backgroundSize: '24px 24px'
        }}
      />
      <div className="relative flex items-center justify-between p-5">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center text-2xl flex-shrink-0">
            {subjectData?.icon_emoji || theme.emoji}
          </div>
          <div>
            <h2 className="font-serif text-xl text-white leading-tight">
              {subjectData?.name || subject}
            </h2>
            <p className="text-white/60 text-xs mt-0.5">
              {docCount?.toLocaleString() || 0} documents available
            </p>
          </div>
        </div>
        <button
          onClick={onClear}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/15 text-white/80
            hover:bg-white/25 text-xs font-medium transition-all"
        >
          ✕ Clear
        </button>
      </div>
    </div>
  )
}
