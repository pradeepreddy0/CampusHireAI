// ============================================================
// Button.jsx — Reusable animated button with variants
// ============================================================

import { motion } from 'framer-motion'

const VARIANTS = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    danger: 'btn-danger',
    success: 'btn-success',
    glow: 'btn-glow',
    ghost: 'flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 hover:bg-white/5 text-sub hover:text-heading',
    icon: 'p-2 rounded-xl transition-all duration-200 hover:bg-primary-500/10 flex items-center justify-center',
}

const SIZES = {
    xs: '!text-xs !px-3 !py-1.5',
    sm: '!text-sm !px-4 !py-2',
    md: '',
    lg: '!text-base !px-7 !py-3.5',
}

const Spinner = ({ size = 16 }) => (
    <span className="inline-flex" style={{ width: size, height: size }}>
        <span
            className="inline-block w-full h-full rounded-full border-2 border-current animate-spin"
            style={{ borderTopColor: 'transparent' }}
        />
    </span>
)

function Button({
    variant = 'primary',
    size = 'md',
    loading = false,
    disabled = false,
    leftIcon,
    rightIcon,
    children,
    className = '',
    ...props
}) {
    const baseClass = VARIANTS[variant] || VARIANTS.primary
    const sizeClass = SIZES[size] || ''
    const isDisabled = disabled || loading

    return (
        <motion.button
            whileTap={isDisabled ? {} : { scale: 0.96 }}
            whileHover={isDisabled ? {} : { scale: 1.02 }}
            transition={{ duration: 0.15 }}
            disabled={isDisabled}
            className={`inline-flex items-center justify-center gap-2 ${baseClass} ${sizeClass} ${className}`}
            {...props}
        >
            {loading ? (
                <Spinner size={16} />
            ) : (
                leftIcon && <span className="flex-shrink-0">{leftIcon}</span>
            )}
            {children}
            {!loading && rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
        </motion.button>
    )
}

export default Button
