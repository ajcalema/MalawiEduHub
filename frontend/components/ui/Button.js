'use client'

export default function Button({
  children, variant = 'primary', size = 'md',
  loading, disabled, className = '', ...props
}) {
  const base = 'inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed'

  const variants = {
    primary: 'bg-green-500 text-white border border-green-500 hover:bg-green-400 hover:-translate-y-0.5 active:translate-y-0',
    outline: 'bg-transparent text-green-500 border border-green-500 hover:bg-green-50 hover:-translate-y-0.5',
    ghost:   'bg-transparent text-gray-600 border border-gray-200 hover:border-gray-300 hover:bg-gray-50',
    danger:  'bg-red-500 text-white border border-red-500 hover:bg-red-600 hover:-translate-y-0.5',
    dark:    'bg-white text-green-700 border border-white hover:bg-green-50 hover:-translate-y-0.5',
  }

  const sizes = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-5 py-3 text-sm',
    lg: 'px-7 py-4 text-base',
  }

  return (
    <button
      disabled={disabled || loading}
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {loading && <span className="spinner" />}
      {children}
    </button>
  )
}
