// ============================================================
// PageTransition.jsx — Polished Framer Motion page transitions
// ============================================================

import { motion } from 'framer-motion'

const pageVariants = {
    initial: { opacity: 0, y: 16, scale: 0.99 },
    animate: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, y: -10, scale: 0.99 },
}

const pageTransition = {
    type: 'tween',
    ease: [0.4, 0, 0.2, 1],
    duration: 0.35,
}

function PageTransition({ children }) {
    return (
        <motion.div
            initial="initial"
            animate="animate"
            exit="exit"
            variants={pageVariants}
            transition={pageTransition}
        >
            {children}
        </motion.div>
    )
}

export default PageTransition
