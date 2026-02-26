// ============================================================
// TrainingRecommendations.jsx — Student View (Theme-Aware)
// ============================================================

import { useState, useEffect } from 'react'
import api from '../services/api'

function TrainingRecommendations() {
    const [resources, setResources] = useState([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState('')

    useEffect(() => {
        const fetchResources = async () => {
            try { const res = await api.get('/training'); setResources(res.data || []) }
            catch (err) { console.error('Failed to fetch training:', err) }
            finally { setLoading(false) }
        }
        fetchResources()
    }, [])

    // Group resources by skill
    const grouped = resources.reduce((acc, r) => {
        const skill = r.skill || 'Other'
        if (!acc[skill]) acc[skill] = []
        acc[skill].push(r)
        return acc
    }, {})

    const filteredSkills = Object.keys(grouped).filter((skill) =>
        skill.toLowerCase().includes(filter.toLowerCase()) ||
        grouped[skill].some((r) => r.title?.toLowerCase().includes(filter.toLowerCase()))
    )

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary-500 border-t-transparent"></div>
            </div>
        )
    }

    return (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 animate-fade-in">
            <div className="mb-8">
                <h1 className="text-2xl text-heading">📚 Training Resources</h1>
                <p className="text-sub mt-1">Videos, blogs, courses and tutorials to boost your skills</p>
            </div>

            <div className="mb-6">
                <input type="text" className="input max-w-md" placeholder="🔍 Search by skill or title..."
                    value={filter} onChange={(e) => setFilter(e.target.value)} />
            </div>

            {filteredSkills.length > 0 ? (
                <div className="space-y-6 stagger">
                    {filteredSkills.map((skill) => (
                        <div key={skill} className="animate-fade-in">
                            <h2 className="text-lg font-semibold mb-3">
                                <span className="bg-gradient-to-r from-primary-400 to-accent-400 bg-clip-text text-transparent">{skill}</span>
                                <span className="text-sub text-sm ml-2">({grouped[skill].length})</span>
                            </h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {grouped[skill].map((r) => (
                                    <div key={r.id} className="card group">
                                        <div className="flex items-start space-x-3">
                                            <span className="text-xl mt-0.5">
                                                {r.type === 'video' && '🎥'}
                                                {r.type === 'blog' && '📝'}
                                                {r.type === 'article' && '📰'}
                                                {r.type === 'course' && '🎓'}
                                                {r.type === 'documentation' && '📖'}
                                                {r.type === 'tutorial' && '📝'}
                                                {!r.type && '🔗'}
                                            </span>
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-medium text-heading text-sm group-hover:text-primary-400 transition-colors">
                                                    {r.title}
                                                </h3>
                                                <span className="inline-block mt-1 px-2 py-0.5 text-xs rounded bg-primary-500/10 text-primary-400 border border-primary-500/20 capitalize">
                                                    {r.type || 'link'}
                                                </span>
                                            </div>
                                        </div>
                                        {r.link && (
                                            <a href={r.link} target="_blank" rel="noopener noreferrer"
                                                className="mt-3 inline-flex items-center text-sm text-primary-400 hover:text-primary-300 font-medium transition-colors">
                                                Open resource →
                                            </a>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="card text-center py-12">
                    <p className="text-4xl mb-3">📭</p>
                    <p className="text-sub text-lg">No training resources available yet</p>
                </div>
            )}
        </div>
    )
}

export default TrainingRecommendations
