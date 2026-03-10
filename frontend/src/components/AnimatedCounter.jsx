// ============================================================
// AnimatedCounter.jsx — Spring-eased count-up with IntersectionObserver
// ============================================================

import { useState, useEffect, useRef } from 'react'

function AnimatedCounter({ value, duration = 1400, prefix = '', suffix = '', decimals = 0 }) {
    const [display, setDisplay] = useState(0)
    const [triggered, setTriggered] = useState(false)
    const rafRef = useRef(null)
    const wrapRef = useRef(null)

    // Trigger only when element enters viewport
    useEffect(() => {
        const el = wrapRef.current
        if (!el) return
        const observer = new IntersectionObserver(
            ([entry]) => { if (entry.isIntersecting) { setTriggered(true); observer.unobserve(el) } },
            { threshold: 0.2 }
        )
        observer.observe(el)
        return () => observer.disconnect()
    }, [])

    useEffect(() => {
        if (!triggered) return
        const target = typeof value === 'number' ? value : parseFloat(value) || 0
        if (target === 0) { setDisplay(0); return }

        const startTime = performance.now()

        const animate = (now) => {
            const elapsed = now - startTime
            const progress = Math.min(elapsed / duration, 1)
            // Ease-out quart for snappy feel
            const eased = 1 - Math.pow(1 - progress, 4)
            setDisplay(eased * target)
            if (progress < 1) {
                rafRef.current = requestAnimationFrame(animate)
            }
        }
        rafRef.current = requestAnimationFrame(animate)

        return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
    }, [value, duration, triggered])

    const formatted = decimals > 0
        ? display.toFixed(decimals)
        : Math.round(display).toLocaleString()

    return (
        <span ref={wrapRef}>
            {prefix}{formatted}{suffix}
        </span>
    )
}

export default AnimatedCounter
