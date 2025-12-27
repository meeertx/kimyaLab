import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface Notification {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message?: string
  duration?: number
  action?: {
    label: string
    handler: () => void
  }
}

interface NotificationContextType {
  showNotification: (notification: Omit<Notification, 'id'>) => string
  removeNotification: (id: string) => void
  clearAll: () => void
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export const useNotifications = () => {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider')
  }
  return context
}

interface NotificationProviderProps {
  children: React.ReactNode
  maxNotifications?: number
}

const NotificationItem = React.forwardRef<
  HTMLDivElement,
  {
    notification: Notification
    onRemove: (id: string) => void
  }
>(({ notification, onRemove }, ref) => {
  const getIcon = () => {
    switch (notification.type) {
      case 'success': return '✅'
      case 'error': return '❌'
      case 'warning': return '⚠️'
      case 'info': return 'ℹ️'
      default: return 'ℹ️'
    }
  }

  const getColors = () => {
    switch (notification.type) {
      case 'success': return 'bg-green-50 border-green-200 text-green-800'
      case 'error': return 'bg-red-50 border-red-200 text-red-800'
      case 'warning': return 'bg-yellow-50 border-yellow-200 text-yellow-800'
      case 'info': return 'bg-blue-50 border-blue-200 text-blue-800'
      default: return 'bg-gray-50 border-gray-200 text-gray-800'
    }
  }

  useEffect(() => {
    if (notification.duration) {
      const timer = setTimeout(() => {
        onRemove(notification.id)
      }, notification.duration)

      return () => clearTimeout(timer)
    }
  }, [notification.duration, notification.id, onRemove])

  return (
    <motion.div
      ref={ref}
      layout
      initial={{ opacity: 0, y: -50, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: 300, scale: 0.95 }}
      transition={{ duration: 0.3 }}
      className={`relative p-4 border rounded-lg shadow-lg ${getColors()} max-w-sm w-full`}
    >
      <div className="flex items-start space-x-3">
        <div className="text-lg flex-shrink-0">
          {getIcon()}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold">
            {notification.title}
          </h4>
          {notification.message && (
            <p className="text-sm mt-1 opacity-90">
              {notification.message}
            </p>
          )}
          {notification.action && (
            <button
              onClick={notification.action.handler}
              className="text-sm font-medium underline mt-2 hover:no-underline"
            >
              {notification.action.label}
            </button>
          )}
        </div>
        <button
          onClick={() => onRemove(notification.id)}
          className="flex-shrink-0 text-current opacity-50 hover:opacity-100 transition-opacity"
        >
          ×
        </button>
      </div>

      {/* Progress bar for timed notifications */}
      {notification.duration && (
        <motion.div
          className="absolute bottom-0 left-0 h-1 bg-current opacity-30"
          initial={{ width: '100%' }}
          animate={{ width: '0%' }}
          transition={{ duration: notification.duration / 1000, ease: 'linear' }}
        />
      )}
    </motion.div>
  )
})

NotificationItem.displayName = 'NotificationItem'

export const NotificationProvider: React.FC<NotificationProviderProps> = ({
  children,
  maxNotifications = 5
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([])

  const showNotification = useCallback((notification: Omit<Notification, 'id'>) => {
    const id = `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    const newNotification: Notification = {
      id,
      duration: 5000, // Default 5 seconds
      ...notification
    }

    setNotifications(prev => {
      const updated = [newNotification, ...prev]
      // Keep only the latest notifications
      return updated.slice(0, maxNotifications)
    })

    return id
  }, [maxNotifications])

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }, [])

  const clearAll = useCallback(() => {
    setNotifications([])
  }, [])

  const contextValue: NotificationContextType = {
    showNotification,
    removeNotification,
    clearAll
  }

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
      
      {/* Notification Container */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        <AnimatePresence mode="popLayout">
          {notifications.map((notification) => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              onRemove={removeNotification}
            />
          ))}
        </AnimatePresence>
      </div>
    </NotificationContext.Provider>
  )
}

// Helper hooks for common notification types
export const useSuccessNotification = () => {
  const { showNotification } = useNotifications()
  
  return useCallback((title: string, message?: string, duration?: number) => {
    return showNotification({
      type: 'success',
      title,
      message,
      duration
    })
  }, [showNotification])
}

export const useErrorNotification = () => {
  const { showNotification } = useNotifications()
  
  return useCallback((title: string, message?: string, action?: Notification['action']) => {
    return showNotification({
      type: 'error',
      title,
      message,
      duration: 8000, // Errors stay longer
      action
    })
  }, [showNotification])
}

export const useInfoNotification = () => {
  const { showNotification } = useNotifications()
  
  return useCallback((title: string, message?: string, duration?: number) => {
    return showNotification({
      type: 'info',
      title,
      message,
      duration
    })
  }, [showNotification])
}

export const useWarningNotification = () => {
  const { showNotification } = useNotifications()
  
  return useCallback((title: string, message?: string, duration?: number) => {
    return showNotification({
      type: 'warning',
      title,
      message,
      duration: 6000 // Warnings stay a bit longer
    })
  }, [showNotification])
}