'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import StatsCards from '@/components/progress/StatsCards'
import SubjectProgressList from '@/components/progress/SubjectProgressList'
import ActivityFeed from '@/components/progress/ActivityFeed'
import QuizPerformance from '@/components/progress/QuizPerformance'
import MotivationBanner from '@/components/progress/MotivationBanner'
import { progressApi } from '@/lib/api'
import { useAuth } from '@/lib/auth-context'
import { ChevronLeft, Loader2, RefreshCw } from 'lucide-react'

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="animate-pulse rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="h-3 w-24 rounded bg-gray-100" />
            <div className="mt-4 h-10 w-20 rounded bg-gray-200" />
          </div>
        ))}
      </div>

      <div className="animate-pulse rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="h-5 w-48 rounded bg-gray-200" />
        <div className="mt-3 h-4 w-72 rounded bg-gray-100" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          <div className="animate-pulse rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="h-5 w-44 rounded bg-gray-200" />
            <div className="mt-5 space-y-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index}>
                  <div className="h-4 w-32 rounded bg-gray-100" />
                  <div className="mt-3 h-3 rounded-full bg-gray-100" />
                </div>
              ))}
            </div>
          </div>

          <div className="animate-pulse rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="h-5 w-40 rounded bg-gray-200" />
            <div className="mt-5 space-y-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="h-20 rounded-2xl bg-gray-100" />
              ))}
            </div>
          </div>
        </div>

        <div className="animate-pulse rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="h-5 w-40 rounded bg-gray-200" />
          <div className="mt-5 space-y-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-24 rounded-2xl bg-gray-100" />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ProgressDashboardPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()

  const [overview, setOverview] = useState(null)
  const [subjects, setSubjects] = useState([])
  const [activity, setActivity] = useState([])
  const [quizzes, setQuizzes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadDashboard = async () => {
    setLoading(true)
    setError('')
    try {
      const [overviewRes, subjectsRes, activityRes, quizzesRes] = await Promise.all([
        progressApi.overview(),
        progressApi.subjects(),
        progressApi.activity(),
        progressApi.quizzes(),
      ])

      setOverview(overviewRes.data)
      setSubjects(subjectsRes.data || [])
      setActivity(activityRes.data || [])
      setQuizzes(quizzesRes.data || [])
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to load your progress dashboard.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (authLoading) return
    if (!user) {
      router.push('/auth/login')
      return
    }
    loadDashboard()
  }, [authLoading, user])

  if (authLoading || (!user && !error)) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex min-h-screen items-center justify-center pt-16">
          <Loader2 size={32} className="animate-spin text-emerald-500" />
        </div>
      </div>
    )
  }

  const hasAnyActivity = activity.length > 0
    || Number(overview?.total_lessons_completed || 0) > 0
    || Number(overview?.total_quizzes_taken || 0) > 0
    || Number(overview?.total_documents_downloaded || 0) > 0

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="mx-auto max-w-7xl px-4 pb-16 pt-24 sm:px-6">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 text-sm font-medium text-emerald-700 no-underline hover:text-emerald-600"
            >
              <ChevronLeft size={16} />
              Back to dashboard
            </Link>
            <h1 className="mt-3 font-serif text-3xl text-gray-900">Student Progress Dashboard</h1>
            <p className="mt-2 max-w-2xl text-sm text-gray-500">
              Stay motivated by tracking your lesson completion, quiz performance, downloads, and recent activity.
            </p>
          </div>

          <button
            onClick={loadDashboard}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-white px-4 py-2.5 text-sm font-semibold text-emerald-700 shadow-sm transition-all hover:bg-emerald-50"
          >
            <RefreshCw size={15} />
            Refresh
          </button>
        </div>

        {loading ? (
          <LoadingSkeleton />
        ) : error ? (
          <div className="rounded-3xl border border-rose-200 bg-rose-50 p-8 text-center shadow-sm">
            <p className="text-lg font-semibold text-rose-700">Could not load progress data</p>
            <p className="mt-2 text-sm text-rose-600">{error}</p>
            <button
              onClick={loadDashboard}
              className="mt-5 rounded-2xl bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-rose-500"
            >
              Try again
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <StatsCards stats={overview} />
            <MotivationBanner isActive={hasAnyActivity} />

            <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
              <div className="space-y-6">
                <SubjectProgressList subjects={subjects} />
                <ActivityFeed activities={activity} />
              </div>

              <QuizPerformance quizzes={quizzes} />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
