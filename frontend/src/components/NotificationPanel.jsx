// ============================================================
// NotificationPanel.jsx — Dropdown notification panel
// ============================================================

import { motion, AnimatePresence } from 'framer-motion'
import { useNotifications } from '../context/NotificationContext'

function NotificationPanel({ isOpen, onClose }) {
    const { notifications, unreadCount, markAsRead, markAllRead, removeNotification } = useNotifications()

    const typeIcon = (type) => {
        switch (type) {
            case 'drive': return '🏢'
            case 'success': return '✅'
            case 'warning': return '⚠️'
            case 'error': return '❌'
            default: return '🔔'
        }
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-40"
                        onClick={onClose}
                    />

                    {/* Panel */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -10 }}
                        transition={{ duration: 0.2, ease: 'easeOut' }}
                        className="absolute right-0 top-full mt-2 w-80 sm:w-96 z-50 card !p-0 overflow-hidden"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-4 py-3 border-b border-current/10">
                            <h3 className="text-sm font-semibold text-heading">
                                Notifications {unreadCount > 0 && (
                                    <span className="ml-1 px-1.5 py-0.5 bg-primary-500/20 text-primary-400 text-xs rounded-full">
                                        {unreadCount}
                                    </span>
                                )}
                            </h3>
                            {unreadCount > 0 && (
                                <button
                                    onClick={markAllRead}
                                    className="text-xs text-primary-400 hover:text-primary-300 font-medium transition-colors"
                                >
                                    Mark all read
                                </button>
                            )}
                        </div>

                        {/* Notification List */}
                        <div className="notification-scroll">
                            {notifications.length === 0 ? (
                                <div className="py-8 text-center text-sub">
                                    <p className="text-2xl mb-2">🔔</p>
                                    <p>No notifications</p>
                                </div>
                            ) : (
                                <div>
                                    {notifications.map((notif, i) => (
                                        <motion.div
                                            key={notif.id}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: i * 0.05 }}
                                            onClick={() => markAsRead(notif.id)}
                                            className={`flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors hover:bg-primary-500/5 border-b border-current/5 last:border-none ${!notif.read ? 'bg-primary-500/5' : ''
                                                }`}
                                        >
                                            <span className="text-lg mt-0.5">{typeIcon(notif.type)}</span>
                                            <div className="flex-1 min-w-0">
                                                <p className={`text-sm font-medium truncate ${!notif.read ? 'text-heading' : 'text-body'}`}>
                                                    {notif.title}
                                                </p>
                                                <p className="text-xs text-sub truncate mt-0.5">{notif.message}</p>
                                                <p className="text-xs text-sub mt-1">{notif.time}</p>
                                            </div>
                                            {!notif.read && (
                                                <div className="w-2 h-2 bg-primary-500 rounded-full mt-2 flex-shrink-0 animate-pulse-badge" />
                                            )}
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    )
}

export default NotificationPanel
