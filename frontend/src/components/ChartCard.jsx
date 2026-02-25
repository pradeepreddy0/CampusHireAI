// ============================================================
// ChartCard.jsx — Reusable Chart.js Wrapper
//
// Renders a Chart.js chart inside a styled card.
// Accepts chart type, data, options, and a title.
//
// Usage:
//   <ChartCard
//     title="Placement Rate"
//     type="doughnut"
//     data={chartData}
//     options={chartOptions}
//   />
// ============================================================

import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    ArcElement,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js'
import { Bar, Doughnut, Pie, Line } from 'react-chartjs-2'

// Register Chart.js components
ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    ArcElement,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
)

// Map chart type string to react-chartjs-2 component
const chartComponents = {
    bar: Bar,
    doughnut: Doughnut,
    pie: Pie,
    line: Line,
}

function ChartCard({ title, type = 'bar', data, options = {}, className = '' }) {
    const ChartComponent = chartComponents[type] || Bar

    // Default options for clean charts
    const defaultOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'bottom',
                labels: {
                    padding: 16,
                    usePointStyle: true,
                    font: { size: 12, family: 'Inter' },
                },
            },
            title: {
                display: false, // We use our own title
            },
        },
        ...options,
    }

    return (
        <div className={`card ${className}`}>
            {title && (
                <h3 className="text-lg font-semibold text-gray-800 mb-4">{title}</h3>
            )}
            <div className="h-64">
                <ChartComponent data={data} options={defaultOptions} />
            </div>
        </div>
    )
}

export default ChartCard
