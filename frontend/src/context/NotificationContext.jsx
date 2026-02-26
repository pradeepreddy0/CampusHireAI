// ============================================================
// NotificationContext.jsx — Notification state management
// ============================================================

import { createContext, useContext, useState, useCallback } from 'react'

const NotificationContext = createContext(null)

let notifId = 0

// Demo notifications seeded on mount
const demoNotifications = [
    { id: ++notifId, title: 'Welcome to CampusHireAI!', message: 'Your account is ready.', time: '2m ago', read: false, type: 'info' },
    { id: ++notifId, title: 'New Drive Posted', message: 'Google is hiring for SDE roles.', time: '1h ago', read: false, type: 'drive' },
    { id: ++notifId, title: 'Resume Parsed', message: 'Your skills have been extracted.', time: '3h ago', read: true, type: 'success' },
]

export function NotificationProvider({ children }) {
    const [notifications, setNotifications] = useState(demoNotifications)

    const addNotification = useCallback((title, message, type = 'info') => {
        const id = ++notifId
        setNotifications(prev => [{
            id, title, message, type,
            time: 'Just now', read: false,
        }, ...prev])
        return id
    }, [])

    const markAsRead = useCallback((id) => {
        setNotifications(prev =>
            prev.map(n => n.id === id ? { ...n, read: true } : n)
        )
    }, [])

    const markAllRead = useCallback(() => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    }, [])

    const removeNotification = useCallback((id) => {
        setNotifications(prev => prev.filter(n => n.id !== id))
    }, [])

    const clearAll = useCallback(() => {
        setNotifications([])
    }, [])

    const unreadCount = notifications.filter(n => !n.read).length

    return (
        <NotificationContext.Provider value={{
            notifications, unreadCount,
            addNotification, markAsRead, markAllRead,
            removeNotification, clearAll,
        }}>
            {children}
        </NotificationContext.Provider>
    )
}

export function useNotifications() {
    const ctx = useContext(NotificationContext)
    if (!ctx) throw new Error('useNotifications must be used within NotificationProvider')
    return ctx
}
