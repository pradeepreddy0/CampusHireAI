// ============================================================
// PageTransition.jsx — Framer Motion wrapper for route transitions
// ============================================================

import { motion } from 'framer-motion'

const pageVariants = {
    initial: { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -8 },
}

const pageTransition = {
    type: 'tween',
    ease: 'easeOut',
    duration: 0.3,
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
