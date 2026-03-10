// ============================================================
// ToastContainer.jsx — Premium toasts with icons + progress bar
// ============================================================

import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const ToastContext = createContext(null)
let toastId = 0

// Toast type config
const TYPE_CONFIG = {
    success: {
        bg: 'rgba(16,185,129,0.12)',
        border: 'rgba(16,185,129,0.3)',
        text: '#34d399',
        bar: '#10b981',
        icon: (
            <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
        ),
    },
    error: {
        bg: 'rgba(239,68,68,0.12)',
        border: 'rgba(239,68,68,0.3)',
        text: '#f87171',
        bar: '#ef4444',
        icon: (
            <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
        ),
    },
    warning: {
        bg: 'rgba(245,158,11,0.12)',
        border: 'rgba(245,158,11,0.3)',
        text: '#fbbf24',
        bar: '#f59e0b',
        icon: (
            <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
        ),
    },
    info: {
        bg: 'rgba(99,102,241,0.12)',
        border: 'rgba(99,102,241,0.3)',
        text: '#818cf8',
        bar: '#6366f1',
        icon: (
            <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
        ),
    },
}

function Toast({ id, message, type = 'info', duration = 5000, onRemove }) {
    const cfg = TYPE_CONFIG[type] || TYPE_CONFIG.info
    const [progress, setProgress] = useState(100)
    const startRef = useRef(Date.now())
    const rafRef = useRef(null)

    useEffect(() => {
        if (duration <= 0) return

        const tick = () => {
            const elapsed = Date.now() - startRef.current
            const pct = Math.max(0, 100 - (elapsed / duration) * 100)
            setProgress(pct)
            if (pct > 0) {
                rafRef.current = requestAnimationFrame(tick)
            }
        }
        rafRef.current = requestAnimationFrame(tick)
        const timer = setTimeout(() => onRemove(id), duration)

        return () => {
            cancelAnimationFrame(rafRef.current)
            clearTimeout(timer)
        }
    }, [id, duration, onRemove])

    return (
        <motion.div
            layout
            initial={{ opacity: 0, x: 80, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 60, scale: 0.92 }}
            transition={{ duration: 0.28, ease: [0.34, 1.56, 0.64, 1] }}
            className="relative overflow-hidden rounded-2xl min-w-[300px] max-w-[400px]"
            style={{
                background: 'rgba(10,15,30,0.92)',
                border: `1px solid ${cfg.border}`,
                backdropFilter: 'blur(20px)',
                boxShadow: `0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px ${cfg.border}`,
            }}
        >
            {/* Content */}
            <div className="flex items-start gap-3 px-4 py-3.5">
                {/* Icon */}
                <span
                    className="flex-shrink-0 mt-0.5"
                    style={{ color: cfg.text }}
                >
                    {cfg.icon}
                </span>

                {/* Message */}
                <p className="text-sm font-medium text-white/90 flex-1 leading-relaxed">{message}</p>

                {/* Close */}
                <button
                    onClick={() => onRemove(id)}
                    className="flex-shrink-0 p-0.5 rounded-md opacity-40 hover:opacity-80 transition-opacity text-white"
                >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            {/* Progress bar */}
            {duration > 0 && (
                <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-white/5">
                    <div
                        className="h-full rounded-full transition-none"
                        style={{ width: `${progress}%`, background: cfg.bar }}
                    />
                </div>
            )}
        </motion.div>
    )
}

export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([])

    const removeToast = useCallback((id) => {
        setToasts((prev) => prev.filter((t) => t.id !== id))
    }, [])

    const addToast = useCallback((message, type = 'info', duration = 4500) => {
        const id = ++toastId
        setToasts((prev) => [...prev, { id, message, type, duration }])
        return id
    }, [])

    return (
        <ToastContext.Provider value={{ addToast, removeToast }}>
            {children}
            <div className="toast-container">
                <AnimatePresence initial={false}>
                    {toasts.map((toast) => (
                        <Toast
                            key={toast.id}
                            {...toast}
                            onRemove={removeToast}
                        />
                    ))}
                </AnimatePresence>
            </div>
        </ToastContext.Provider>
    )
}

export function useToast() {
    const ctx = useContext(ToastContext)
    if (!ctx) throw new Error('useToast must be used within ToastProvider')
    return ctx
}
