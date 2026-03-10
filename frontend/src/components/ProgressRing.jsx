// ============================================================
// ProgressRing.jsx — Animated SVG circular progress indicator
// ============================================================

import { useEffect, useRef, useState } from 'react'

function ProgressRing({ value = 0, max = 100, size = 80, stroke = 7, color = '#3b82f6', label, sublabel, delay = 0 }) {
    const [animated, setAnimated] = useState(0)
    const ref = useRef(null)

    const radius = (size - stroke) / 2
    const circumference = 2 * Math.PI * radius
    const percentage = Math.min(100, Math.max(0, (value / max) * 100))
    const offset = circumference - (animated / 100) * circumference

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setTimeout(() => {
                        setAnimated(percentage)
                    }, delay)
                    observer.unobserve(entry.target)
                }
            },
            { threshold: 0.4 }
        )
        if (ref.current) observer.observe(ref.current)
        return () => observer.disconnect()
    }, [percentage, delay])

    return (
        <div ref={ref} className="flex flex-col items-center gap-2">
            <div className="relative" style={{ width: size, height: size }}>
                <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
                    {/* Background track */}
                    <circle
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        fill="none"
                        stroke="rgba(255,255,255,0.06)"
                        strokeWidth={stroke}
                    />
                    {/* Progress arc */}
                    <circle
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        fill="none"
                        stroke={color}
                        strokeWidth={stroke}
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        strokeDashoffset={offset}
                        style={{
                            transition: `stroke-dashoffset 1.2s cubic-bezier(0.4, 0, 0.2, 1) ${delay}ms`,
                            filter: `drop-shadow(0 0 6px ${color}80)`,
                        }}
                    />
                </svg>
                {/* Center label */}
                <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-sm font-bold text-white">
                        {Math.round(animated)}{max === 100 ? '%' : ''}
                    </span>
                </div>
            </div>
            {label && <p className="text-xs font-semibold text-heading truncate max-w-[80px] text-center">{label}</p>}
            {sublabel && <p className="text-xs text-sub text-center">{sublabel}</p>}
        </div>
    )
}

export default ProgressRing
