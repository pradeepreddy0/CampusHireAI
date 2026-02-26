/** @type {import('tailwindcss').Config} */
export default {
    darkMode: 'class',
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: {
                    50: '#eef6ff',
                    100: '#d9ecff',
                    200: '#bcdeff',
                    300: '#8ec8ff',
                    400: '#59a8ff',
                    500: '#3b82f6',
                    600: '#2563eb',
                    700: '#1d4ed8',
                    800: '#1e40af',
                    900: '#1e3a8a',
                },
                accent: {
                    300: '#c4b5fd',
                    400: '#a78bfa',
                    500: '#8b5cf6',
                    600: '#7c3aed',
                    700: '#6d28d9',
                },
                neon: {
                    cyan: '#22d3ee',
                    purple: '#a855f7',
                    blue: '#3b82f6',
                    green: '#10b981',
                    pink: '#f472b6',
                },
                dark: {
                    50: '#f8fafc',
                    100: '#f1f5f9',
                    200: '#e2e8f0',
                    300: '#cbd5e1',
                    400: '#94a3b8',
                    500: '#64748b',
                    600: '#475569',
                    700: '#334155',
                    800: '#1e293b',
                    850: '#172033',
                    900: '#0f172a',
                    950: '#020617',
                },
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
            },
            spacing: {
                'sidebar': '260px',
                'sidebar-collapsed': '72px',
            },
            backgroundImage: {
                'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
                'grid-pattern': 'linear-gradient(rgba(59, 130, 246, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(59, 130, 246, 0.03) 1px, transparent 1px)',
            },
            backgroundSize: {
                'grid': '40px 40px',
            },
            boxShadow: {
                'glow-blue': '0 0 20px rgba(59, 130, 246, 0.15)',
                'glow-purple': '0 0 20px rgba(139, 92, 246, 0.15)',
                'glow-cyan': '0 0 20px rgba(34, 211, 238, 0.15)',
                'glass': '0 8px 32px rgba(0, 0, 0, 0.12)',
                'card-hover': '0 20px 40px rgba(0, 0, 0, 0.2)',
                'input-focus': '0 0 0 3px rgba(59, 130, 246, 0.15)',
            },
            animation: {
                'fade-in': 'fadeIn 0.5s ease-out forwards',
                'slide-up': 'slideUp 0.5s ease-out forwards',
                'slide-down': 'slideDown 0.3s ease-out forwards',
                'slide-in-right': 'slideInRight 0.3s ease-out forwards',
                'scale-in': 'scaleIn 0.2s ease-out forwards',
                'float': 'float 6s ease-in-out infinite',
                'shake': 'shake 0.6s ease-in-out',
                'glow-pulse': 'glowPulse 3s ease-in-out infinite',
                'shimmer': 'shimmer 2s ease-in-out infinite',
                'pulse-badge': 'pulseBadge 2s ease-in-out infinite',
                'ripple': 'ripple 0.6s ease-out',
                'spin-slow': 'spin 3s linear infinite',
                'checkmark': 'checkmark 0.4s ease-out forwards',
            },
            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0', transform: 'translateY(10px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                slideUp: {
                    '0%': { opacity: '0', transform: 'translateY(20px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                slideDown: {
                    '0%': { opacity: '0', transform: 'translateY(-10px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                slideInRight: {
                    '0%': { opacity: '0', transform: 'translateX(20px)' },
                    '100%': { opacity: '1', transform: 'translateX(0)' },
                },
                scaleIn: {
                    '0%': { opacity: '0', transform: 'scale(0.95)' },
                    '100%': { opacity: '1', transform: 'scale(1)' },
                },
                float: {
                    '0%, 100%': { transform: 'translateY(0px)' },
                    '50%': { transform: 'translateY(-20px)' },
                },
                shake: {
                    '0%, 100%': { transform: 'translateX(0)' },
                    '10%, 30%, 50%, 70%, 90%': { transform: 'translateX(-4px)' },
                    '20%, 40%, 60%, 80%': { transform: 'translateX(4px)' },
                },
                glowPulse: {
                    '0%, 100%': { boxShadow: '0 0 20px rgba(59, 130, 246, 0.1)' },
                    '50%': { boxShadow: '0 0 30px rgba(59, 130, 246, 0.25)' },
                },
                shimmer: {
                    '0%': { backgroundPosition: '-200% 0' },
                    '100%': { backgroundPosition: '200% 0' },
                },
                pulseBadge: {
                    '0%, 100%': { transform: 'scale(1)', opacity: '1' },
                    '50%': { transform: 'scale(1.15)', opacity: '0.8' },
                },
                ripple: {
                    '0%': { transform: 'scale(0)', opacity: '0.5' },
                    '100%': { transform: 'scale(4)', opacity: '0' },
                },
                checkmark: {
                    '0%': { transform: 'scale(0) rotate(-45deg)', opacity: '0' },
                    '50%': { transform: 'scale(1.2) rotate(-45deg)', opacity: '1' },
                    '100%': { transform: 'scale(1) rotate(-45deg)', opacity: '1' },
                },
            },
            transitionDuration: {
                '400': '400ms',
            },
        },
    },
    plugins: [],
}
