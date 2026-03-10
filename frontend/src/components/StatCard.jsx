// ============================================================
// StatCard.jsx — Premium stat card with refined curated palette
// ============================================================

import { useRef, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import AnimatedCounter from './AnimatedCounter'

// ── Curated professional palette (no basic blue/green/orange/pink)
const PALETTES = {
    indigo: {
        grad: 'linear-gradient(135deg, #312e81 0%, #4338ca 60%, #4f46e5 100%)',
        glow: 'rgba(79, 70, 229, 0.35)',
        iconBg: 'rgba(99, 102, 241, 0.18)',
        iconColor: '#a5b4fc',
        border: 'rgba(99, 102, 241, 0.25)',
        shine: 'rgba(165, 180, 252, 0.08)',
    },
    violet: {
        grad: 'linear-gradient(135deg, #4c1d95 0%, #6d28d9 60%, #7c3aed 100%)',
        glow: 'rgba(109, 40, 217, 0.35)',
        iconBg: 'rgba(124, 58, 237, 0.18)',
        iconColor: '#c4b5fd',
        border: 'rgba(124, 58, 237, 0.25)',
        shine: 'rgba(196, 181, 253, 0.08)',
    },
    teal: {
        grad: 'linear-gradient(135deg, #134e4a 0%, #0f766e 60%, #0d9488 100%)',
        glow: 'rgba(13, 148, 136, 0.35)',
        iconBg: 'rgba(13, 148, 136, 0.18)',
        iconColor: '#5eead4',
        border: 'rgba(13, 148, 136, 0.25)',
        shine: 'rgba(94, 234, 212, 0.08)',
    },
    rose: {
        grad: 'linear-gradient(135deg, #881337 0%, #be123c 60%, #e11d48 100%)',
        glow: 'rgba(190, 18, 60, 0.35)',
        iconBg: 'rgba(225, 29, 72, 0.18)',
        iconColor: '#fda4af',
        border: 'rgba(225, 29, 72, 0.25)',
        shine: 'rgba(253, 164, 175, 0.08)',
    },
    slate: {
        grad: 'linear-gradient(135deg, #1e293b 0%, #334155 60%, #475569 100%)',
        glow: 'rgba(71, 85, 105, 0.4)',
        iconBg: 'rgba(100, 116, 139, 0.18)',
        iconColor: '#94a3b8',
        border: 'rgba(100, 116, 139, 0.25)',
        shine: 'rgba(148, 163, 184, 0.08)',
    },
    cyan: {
        grad: 'linear-gradient(135deg, #164e63 0%, #0e7490 60%, #0891b2 100%)',
        glow: 'rgba(8, 145, 178, 0.35)',
        iconBg: 'rgba(8, 145, 178, 0.18)',
        iconColor: '#67e8f9',
        border: 'rgba(8, 145, 178, 0.25)',
        shine: 'rgba(103, 232, 249, 0.08)',
    },
    fuchsia: {
        grad: 'linear-gradient(135deg, #701a75 0%, #a21caf 60%, #c026d3 100%)',
        glow: 'rgba(192, 38, 211, 0.35)',
        iconBg: 'rgba(192, 38, 211, 0.18)',
        iconColor: '#e879f9',
        border: 'rgba(192, 38, 211, 0.25)',
        shine: 'rgba(232, 121, 249, 0.08)',
    },
    amber: {
        grad: 'linear-gradient(135deg, #78350f 0%, #b45309 60%, #d97706 100%)',
        glow: 'rgba(180, 83, 9, 0.35)',
        iconBg: 'rgba(217, 119, 6, 0.18)',
        iconColor: '#fcd34d',
        border: 'rgba(217, 119, 6, 0.25)',
        shine: 'rgba(252, 211, 77, 0.08)',
    },
}

function StatCard({ label, value, suffix = '', prefix = '', icon, color = 'indigo', delay = 0, subtitle }) {
    const p = PALETTES[color] || PALETTES.indigo
    const [hovered, setHovered] = useState(false)

    return (
        <motion.div
            initial={{ opacity: 0, y: 28, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay, duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
            onHoverStart={() => setHovered(true)}
            onHoverEnd={() => setHovered(false)}
            className="relative overflow-hidden rounded-2xl cursor-default select-none"
            style={{
                background: p.grad,
                border: `1px solid ${p.border}`,
                boxShadow: hovered
                    ? `0 12px 40px ${p.glow}, 0 2px 8px rgba(0,0,0,0.3)`
                    : `0 4px 20px ${p.glow.replace('0.35', '0.2')}, 0 1px 4px rgba(0,0,0,0.2)`,
                transition: 'box-shadow 0.3s ease, transform 0.2s ease',
                transform: hovered ? 'translateY(-3px)' : 'translateY(0)',
            }}
        >
            {/* Shine overlay */}
            <div
                className="absolute inset-0 pointer-events-none"
                style={{
                    background: `radial-gradient(ellipse at top left, ${p.shine} 0%, transparent 60%)`,
                }}
            />
            {/* Top-right decorative ring */}
            <div
                className="absolute -top-6 -right-6 w-20 h-20 rounded-full pointer-events-none"
                style={{ background: `rgba(255,255,255,0.04)`, border: '1px solid rgba(255,255,255,0.06)' }}
            />
            <div
                className="absolute -top-2 -right-2 w-10 h-10 rounded-full pointer-events-none"
                style={{ background: 'rgba(255,255,255,0.03)' }}
            />

            <div className="relative p-5">
                {/* Icon */}
                <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center mb-3 text-lg"
                    style={{ background: p.iconBg, color: p.iconColor }}
                >
                    {icon}
                </div>

                {/* Value */}
                <p className="text-2xl font-black text-white leading-none mb-1">
                    {prefix}
                    <AnimatedCounter value={typeof value === 'number' ? value : parseFloat(value) || 0} />
                    {suffix}
                </p>

                {/* Label */}
                <p className="text-xs font-semibold text-white/70 uppercase tracking-widest">{label}</p>

                {/* Subtitle */}
                {subtitle && (
                    <p className="text-xs text-white/45 mt-1.5 truncate">{subtitle}</p>
                )}
            </div>
        </motion.div>
    )
}

export default StatCard
