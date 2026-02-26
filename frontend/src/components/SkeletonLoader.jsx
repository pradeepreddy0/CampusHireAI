// ============================================================
// SkeletonLoader.jsx — Shimmer placeholder for loading states
// ============================================================

function SkeletonCard() {
    return (
        <div className="card animate-pulse">
            <div className="skeleton h-4 w-24 mb-3 rounded"></div>
            <div className="skeleton h-8 w-16 mb-2 rounded"></div>
            <div className="skeleton h-3 w-32 rounded"></div>
        </div>
    )
}

function SkeletonStatCard() {
    return (
        <div className="rounded-2xl p-6 animate-pulse">
            <div className="skeleton h-4 w-20 mb-3 rounded"></div>
            <div className="skeleton h-10 w-14 rounded"></div>
        </div>
    )
}

function SkeletonTable({ rows = 5, cols = 4 }) {
    return (
        <div className="card">
            <div className="skeleton h-5 w-40 mb-4 rounded"></div>
            <div className="space-y-3">
                {Array.from({ length: rows }).map((_, r) => (
                    <div key={r} className="flex gap-4">
                        {Array.from({ length: cols }).map((_, c) => (
                            <div key={c} className="skeleton h-4 flex-1 rounded"></div>
                        ))}
                    </div>
                ))}
            </div>
        </div>
    )
}

function SkeletonDashboard() {
    return (
        <div className="space-y-6">
            {/* Header skeleton */}
            <div>
                <div className="skeleton h-7 w-64 mb-2 rounded"></div>
                <div className="skeleton h-4 w-40 rounded"></div>
            </div>
            {/* Stat cards skeleton */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map(i => <SkeletonStatCard key={i} />)}
            </div>
            {/* Content cards skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
            </div>
        </div>
    )
}

export { SkeletonCard, SkeletonStatCard, SkeletonTable, SkeletonDashboard }
export default SkeletonDashboard
