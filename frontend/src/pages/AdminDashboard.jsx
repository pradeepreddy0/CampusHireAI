// ============================================================
// AdminDashboard.jsx — Admin Analytics Dashboard
//
// Shows:
//   - Summary stat cards (students, drives, shortlisted, placement rate)
//   - Placement rate doughnut chart
//   - Branch distribution bar chart
//   - Skill heatmap / distribution bar chart
// ============================================================

import { useState, useEffect } from 'react'
import api from '../services/api'
import ChartCard from '../components/ChartCard'

function AdminDashboard() {
    const [analytics, setAnalytics] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchAnalytics()
    }, [])

    const fetchAnalytics = async () => {
        try {
            const res = await api.get('/analytics')
            setAnalytics(res.data)
        } catch (err) {
            console.error('Failed to load analytics:', err)
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
            </div>
        )
    }

    if (!analytics) {
        return (
            <div className="max-w-7xl mx-auto px-4 text-center py-12">
                <p className="text-gray-400 text-lg">Failed to load analytics</p>
            </div>
        )
    }

    // ── Chart Data Preparation ──────────────────────────────

    // Placement rate — doughnut chart
    const placementData = {
        labels: ['Placed', 'Not Placed'],
        datasets: [
            {
                data: [
                    analytics.placement_rate,
                    Math.max(0, 100 - analytics.placement_rate),
                ],
                backgroundColor: ['#4f46e5', '#e5e7eb'],
                hoverBackgroundColor: ['#4338ca', '#d1d5db'],
                borderWidth: 0,
            },
        ],
    }

    // Branch distribution — bar chart
    const branchLabels = Object.keys(analytics.branch_stats || {})
    const branchValues = Object.values(analytics.branch_stats || {})
    const branchData = {
        labels: branchLabels,
        datasets: [
            {
                label: 'Students',
                data: branchValues,
                backgroundColor: [
                    '#6366f1', '#8b5cf6', '#a855f7', '#d946ef',
                    '#ec4899', '#f43f5e', '#f97316',
                ],
                borderRadius: 6,
            },
        ],
    }

    // Skill distribution — horizontal bar chart
    const skillLabels = Object.keys(analytics.skill_distribution || {}).slice(0, 15)
    const skillValues = skillLabels.map((s) => analytics.skill_distribution[s])
    const skillData = {
        labels: skillLabels,
        datasets: [
            {
                label: 'Students with Skill',
                data: skillValues,
                backgroundColor: '#6366f1',
                borderRadius: 4,
            },
        ],
    }

    const horizontalBarOptions = {
        indexAxis: 'y',
        scales: {
            x: {
                beginAtZero: true,
                grid: { display: false },
            },
            y: {
                grid: { display: false },
            },
        },
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 animate-fade-in">
            {/* ── Header ──────────────────────────────────────── */}
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-800">📊 Admin Dashboard</h1>
                <p className="text-gray-500 mt-1">Platform analytics and insights</p>
            </div>

            {/* ── Stat Cards ──────────────────────────────────── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <div className="card-gradient bg-gradient-to-br from-blue-500 to-blue-700">
                    <p className="text-blue-100 text-sm">Total Students</p>
                    <p className="text-3xl font-bold">{analytics.total_students}</p>
                </div>
                <div className="card-gradient bg-gradient-to-br from-green-500 to-green-700">
                    <p className="text-green-100 text-sm">Total Drives</p>
                    <p className="text-3xl font-bold">{analytics.total_drives}</p>
                </div>
                <div className="card-gradient bg-gradient-to-br from-purple-500 to-purple-700">
                    <p className="text-purple-100 text-sm">Shortlisted</p>
                    <p className="text-3xl font-bold">{analytics.total_shortlisted}</p>
                </div>
                <div className="card-gradient bg-gradient-to-br from-amber-500 to-amber-700">
                    <p className="text-amber-100 text-sm">Placement Rate</p>
                    <p className="text-3xl font-bold">{analytics.placement_rate}%</p>
                </div>
            </div>

            {/* ── Charts ──────────────────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Placement Rate Doughnut */}
                <ChartCard
                    title="📈 Placement Percentage"
                    type="doughnut"
                    data={placementData}
                    options={{
                        cutout: '65%',
                        plugins: {
                            legend: { position: 'bottom' },
                        },
                    }}
                />

                {/* Branch Distribution */}
                <ChartCard
                    title="🏛️ Branch-wise Students"
                    type="bar"
                    data={branchData}
                    options={{
                        scales: {
                            y: { beginAtZero: true, grid: { display: false } },
                            x: { grid: { display: false } },
                        },
                    }}
                />
            </div>

            {/* Skill Distribution — Full Width */}
            {skillLabels.length > 0 && (
                <ChartCard
                    title="🛠️ Skill Distribution (Top 15)"
                    type="bar"
                    data={skillData}
                    options={horizontalBarOptions}
                    className="mb-8"
                />
            )}

            {/* ── Quick Summary Table ───────────────────────── */}
            <div className="card">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">📋 Summary</h2>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <tbody>
                            <tr className="border-b border-gray-100">
                                <td className="py-3 text-gray-500">Total Registered Students</td>
                                <td className="py-3 font-medium text-right">{analytics.total_students}</td>
                            </tr>
                            <tr className="border-b border-gray-100">
                                <td className="py-3 text-gray-500">Total Placement Drives</td>
                                <td className="py-3 font-medium text-right">{analytics.total_drives}</td>
                            </tr>
                            <tr className="border-b border-gray-100">
                                <td className="py-3 text-gray-500">Students Shortlisted</td>
                                <td className="py-3 font-medium text-right">{analytics.total_shortlisted}</td>
                            </tr>
                            <tr className="border-b border-gray-100">
                                <td className="py-3 text-gray-500">Offers Extended</td>
                                <td className="py-3 font-medium text-right">{analytics.total_offers}</td>
                            </tr>
                            <tr>
                                <td className="py-3 text-gray-500">Overall Placement Rate</td>
                                <td className="py-3 font-bold text-right text-primary-600">
                                    {analytics.placement_rate}%
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}

export default AdminDashboard
