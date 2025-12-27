// This file is deprecated - use src/services/api/authApi.ts instead
// PostgreSQL Backend Auth Service (Redirected)

import { AuthApi } from './api/authApi'

// Re-export AuthApi methods for backward compatibility
export const AuthService = AuthApi

// Status indicator
console.log('🚀 AuthService: Redirected to PostgreSQL Backend AuthApi (Firebase removed)')