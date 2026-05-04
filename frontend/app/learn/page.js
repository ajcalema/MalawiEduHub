'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'
import StatsCards from '@/components/progress/StatsCards'
import SubjectProgressList from '@/components/progress/SubjectProgressList'
import ActivityFeed from '@/components/progress/ActivityFeed'
import QuizPerformance from '@/components/progress/QuizPerformance'
import MotivationBanner from '@/components/progress/MotivationBanner'
import { learnApi, progressApi } from '@/lib/api'
import { useAuth } from '@/lib/auth-context'
import { BookOpen, ChevronRight, GraduationCap, Loader2, RefreshCw, TrendingUp } from 'lucide-react'

const CLASS_COLORS = [
  { bg: '#E6F1FB', border: '#B5D4F4', text: '#0C447C', accent: '#378ADD', num: '01' },
  { bg: '#E1F5EE', border: '#9FE1CB', text: '#085041', accent: '#1D9E75', num: '02' },
  { bg: '#FAEEDA', border: '#FAC775', text: '#633806', accent: '#BA7517', num: '03' },
  { bg: '#EEEDFE', border: '#CECBF6', text: '#3C3489', accent: '#7F77DD', num: '04' },
]

export default function LearnPage() {
  const { user } = useAuth()
  const router = useRouter()

  const [classes, setClasses] = useState([])
  const [progress, setProgress] = useState([])
  const [overview, setOverview] = useState(null)
  const [subjectProgress, setSubjectProgress] = useState([])
  const [activity, setActivity] = useState([])
  const [quizzes, setQuizzes] = useState([])
  const [dashboardError, setDashboardError] = useState('')
  const [loading, setLoading] = useState(true)

  const loadLearningRoom = async () => {
    setLoading(true)
    setDashboardError('')

    try {
      const [
        classesRes,
        progressRes,
        overviewRes,
        subjectsRes,
        activityRes,
        quizzesRes,
      ] = await Promise.all([
        learnApi.getClasses(),
        user ? learnApi.getProgress().catch(() => ({ data: [] })) : Promise.resolve({ data: [] }),
        progressApi.overview().catch((error) => ({ error })),
        progressApi.subjects().catch((error) => ({ error })),
        progressApi.activity().catch((error) => ({ error })),
        progressApi.quizzes().catch((error) => ({ error })),
      ])

      setClasses(classesRes.data || [])
      setProgress(progressRes.data || [])

      if (!overviewRes?.error) setOverview(overviewRes.data)
      if (!subjectsRes?.error) setSubjectProgress(subjectsRes.data || [])
      if (!activityRes?.error) setActivity(activityRes.data || [])
      if (!quizzesRes?.error) setQuizzes(quizzesRes.data || [])

      if (overviewRes?.error || subjectsRes?.error || activityRes?.error || quizzesRes?.error) {
        setDashboardError('Some progress insights could not be loaded right now.')
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user === null) {
      router.push('/auth/login')
      return
    }

    if (user) {
      loadLearningRoom()
    }
  }, [user])

  const completedByClass = progress.reduce((acc, item) => {
    if (item.completed) acc[item.class_name] = (acc[item.class_name] || 0) + 1
    return acc
  }, {})

  const hasAnyActivity = activity.length > 0
    || Number(overview?.total_lessons_completed || 0) > 0
    || Number(overview?.total_quizzes_taken || 0) > 0
    || Number(overview?.total_documents_downloaded || 0) > 0

  if (!user || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Navbar />
        <Loader2 size={32} className="text-green-500 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-24 pb-16">
        <div className="mb-10 text-center">
          <div
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-4"
            style={{ background: '#E1F5EE', border: '1px solid #9FE1CB' }}
          >
            <GraduationCap size={14} className="text-green-600" />
            <span className="text-xs font-semibold text-green-700 uppercase tracking-wider">Learning Room</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl text-gray-900 mb-3">
            Welcome, {user.full_name.split(' ')[0]}
          </h1>
          <p className="text-gray-500 text-sm max-w-xl mx-auto leading-relaxed">
            Your student progress dashboard is now part of the Learning Room.
            Follow your path from class to subject to topic while tracking lessons, quizzes, activity, and downloads.
          </p>
        </div>

        <div className="mb-8 flex flex-col gap-4 rounded-3xl border border-green-200 bg-gradient-to-r from-green-50 via-emerald-50 to-white p-5 shadow-sm md:flex-row md:items-center md:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-green-700">
              <TrendingUp size={12} />
              Learning Dashboard
            </div>
            <h2 className="mt-3 font-serif text-2xl text-gray-900">See your progress where you learn</h2>
            <p className="mt-2 max-w-2xl text-sm text-gray-600">
              Track completed lessons, recent quiz scores, downloads, and per-subject progress without leaving the Learning Room.
            </p>
          </div>

          <button
            onClick={loadLearningRoom}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-green-200 bg-white px-4 py-2.5 text-sm font-semibold text-green-700 shadow-sm transition-all hover:bg-green-50"
          >
            <RefreshCw size={15} />
            Refresh
          </button>
        </div>

        {dashboardError && (
          <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            {dashboardError}
          </div>
        )}

        <div className="mb-10 space-y-6">
          <StatsCards stats={overview} />
          <MotivationBanner isActive={hasAnyActivity} />

          <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
            <div className="space-y-6">
              <SubjectProgressList subjects={subjectProgress} />
              <ActivityFeed activities={activity} />
            </div>

            <QuizPerformance quizzes={quizzes} />
          </div>
        </div>

        <div className="mb-4">
          <h2 className="font-serif text-2xl text-gray-900 mb-2">Choose your class</h2>
          <p className="text-sm text-gray-500">
            Open your class to continue with structured lessons, topics, resources, and quizzes.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-5 mb-8">
          {classes.map((cls, index) => {
            const colors = CLASS_COLORS[index % CLASS_COLORS.length]
            const completed = completedByClass[cls.name] || 0

            return (
              <Link key={cls.id} href={`/learn/${cls.id}`} className="group block no-underline">
                <div
                  className="rounded-2xl border-2 p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
                  style={{ background: colors.bg, borderColor: colors.border }}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div
                      className="w-12 h-12 rounded-2xl flex items-center justify-center font-serif text-xl font-bold"
                      style={{ background: `${colors.accent}20`, color: colors.accent }}
                    >
                      {colors.num}
                    </div>
                    <ChevronRight
                      size={20}
                      style={{ color: colors.accent }}
                      className="group-hover:translate-x-1 transition-transform"
                    />
                  </div>

                  <h3 className="font-serif text-2xl mb-1" style={{ color: colors.text }}>
                    {cls.name}
                  </h3>

                  {cls.description && (
                    <p className="text-sm mb-3 opacity-70" style={{ color: colors.text }}>
                      {cls.description}
                    </p>
                  )}

                  {completed > 0 && (
                    <div className="mt-3 pt-3" style={{ borderTop: `1px solid ${colors.border}` }}>
                      <div className="flex items-center gap-2">
                        <TrendingUp size={12} style={{ color: colors.accent }} />
                        <span className="text-xs font-semibold" style={{ color: colors.text }}>
                          {completed} topic{completed !== 1 ? 's' : ''} completed
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </Link>
            )
          })}
        </div>

        <div className="text-center">
          <p className="text-sm text-gray-400 mb-3">Looking for something specific?</p>
          <Link
            href="/browse"
            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-green-700 border-2 border-green-200 rounded-xl hover:bg-green-50 transition-all no-underline"
          >
            <BookOpen size={15} />
            Browse all documents
          </Link>
        </div>
      </div>
    </div>
  )
}
