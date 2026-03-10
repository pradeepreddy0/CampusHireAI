// ============================================================
// EmptyState.jsx — Rich illustrated empty states with CTA
// ============================================================

import { motion } from 'framer-motion'

// SVG Illustrations (inline, no external deps)
const ILLUSTRATIONS = {
    drives: (color) => (
        <svg viewBox="0 0 120 100" fill="none" className="w-full h-full">
            <rect x="20" y="30" width="80" height="52" rx="8" fill={`${color}15`} stroke={`${color}40`} strokeWidth="1.5" />
            <rect x="30" y="42" width="40" height="6" rx="3" fill={`${color}50`} />
            <rect x="30" y="54" width="25" height="4" rx="2" fill={`${color}30`} />
            <rect x="30" y="64" width="32" height="4" rx="2" fill={`${color}30`} />
            <circle cx="82" cy="55" r="12" fill={`${color}20`} stroke={`${color}40`} strokeWidth="1.5" />
            <path d="M78 55l3 3 5-5" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="35" cy="22" r="6" fill={`${color}25`} />
            <circle cx="25" cy="18" r="4" fill={`${color}15`} />
            <circle cx="45" cy="15" r="5" fill={`${color}20`} />
        </svg>
    ),
    applications: (color) => (
        <svg viewBox="0 0 120 100" fill="none" className="w-full h-full">
            <rect x="25" y="20" width="55" height="70" rx="6" fill={`${color}15`} stroke={`${color}40`} strokeWidth="1.5" />
            <rect x="35" y="35" width="35" height="4" rx="2" fill={`${color}50`} />
            <rect x="35" y="45" width="25" height="3" rx="1.5" fill={`${color}30`} />
            <rect x="35" y="53" width="30" height="3" rx="1.5" fill={`${color}30`} />
            <rect x="35" y="61" width="20" height="3" rx="1.5" fill={`${color}25`} />
            <path d="M55 18 L65 18 L70 28 L60 28 Z" fill={`${color}30`} stroke={`${color}50`} strokeWidth="1" />
            <circle cx="90" cy="72" r="14" fill={`${color}20`} stroke={`${color}40`} strokeWidth="1.5" />
            <path d="M86 72h8M90 68v8" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
        </svg>
    ),
    offers: (color) => (
        <svg viewBox="0 0 120 100" fill="none" className="w-full h-full">
            <path d="M60 20 L90 38 L90 72 L60 90 L30 72 L30 38 Z" fill={`${color}12`} stroke={`${color}40`} strokeWidth="1.5" />
            <path d="M60 20 L90 38 L60 55 L30 38 Z" fill={`${color}25`} stroke={`${color}40`} strokeWidth="1" />
            <path d="M60 55 L90 38 L90 72 L60 90 L60 55Z" fill={`${color}18`} />
            <path d="M60 55 L30 38 L30 72 L60 90 L60 55Z" fill={`${color}10`} />
            <circle cx="60" cy="55" r="8" fill={`${color}30`} stroke={`${color}50`} strokeWidth="1.5" />
            <path d="M57 55l2.5 2.5L64 52" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    ),
    generic: (color) => (
        <svg viewBox="0 0 120 100" fill="none" className="w-full h-full">
            <circle cx="60" cy="48" r="28" fill={`${color}12`} stroke={`${color}40`} strokeWidth="1.5" />
            <circle cx="60" cy="48" r="18" fill={`${color}18`} stroke={`${color}35`} strokeWidth="1.5" />
            <circle cx="60" cy="48" r="9" fill={`${color}30`} />
            <path d="M60 30 L60 20 M60 66 L60 76 M42 48 L32 48 M78 48 L88 48" stroke={`${color}50`} strokeWidth="1.5" strokeLinecap="round" />
            <circle cx="60" cy="80" r="4" fill={`${color}20`} />
            <circle cx="45" cy="76" r="3" fill={`${color}15`} />
            <circle cx="75" cy="76" r="3" fill={`${color}15`} />
        </svg>
    ),
    training: (color) => (
        <svg viewBox="0 0 120 100" fill="none" className="w-full h-full">
            <rect x="20" y="25" width="48" height="58" rx="6" fill={`${color}15`} stroke={`${color}40`} strokeWidth="1.5" />
            <rect x="28" y="36" width="32" height="4" rx="2" fill={`${color}50`} />
            <rect x="28" y="46" width="24" height="3" rx="1.5" fill={`${color}30`} />
            <rect x="28" y="54" width="28" height="3" rx="1.5" fill={`${color}30`} />
            <rect x="28" y="62" width="18" height="3" rx="1.5" fill={`${color}20`} />
            <circle cx="86" cy="45" r="18" fill={`${color}20`} stroke={`${color}40`} strokeWidth="1.5" />
            <path d="M81 42 L91 45 L81 48 Z" fill={color} />
            <path d="M80 65 L88 78" stroke={`${color}40`} strokeWidth="1.5" strokeLinecap="round" />
            <path d="M92 65 L84 78" stroke={`${color}40`} strokeWidth="1.5" strokeLinecap="round" />
            <path d="M78 78 L94 78" stroke={`${color}40`} strokeWidth="2" strokeLinecap="round" />
        </svg>
    ),
}

const CONFIGS = {
    drives: { color: '#3b82f6', title: 'No drives available yet', desc: 'Check back soon for new placement opportunities.' },
    applications: { color: '#8b5cf6', title: 'No applications yet', desc: "You haven't applied to any drives yet. Start exploring!" },
    offers: { color: '#10b981', title: 'No offers yet', desc: 'Keep applying and performing well— offers are on the way!' },
    training: { color: '#06b6d4', title: 'No training resources', desc: 'Training resources will appear here once added.' },
    generic: { color: '#6366f1', title: 'Nothing here yet', desc: 'This section is empty right now.' },
}

function EmptyState({
    variant = 'generic',
    title,
    description,
    action,
    size = 'md',
    className = '',
}) {
    const cfg = CONFIGS[variant] || CONFIGS.generic
    const illustration = ILLUSTRATIONS[variant] || ILLUSTRATIONS.generic
    const displayTitle = title ?? cfg.title
    const displayDesc = description ?? cfg.desc

    const illSize = size === 'sm' ? 'w-24 h-20' : 'w-36 h-28'
    const paddingCls = size === 'sm' ? 'py-10' : 'py-16'

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, ease: [0.34, 1.56, 0.64, 1] }}
            className={`flex flex-col items-center text-center ${paddingCls} px-8 ${className}`}
        >
            {/* Illustration */}
            <motion.div
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1, duration: 0.5 }}
                className={`${illSize} mb-5 opacity-80`}
                style={{ filter: `drop-shadow(0 8px 24px ${cfg.color}30)` }}
            >
                {illustration(cfg.color)}
            </motion.div>

            {/* Floating decoration rings */}
            <div className="relative mb-5">
                <motion.div
                    animate={{ scale: [1, 1.06, 1] }}
                    transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                    className="absolute -inset-3 rounded-full opacity-10"
                    style={{ background: `radial-gradient(circle, ${cfg.color}, transparent)` }}
                />
            </div>

            <motion.h3
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.18, duration: 0.35 }}
                className="text-base font-bold text-heading mb-2"
            >
                {displayTitle}
            </motion.h3>

            <motion.p
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.24, duration: 0.35 }}
                className="text-sm text-sub max-w-xs opacity-80"
            >
                {displayDesc}
            </motion.p>

            {action && (
                <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.32, duration: 0.35 }}
                    className="mt-5"
                >
                    {action}
                </motion.div>
            )}
        </motion.div>
    )
}

export default EmptyState
