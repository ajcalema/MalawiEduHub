'use client'

import { BookMarked } from 'lucide-react'

export default function SubjectProgressList({ subjects }) {
  return (
    <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="mb-5 flex items-center gap-3">
        <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-700">
          <BookMarked size={18} />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Subject Progress</h2>
          <p className="text-sm text-gray-500">Track how far you have gone in each subject.</p>
        </div>
      </div>

      {subjects.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-5 py-10 text-center">
          <p className="text-sm font-medium text-gray-600">No lesson progress yet.</p>
          <p className="mt-1 text-xs text-gray-400">Complete your first lesson to start building momentum.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {subjects.map((subject) => (
            <div key={subject.subject_id} className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
              <div className="mb-3 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-gray-800">
                    {subject.subject_icon ? `${subject.subject_icon} ` : ''}
                    {subject.subject_name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {subject.lessons_completed} of {subject.total_lessons} lessons completed
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-emerald-700">
                    {Math.round(subject.progress_percentage)}%
                  </p>
                </div>
              </div>

              <div className="h-3 overflow-hidden rounded-full bg-emerald-100">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-green-400 transition-all duration-1000"
                  style={{ width: `${Math.min(100, Math.max(0, subject.progress_percentage))}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
