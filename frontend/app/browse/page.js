'use client'
import { useState, useEffect, useCallback, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import DocumentCard from '@/components/documents/DocumentCard'
import FilterSidebar from '@/components/documents/FilterSidebar'
import AccessModal from '@/components/documents/AccessModal'
import { documentsApi, subjectsApi, paymentsApi } from '@/lib/api'
import { useAuth } from '@/lib/auth-context'
import { Search, SlidersHorizontal, X, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

const SORT_OPTIONS = [
  { value: 'newest',  label: 'Newest first' },
  { value: 'popular', label: 'Most downloaded' },
  { value: 'relevant',label: 'Most relevant' },
]

function BrowseContent() {
  const { user, hasAccess, refreshProfile } = useAuth()
  const router       = useRouter()
  const searchParams = useSearchParams()

  const [docs,     setDocs]     = useState([])
  const [subjects, setSubjects] = useState([])
  const [loading,  setLoading]  = useState(true)
  const [pagination, setPagination] = useState({ total: 0, page: 1, total_pages: 1 })
  const [showFilters, setShowFilters] = useState(false)
  const [accessDoc,   setAccessDoc]   = useState(null) // doc to show payment modal for
  const [search, setSearch] = useState(searchParams.get('search') || '')
  const [searchInput, setSearchInput] = useState(searchParams.get('search') || '')

  const [filters, setFilters] = useState({
    subject:  searchParams.get('subject')  || '',
    level:    searchParams.get('level')    || '',
    doc_type: searchParams.get('doc_type') || '',
    year:     searchParams.get('year')     || '',
    sort:     'newest',
    page:     1,
  })

  // Refresh user profile on mount to ensure latest subscription is loaded
  useEffect(() => {
    if (user && refreshProfile) {
      refreshProfile().catch(() => {})
    }
  }, [])

  // Load subjects once
  useEffect(() => {
    subjectsApi.list()
      .then(r => setSubjects(r.data))
      .catch(() => {})
  }, [])

  // Load documents when filters or search change
  const loadDocs = useCallback(async () => {
    setLoading(true)
    try {
      const params = { ...filters, limit: 20 }
      if (search) params.search = search
      // Remove empty values
      Object.keys(params).forEach(k => { if (!params[k]) delete params[k] })
      const { data } = await documentsApi.browse(params)
      setDocs(data.documents)
      setPagination(data.pagination)
    } catch (err) {
      toast.error('Failed to load documents.')
    } finally {
      setLoading(false)
    }
  }, [filters, search])

  useEffect(() => { loadDocs() }, [loadDocs])

  const handleSearch = (e) => {
    e.preventDefault()
    setSearch(searchInput)
    setFilters(f => ({ ...f, page: 1 }))
  }

  const handleDownload = async (doc) => {
    if (!user) { router.push('/auth/login'); return }

    // If user has active subscription, download directly
    if (hasAccess()) {
      try {
        const { data } = await documentsApi.download(doc.id)
        window.open(data.download_url, '_blank')
      } catch (err) {
        if (err?.response?.status === 403) {
          setAccessDoc(doc)
        } else {
          toast.error('Download failed. Please try again.')
        }
      }
      return
    }

    // No access — show payment modal
    setAccessDoc(doc)
  }

  const activeFilterCount = [filters.subject, filters.level, filters.doc_type, filters.year].filter(Boolean).length

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Page header */}
      <div className="bg-white border-b border-gray-100 pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div>
              <h1 className="font-serif text-2xl text-gray-900">Browse library</h1>
              <p className="text-sm text-gray-500 mt-0.5">
                {loading ? '…' : `${pagination.total.toLocaleString()} documents`}
                {search && <span> matching "<span className="font-medium text-gray-700">{search}</span>"</span>}
              </p>
            </div>

            {/* Search bar */}
            <form onSubmit={handleSearch} className="flex-1 max-w-lg sm:ml-auto">
              <div className="relative flex gap-2">
                <div className="relative flex-1">
                  <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  <input
                    value={searchInput}
                    onChange={e => setSearchInput(e.target.value)}
                    placeholder="Search documents…"
                    className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-gray-200
                      focus:outline-none focus:border-green-400 focus:shadow-[0_0_0_3px_rgba(13,122,85,0.1)]
                      bg-gray-50 focus:bg-white transition-all"
                  />
                  {searchInput && (
                    <button type="button" onClick={() => { setSearchInput(''); setSearch('') }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      <X size={14} />
                    </button>
                  )}
                </div>
                <button type="submit"
                  className="px-4 py-2.5 bg-green-500 text-white text-sm font-semibold rounded-xl hover:bg-green-400 transition-all">
                  Search
                </button>
              </div>
            </form>
          </div>

          {/* Sort + filter toggle row */}
          <div className="flex items-center gap-3 mt-4 flex-wrap">
            <div className="flex gap-2 flex-wrap">
              {SORT_OPTIONS.map(s => (
                <button key={s.value}
                  onClick={() => setFilters(f => ({ ...f, sort: s.value, page: 1 }))}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all ${
                    filters.sort === s.value
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}>
                  {s.label}
                </button>
              ))}
            </div>

            {/* Active filter chips */}
            {filters.level && (
              <FilterChip label={filters.level.toUpperCase()} onRemove={() => setFilters(f => ({ ...f, level: '', page: 1 }))} />
            )}
            {filters.doc_type && (
              <FilterChip label={filters.doc_type.replace('_', ' ')} onRemove={() => setFilters(f => ({ ...f, doc_type: '', page: 1 }))} />
            )}
            {filters.year && (
              <FilterChip label={filters.year} onRemove={() => setFilters(f => ({ ...f, year: '', page: 1 }))} />
            )}
            {filters.subject && (
              <FilterChip label={subjects.find(s => s.slug === filters.subject)?.name || filters.subject}
                onRemove={() => setFilters(f => ({ ...f, subject: '', page: 1 }))} />
            )}

            {/* Mobile filter button */}
            <button
              onClick={() => setShowFilters(true)}
              className="lg:hidden ml-auto flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold
                rounded-xl border border-gray-200 text-gray-600 hover:border-gray-300 transition-colors">
              <SlidersHorizontal size={14} />
              Filters
              {activeFilterCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-green-500 text-white text-[10px] flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex gap-6">

        {/* Desktop sidebar */}
        <div className="hidden lg:block">
          <FilterSidebar
            filters={filters}
            onChange={setFilters}
            subjects={subjects}
          />
        </div>

        {/* Mobile sidebar overlay */}
        {showFilters && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            <div className="fixed inset-0 bg-black/40" onClick={() => setShowFilters(false)} />
            <div className="relative ml-auto w-72 bg-white h-full overflow-y-auto p-4 animate-slide-in">
              <FilterSidebar
                filters={filters}
                onChange={(f) => { setFilters(f); setShowFilters(false) }}
                subjects={subjects}
                onClose={() => setShowFilters(false)}
              />
            </div>
          </div>
        )}

        {/* Document grid */}
        <div className="flex-1 min-w-0">
          {loading ? (
            <LoadingGrid />
          ) : docs.length === 0 ? (
            <EmptyState search={search} onClear={() => { setSearch(''); setSearchInput(''); setFilters(f => ({ ...f, subject: '', level: '', doc_type: '', year: '', page: 1 })) }} />
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {docs.map(doc => (
                  <DocumentCard key={doc.id} doc={doc} onDownload={handleDownload} />
                ))}
              </div>

              {/* Pagination */}
              {pagination.total_pages > 1 && (
                <div className="flex items-center justify-center gap-3 mt-8">
                  <button
                    disabled={filters.page <= 1}
                    onClick={() => setFilters(f => ({ ...f, page: f.page - 1 }))}
                    className="p-2 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                    <ChevronLeft size={18} />
                  </button>

                  <div className="flex gap-1">
                    {Array.from({ length: Math.min(pagination.total_pages, 7) }, (_, i) => {
                      const p = i + 1
                      return (
                        <button key={p}
                          onClick={() => setFilters(f => ({ ...f, page: p }))}
                          className={`w-9 h-9 text-sm font-semibold rounded-xl transition-all ${
                            filters.page === p
                              ? 'bg-green-500 text-white'
                              : 'text-gray-500 hover:bg-gray-100'
                          }`}>
                          {p}
                        </button>
                      )
                    })}
                  </div>

                  <button
                    disabled={filters.page >= pagination.total_pages}
                    onClick={() => setFilters(f => ({ ...f, page: f.page + 1 }))}
                    className="p-2 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                    <ChevronRight size={18} />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Access/payment modal */}
      {accessDoc && (
        <AccessModal
          doc={accessDoc}
          onClose={() => setAccessDoc(null)}
          onSuccess={() => {
            setAccessDoc(null)
            loadDocs()
          }}
        />
      )}
    </div>
  )
}

// ── Loading skeleton ────────────────────────
function LoadingGrid() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
      {Array.from({ length: 9 }).map((_, i) => (
        <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 animate-pulse">
          <div className="flex items-start justify-between mb-4">
            <div className="w-10 h-10 rounded-xl bg-gray-100" />
            <div className="flex gap-1">
              <div className="h-5 w-14 rounded-full bg-gray-100" />
              <div className="h-5 w-16 rounded-full bg-gray-100" />
            </div>
          </div>
          <div className="h-4 bg-gray-100 rounded-lg mb-2 w-3/4" />
          <div className="h-3 bg-gray-100 rounded-lg w-1/2 mb-4" />
          <div className="h-px bg-gray-50 mb-3" />
          <div className="flex gap-2">
            <div className="h-9 flex-1 bg-gray-100 rounded-xl" />
            <div className="h-9 flex-1 bg-green-50 rounded-xl" />
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Empty state ─────────────────────────────
function EmptyState({ search, onClear }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
        <Search size={28} className="text-gray-300" />
      </div>
      <h3 className="font-serif text-xl text-gray-700 mb-2">
        {search ? `No results for "${search}"` : 'No documents found'}
      </h3>
      <p className="text-sm text-gray-400 max-w-sm mb-6 leading-relaxed">
        {search
          ? 'Try different keywords or remove some filters.'
          : 'No documents match your current filters. Try broadening your search.'}
      </p>
      <button onClick={onClear}
        className="px-5 py-2.5 text-sm font-semibold text-green-600 border border-green-200 rounded-xl hover:bg-green-50 transition-colors">
        Clear all filters
      </button>
    </div>
  )
}

// ── Filter chip ─────────────────────────────
function FilterChip({ label, onRemove }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-xl
      bg-green-50 text-green-700 border border-green-100">
      {label}
      <button onClick={onRemove} className="hover:text-red-500 transition-colors">
        <X size={12} />
      </button>
    </span>
  )
}

// ── Page export with Suspense for useSearchParams ──
export default function BrowsePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 size={32} className="text-green-500 animate-spin" />
      </div>
    }>
      <BrowseContent />
    </Suspense>
  )
}
