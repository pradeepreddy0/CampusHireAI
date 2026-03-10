// ============================================================
// Badge.jsx — Reusable status badge component
// ============================================================

import { motion } from 'framer-motion'

const VARIANTS = {
    default: { bg: 'rgba(59,130,246,0.12)', color: '#60a5fa', border: 'rgba(59,130,246,0.25)' },
    applied: { bg: 'rgba(59,130,246,0.12)', color: '#60a5fa', border: 'rgba(59,130,246,0.25)' },
    shortlisted: { bg: 'rgba(16,185,129,0.12)', color: '#34d399', border: 'rgba(16,185,129,0.25)' },
    rejected: { bg: 'rgba(239,68,68,0.12)', color: '#f87171', border: 'rgba(239,68,68,0.25)' },
    offered: { bg: 'rgba(139,92,246,0.12)', color: '#a78bfa', border: 'rgba(139,92,246,0.25)' },
    placed: { bg: 'rgba(245,158,11,0.12)', color: '#fbbf24', border: 'rgba(245,158,11,0.25)' },
    success: { bg: 'rgba(16,185,129,0.12)', color: '#34d399', border: 'rgba(16,185,129,0.25)' },
    danger: { bg: 'rgba(239,68,68,0.12)', color: '#f87171', border: 'rgba(239,68,68,0.25)' },
    warning: { bg: 'rgba(245,158,11,0.12)', color: '#fbbf24', border: 'rgba(245,158,11,0.25)' },
    info: { bg: 'rgba(6,182,212,0.12)', color: '#22d3ee', border: 'rgba(6,182,212,0.25)' },
    purple: { bg: 'rgba(139,92,246,0.12)', color: '#a78bfa', border: 'rgba(139,92,246,0.25)' },
    admin: { bg: 'rgba(99,102,241,0.12)', color: '#818cf8', border: 'rgba(99,102,241,0.25)' },
}

function Badge({ variant = 'default', children, dot = false, animate = false, className = '' }) {
    const style = VARIANTS[variant.toLowerCase()] || VARIANTS.default

    const inner = (
        <span
            className={`inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-semibold tracking-wide ${className}`}
            style={{ background: style.bg, color: style.color, border: `1px solid ${style.border}` }}
        >
            {dot && (
                <span
                    className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                    style={{ background: style.color }}
                />
            )}
            {children}
        </span>
    )

    if (animate) {
        return (
            <motion.span
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.25, ease: [0.34, 1.56, 0.64, 1] }}
            >
                {inner}
            </motion.span>
        )
    }

    return inner
}

export default Badge
