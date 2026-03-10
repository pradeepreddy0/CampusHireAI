// ============================================================
// DataTable.jsx — Animated data table with sort + empty state
// ============================================================

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import EmptyState from './EmptyState'

const rowVariants = {
    hidden: { opacity: 0, x: -12 },
    show: (i) => ({
        opacity: 1, x: 0,
        transition: { delay: i * 0.04, duration: 0.3, ease: [0.4, 0, 0.2, 1] },
    }),
}

function SortIcon({ dir }) {
    return (
        <span className="inline-flex flex-col ml-1 opacity-50">
            <svg className={`w-2.5 h-2.5 ${dir === 'asc' ? 'opacity-100 text-primary-400' : ''}`} viewBox="0 0 10 6" fill="currentColor">
                <path d="M5 0L10 6H0z" />
            </svg>
            <svg className={`w-2.5 h-2.5 -mt-0.5 ${dir === 'desc' ? 'opacity-100 text-primary-400' : ''}`} viewBox="0 0 10 6" fill="currentColor">
                <path d="M5 6L0 0H10z" />
            </svg>
        </span>
    )
}

function DataTable({
    columns = [],
    data = [],
    loading = false,
    emptyVariant = 'generic',
    emptyTitle,
    emptyDesc,
    emptyAction,
    rowKey = 'id',
    onRowClick,
    className = '',
}) {
    const [sortKey, setSortKey] = useState(null)
    const [sortDir, setSortDir] = useState('asc')

    const handleSort = (col) => {
        if (!col.sortable) return
        if (sortKey === col.key) {
            setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
        } else {
            setSortKey(col.key)
            setSortDir('asc')
        }
    }

    const sorted = [...data].sort((a, b) => {
        if (!sortKey) return 0
        const va = a[sortKey] ?? ''
        const vb = b[sortKey] ?? ''
        const cmp = String(va).localeCompare(String(vb), undefined, { numeric: true })
        return sortDir === 'asc' ? cmp : -cmp
    })

    if (loading) {
        return (
            <div className="overflow-x-auto rounded-xl">
                <table className="pro-table">
                    <thead>
                        <tr>{columns.map((col) => <th key={col.key}>{col.label}</th>)}</tr>
                    </thead>
                    <tbody>
                        {Array.from({ length: 4 }).map((_, r) => (
                            <tr key={r}>
                                {columns.map((_, c) => (
                                    <td key={c}>
                                        <div className="skeleton h-4 rounded" style={{ width: `${60 + (c * 10) % 30}%` }} />
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        )
    }

    if (!data.length) {
        return (
            <EmptyState
                variant={emptyVariant}
                title={emptyTitle}
                description={emptyDesc}
                action={emptyAction}
                size="sm"
                className={className}
            />
        )
    }

    return (
        <div className={`overflow-x-auto rounded-xl ${className}`}>
            <table className="pro-table">
                <thead>
                    <tr>
                        {columns.map((col) => (
                            <th
                                key={col.key}
                                onClick={() => handleSort(col)}
                                className={col.sortable ? 'cursor-pointer select-none hover:opacity-80 transition-opacity' : ''}
                                style={{ width: col.width }}
                            >
                                <span className="inline-flex items-center">
                                    {col.label}
                                    {col.sortable && (
                                        <SortIcon dir={sortKey === col.key ? sortDir : null} />
                                    )}
                                </span>
                            </th>
                        ))}
                    </tr>
                </thead>
                <AnimatePresence mode="wait">
                    <tbody key={`${sortKey}-${sortDir}`}>
                        {sorted.map((row, i) => (
                            <motion.tr
                                key={row[rowKey] ?? i}
                                custom={i}
                                variants={rowVariants}
                                initial="hidden"
                                animate="show"
                                onClick={() => onRowClick?.(row)}
                                className={onRowClick ? 'cursor-pointer' : ''}
                            >
                                {columns.map((col) => (
                                    <td key={col.key}>
                                        {col.render ? col.render(row[col.key], row) : row[col.key] ?? '—'}
                                    </td>
                                ))}
                            </motion.tr>
                        ))}
                    </tbody>
                </AnimatePresence>
            </table>
        </div>
    )
}

export default DataTable
