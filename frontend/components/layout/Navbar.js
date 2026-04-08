'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { Search, Menu, X, Upload, LayoutDashboard, Shield, BookOpen, LogOut, User } from 'lucide-react'

export default function Navbar({ onSearch }) {
  const { user, logout, isAdmin } = useAuth()
  const router   = useRouter()
  const pathname = usePathname()
  const [menuOpen,    setMenuOpen]    = useState(false)
  const [userMenuOpen,setUserMenuOpen]= useState(false)
  const [searchVal,   setSearchVal]   = useState('')

  const navLinks = [
    { href: '/browse',    label: 'Browse',   icon: BookOpen },
    { href: '/upload',    label: 'Upload',   icon: Upload },
    { href: '/dashboard', label: 'Dashboard',icon: LayoutDashboard },
    ...(isAdmin ? [{ href: '/admin', label: 'Admin', icon: Shield }] : []),
  ]

  const handleSearch = (e) => {
    e.preventDefault()
    if (onSearch) { onSearch(searchVal); return }
    router.push(`/browse?search=${encodeURIComponent(searchVal)}`)
  }

  const initials = user?.full_name
    ? user.full_name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0,2)
    : '?'

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center h-16 gap-4">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 flex-shrink-0 no-underline">
          <div className="w-8 h-8 rounded-xl bg-green-500 flex items-center justify-center">
            <svg viewBox="0 0 18 18" fill="none" width="16" height="16">
              <path d="M9 2L2 6v6l7 4 7-4V6L9 2z" stroke="#fff" strokeWidth="1.4" strokeLinejoin="round"/>
              <path d="M9 2v10M2 6l7 4 7-4" stroke="#fff" strokeWidth="1.4" strokeLinecap="round"/>
            </svg>
          </div>
          <span className="font-serif text-lg text-gray-900 hidden sm:block">MalawiEduHub</span>
        </Link>

        {/* Search bar */}
        <form onSubmit={handleSearch} className="flex-1 max-w-lg mx-4 hidden md:flex">
          <div className="relative w-full">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={searchVal}
              onChange={e => setSearchVal(e.target.value)}
              placeholder="Search past papers, notes, textbooks…"
              className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-gray-200 bg-gray-50
                focus:bg-white focus:border-green-400 focus:outline-none focus:shadow-[0_0_0_3px_rgba(13,122,85,0.1)]
                transition-all placeholder:text-gray-400"
            />
          </div>
        </form>

        {/* Desktop nav links */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map(({ href, label }) => (
            <Link key={href} href={href}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors no-underline
                ${pathname.startsWith(href)
                  ? 'bg-green-50 text-green-700'
                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'}`}>
              {label}
            </Link>
          ))}
        </div>

        {/* Auth buttons / user menu */}
        <div className="ml-auto flex items-center gap-2">
          {user ? (
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(o => !o)}
                className="flex items-center gap-2 px-2 py-1.5 rounded-xl hover:bg-gray-50 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white text-xs font-bold">
                  {initials}
                </div>
                <span className="text-sm font-medium text-gray-700 hidden sm:block max-w-[100px] truncate">
                  {user.full_name.split(' ')[0]}
                </span>
              </button>

              {userMenuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                  <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-2xl border border-gray-100 shadow-xl z-50 overflow-hidden py-1">
                    <div className="px-4 py-3 border-b border-gray-50">
                      <p className="text-sm font-semibold text-gray-900 truncate">{user.full_name}</p>
                      <p className="text-xs text-gray-400 truncate">{user.email || user.phone}</p>
                    </div>
                    {navLinks.map(({ href, label, icon: Icon }) => (
                      <Link key={href} href={href}
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 no-underline transition-colors">
                        <Icon size={15} className="text-gray-400" />
                        {label}
                      </Link>
                    ))}
                    <div className="border-t border-gray-50 mt-1">
                      <button
                        onClick={() => { setUserMenuOpen(false); logout() }}
                        className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors">
                        <LogOut size={15} />
                        Sign out
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            <>
              <Link href="/auth/login"
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 rounded-xl hover:bg-gray-50 transition-colors no-underline hidden sm:block">
                Sign in
              </Link>
              <Link href="/auth/register"
                className="px-4 py-2 text-sm font-semibold bg-green-500 text-white rounded-xl hover:bg-green-400 transition-all hover:-translate-y-0.5 no-underline">
                Get started
              </Link>
            </>
          )}

          {/* Mobile menu button */}
          <button
            onClick={() => setMenuOpen(o => !o)}
            className="md:hidden p-2 rounded-xl hover:bg-gray-50 text-gray-500"
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile search + menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white px-4 py-3 flex flex-col gap-2">
          <form onSubmit={handleSearch}>
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={searchVal}
                onChange={e => setSearchVal(e.target.value)}
                placeholder="Search documents…"
                className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:border-green-400"
              />
            </div>
          </form>
          {navLinks.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href}
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-gray-600 rounded-xl hover:bg-gray-50 no-underline">
              <Icon size={16} className="text-gray-400" />
              {label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  )
}
