// ============================================================
// TrainingRecommendations.jsx — Training Resources Page
//
// Shows all training resources from the database.
// Groups them by skill for easy navigation.
// ============================================================

import { useState, useEffect } from 'react'
import api from '../services/api'

function TrainingRecommendations() {
    const [resources, setResources] = useState([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState('')

    useEffect(() => {
        fetchResources()
    }, [])

    const fetchResources = async () => {
        try {
            const res = await api.get('/training')
            setResources(res.data || [])
        } catch (err) {
            console.error('Failed to fetch training resources:', err)
        } finally {
            setLoading(false)
        }
    }

    // Group resources by skill
    const groupedBySkill = resources.reduce((acc, resource) => {
        const skill = resource.skill || 'Other'
        if (!acc[skill]) acc[skill] = []
        acc[skill].push(resource)
        return acc
    }, {})

    // Filter skills based on search
    const filteredSkills = Object.keys(groupedBySkill).filter((skill) =>
        skill.toLowerCase().includes(filter.toLowerCase())
    )

    // Type badge color
    const typeBadgeColor = (type) => {
        const colors = {
            video: 'bg-red-100 text-red-700',
            article: 'bg-blue-100 text-blue-700',
            course: 'bg-green-100 text-green-700',
            tutorial: 'bg-purple-100 text-purple-700',
            documentation: 'bg-amber-100 text-amber-700',
        }
        return colors[type?.toLowerCase()] || 'bg-gray-100 text-gray-700'
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
            </div>
        )
    }

    return (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 animate-fade-in">
            {/* ── Header ──────────────────────────────────────── */}
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-800">📚 Training Resources</h1>
                <p className="text-gray-500 mt-1">
                    Improve your skills with curated learning resources
                </p>
            </div>

            {/* ── Search / Filter ─────────────────────────────── */}
            <div className="mb-6">
                <input
                    type="text"
                    className="input max-w-md"
                    placeholder="🔍 Search skills..."
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                />
            </div>

            {/* ── Resources by Skill ──────────────────────────── */}
            {filteredSkills.length > 0 ? (
                <div className="space-y-6">
                    {filteredSkills.map((skill) => (
                        <div key={skill} className="card">
                            <div className="flex items-center space-x-3 mb-4">
                                <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center">
                                    <span className="text-primary-700 font-bold text-xs">
                                        {skill.charAt(0).toUpperCase()}
                                    </span>
                                </div>
                                <h2 className="text-lg font-semibold text-gray-800">{skill}</h2>
                                <span className="text-xs text-gray-400">
                                    {groupedBySkill[skill].length} resource{groupedBySkill[skill].length !== 1 ? 's' : ''}
                                </span>
                            </div>

                            <div className="space-y-3">
                                {groupedBySkill[skill].map((resource) => (
                                    <a
                                        key={resource.id}
                                        href={resource.link || '#'}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="block p-3 bg-gray-50 hover:bg-primary-50 rounded-lg transition-colors duration-150 group"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center space-x-3">
                                                <span className="text-lg">
                                                    {resource.type === 'video' && '🎥'}
                                                    {resource.type === 'article' && '📰'}
                                                    {resource.type === 'course' && '🎓'}
                                                    {resource.type === 'tutorial' && '📝'}
                                                    {resource.type === 'documentation' && '📖'}
                                                    {!resource.type && '🔗'}
                                                </span>
                                                <div>
                                                    <p className="font-medium text-gray-800 group-hover:text-primary-700 text-sm">
                                                        {resource.title}
                                                    </p>
                                                    {resource.link && (
                                                        <p className="text-xs text-gray-400 truncate max-w-md">
                                                            {resource.link}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                            {resource.type && (
                                                <span className={`badge ${typeBadgeColor(resource.type)}`}>
                                                    {resource.type}
                                                </span>
                                            )}
                                        </div>
                                    </a>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="card text-center py-12">
                    <p className="text-4xl mb-3">📭</p>
                    <p className="text-gray-400 text-lg">
                        {filter
                            ? `No resources found for "${filter}"`
                            : 'No training resources available yet'}
                    </p>
                    <p className="text-gray-400 text-sm mt-1">
                        Ask your admin to add training resources to the platform.
                    </p>
                </div>
            )}
        </div>
    )
}

export default TrainingRecommendations
