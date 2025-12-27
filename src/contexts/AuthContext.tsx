import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { AuthApi } from '../services/api'

interface AuthUser {
  id: string
  email: string
  displayName: string | null
  photoURL?: string | null
  role: string
  isEmailVerified: boolean
}

interface AuthContextType {
  user: AuthUser | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, displayName: string) => Promise<void>
  signOut: () => Promise<void>
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if user is already logged in on app load
    checkAuthState()
  }, [])

  const checkAuthState = async () => {
    try {
      const token = localStorage.getItem('accessToken')
      if (token) {
        // Verify token with backend and get user info
        const authUser = await AuthApi.getProfile()
        setUser({
          id: authUser.uid,
          email: authUser.email || '',
          displayName: authUser.displayName,
          photoURL: null, // PostgreSQL backend doesn't support profile photos yet
          role: authUser.role || 'USER',
          isEmailVerified: authUser.emailVerified
        })
      }
    } catch (error) {
      console.error('Auth check failed:', error)
      // Clear invalid token
      localStorage.removeItem('accessToken')
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  const signIn = async (email: string, password: string): Promise<void> => {
    try {
      setLoading(true)
      const authUser = await AuthApi.login({ email, password })
      
      // Store token (AuthApi already handles this internally)
      // Set user data
      const userData = {
        id: authUser.uid,
        email: authUser.email || '',
        displayName: authUser.displayName,
        photoURL: null, // PostgreSQL backend doesn't support profile photos yet
        role: authUser.role || 'USER',
        isEmailVerified: authUser.emailVerified
      }
      
      setUser(userData)
      
      // Store user data for later use
      localStorage.setItem('userData', JSON.stringify(userData))
    } catch (error) {
      setLoading(false)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const signUp = async (email: string, password: string, displayName: string): Promise<void> => {
    try {
      setLoading(true)
      const authUser = await AuthApi.register({
        email,
        password,
        name: displayName
      })
      
      // Store token (AuthApi already handles this internally)
      // Set user data
      setUser({
        id: authUser.uid,
        email: authUser.email || '',
        displayName: authUser.displayName,
        photoURL: null, // PostgreSQL backend doesn't support profile photos yet
        role: authUser.role || 'USER',
        isEmailVerified: authUser.emailVerified
      })
    } catch (error) {
      setLoading(false)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const signOut = async (): Promise<void> => {
    try {
      setLoading(true)
      // Call logout API (optional)
      await AuthApi.logout()
    } catch (error) {
      console.error('Logout API call failed:', error)
    } finally {
      // Always clear local state regardless of API call result
      localStorage.removeItem('accessToken')
      setUser(null)
      setLoading(false)
    }
  }

  const value: AuthContextType = {
    user,
    loading,
    signIn,
    signUp,
    signOut,
    isAuthenticated: !!user
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// Status indicator
console.log('🚀 AuthContext: Using PostgreSQL Backend (Firebase removed)')