// ============================================================
// AnimatedCounter.jsx — Count-up animation for stat cards
// ============================================================

import { useState, useEffect, useRef } from 'react'

function AnimatedCounter({ value, duration = 1200, prefix = '', suffix = '', decimals = 0 }) {
    const [display, setDisplay] = useState(0)
    const ref = useRef(null)
    const startRef = useRef(null)

    useEffect(() => {
        const target = typeof value === 'number' ? value : parseFloat(value) || 0
        if (target === 0) { setDisplay(0); return }

        const startTime = performance.now()
        startRef.current = startTime

        const animate = (now) => {
            if (startRef.current !== startTime) return
            const elapsed = now - startTime
            const progress = Math.min(elapsed / duration, 1)
            // Ease-out cubic
            const eased = 1 - Math.pow(1 - progress, 3)
            setDisplay(eased * target)

            if (progress < 1) {
                ref.current = requestAnimationFrame(animate)
            }
        }
        ref.current = requestAnimationFrame(animate)

        return () => {
            if (ref.current) cancelAnimationFrame(ref.current)
        }
    }, [value, duration])

    const formatted = decimals > 0
        ? display.toFixed(decimals)
        : Math.round(display).toLocaleString()

    return <span>{prefix}{formatted}{suffix}</span>
}

export default AnimatedCounter
