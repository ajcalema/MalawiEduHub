'use client'

import { Rocket, Sparkles } from 'lucide-react'

export default function MotivationBanner({ isActive }) {
  const Icon = isActive ? Sparkles : Rocket

  return (
    <div className={`rounded-3xl border p-5 shadow-sm ${
      isActive
        ? 'border-emerald-200 bg-gradient-to-r from-emerald-50 to-green-50'
        : 'border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50'
    }`}>
      <div className="flex items-start gap-4">
        <div className={`rounded-2xl p-3 ${
          isActive ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-white'
        }`}>
          <Icon size={18} />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
            Motivation
          </p>
          <h2 className="mt-1 text-xl font-semibold text-gray-900">
            {isActive ? "You're making great progress! Keep going." : 'Start learning today.'}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {isActive
              ? 'Every completed lesson and quiz builds momentum. Stay consistent and your progress will compound.'
              : 'Pick one lesson, one quiz, or one document and get your streak started.'}
          </p>
        </div>
      </div>
    </div>
  )
}
