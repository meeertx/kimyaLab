// Base API Client for Node.js Backend
export const API_BASE_URL = 'http://localhost:5001/api'

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  error?: string
  timestamp: string
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

class ApiClient {
  private baseURL: string
  private token: string | null = null

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL
    this.token = localStorage.getItem('accessToken')
  }

  // Set authentication token
  setToken(token: string) {
    this.token = token
    localStorage.setItem('accessToken', token)
  }

  // Clear authentication token
  clearToken() {
    this.token = null
    localStorage.removeItem('accessToken')
  }

  // Get authentication headers
  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    }

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`
    }

    return headers
  }

  // Generic request method with auto-refresh
  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    isRetry: boolean = false
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`
    const headers = {
      ...this.getHeaders(),
      ...options.headers,
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      })

      // Check if token expired (401)
      if (response.status === 401 && !isRetry && this.token && !endpoint.includes('/auth/')) {
        console.log('🔄 Token expired, attempting refresh...')
        
        try {
          // Attempt token refresh
          await this.refreshToken()
          
          // Retry the original request with new token
          return this.request<T>(endpoint, options, true)
        } catch (refreshError) {
          console.error('❌ Token refresh failed:', refreshError)
          
          // Clear invalid token and redirect to login
          this.clearToken()
          
          // If we're in browser, redirect to auth page
          if (typeof window !== 'undefined') {
            window.location.href = '/auth'
          }
          
          throw new Error('Oturum süreniz doldu. Lütfen tekrar giriş yapın.')
        }
      }

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || `HTTP ${response.status}: ${response.statusText}`)
      }

      return data
    } catch (error) {
      console.error('API Request Error:', error)
      throw error
    }
  }

  // Auto token refresh method
  private async refreshToken(): Promise<void> {
    const refreshToken = localStorage.getItem('refreshToken')
    
    if (!refreshToken) {
      throw new Error('No refresh token available')
    }
    
    const refreshResponse = await fetch(`${this.baseURL}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ refreshToken })
    })

    if (!refreshResponse.ok) {
      throw new Error('Token refresh failed')
    }

    const data = await refreshResponse.json()
    
    if (data.success && data.data?.accessToken) {
      this.setToken(data.data.accessToken)
      console.log('✅ Token refreshed successfully')
    } else {
      throw new Error('Invalid refresh response')
    }
  }

  // GET request
  async get<T>(endpoint: string, params?: Record<string, any>): Promise<ApiResponse<T>> {
    const query = params ? '?' + new URLSearchParams(params).toString() : ''
    return this.request<T>(`${endpoint}${query}`, {
      method: 'GET',
    })
  }

  // POST request
  async post<T>(endpoint: string, body?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    })
  }

  // PUT request
  async put<T>(endpoint: string, body?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    })
  }

  // PATCH request
  async patch<T>(endpoint: string, body?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    })
  }

  // DELETE request
  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'DELETE',
    })
  }

  // Health check
  async healthCheck(): Promise<ApiResponse> {
    const response = await fetch('http://localhost:5001/health')
    return response.json()
  }
}

// Export singleton instance
export const apiClient = new ApiClient()
export default apiClient