import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { config } from '../config/config.js'
import { prisma } from '../config/database.js'
import { 
  User, 
  LoginRequest, 
  RegisterRequest, 
  LoginResponse,
  JWTPayload 
} from '../types/index.js'
import { 
  AuthenticationError, 
  ConflictError, 
  ValidationError 
} from '../middleware/errorHandler.js'

export class AuthService {
  // Register new user
  static async register(data: RegisterRequest): Promise<LoginResponse> {
    const { email, password, name } = data

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      throw new ConflictError('User with this email already exists')
    }

    // Hash password
    const saltRounds = 12
    const hashedPassword = await bcrypt.hash(password, saltRounds)

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: 'USER', // Default role
        isActive: true
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      }
    })

    // Generate tokens
    const { accessToken, refreshToken } = await this.generateTokens(user)

    return {
      user,
      accessToken,
      refreshToken
    }
  }

  // Login user
  static async login(data: LoginRequest): Promise<LoginResponse> {
    const { email, password } = data

    // Find user with password
    const user = await prisma.user.findUnique({
      where: { email }
    })

    if (!user) {
      throw new AuthenticationError('Invalid email or password')
    }

    if (!user.isActive) {
      throw new AuthenticationError('Account is deactivated')
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password!)
    
    if (!isPasswordValid) {
      throw new AuthenticationError('Invalid email or password')
    }

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user

    // Generate tokens
    const { accessToken, refreshToken } = await this.generateTokens(userWithoutPassword)

    return {
      user: userWithoutPassword,
      accessToken,
      refreshToken
    }
  }

  // Refresh token
  static async refreshToken(token: string): Promise<{ accessToken: string }> {
    try {
      const decoded = jwt.verify(token, config.jwt.refreshSecret) as JWTPayload

      // Check if user still exists and is active
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isActive: true,
          createdAt: true,
          updatedAt: true
        }
      })

      if (!user || !user.isActive) {
        throw new AuthenticationError('User not found or inactive')
      }

      // Check if refresh token exists in database
      const storedToken = await prisma.authToken.findFirst({
        where: {
          userId: user.id,
          token: token,
          type: 'refresh',
          expiresAt: {
            gt: new Date()
          }
        }
      })

      if (!storedToken) {
        throw new AuthenticationError('Invalid or expired refresh token')
      }

      // Generate new access token
      const accessToken = this.generateAccessToken(user)

      return { accessToken }
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        throw new AuthenticationError('Invalid refresh token')
      }
      throw error
    }
  }

  // Logout (invalidate refresh token)
  static async logout(userId: string, refreshToken?: string): Promise<void> {
    if (refreshToken) {
      await prisma.authToken.deleteMany({
        where: {
          userId,
          token: refreshToken,
          type: 'refresh'
        }
      })
    } else {
      // Logout from all devices
      await prisma.authToken.deleteMany({
        where: {
          userId,
          type: 'refresh'
        }
      })
    }
  }

  // Generate password reset token
  static async generatePasswordResetToken(email: string): Promise<string> {
    const user = await prisma.user.findUnique({
      where: { email }
    })

    if (!user) {
      throw new ValidationError('No user found with this email')
    }

    if (!user.isActive) {
      throw new AuthenticationError('Account is deactivated')
    }

    // Generate reset token
    const resetToken = jwt.sign(
      { userId: user.id, email: user.email, type: 'password_reset' },
      config.jwt.secret,
      { expiresIn: '1h' }
    )

    // Store token in database
    await prisma.authToken.create({
      data: {
        userId: user.id,
        token: resetToken,
        type: 'reset_password',
        expiresAt: new Date(Date.now() + 60 * 60 * 1000) // 1 hour
      }
    })

    return resetToken
  }

  // Reset password
  static async resetPassword(token: string, newPassword: string): Promise<void> {
    try {
      const decoded = jwt.verify(token, config.jwt.secret) as JWTPayload & { type: string }

      if (decoded.type !== 'password_reset') {
        throw new AuthenticationError('Invalid token type')
      }

      // Check if token exists in database and is not expired
      const storedToken = await prisma.authToken.findFirst({
        where: {
          userId: decoded.userId,
          token: token,
          type: 'reset_password',
          expiresAt: {
            gt: new Date()
          }
        }
      })

      if (!storedToken) {
        throw new AuthenticationError('Invalid or expired reset token')
      }

      // Hash new password
      const saltRounds = 12
      const hashedPassword = await bcrypt.hash(newPassword, saltRounds)

      // Update user password
      await prisma.user.update({
        where: { id: decoded.userId },
        data: { password: hashedPassword }
      })

      // Delete the used reset token
      await prisma.authToken.delete({
        where: { id: storedToken.id }
      })

      // Logout user from all devices (invalidate all refresh tokens)
      await prisma.authToken.deleteMany({
        where: {
          userId: decoded.userId,
          type: 'refresh'
        }
      })

    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        throw new AuthenticationError('Invalid reset token')
      }
      throw error
    }
  }

  // Change password (authenticated user)
  static async changePassword(
    userId: string, 
    currentPassword: string, 
    newPassword: string
  ): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!user) {
      throw new AuthenticationError('User not found')
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password!)
    
    if (!isCurrentPasswordValid) {
      throw new AuthenticationError('Current password is incorrect')
    }

    // Hash new password
    const saltRounds = 12
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds)

    // Update password
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword }
    })
  }

  // Generate access and refresh tokens
  private static async generateTokens(user: Omit<User, 'password'>): Promise<{
    accessToken: string
    refreshToken: string
  }> {
    const accessToken = this.generateAccessToken(user)
    const refreshToken = this.generateRefreshToken(user)

    // Store refresh token in database
    await prisma.authToken.create({
      data: {
        userId: user.id,
        token: refreshToken,
        type: 'refresh',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
      }
    })

    return { accessToken, refreshToken }
  }

  // Generate access token
  private static generateAccessToken(user: Omit<User, 'password'>): string {
    return jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role
      },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn } as jwt.SignOptions
    )
  }

  // Generate refresh token
  private static generateRefreshToken(user: Omit<User, 'password'>): string {
    return jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role
      },
      config.jwt.refreshSecret,
      { expiresIn: config.jwt.refreshExpiresIn } as jwt.SignOptions
    )
  }

  // Verify token
  static verifyToken(token: string): JWTPayload {
    return jwt.verify(token, config.jwt.secret) as JWTPayload
  }

  // Clean expired tokens (should be called periodically)
  static async cleanExpiredTokens(): Promise<void> {
    await prisma.authToken.deleteMany({
      where: {
        expiresAt: {
          lt: new Date()
        }
      }
    })
  }
}