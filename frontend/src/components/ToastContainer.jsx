// ============================================================
// ToastContainer.jsx — Toast notifications (top-right, auto-dismiss)
// ============================================================

import { createContext, useContext, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const ToastContext = createContext(null)

let toastId = 0

export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([])

    const addToast = useCallback((message, type = 'info', duration = 5000) => {
        const id = ++toastId
        setToasts(prev => [...prev, { id, message, type }])
        if (duration > 0) {
            setTimeout(() => removeToast(id), duration)
        }
        return id
    }, [])

    const removeToast = useCallback((id) => {
        setToasts(prev => prev.filter(t => t.id !== id))
    }, [])

    return (
        <ToastContext.Provider value={{ addToast, removeToast }}>
            {children}
            <div className="toast-container">
                <AnimatePresence>
                    {toasts.map(toast => (
                        <motion.div
                            key={toast.id}
                            initial={{ opacity: 0, x: 60, scale: 0.95 }}
                            animate={{ opacity: 1, x: 0, scale: 1 }}
                            exit={{ opacity: 0, x: 40, scale: 0.95 }}
                            transition={{ duration: 0.25, ease: 'easeOut' }}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg backdrop-blur-xl text-sm font-medium min-w-[280px] max-w-[400px] ${toast.type === 'success' ? 'bg-emerald-500/90 text-white' :
                                    toast.type === 'error' ? 'bg-red-500/90 text-white' :
                                        toast.type === 'warning' ? 'bg-amber-500/90 text-white' :
                                            'bg-dark-800/90 text-dark-100 border border-dark-700/50'
                                }`}
                        >
                            <span className="text-base">
                                {toast.type === 'success' ? '✓' :
                                    toast.type === 'error' ? '✕' :
                                        toast.type === 'warning' ? '⚠' : 'ℹ'}
                            </span>
                            <span className="flex-1">{toast.message}</span>
                            <button
                                onClick={() => removeToast(toast.id)}
                                className="ml-2 opacity-60 hover:opacity-100 transition-opacity text-lg leading-none"
                            >
                                ×
                            </button>
                        </motion.div>
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
