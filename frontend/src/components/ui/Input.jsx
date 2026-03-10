// ============================================================
// Input.jsx — Reusable form input with animated focus glow
// ============================================================

import { useState, forwardRef } from 'react'
import { motion } from 'framer-motion'

const Input = forwardRef(function Input(
    {
        label,
        error,
        hint,
        leftIcon,
        rightIcon,
        type = 'text',
        as: Tag = 'input',
        className = '',
        wrapperClass = '',
        rows = 4,
        ...props
    },
    ref
) {
    const [focused, setFocused] = useState(false)

    return (
        <div className={`w-full ${wrapperClass}`}>
            {label && (
                <label className="label">{label}</label>
            )}

            <div className="relative">
                {/* Left Icon */}
                {leftIcon && (
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sub pointer-events-none">
                        {leftIcon}
                    </span>
                )}

                {/* The actual field */}
                {Tag === 'textarea' ? (
                    <textarea
                        ref={ref}
                        rows={rows}
                        className={`input resize-none ${leftIcon ? '!pl-10' : ''} ${rightIcon ? '!pr-10' : ''} ${error ? '!border-red-500/50' : ''} ${className}`}
                        onFocus={() => setFocused(true)}
                        onBlur={() => setFocused(false)}
                        {...props}
                    />
                ) : (
                    <input
                        ref={ref}
                        type={type}
                        className={`input ${leftIcon ? '!pl-10' : ''} ${rightIcon ? '!pr-10' : ''} ${error ? '!border-red-500/50' : ''} ${className}`}
                        onFocus={() => setFocused(true)}
                        onBlur={() => setFocused(false)}
                        {...props}
                    />
                )}

                {/* Right Icon */}
                {rightIcon && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sub">
                        {rightIcon}
                    </span>
                )}

                {/* Focus glow ring */}
                {focused && !error && (
                    <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 rounded-xl pointer-events-none"
                        style={{ boxShadow: '0 0 0 3px rgba(59,130,246,0.2), 0 0 20px rgba(59,130,246,0.06)' }}
                    />
                )}
                {focused && error && (
                    <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="absolute inset-0 rounded-xl pointer-events-none"
                        style={{ boxShadow: '0 0 0 3px rgba(239,68,68,0.2)' }}
                    />
                )}
            </div>

            {/* Error */}
            {error && (
                <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-xs text-red-400 mt-1.5 flex items-center gap-1"
                >
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {error}
                </motion.p>
            )}

            {/* Hint */}
            {hint && !error && (
                <p className="text-xs text-sub mt-1.5 opacity-70">{hint}</p>
            )}
        </div>
    )
})

export default Input
