'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { apiClient } from '@/lib/apiClient'
import { useTranslation } from '@/contexts/I18nContext'

export interface AuthUser {
  id: string
  username: string
  email: string
  firstName?: string
  lastName?: string
  avatar?: string
}

export interface AuthState {
  user: AuthUser | null
  isLoading: boolean
  isAuthenticated: boolean
  error: string | null
}

export interface SignInData {
  email: string
  password: string
  rememberMe?: boolean
}

export interface SignUpData {
  email: string
  password: string
  firstName?: string
  lastName?: string
  phoneNumber?: string
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
    error: null
  })
  const router = useRouter()
  const { tAuth, tError } = useTranslation()

  // 检查认证状态
  const checkAuthStatus = async () => {
    try {
      const token = localStorage.getItem('access_token')
      if (!token) {
        setAuthState(prev => ({
          ...prev,
          isLoading: false,
          isAuthenticated: false
        }))
        return
      }

      // 验证token并获取用户信息
      const response = await apiClient.get('/api/v1/auth/user/')

      setAuthState({
        user: response.data,
        isLoading: false,
        isAuthenticated: true,
        error: null
      })
    } catch (error: any) {
      console.error('Auth check failed:', error)

      // 清除无效token
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')

      setAuthState({
        user: null,
        isLoading: false,
        isAuthenticated: false,
        error: null
      })
    }
  }

  // 登录
  const signIn = async (data: SignInData): Promise<{ success: boolean; error?: string }> => {
    setAuthState(prev => ({ ...prev, isLoading: true, error: null }))

    try {
      // 开发阶段：支持用户名或邮箱登录
      // 如果输入的是邮箱格式，使用邮箱；否则直接作为用户名
      const isEmail = data.email.includes('@')
      const loginData = isEmail
        ? { username: data.email, email: data.email, password: data.password }
        : { username: data.email, password: data.password }

      const response = await apiClient.post('/api/v1/auth/token/', loginData)

      if (response.data.access && response.data.refresh) {
        // 存储tokens
        localStorage.setItem('access_token', response.data.access)
        localStorage.setItem('refresh_token', response.data.refresh)

        // 获取用户信息
        await checkAuthStatus()

        return { success: true }
      } else {
        const error = tError('登录响应格式错误')
        setAuthState(prev => ({ ...prev, isLoading: false, error }))
        return { success: false, error }
      }
    } catch (error: any) {
      console.error('Sign in error:', error)

      let errorMessage = tAuth('登录失败，请稍后重试')

      if (error.response?.status === 401) {
        errorMessage = tAuth('邮箱或密码错误')
      } else if (error.response?.status === 400) {
        errorMessage = tAuth('请填写完整的邮箱和密码')
      }

      setAuthState(prev => ({ ...prev, isLoading: false, error: errorMessage }))
      return { success: false, error: errorMessage }
    }
  }

  // 注册
  const signUp = async (data: SignUpData): Promise<{ success: boolean; error?: string }> => {
    setAuthState(prev => ({ ...prev, isLoading: true, error: null }))

    try {
      // 注册新用户
      const response = await apiClient.post('/api/v1/auth/register/', {
        email: data.email,
        password: data.password,
        first_name: data.firstName,
        last_name: data.lastName,
        phone_number: data.phoneNumber
      })

      if (response.data.access && response.data.refresh) {
        // 注册成功，直接登录
        localStorage.setItem('access_token', response.data.access)
        localStorage.setItem('refresh_token', response.data.refresh)

        await checkAuthStatus()

        return { success: true }
      } else {
        // 注册成功但需要验证，跳转到登录页
        return { success: true }
      }
    } catch (error: any) {
      console.error('Sign up error:', error)

      let errorMessage = tAuth('注册失败，请稍后重试')

      if (error.response?.status === 400) {
        const data = error.response.data
        if (data.email) {
          errorMessage = tAuth('该邮箱已被注册')
        } else if (data.password) {
          errorMessage = tAuth('密码格式不符合要求')
        } else {
          errorMessage = tAuth('请检查输入信息')
        }
      }

      setAuthState(prev => ({ ...prev, isLoading: false, error: errorMessage }))
      return { success: false, error: errorMessage }
    }
  }

  // 登出
  const signOut = async () => {
    try {
      // 尝试调用登出API
      await apiClient.post('/api/v1/auth/logout/')
    } catch (error) {
      // 忽略登出API错误，继续清除本地数据
      console.warn('Logout API failed:', error)
    }

    // 清除本地存储
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')

    setAuthState({
      user: null,
      isLoading: false,
      isAuthenticated: false,
      error: null
    })

    // 跳转到登录页
    router.push('/login')
  }

  // 忘记密码
  const forgotPassword = async (email: string): Promise<{ success: boolean; error?: string }> => {
    try {
      await apiClient.post('/api/v1/auth/password-reset/', { email })
      return { success: true }
    } catch (error: any) {
      console.error('Forgot password error:', error)

      let errorMessage = tAuth('发送重置邮件失败，请稍后重试')
      if (error.response?.status === 404) {
        errorMessage = tAuth('该邮箱未注册')
      }

      return { success: false, error: errorMessage }
    }
  }

  // 社交登录占位符
  const socialSignIn = async (provider: string): Promise<{ success: boolean; error?: string }> => {
    // TODO: 实现社交登录逻辑
    console.log(`Social sign in with ${provider} - Not implemented yet`)
    return {
      success: false,
      error: tAuth(`${provider} 登录功能正在开发中`)
    }
  }

  // 初始化时检查认证状态
  useEffect(() => {
    checkAuthStatus()
  }, [])

  return {
    ...authState,
    signIn,
    signUp,
    signOut,
    forgotPassword,
    socialSignIn,
    checkAuthStatus
  }
}
