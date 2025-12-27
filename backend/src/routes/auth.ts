import { Router, Request, Response } from 'express'
import { AuthService } from '../services/authService.js'
import { 
  validateRegister, 
  validateLogin, 
  handleValidationErrors 
} from '../middleware/validation.js'
import { authenticateToken } from '../middleware/auth.js'
import { asyncHandler } from '../middleware/errorHandler.js'
import { ApiResponse, LoginResponse } from '../types/index.js'

const router = Router()

// Register new user
router.post('/register',
  validateRegister,
  handleValidationErrors,
  asyncHandler(async (req: Request, res: Response<ApiResponse<LoginResponse>>) => {
    const result = await AuthService.register(req.body)
    
    res.status(201).json({
      success: true,
      data: result,
      message: 'User registered successfully',
      timestamp: new Date().toISOString()
    })
  })
)

// Login user
router.post('/login',
  validateLogin,
  handleValidationErrors,
  asyncHandler(async (req: Request, res: Response<ApiResponse<LoginResponse>>) => {
    const result = await AuthService.login(req.body)
    
    res.json({
      success: true,
      data: result,
      message: 'Login successful',
      timestamp: new Date().toISOString()
    })
  })
)

// Refresh access token
router.post('/refresh',
  asyncHandler(async (req: Request, res: Response<ApiResponse<{ accessToken: string }>>) => {
    const { refreshToken } = req.body
    
    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        error: 'Refresh token required',
        message: 'Please provide a refresh token',
        timestamp: new Date().toISOString()
      })
    }
    
    const result = await AuthService.refreshToken(refreshToken)
    
    res.json({
      success: true,
      data: result,
      message: 'Token refreshed successfully',
      timestamp: new Date().toISOString()
    })
  })
)

// Logout user
router.post('/logout',
  authenticateToken,
  asyncHandler(async (req: Request, res: Response<ApiResponse>) => {
    const { refreshToken } = req.body
    const userId = req.userId!
    
    await AuthService.logout(userId, refreshToken)
    
    res.json({
      success: true,
      message: 'Logout successful',
      timestamp: new Date().toISOString()
    })
  })
)

// Logout from all devices
router.post('/logout-all',
  authenticateToken,
  asyncHandler(async (req: Request, res: Response<ApiResponse>) => {
    const userId = req.userId!
    
    await AuthService.logout(userId) // No refresh token = logout all
    
    res.json({
      success: true,
      message: 'Logged out from all devices successfully',
      timestamp: new Date().toISOString()
    })
  })
)

// Generate password reset token
router.post('/forgot-password',
  asyncHandler(async (req: Request, res: Response<ApiResponse>) => {
    const { email } = req.body
    
    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email required',
        message: 'Please provide an email address',
        timestamp: new Date().toISOString()
      })
    }
    
    // Note: In production, you would send this token via email
    // For now, we'll return it in the response (development only)
    const resetToken = await AuthService.generatePasswordResetToken(email)
    
    res.json({
      success: true,
      message: 'Password reset instructions sent to your email',
      ...(process.env.NODE_ENV === 'development' && { 
        data: { resetToken } // Only include in development
      }),
      timestamp: new Date().toISOString()
    })
  })
)

// Reset password with token
router.post('/reset-password',
  asyncHandler(async (req: Request, res: Response<ApiResponse>) => {
    const { token, newPassword } = req.body
    
    if (!token || !newPassword) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'Token and new password are required',
        timestamp: new Date().toISOString()
      })
    }
    
    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        error: 'Invalid password',
        message: 'Password must be at least 8 characters long',
        timestamp: new Date().toISOString()
      })
    }
    
    await AuthService.resetPassword(token, newPassword)
    
    res.json({
      success: true,
      message: 'Password reset successfully',
      timestamp: new Date().toISOString()
    })
  })
)

// Change password (authenticated user)
router.post('/change-password',
  authenticateToken,
  asyncHandler(async (req: Request, res: Response<ApiResponse>) => {
    const { currentPassword, newPassword } = req.body
    const userId = req.userId!
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'Current password and new password are required',
        timestamp: new Date().toISOString()
      })
    }
    
    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        error: 'Invalid password',
        message: 'New password must be at least 8 characters long',
        timestamp: new Date().toISOString()
      })
    }
    
    await AuthService.changePassword(userId, currentPassword, newPassword)
    
    res.json({
      success: true,
      message: 'Password changed successfully',
      timestamp: new Date().toISOString()
    })
  })
)

// Get current user profile
router.get('/me',
  authenticateToken,
  asyncHandler(async (req: Request, res: Response<ApiResponse>) => {
    res.json({
      success: true,
      data: req.user,
      message: 'User profile retrieved successfully',
      timestamp: new Date().toISOString()
    })
  })
)

// Verify token (health check for authentication)
router.get('/verify',
  authenticateToken,
  asyncHandler(async (req: Request, res: Response<ApiResponse>) => {
    res.json({
      success: true,
      data: {
        valid: true,
        userId: req.userId,
        role: req.user?.role
      },
      message: 'Token is valid',
      timestamp: new Date().toISOString()
    })
  })
)

export default router