// ============================================================
// Modal.jsx — Animated modal with backdrop blur + keyboard support
// ============================================================

import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const overlayVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1 },
}

const modalVariants = {
    hidden: { opacity: 0, scale: 0.93, y: 24 },
    show: {
        opacity: 1, scale: 1, y: 0,
        transition: { type: 'spring', stiffness: 400, damping: 32 },
    },
    exit: { opacity: 0, scale: 0.95, y: 12, transition: { duration: 0.18 } },
}

function Modal({
    isOpen,
    onClose,
    title,
    children,
    footer,
    size = 'md',
    hideHeader = false,
}) {
    // Close on Escape
    useEffect(() => {
        if (!isOpen) return
        const handler = (e) => { if (e.key === 'Escape') onClose?.() }
        document.addEventListener('keydown', handler)
        return () => document.removeEventListener('keydown', handler)
    }, [isOpen, onClose])

    // Prevent background scroll
    useEffect(() => {
        document.body.style.overflow = isOpen ? 'hidden' : ''
        return () => { document.body.style.overflow = '' }
    }, [isOpen])

    const widths = {
        sm: 'max-w-md',
        md: 'max-w-xl',
        lg: 'max-w-2xl',
        xl: 'max-w-4xl',
        full: 'max-w-[95vw]',
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        variants={overlayVariants}
                        initial="hidden"
                        animate="show"
                        exit="hidden"
                        transition={{ duration: 0.22 }}
                        className="absolute inset-0 bg-black/60 backdrop-blur-md"
                        onClick={onClose}
                    />

                    {/* Modal Panel */}
                    <motion.div
                        variants={modalVariants}
                        initial="hidden"
                        animate="show"
                        exit="exit"
                        className={`relative w-full ${widths[size] || widths.md} card !p-0 overflow-hidden z-10`}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Shimmer top line */}
                        <div className="absolute top-0 left-0 right-0 h-px"
                            style={{ background: 'linear-gradient(90deg, transparent, rgba(99,102,241,0.5), transparent)' }} />

                        {/* Header */}
                        {!hideHeader && (
                            <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
                                {title && (
                                    <h2 className="text-base font-bold text-heading">{title}</h2>
                                )}
                                <button
                                    onClick={onClose}
                                    className="ml-auto p-1.5 rounded-lg text-sub hover:text-heading hover:bg-white/5 transition-all duration-150"
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        )}

                        {/* Body */}
                        <div className="px-6 py-5 overflow-y-auto max-h-[70vh]">
                            {children}
                        </div>

                        {/* Footer */}
                        {footer && (
                            <div className="px-6 py-4 border-t border-white/5 flex justify-end gap-3">
                                {footer}
                            </div>
                        )}
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    )
}

export default Modal
