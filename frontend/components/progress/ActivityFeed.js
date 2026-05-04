'use client'

import { BookOpen, ClipboardCheck, Download, Clock3 } from 'lucide-react'

const TYPE_META = {
  lesson: {
    icon: BookOpen,
    accent: 'bg-emerald-50 text-emerald-700',
    label: 'Lesson',
  },
  quiz: {
    icon: ClipboardCheck,
    accent: 'bg-violet-50 text-violet-700',
    label: 'Quiz',
  },
  document: {
    icon: Download,
    accent: 'bg-sky-50 text-sky-700',
    label: 'Document',
  },
}

function formatTime(timestamp) {
  return new Date(timestamp).toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function ActivityFeed({ activities }) {
  return (
    <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="mb-5 flex items-center gap-3">
        <div className="rounded-2xl bg-slate-100 p-3 text-slate-700">
          <Clock3 size={18} />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
          <p className="text-sm text-gray-500">Your latest learning milestones and downloads.</p>
        </div>
      </div>

      {activities.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-5 py-10 text-center">
          <p className="text-sm font-medium text-gray-600">No activity yet.</p>
          <p className="mt-1 text-xs text-gray-400">Start a lesson, take a quiz, or download a resource to see it here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {activities.map((activity) => {
            const meta = TYPE_META[activity.type] || TYPE_META.lesson
            const Icon = meta.icon

            return (
              <div key={activity.id} className="flex items-start gap-3 rounded-2xl border border-gray-100 bg-gray-50 p-4">
                <div className={`rounded-2xl p-3 ${meta.accent}`}>
                  <Icon size={16} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                      {meta.label}
                    </span>
                  </div>
                  <p className="mt-1 text-sm font-semibold text-gray-800">{activity.description}</p>
                  <p className="mt-1 truncate text-xs text-gray-500">{activity.title || activity.description}</p>
                </div>
                <p className="text-right text-[11px] text-gray-400">{formatTime(activity.created_at)}</p>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
