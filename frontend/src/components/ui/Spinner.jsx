// ============================================================
// Spinner.jsx — Premium dual-ring loader
// ============================================================

import { motion } from 'framer-motion'

function Spinner({ size = 48, className = '' }) {
    return (
        <div
            className={`relative inline-flex items-center justify-center ${className}`}
            style={{ width: size, height: size }}
        >
            {/* Outer ring */}
            <motion.span
                className="absolute inset-0 rounded-full"
                style={{
                    border: `2px solid transparent`,
                    borderTopColor: '#3b82f6',
                    borderRightColor: 'rgba(59,130,246,0.3)',
                }}
                animate={{ rotate: 360 }}
                transition={{ duration: 0.9, ease: 'linear', repeat: Infinity }}
            />
            {/* Inner ring (opposite) */}
            <motion.span
                className="absolute rounded-full"
                style={{
                    inset: '6px',
                    border: `2px solid transparent`,
                    borderBottomColor: '#8b5cf6',
                    borderLeftColor: 'rgba(139,92,246,0.3)',
                }}
                animate={{ rotate: -360 }}
                transition={{ duration: 0.7, ease: 'linear', repeat: Infinity }}
            />
            {/* Center dot */}
            <span
                className="absolute w-1.5 h-1.5 rounded-full"
                style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)' }}
            />
        </div>
    )
}

function SpinnerPage({ label = 'Loading...' }) {
    return (
        <div className="flex flex-col items-center justify-center h-64 gap-4">
            <Spinner size={48} />
            {label && <p className="text-sm text-sub animate-pulse">{label}</p>}
        </div>
    )
}

export { SpinnerPage }
export default Spinner
