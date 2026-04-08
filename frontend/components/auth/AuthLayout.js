import Link from 'next/link'

export default function AuthLayout({ children, side }) {
  return (
    <div className="min-h-screen grid lg:grid-cols-2">

      {/* ── Left panel — branding ── */}
      <div className="auth-panel-left hidden lg:flex flex-col justify-between p-12">
        <div className="auth-grid-bg" />

        {/* Glow */}
        <div className="absolute top-[-80px] right-[-60px] w-[420px] h-[420px] rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(13,122,85,0.4) 0%, transparent 70%)' }} />
        <div className="absolute bottom-[-60px] left-[-40px] w-[280px] h-[280px] rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(212,160,23,0.2) 0%, transparent 70%)' }} />

        {/* Logo */}
        <div className="relative z-10">
          <Link href="/" className="flex items-center gap-3 no-underline">
            <div className="w-10 h-10 rounded-xl bg-green-500 flex items-center justify-center">
              <svg viewBox="0 0 18 18" fill="none" width="20" height="20">
                <path d="M9 2L2 6v6l7 4 7-4V6L9 2z" stroke="#fff" strokeWidth="1.4" strokeLinejoin="round"/>
                <path d="M9 2v10M2 6l7 4 7-4" stroke="#fff" strokeWidth="1.4" strokeLinecap="round"/>
              </svg>
            </div>
            <span className="font-serif text-xl text-white">MalawiEduHub</span>
          </Link>
        </div>

        {/* Centre content */}
        <div className="relative z-10 flex-1 flex flex-col justify-center">
          {side}
        </div>

        {/* Bottom tagline */}
        <div className="relative z-10">
          <p className="text-xs text-white/30">
            Payments via Airtel Money &amp; TNM Mpamba
          </p>
        </div>
      </div>

      {/* ── Right panel — form ── */}
      <div className="flex flex-col justify-center items-center px-6 py-12 bg-white min-h-screen lg:min-h-0">

        {/* Mobile logo — tap to go home */}
        <Link href="/" className="lg:hidden mb-6 flex items-center gap-3 no-underline self-start">
          <div className="w-9 h-9 rounded-xl bg-green-500 flex items-center justify-center">
            <svg viewBox="0 0 18 18" fill="none" width="18" height="18">
              <path d="M9 2L2 6v6l7 4 7-4V6L9 2z" stroke="#fff" strokeWidth="1.4" strokeLinejoin="round"/>
              <path d="M9 2v10M2 6l7 4 7-4" stroke="#fff" strokeWidth="1.4" strokeLinecap="round"/>
            </svg>
          </div>
          <span className="font-serif text-xl text-gray-900">MalawiEduHub</span>
        </Link>

        <div className="w-full max-w-md">
          <nav className="mb-6 flex flex-wrap items-center gap-x-1 gap-y-2 text-sm" aria-label="Leave sign-in">
            <Link
              href="/browse"
              className="text-gray-500 hover:text-green-600 no-underline font-medium transition-colors"
            >
              ← Back to library
            </Link>
            <span className="text-gray-300 mx-2 hidden sm:inline" aria-hidden>
              ·
            </span>
            <Link href="/" className="text-gray-500 hover:text-green-600 no-underline font-medium transition-colors">
              Home
            </Link>
          </nav>
          {children}
        </div>
      </div>
    </div>
  )
}
