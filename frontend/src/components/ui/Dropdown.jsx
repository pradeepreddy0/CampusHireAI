// ============================================================
// Dropdown.jsx — Animated dropdown menu with staggered items
// ============================================================

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const menuVariants = {
    hidden: { opacity: 0, scale: 0.94, y: -8 },
    show: {
        opacity: 1, scale: 1, y: 0,
        transition: { duration: 0.18, ease: [0.34, 1.56, 0.64, 1] },
    },
    exit: { opacity: 0, scale: 0.95, y: -6, transition: { duration: 0.14 } },
}

const itemVariants = {
    hidden: { opacity: 0, x: -6 },
    show: (i) => ({
        opacity: 1, x: 0,
        transition: { delay: i * 0.04, duration: 0.18 },
    }),
}

function Dropdown({ trigger, items = [], align = 'right', className = '' }) {
    const [open, setOpen] = useState(false)
    const ref = useRef(null)

    useEffect(() => {
        const handler = (e) => {
            if (ref.current && !ref.current.contains(e.target)) setOpen(false)
        }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [])

    const alignClass = align === 'left' ? 'left-0' : 'right-0'

    return (
        <div className={`relative inline-block ${className}`} ref={ref}>
            {/* Trigger */}
            <div onClick={() => setOpen((p) => !p)} className="cursor-pointer">
                {trigger}
            </div>

            {/* Menu */}
            <AnimatePresence>
                {open && (
                    <motion.div
                        variants={menuVariants}
                        initial="hidden"
                        animate="show"
                        exit="exit"
                        className={`absolute ${alignClass} top-full mt-2 min-w-[160px] card !p-1.5 z-50`}
                        style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.35)' }}
                    >
                        {items.map((item, i) => {
                            if (item.divider) {
                                return <div key={i} className="my-1 border-t border-white/5" />
                            }
                            return (
                                <motion.button
                                    key={i}
                                    custom={i}
                                    variants={itemVariants}
                                    initial="hidden"
                                    animate="show"
                                    onClick={() => { item.onClick?.(); setOpen(false) }}
                                    disabled={item.disabled}
                                    className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm rounded-lg transition-all duration-150 disabled:opacity-40 ${item.danger
                                            ? 'text-red-400 hover:bg-red-500/10'
                                            : 'text-body hover:bg-white/5 hover:text-heading'
                                        }`}
                                >
                                    {item.icon && <span className="flex-shrink-0 w-4 h-4">{item.icon}</span>}
                                    {item.label}
                                </motion.button>
                            )
                        })}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

export default Dropdown
