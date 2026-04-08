'use client'

export default function Input({
  label, type = 'text', id, name,
  value, onChange, placeholder,
  error, hint, required,
  icon: Icon, ...props
}) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={id} className="text-xs font-semibold text-green-600 uppercase tracking-wider">
          {label} {required && <span className="text-red-400">*</span>}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-green-400 pointer-events-none">
            <Icon size={16} />
          </div>
        )}
        <input
          id={id}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          className={`
            w-full rounded-xl border bg-white px-4 py-3 text-sm text-gray-800
            transition-all duration-200
            placeholder:text-gray-400
            ${Icon ? 'pl-10' : ''}
            ${error
              ? 'border-red-300 focus:border-red-400 focus:shadow-[0_0_0_3px_rgba(239,68,68,0.12)]'
              : 'border-gray-200 focus:border-green-500 focus:shadow-[0_0_0_3px_rgba(13,122,85,0.12)]'
            }
          `}
          {...props}
        />
      </div>
      {hint  && !error && <p className="text-xs text-gray-400">{hint}</p>}
      {error && <p className="text-xs text-red-500 flex items-center gap-1">⚠ {error}</p>}
    </div>
  )
}
