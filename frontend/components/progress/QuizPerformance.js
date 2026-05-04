'use client'

import { TrendingDown, TrendingUp, Minus, Trophy } from 'lucide-react'

const TREND_META = {
  improving: {
    icon: TrendingUp,
    text: 'Improving',
    accent: 'text-emerald-700 bg-emerald-50',
  },
  declining: {
    icon: TrendingDown,
    text: 'Declining',
    accent: 'text-rose-700 bg-rose-50',
  },
  steady: {
    icon: Minus,
    text: 'Steady',
    accent: 'text-amber-700 bg-amber-50',
  },
}

function formatDate(timestamp) {
  return new Date(timestamp).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export default function QuizPerformance({ quizzes }) {
  return (
    <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="mb-5 flex items-center gap-3">
        <div className="rounded-2xl bg-violet-50 p-3 text-violet-700">
          <Trophy size={18} />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Quiz Performance</h2>
          <p className="text-sm text-gray-500">Review recent attempts and see whether your scores are rising.</p>
        </div>
      </div>

      {quizzes.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-5 py-10 text-center">
          <p className="text-sm font-medium text-gray-600">No quizzes taken yet.</p>
          <p className="mt-1 text-xs text-gray-400">Take your first quiz to measure your understanding.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {quizzes.map((quiz) => {
            const trendMeta = quiz.trend ? TREND_META[quiz.trend] : null
            const TrendIcon = trendMeta?.icon
            const passed = quiz.status === 'pass'

            return (
              <div key={quiz.id} className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-gray-800">{quiz.quiz_title}</p>
                    <p className="mt-1 text-xs text-gray-500">
                      {quiz.subject_name} • {quiz.topic_title}
                    </p>
                    <p className="mt-1 text-[11px] text-gray-400">{formatDate(quiz.completed_at)}</p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      passed ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                    }`}>
                      {passed ? 'Pass' : 'Fail'}
                    </span>
                    <span className="rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold text-violet-700">
                      {quiz.score}%
                    </span>
                    {trendMeta && TrendIcon && (
                      <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${trendMeta.accent}`}>
                        <TrendIcon size={12} />
                        {trendMeta.text}
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-3 h-2 overflow-hidden rounded-full bg-gray-200">
                  <div
                    className={`h-full rounded-full transition-all duration-1000 ${
                      passed ? 'bg-gradient-to-r from-emerald-500 to-green-400' : 'bg-gradient-to-r from-rose-500 to-orange-400'
                    }`}
                    style={{ width: `${Math.min(100, Math.max(0, quiz.score))}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
