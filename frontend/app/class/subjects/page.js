'use client'
export const dynamic = 'force-dynamic'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'
import { learnApi } from '@/lib/api'
import { useAuth } from '@/lib/auth-context'
import toast from 'react-hot-toast'
import {
  ChevronRight, ChevronLeft, BookOpen, Loader2, GraduationCap
} from 'lucide-react'

function SubjectsContent() {
  const { user } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()

  const [subjects, setSubjects] = useState([])
  const [classMeta, setClassMeta] = useState({ name: '', description: '' })
  const [loading, setLoading] = useState(true)

  const classId = searchParams.get('class')

  useEffect(() => {
    if (user === null) {
      router.push('/auth/login')
      return
    }
    if (!classId) {
      router.push('/class')
      return
    }
    loadData()
  }, [user, classId])

  const loadData = async () => {
    setLoading(true)
    try {
      const [clsRes, subjRes] = await Promise.all([
        learnApi.getClasses(),
        learnApi.getSubjects(classId)
      ])
      
      const cls = clsRes.data?.find(c => c.id === parseInt(classId))
      if (cls) setClassMeta({ name: cls.name, description: cls.description })
      
      setSubjects(subjRes.data || [])
    } catch (err) {
      const msg = err?.response?.data?.error || 'Failed to load subjects'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

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
      <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-24 pb-16">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-400 mb-8 flex-wrap">
          <Link href="/class" className="hover:text-green-600 no-underline flex items-center gap-1 transition-colors">
            <GraduationCap size={14} /> Learning Room
          </Link>
          <ChevronRight size={14} />
          <span className="text-gray-700 font-medium">{classMeta.name}</span>
        </div>

        {/* Header */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-green-50 flex items-center justify-center text-2xl flex-shrink-0">
              🎓
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-green-600 uppercase tracking-wider mb-0.5">Select Subject</p>
              <h1 className="font-serif text-2xl text-gray-900">{classMeta.name}</h1>
              {classMeta.description && (
                <p className="text-sm text-gray-500 mt-1">{classMeta.description}</p>
              )}
            </div>
          </div>
        </div>

        {/* Subjects grid */}
        {subjects.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
            <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <BookOpen size={26} className="text-gray-300" />
            </div>
            <p className="font-semibold text-gray-600 mb-1">No subjects yet</p>
            <p className="text-sm text-gray-400">Admin is still adding subjects for this class.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {subjects.map((subject) => (
              <Link key={subject.id} href={`/class/topics?class=${classId}&subject=${subject.id}`}
                className="group block no-underline">
                <div className="flex items-center gap-4 p-5 rounded-2xl border bg-white border-gray-100 hover:border-green-200 hover:shadow-sm hover:-translate-y-0.5 transition-all duration-200">
                  <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center text-2xl flex-shrink-0">
                    📚
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-800 group-hover:text-green-700 truncate">
                      {subject.subject_name}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {subject.topic_count || 0} topic{(subject.topic_count || 0) !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <ChevronRight size={18} className="text-gray-300 group-hover:text-green-500 group-hover:translate-x-1 transition-all" />
                </div>
              </Link>
            ))}
          </div>
        )}

        <div className="mt-6">
          <Link href="/class"
            className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-green-600 transition-colors no-underline">
            <ChevronLeft size={15} /> Back to classes
          </Link>
        </div>
      </div>
    </div>
  )
}

function Loading() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <Loader2 size={32} className="text-green-500 animate-spin" />
    </div>
  )
}

export default function SubjectsPage() {
  return (
    <Suspense fallback={<Loading />}>
      <SubjectsContent />
    </Suspense>
  )
}