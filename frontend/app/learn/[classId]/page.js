'use client'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'
import { learnApi } from '@/lib/api'
import { useAuth } from '@/lib/auth-context'
import { ChevronRight, ChevronLeft, BookOpen, Loader2, GraduationCap } from 'lucide-react'

const SUBJECT_COLORS = [
  { bg:'#E1F5EE', border:'#9FE1CB', text:'#085041', icon:'#1D9E75' },
  { bg:'#E6F1FB', border:'#B5D4F4', text:'#0C447C', icon:'#378ADD' },
  { bg:'#FAEEDA', border:'#FAC775', text:'#633806', icon:'#BA7517' },
  { bg:'#EEEDFE', border:'#CECBF6', text:'#3C3489', icon:'#7F77DD' },
  { bg:'#FCEBEB', border:'#F7C1C1', text:'#791F1F', icon:'#E24B4A' },
  { bg:'#EAF3DE', border:'#C0DD97', text:'#27500A', icon:'#639922' },
  { bg:'#FBEAF0', border:'#F4C0D1', text:'#4B1528', icon:'#D4537E' },
  { bg:'#FAECE7', border:'#F5C4B3', text:'#4A1B0C', icon:'#D85A30' },
]

export default function SubjectsPage() {
  const { classId } = useParams()
  const { user }    = useAuth()
  const router      = useRouter()
  const [subjects,  setSubjects]  = useState([])
  const [className, setClassName] = useState('')
  const [loading,   setLoading]   = useState(true)

  useEffect(() => {
    if (user === null) { router.push('/auth/login'); return }
    learnApi.getSubjects(classId)
      .then(r => {
        setSubjects(r.data || [])
        if (r.data?.[0]) setClassName(r.data[0].class_name)
      })
      .finally(() => setLoading(false))
  }, [classId, user])

  if (!user || loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <Navbar />
      <Loader2 size={32} className="text-green-500 animate-spin" />
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-24 pb-16">

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-400 mb-8">
          <Link href="/learn" className="hover:text-green-600 transition-colors no-underline flex items-center gap-1">
            <GraduationCap size={14} /> Learning Room
          </Link>
          <ChevronRight size={14} />
          <span className="text-gray-700 font-medium">{className}</span>
        </div>

        {/* Header */}
        <div className="mb-10">
          <h1 className="font-serif text-3xl sm:text-4xl text-gray-900 mb-2">
            {className} — Choose a subject
          </h1>
          <p className="text-gray-500 text-sm">Select a subject to see its topics and learning materials.</p>
        </div>

        {subjects.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
            <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <BookOpen size={26} className="text-gray-300" />
            </div>
            <p className="font-semibold text-gray-600 mb-1">No subjects yet</p>
            <p className="text-sm text-gray-400">Admin has not added subjects for this class yet.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {subjects.map((subj, i) => {
              const c = SUBJECT_COLORS[i % SUBJECT_COLORS.length]
              return (
                <Link key={subj.subject_id}
                  href={`/learn/${classId}/${subj.subject_id}`}
                  className="group block no-underline">
                  <div className="rounded-2xl border-2 p-5 transition-all duration-300
                    hover:-translate-y-1 hover:shadow-lg h-full"
                    style={{ background: c.bg, borderColor: c.border }}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                        style={{ background: c.icon + '20' }}>
                        {subj.icon_emoji || '📚'}
                      </div>
                      <ChevronRight size={18} style={{ color: c.icon }}
                        className="group-hover:translate-x-1 transition-transform" />
                    </div>
                    <h2 className="font-semibold text-base mb-1" style={{ color: c.text }}>
                      {subj.subject_name}
                    </h2>
                    <p className="text-xs font-medium mt-2" style={{ color: c.icon }}>
                      {subj.topic_count} topic{subj.topic_count !== 1 ? 's' : ''}
                    </p>
                  </div>
                </Link>
              )
            })}
          </div>
        )}

        {/* Back */}
        <div className="mt-8">
          <Link href="/learn"
            className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-green-600 transition-colors no-underline">
            <ChevronLeft size={15} /> Back to class selection
          </Link>
        </div>
      </div>
    </div>
  )
}