import { X, CheckCircle, XCircle, AlertTriangle, Info } from 'lucide-react'
import { useNotificationStore } from '@/lib/notification-store'
import type { NotificationType, Notification } from '@/lib/notification-store'
import { cn } from '@/lib/utils'

const notificationStyles = {
  success: 'bg-green-50 border-green-200 text-green-900 dark:bg-green-900/20 dark:border-green-800 dark:text-green-100',
  error: 'bg-red-50 border-red-200 text-red-900 dark:bg-red-900/20 dark:border-red-800 dark:text-red-100',
  warning: 'bg-yellow-50 border-yellow-200 text-yellow-900 dark:bg-yellow-900/20 dark:border-yellow-800 dark:text-yellow-100',
  info: 'bg-blue-50 border-blue-200 text-blue-900 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-100',
}

const notificationIcons = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
}

const notificationIconColors = {
  success: 'text-green-600 dark:text-green-400',
  error: 'text-red-600 dark:text-red-400',
  warning: 'text-yellow-600 dark:text-yellow-400',
  info: 'text-blue-600 dark:text-blue-400',
}

export function NotificationContainer() {
  const { notifications, removeNotification } = useNotificationStore()

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-md w-full pointer-events-none">
      {notifications.map((notification: Notification) => {
        const Icon = notificationIcons[notification.type as NotificationType]
        
        return (
          <div
            key={notification.id}
            className={cn(
              'pointer-events-auto rounded-lg border p-4 shadow-lg animate-in slide-in-from-top-5 fade-in',
              notificationStyles[notification.type as NotificationType]
            )}
          >
            <div className="flex items-start gap-3">
              <Icon className={cn('h-5 w-5 mt-0.5 flex-shrink-0', notificationIconColors[notification.type as NotificationType])} />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">{notification.title}</p>
                <p className="text-sm mt-1 opacity-90">{notification.message}</p>
              </div>
              <button
                onClick={() => removeNotification(notification.id)}
                className="flex-shrink-0 p-1 rounded-md hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
