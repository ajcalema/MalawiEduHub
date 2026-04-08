'use client'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'
import AccessModal from '@/components/documents/AccessModal'
import { documentsApi } from '@/lib/api'
import { useAuth } from '@/lib/auth-context'
import {
  Download, Eye, ChevronLeft, FileText, BookOpen, BookMarked,
  ClipboardList, GraduationCap, Calendar, User, Tag, Loader2
} from 'lucide-react'
import toast from 'react-hot-toast'

const LEVEL_LABELS = { primary:'Primary',jce:'JCE',msce:'MSCE',tvet:'TVET',university:'University',other:'Other' }
const TYPE_LABELS  = { past_paper:'Past Paper',notes:'Notes',textbook:'Textbook',marking_scheme:'Marking Scheme',revision_guide:'Revision Guide',assignment:'Assignment',syllabus:'Syllabus',school_calendar:'School Calendar',other:'Other' }
const TYPE_ICONS   = { past_paper:FileText,notes:BookOpen,textbook:BookMarked,marking_scheme:ClipboardList,revision_guide:GraduationCap,assignment:ClipboardList,syllabus:BookOpen,school_calendar:Calendar,other:FileText }

export default function DocumentDetailPage() {
  const { id } = useParams()
  const router  = useRouter()
  const { user, hasAccess, refreshProfile } = useAuth()
  const [doc,        setDoc]        = useState(null)
  const [loading,    setLoading]    = useState(true)
  const [downloading,setDownloading]= useState(false)
  const [showModal,  setShowModal]  = useState(false)

  useEffect(() => {
    if (!id) return
    documentsApi.get(id)
      .then(r => setDoc(r.data))
      .catch(() => toast.error('Document not found.'))
      .finally(() => setLoading(false))
  }, [id])

  // Refresh user profile on mount to ensure latest subscription is loaded
  useEffect(() => {
    if (user && refreshProfile) {
      refreshProfile().catch(() => {})
    }
  }, [])

  const handleDownload = async () => {
    if (!user) { router.push('/auth/login'); return }
    if (!hasAccess()) { setShowModal(true); return }
    setDownloading(true)
    try {
      const { data } = await documentsApi.download(id)
      window.open(data.download_url, '_blank')
    } catch (err) {
      if (err?.response?.status === 403) setShowModal(true)
      else toast.error('Download failed.')
    } finally {
      setDownloading(false)
    }
  }

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <Navbar />
      <Loader2 size={32} className="text-green-500 animate-spin mt-16" />
    </div>
  )

  if (!doc) return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 pt-28 text-center">
        <h1 className="font-serif text-2xl text-gray-700 mb-4">Document not found</h1>
        <Link href="/browse" className="text-green-600 hover:underline text-sm">← Back to library</Link>
      </div>
    </div>
  )

  const Icon = TYPE_ICONS[doc.doc_type] || FileText

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-24 pb-12">

        {/* Back */}
        <Link href="/browse"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-green-600 mb-6 no-underline transition-colors">
          <ChevronLeft size={16} /> Back to library
        </Link>

        <div className="grid md:grid-cols-3 gap-6">

          {/* Main info */}
          <div className="md:col-span-2 flex flex-col gap-4">
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              {/* Icon + badges */}
              <div className="flex items-start gap-4 mb-5">
                <div className="w-14 h-14 rounded-2xl bg-green-50 flex items-center justify-center flex-shrink-0">
                  <Icon size={26} className="text-green-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-green-50 text-green-700">
                      {LEVEL_LABELS[doc.level]}
                    </span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-orange-50 text-orange-700">
                      {TYPE_LABELS[doc.doc_type]}
                    </span>
                  </div>
                  <h1 className="font-serif text-2xl text-gray-900 leading-tight">{doc.title}</h1>
                </div>
              </div>

              {doc.description && (
                <p className="text-sm text-gray-600 leading-relaxed mb-4 pb-4 border-b border-gray-50">
                  {doc.description}
                </p>
              )}

              {/* Meta grid */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { icon: Tag,      label: 'Subject',  value: `${doc.subject_icon || ''} ${doc.subject_name}` },
                  { icon: Calendar, label: 'Year',     value: doc.year || '—' },
                  { icon: Download, label: 'Downloads',value: doc.download_count?.toLocaleString() || '0' },
                  { icon: Eye,      label: 'Views',    value: doc.view_count?.toLocaleString() || '0' },
                  { icon: User,     label: 'Uploaded by', value: doc.uploader_name || 'Community' },
                ].map(({ icon: MetaIcon, label, value }) => (
                  <div key={label} className="flex items-center gap-2.5 p-3 bg-gray-50 rounded-xl">
                    <MetaIcon size={14} className="text-gray-400 flex-shrink-0" />
                    <div>
                      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">{label}</p>
                      <p className="text-sm font-medium text-gray-700">{value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Download card */}
          <div className="flex flex-col gap-4">
            <div className="bg-white rounded-2xl border border-gray-100 p-5 sticky top-24">
              <div className="text-center mb-5">
                <p className="text-3xl font-bold text-green-700">
                  {doc.is_free ? 'Free' : `MWK ${parseFloat(doc.price_mwk).toLocaleString()}`}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {doc.is_free ? 'No payment needed' : 'or free with subscription'}
                </p>
              </div>

              <button
                onClick={handleDownload}
                disabled={downloading}
                className="w-full py-3.5 flex items-center justify-center gap-2 bg-green-500 text-white
                  font-semibold rounded-xl hover:bg-green-400 transition-all hover:-translate-y-0.5
                  disabled:opacity-60 disabled:cursor-not-allowed text-sm">
                {downloading
                  ? <><span className="spinner" /> Preparing…</>
                  : <><Download size={16} /> Download document</>}
              </button>

              {!hasAccess() && (
                <div className="mt-4 pt-4 border-t border-gray-50">
                  <p className="text-xs text-gray-500 text-center mb-3">Or get unlimited access</p>
                  <div className="flex flex-col gap-2 text-xs text-gray-600">
                    <div className="flex items-center gap-2 p-2.5 bg-gray-50 rounded-xl">
                      <span className="text-green-500 font-bold">✓</span>
                      Monthly: <strong>MWK 2,500</strong>
                    </div>
                    <div className="flex items-center gap-2 p-2.5 bg-gray-50 rounded-xl">
                      <span className="text-green-500 font-bold">✓</span>
                      Upload 5 docs = 1-day free pass
                    </div>
                  </div>
                </div>
              )}

              {user && hasAccess() && (
                <div className="mt-3 p-3 bg-green-50 rounded-xl text-center">
                  <p className="text-xs font-semibold text-green-700">✓ Active subscription</p>
                  <p className="text-xs text-green-600 mt-0.5">Unlimited downloads included</p>
                </div>
              )}
            </div>

            {/* Related docs link */}
            <Link href={`/browse?subject=${doc.subject_slug}&level=${doc.level}`}
              className="flex items-center justify-center gap-2 py-3 text-sm text-gray-500
                bg-white rounded-2xl border border-gray-100 hover:border-green-200 hover:text-green-600
                no-underline transition-all">
              View related {doc.subject_name} documents →
            </Link>
          </div>
        </div>
      </div>

      {showModal && (
        <AccessModal
          doc={doc}
          onClose={() => setShowModal(false)}
          onSuccess={() => { setShowModal(false); handleDownload() }}
        />
      )}
    </div>
  )
}
