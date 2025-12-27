import { io, Socket } from 'socket.io-client'

interface WebSocketNotification {
  type: 'product_created' | 'product_updated' | 'product_deleted' | 'inventory_updated'
  data: any
  timestamp: string
}

class WebSocketService {
  private socket: Socket | null = null
  private isConnecting = false
  private listeners = new Map<string, Set<Function>>()

  // Initialize connection
  async connect(token?: string): Promise<void> {
    if (this.socket?.connected || this.isConnecting) return

    this.isConnecting = true
    
    try {
      // Connect to backend WebSocket server
      this.socket = io(process.env.NODE_ENV === 'production' 
        ? 'https://api.kimyalab.com' 
        : 'http://localhost:5001', {
        transports: ['websocket', 'polling'],
        auth: token ? { token } : undefined,
        autoConnect: true,
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5,
        timeout: 20000
      })

      // Setup connection event handlers
      this.socket.on('connect', () => {
        console.log('🔌 WebSocket connected:', this.socket?.id)
        this.isConnecting = false
        this.joinRooms()
      })

      this.socket.on('disconnect', (reason: string) => {
        console.log('🔌 WebSocket disconnected:', reason)
        this.isConnecting = false
      })

      this.socket.on('connect_error', (error: Error) => {
        console.error('🔌 WebSocket connection error:', error)
        this.isConnecting = false
      })

      this.socket.on('reconnect', () => {
        console.log('🔌 WebSocket reconnected')
        this.joinRooms()
      })

      // Setup notification handlers
      this.setupNotificationHandlers()

    } catch (error) {
      console.error('🔌 WebSocket connection failed:', error)
      this.isConnecting = false
      throw error
    }
  }

  // Join relevant rooms
  private joinRooms(): void {
    if (!this.socket) return

    // Join general rooms
    this.socket.emit('join_room', 'products')
    this.socket.emit('join_room', 'categories')
    
    // Check if user is admin and join admin room
    const user = this.getCurrentUser()
    if (user?.role === 'admin') {
      this.socket.emit('join_admin')
    }
  }

  // Setup notification event handlers
  private setupNotificationHandlers(): void {
    if (!this.socket) return

    // Product created notifications
    this.socket.on('productCreated', (data: any) => {
      console.log('📦 Product created notification:', data)
      this.notifyListeners('productCreated', data)
      this.notifyListeners('product_updated', data) // For compatibility
    })

    // Product updated notifications
    this.socket.on('productUpdated', (data: any) => {
      console.log('📦 Product updated notification:', data)
      this.notifyListeners('productUpdated', data)
      this.notifyListeners('product_updated', data) // For compatibility
    })

    // Product deleted notifications
    this.socket.on('productDeleted', (data: any) => {
      console.log('📦 Product deleted notification:', data)
      this.notifyListeners('productDeleted', data)
    })

    // Stock updated notifications
    this.socket.on('stockUpdated', (data: any) => {
      console.log('📊 Stock updated notification:', data)
      this.notifyListeners('stockUpdated', data)
      this.notifyListeners('inventory_updated', data) // For compatibility
    })

    // Low stock warnings
    this.socket.on('lowStockWarning', (data: any) => {
      console.log('⚠️ Low stock warning:', data)
      this.notifyListeners('lowStockWarning', data)
    })

    // Legacy product update notifications
    this.socket.on('product_updated', (data: any) => {
      console.log('📦 Legacy product update notification:', data)
      this.notifyListeners('product_updated', data)
    })

    // Legacy inventory update notifications
    this.socket.on('inventory_updated', (data: any) => {
      console.log('📊 Legacy inventory update notification:', data)
      this.notifyListeners('inventory_updated', data)
    })

    // Admin notifications
    this.socket.on('admin_notification', (data: any) => {
      console.log('👨‍💼 Admin notification:', data)
      this.notifyListeners('admin_notification', data)
    })

    // System notifications
    this.socket.on('system_notification', (data: any) => {
      console.log('🔔 System notification:', data)
      this.notifyListeners('system_notification', data)
    })

    // Room join confirmations
    this.socket.on('room_joined', (data: any) => {
      console.log('🏠 Joined room:', data.room)
    })

    this.socket.on('admin_room_joined', (data: any) => {
      console.log('👨‍💼 Joined admin room:', data.message)
    })
  }

  // Subscribe to specific notification types
  subscribe(eventType: string, callback: Function): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set())
    }
    
    this.listeners.get(eventType)!.add(callback)
    
    // Return unsubscribe function
    return () => {
      const listeners = this.listeners.get(eventType)
      if (listeners) {
        listeners.delete(callback)
        if (listeners.size === 0) {
          this.listeners.delete(eventType)
        }
      }
    }
  }

  // Notify all listeners of an event
  private notifyListeners(eventType: string, data: any): void {
    const listeners = this.listeners.get(eventType)
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(data)
        } catch (error) {
          console.error('Error in WebSocket listener:', error)
        }
      })
    }
  }

  // Send real-time notification about product creation
  notifyProductCreated(product: any): void {
    if (this.socket?.connected) {
      // This will be handled by backend automatically when product is created
      console.log('📦 Product created notification will be sent by backend')
    }
  }

  // Send real-time notification about product update  
  notifyProductUpdated(product: any): void {
    if (this.socket?.connected) {
      // This will be handled by backend automatically when product is updated
      console.log('📦 Product updated notification will be sent by backend')
    }
  }

  // Join product-specific room
  joinProductRoom(productId: string): void {
    if (this.socket?.connected) {
      this.socket.emit('join_product', productId)
    }
  }

  // Join category-specific room
  joinCategoryRoom(categoryId: string): void {
    if (this.socket?.connected) {
      this.socket.emit('join_category', categoryId)
    }
  }

  // Get current user (from localStorage or context)
  private getCurrentUser(): any {
    try {
      const userStr = localStorage.getItem('user')
      return userStr ? JSON.parse(userStr) : null
    } catch {
      return null
    }
  }

  // Get connection status
  get connected(): boolean {
    return this.socket?.connected ?? false
  }

  get connecting(): boolean {
    return this.isConnecting
  }

  // Disconnect
  disconnect(): void {
    if (this.socket) {
      console.log('🔌 Disconnecting WebSocket...')
      this.socket.disconnect()
      this.socket = null
    }
    this.listeners.clear()
    this.isConnecting = false
  }
}

// Export singleton instance
export const websocketService = new WebSocketService()

// Export types
export type { WebSocketNotification }
export default websocketService