'use client'

import { BookOpen, ClipboardCheck, Percent, Download } from 'lucide-react'

const CARD_STYLES = [
  {
    label: 'Lessons Completed',
    key: 'total_lessons_completed',
    icon: BookOpen,
    accent: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  },
  {
    label: 'Quizzes Taken',
    key: 'total_quizzes_taken',
    icon: ClipboardCheck,
    accent: 'bg-violet-50 text-violet-700 border-violet-100',
  },
  {
    label: 'Average Quiz Score',
    key: 'average_quiz_score',
    icon: Percent,
    accent: 'bg-amber-50 text-amber-700 border-amber-100',
    suffix: '%',
  },
  {
    label: 'Documents Downloaded',
    key: 'total_documents_downloaded',
    icon: Download,
    accent: 'bg-sky-50 text-sky-700 border-sky-100',
  },
]

export default function StatsCards({ stats }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {CARD_STYLES.map((card) => {
        const Icon = card.icon
        const rawValue = stats?.[card.key] ?? 0
        const value = card.key === 'average_quiz_score'
          ? Number(rawValue).toFixed(rawValue % 1 === 0 ? 0 : 1)
          : Number(rawValue).toLocaleString()

        return (
          <div
            key={card.key}
            className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                  {card.label}
                </p>
                <p className="mt-3 font-serif text-3xl text-gray-900">
                  {value}
                  {card.suffix || ''}
                </p>
              </div>
              <div className={`rounded-2xl border p-3 ${card.accent}`}>
                <Icon size={18} />
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
