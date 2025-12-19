import { create } from 'zustand'

export type NotificationType = 'success' | 'error' | 'warning' | 'info'
export type NotificationPriority = 'low' | 'normal' | 'high' | 'critical'

export interface Notification {
  id: string
  type: NotificationType
  title: string
  message: string
  duration?: number
  priority?: NotificationPriority
  timestamp: number
}

interface NotificationStore {
  notifications: Notification[]
  queue: Notification[]
  maxVisible: number
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => void
  removeNotification: (id: string) => void
  clearAll: () => void
  processQueue: () => void
}

export const useNotificationStore = create<NotificationStore>((set, get) => ({
  notifications: [],
  queue: [],
  maxVisible: 3, // Chỉ hiển thị tối đa 3 notification cùng lúc
  
  processQueue: () => {
    const state = get()
    if (state.notifications.length < state.maxVisible && state.queue.length > 0) {
      // Lấy notification có priority cao nhất từ queue
      const sortedQueue = [...state.queue].sort((a, b) => {
        const priorityOrder = { critical: 4, high: 3, normal: 2, low: 1 }
        const aPriority = priorityOrder[a.priority || 'normal']
        const bPriority = priorityOrder[b.priority || 'normal']
        if (aPriority !== bPriority) return bPriority - aPriority
        return a.timestamp - b.timestamp // FIFO cho cùng priority
      })
      
      const nextNotification = sortedQueue[0]
      
      set({
        notifications: [...state.notifications, nextNotification],
        queue: state.queue.filter(n => n.id !== nextNotification.id)
      })
      
      // Auto remove after duration
      if (nextNotification.duration && nextNotification.duration > 0) {
        setTimeout(() => {
          set((state) => ({
            notifications: state.notifications.filter((n) => n.id !== nextNotification.id),
          }))
          // Process next in queue
          setTimeout(() => get().processQueue(), 100)
        }, nextNotification.duration)
      }
    }
  },
  
  addNotification: (notification) => {
    const id = Math.random().toString(36).substring(2, 9)
    const timestamp = Date.now()
    
    // Set default priority based on type
    let defaultPriority: NotificationPriority = 'normal'
    if (notification.type === 'error') defaultPriority = 'high'
    if (notification.type === 'warning') defaultPriority = 'normal'
    if (notification.type === 'success') defaultPriority = 'low'
    if (notification.type === 'info') defaultPriority = 'low'
    
    const newNotification: Notification = {
      ...notification,
      id,
      timestamp,
      priority: notification.priority ?? defaultPriority,
      duration: notification.duration ?? 5000,
    }
    
    const state = get()
    
    // Nếu đã đủ số notification hiển thị, thêm vào queue
    if (state.notifications.length >= state.maxVisible) {
      set({ queue: [...state.queue, newNotification] })
    } else {
      set({ notifications: [...state.notifications, newNotification] })
      
      // Auto remove after duration
      if (newNotification.duration && newNotification.duration > 0) {
        setTimeout(() => {
          set((state) => ({
            notifications: state.notifications.filter((n) => n.id !== id),
          }))
          // Process next in queue
          setTimeout(() => get().processQueue(), 100)
        }, newNotification.duration)
      }
    }
  },
  
  removeNotification: (id) => {
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    }))
    // Process next in queue after removal
    setTimeout(() => get().processQueue(), 100)
  },
  
  clearAll: () => set({ notifications: [], queue: [] }),
}))

// Helper hooks for common notification types
export const useNotification = () => {
  const { addNotification } = useNotificationStore()
  
  return {
    success: (title: string, message: string, duration?: number, priority?: NotificationPriority) =>
      addNotification({ type: 'success', title, message, duration, priority }),
    
    error: (title: string, message: string, duration?: number, priority?: NotificationPriority) =>
      addNotification({ type: 'error', title, message, duration, priority: priority ?? 'high' }),
    
    warning: (title: string, message: string, duration?: number, priority?: NotificationPriority) =>
      addNotification({ type: 'warning', title, message, duration, priority }),
    
    info: (title: string, message: string, duration?: number, priority?: NotificationPriority) =>
      addNotification({ type: 'info', title, message, duration, priority }),
    
    critical: (title: string, message: string, duration?: number) =>
      addNotification({ type: 'error', title, message, duration: duration ?? 0, priority: 'critical' }),
  }
}
