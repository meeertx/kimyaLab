import { apiClient } from './apiClient'

// Backend auth types
export interface BackendUser {
  id: string
  email: string
  name?: string
  role: 'USER' | 'ADMIN'
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterCredentials {
  email: string
  password: string
  name?: string
}

export interface LoginResponse {
  accessToken: string
  refreshToken: string
  user: BackendUser
}

export interface AuthUser {
  uid: string
  email: string | null
  displayName: string | null
  photoURL: string | null
  emailVerified: boolean
  role?: 'USER' | 'ADMIN'
}

export class AuthApi {
  // Login with email and password
  static async login(credentials: LoginCredentials): Promise<AuthUser> {
    try {
      const response = await apiClient.post<LoginResponse>('/auth/login', credentials)
      const { accessToken, refreshToken, user } = response.data!
      
      // Store tokens in API client and localStorage
      apiClient.setToken(accessToken)
      localStorage.setItem('refreshToken', refreshToken)
      
      // Convert backend user to frontend auth user format
      return this.convertToAuthUser(user)
    } catch (error: any) {
      throw new Error(this.getErrorMessage(error.message))
    }
  }

  // Register new user
  static async register(credentials: RegisterCredentials): Promise<AuthUser> {
    try {
      const response = await apiClient.post<LoginResponse>('/auth/register', credentials)
      const { accessToken, refreshToken, user } = response.data!
      
      // Store tokens in API client and localStorage
      apiClient.setToken(accessToken)
      localStorage.setItem('refreshToken', refreshToken)
      
      return this.convertToAuthUser(user)
    } catch (error: any) {
      throw new Error(this.getErrorMessage(error.message))
    }
  }

  // Get current user profile
  static async getProfile(): Promise<AuthUser> {
    try {
      const response = await apiClient.get<BackendUser>('/auth/me')
      return this.convertToAuthUser(response.data!)
    } catch (error: any) {
      throw new Error('Kullanıcı bilgileri alınamadı')
    }
  }

  // Refresh access token
  static async refreshToken(): Promise<{ accessToken: string }> {
    try {
      const response = await apiClient.post<{ accessToken: string }>('/auth/refresh')
      const { accessToken } = response.data!
      
      // Update token in API client
      apiClient.setToken(accessToken)
      
      return { accessToken }
    } catch (error: any) {
      throw new Error('Token yenilenemedi')
    }
  }

  // Logout
  static async logout(): Promise<void> {
    try {
      await apiClient.post('/auth/logout')
    } catch (error) {
      // Even if logout fails on server, clear local token
      console.warn('Server logout failed:', error)
    } finally {
      // Clear tokens from API client and local storage
      apiClient.clearToken()
      localStorage.removeItem('refreshToken')
    }
  }

  // Update user profile
  static async updateProfile(updates: { name?: string }): Promise<AuthUser> {
    try {
      const response = await apiClient.put<BackendUser>('/auth/profile', updates)
      return this.convertToAuthUser(response.data!)
    } catch (error: any) {
      throw new Error('Profil güncellenemedi')
    }
  }

  // Check if user is authenticated
  static isAuthenticated(): boolean {
    return !!localStorage.getItem('accessToken')
  }

  // Check if user is admin
  static isAdmin(): boolean {
    try {
      const token = localStorage.getItem('accessToken')
      if (!token) return false
      
      // Decode JWT token to check role (basic decode, not verification)
      const payload = JSON.parse(atob(token.split('.')[1]))
      return payload.role === 'ADMIN'
    } catch {
      return false
    }
  }

  // Convert backend user to frontend auth user format
  static convertToAuthUser(backendUser: BackendUser): AuthUser {
    return {
      uid: backendUser.id,
      email: backendUser.email,
      displayName: backendUser.name || null,
      photoURL: null, // Backend doesn't support profile pictures yet
      emailVerified: true, // Assuming email is verified if user can login
      role: backendUser.role
    }
  }

  // Get user-friendly error message
  static getErrorMessage(errorMessage: string): string {
    // Map backend error messages to user-friendly Turkish messages
    if (errorMessage.includes('Invalid credentials')) {
      return 'Email veya şifre hatalı'
    }
    if (errorMessage.includes('User not found')) {
      return 'Bu email adresi ile kayıtlı kullanıcı bulunamadı'
    }
    if (errorMessage.includes('Email already exists')) {
      return 'Bu email adresi zaten kullanımda'
    }
    if (errorMessage.includes('Password too weak')) {
      return 'Şifre çok zayıf. En az 6 karakter olmalı'
    }
    if (errorMessage.includes('Invalid email')) {
      return 'Geçersiz email adresi'
    }
    if (errorMessage.includes('Too many requests')) {
      return 'Çok fazla deneme yapıldı. Lütfen daha sonra tekrar deneyin'
    }
    
    return errorMessage || 'Bir hata oluştu. Lütfen tekrar deneyin'
  }

  // Initialize auth state on app startup
  static async initializeAuth(): Promise<AuthUser | null> {
    const token = localStorage.getItem('accessToken')
    if (!token) return null

    try {
      // Set token in API client
      apiClient.setToken(token)
      
      // Try to get current user profile
      return await this.getProfile()
    } catch (error) {
      // If token is invalid, clear it
      this.logout()
      return null
    }
  }
}