// ============================================================
// ScrollReveal.jsx — Intersection Observer scroll animation wrapper
// ============================================================

import { useEffect, useRef } from 'react'

/**
 * Wraps children with a scroll-reveal animation.
 * @param {string} type — 'up' | 'left' | 'right' | 'scale'
 * @param {number} delay — animation delay in ms (default 0)
 */
function ScrollReveal({ children, type = 'up', delay = 0, className = '' }) {
    const ref = useRef(null)

    useEffect(() => {
        const el = ref.current
        if (!el) return

        if (delay > 0) el.style.transitionDelay = `${delay}ms`

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    el.classList.add('visible')
                    observer.unobserve(el)
                }
            },
            { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
        )

        observer.observe(el)
        return () => observer.disconnect()
    }, [delay])

    const classMap = {
        up: 'reveal',
        left: 'reveal-left',
        right: 'reveal-right',
        scale: 'reveal-scale',
    }

    return (
        <div ref={ref} className={`${classMap[type] || 'reveal'} ${className}`}>
            {children}
        </div>
    )
}

export default ScrollReveal
