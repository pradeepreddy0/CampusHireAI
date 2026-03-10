// ============================================================
// ChartCard.jsx — Premium chart card with gradient header & glow
// ============================================================

import { motion } from 'framer-motion'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js'
import { Bar, Doughnut, Pie, Line } from 'react-chartjs-2'

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, PointElement, LineElement, Title, Tooltip, Legend)

const darkTooltip = {
    backgroundColor: 'rgba(6,11,24,0.92)',
    borderColor: 'rgba(99,102,241,0.3)',
    borderWidth: 1,
    padding: 12,
    titleFont: { size: 13, weight: 'bold' },
    bodyFont: { size: 12 },
    cornerRadius: 10,
}

function ChartCard({ title, type = 'bar', data, options = {}, height = 260 }) {
    const ChartComponent = { bar: Bar, doughnut: Doughnut, pie: Pie, line: Line }[type] || Bar

    const mergedOptions = {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 900, easing: 'easeOutQuart' },
        plugins: {
            legend: {
                position: type === 'bar' || type === 'line' ? 'top' : 'right',
                labels: { padding: 16, usePointStyle: true, pointStyleWidth: 8 },
                // merge caller legend config
                ...(options?.plugins?.legend || {}),
            },
            tooltip: {
                ...darkTooltip,
                ...(options?.plugins?.tooltip || {}),
            },
            ...(options?.plugins || {}),
        },
        // spread everything else from options (but not plugins again)
        ...Object.fromEntries(Object.entries(options).filter(([k]) => k !== 'plugins')),
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
            className="card overflow-hidden"
        >
            {title && (
                <div className="flex items-center gap-2 mb-5">
                    <div className="w-1 h-5 rounded-full" style={{ background: 'linear-gradient(to bottom, #3b82f6, #8b5cf6)' }} />
                    <h3 className="font-bold text-heading text-base">{title}</h3>
                </div>
            )}
            <div style={{ height }}>
                <ChartComponent data={data} options={mergedOptions} />
            </div>
        </motion.div>
    )
}

export default ChartCard
