'use client'
export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { classApi } from '@/lib/api'
import { useAuth } from '@/lib/auth-context'
import toast from 'react-hot-toast'
import {
  GraduationCap, Users, BookOpen, ArrowRight, Loader2
} from 'lucide-react'

// Class icons for display
const CLASS_ICONS = {
  'Form 1 (JCE)': '📚',
  'Form 2 (JCE)': '📖',
  'Form 3 (MSCE)': '🎓',
  'Form 4 (MSCE)': '🎒',
}

export default function ClassSelectionPage() {
  const { user } = useAuth()
  const router = useRouter()

  const [classes, setClasses] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedClass, setSelectedClass] = useState(null)
  const [selecting, setSelecting] = useState(false)

  useEffect(() => {
    if (!user) return
    loadClasses()
  }, [user])

  const loadClasses = async () => {
    try {
      const { data } = await classApi.getClasses()
      setClasses(data || [])
      
      // Check if user already has a class
      const myClassRes = await classApi.getMyClass()
      if (myClassRes.data?.selected) {
        router.push('/class/subjects')
      }
    } catch (err) {
      console.error('Failed to load classes:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSelectClass = async (classId) => {
    setSelecting(true)
    try {
      await classApi.selectClass(classId)
      toast.success('Class selected!')
      router.push('/class/subjects')
    } catch (err) {
      const msg = err?.response?.data?.error || 'Failed to select class'
      toast.error(msg)
    } finally {
      setSelecting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 size={32} className="text-green-500 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-5 py-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-500 flex items-center justify-center">
              <GraduationCap size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">MY CLASS - Select Your Class</h1>
              <p className="text-sm text-gray-500">Select your class to get started</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 p-5">
        <div className="max-w-2xl mx-auto space-y-4">
          <p className="text-sm text-gray-600 mb-6">
            Choose the class/form you are currently in. This will filter subjects and topics to match your curriculum.
          </p>

          {/* Class options */}
          <div className="grid grid-cols-2 gap-4">
            {classes.map((cls) => (
              <button
                key={cls.id}
                onClick={() => handleSelectClass(cls.id)}
                disabled={selecting}
                className="flex items-center gap-4 p-5 bg-white rounded-2xl border-2 border-gray-100 hover:border-green-300 hover:bg-green-50 transition-all text-left group disabled:opacity-50"
              >
                <div className="w-14 h-14 rounded-2xl bg-green-100 flex items-center justify-center text-2xl">
                  {CLASS_ICONS[cls.display_name] || '📚'}
                </div>
                <div className="flex-1">
                  <p className="text-base font-bold text-gray-900">{cls.display_name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {cls.level_type === 'jce' ? 'Junior Certificate' : 
                     cls.level_type === 'msce' ? 'Malawi School Certificate' : 
                     cls.level_type === 'tvet' ? 'Vocational Training' : 'University'}
                  </p>
                </div>
                <ArrowRight size={20} className="text-gray-300 group-hover:text-green-500 transition-colors" />
              </button>
            ))}
          </div>

          {/* Help text */}
          <div className="bg-blue-50 rounded-xl p-4 mt-6">
            <p className="text-sm text-blue-800">
              <strong>Why do I need to select a class?</strong>
              <br />
              Your class determines which subjects and topics are available for your studies. 
              Form 1-2 students see JCE content, while Form 3-4 see MSCE content.
            </p>
          </div>
        </div>
      </main>

      {/* Loading overlay */}
      {selecting && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 flex items-center gap-3">
            <Loader2 size={20} className="text-green-500 animate-spin" />
            <p className="text-sm font-medium">Setting your class...</p>
          </div>
        </div>
      )}
    </div>
  )
}