// ============================================================
// ChartCard.jsx — Reusable Chart with Framer Motion entrance
// ============================================================

import { motion } from 'framer-motion'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend } from 'chart.js'
import { Bar, Doughnut, Pie, Line } from 'react-chartjs-2'

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend)

function ChartCard({ title, type = 'bar', data, options = {} }) {
    const ChartComponent = {
        bar: Bar, doughnut: Doughnut, pie: Pie, line: Line,
    }[type] || Bar

    const defaultOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { position: type === 'bar' ? 'top' : 'right' },
        },
        ...options,
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="card"
        >
            {title && <h3 className="text-lg font-semibold text-heading mb-4">{title}</h3>}
            <div className="h-[250px]">
                <ChartComponent data={data} options={defaultOptions} />
            </div>
        </motion.div>
    )
}

export default ChartCard
