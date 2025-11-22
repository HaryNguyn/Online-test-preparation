import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import type { User } from "@/lib/types"
import { storage } from "@/lib/storage"
import { api } from "@/lib/api"
import { initializeMockData } from "@/lib/mock-data"

interface AuthContextValue {
  user: User | null
  setUser: (user: User | null) => void
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  register: (
    email: string,
    password: string,
    name: string,
    role: User["role"],
    grade?: string,
  ) => Promise<{ success: boolean; error?: string }>
  logout: () => void
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string; message?: string }>
  confirmResetPassword: (token: string, newPassword: string) => Promise<{ success: boolean; error?: string }>
  forgotPassword: (email: string, newPassword: string) => Promise<{ success: boolean; error?: string }>
  changePassword: (currentPassword: string, newPassword: string) => Promise<{ success: boolean; error?: string }>
  isLoading: boolean
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    initializeMockData()
  }, [])

  useEffect(() => {
    const currentUser = storage.getCurrentUser()
    if (currentUser) {
      // Check if the stored user ID is a mock ID (string like "0", "1", etc.)
      const isMockId = /^\d+$/.test(currentUser.id)

      if (isMockId) {
        // Convert mock ID to backend ID using the mapping API
        api
          .resolveUserMapping({ mockId: currentUser.id })
          .then((mappingRes) => {
            if (mappingRes.success && mappingRes.mapping) {
              const backendId = mappingRes.mapping.backendId
              // Fetch user data using the backend ID
              return api.me(backendId)
            } else {
              throw new Error('User mapping not found')
            }
          })
          .then((res) => {
            setUser(res.user)
          })
          .catch(() => {
            storage.saveCurrentUser(null)
            setUser(null)
          })
          .finally(() => setIsLoading(false))
      } else {
        // Use backend ID directly
        api
          .me(currentUser.id)
          .then((res) => {
            setUser(res.user)
          })
          .catch(() => {
            storage.saveCurrentUser(null)
            setUser(null)
          })
          .finally(() => setIsLoading(false))
      }
    } else {
      setIsLoading(false)
    }
  }, [])

  const login = async (email: string, password: string) => {
    try {
      const { user: authenticatedUser } = await api.login(email, password)
      setUser(authenticatedUser)
      storage.saveCurrentUser(authenticatedUser)
      return { success: true }
    } catch (error) {
      const err = error as Error
      return { success: false, error: err.message || "Login failed" }
    }
  }

  const register = async (
    email: string,
    password: string,
    name: string,
    role: User["role"],
    grade?: string,
  ) => {
    try {
      const { user: registeredUser } = await api.register({ email, password, name, role, grade })
      setUser(registeredUser)
      storage.saveCurrentUser(registeredUser)
      return { success: true }
    } catch (error) {
      const err = error as Error
      return { success: false, error: err.message || "Registration failed" }
    }
  }

  const logout = () => {
    setUser(null)
    storage.saveCurrentUser(null)
  }

  const resetPassword = async (email: string) => {
    // Mock API call
    await new Promise((resolve) => setTimeout(resolve, 1000))
    console.log(`Password reset requested for: ${email}`)
    return { success: true, message: "If an account with this email exists, a password reset link has been sent." }
  }

  const confirmResetPassword = async (token: string, newPassword: string) => {
    try {
      if (!token || !newPassword) {
        return { success: false, error: "Token and new password are required" };
      }

      // Call backend API to confirm password reset with token
      await api.confirmResetPassword({ token, newPassword });

      return { success: true }
    } catch (error) {
      const err = error as Error
      return { success: false, error: err.message || "Failed to reset password" }
    }
  }

  const forgotPassword = async (email: string, newPassword: string) => {
    try {
      if (!email || !newPassword) {
        return { success: false, error: "Email and new password are required" };
      }

      // Call backend API to reset password via email (no login required)
      await api.forgotPassword({ email, newPassword });

      return { success: true }
    } catch (error) {
      const err = error as Error
      return { success: false, error: err.message || "Failed to reset password" }
    }
  }

  const changePassword = async (currentPassword: string, newPassword: string) => {
    try {
      if (!user) {
        return { success: false, error: "User not logged in" };
      }
      
      if (!currentPassword || !newPassword) {
        return { success: false, error: "Current and new password are required" };
      }

      // Call API with userId, current password, and new password
      await api.changePassword({ userId: user.id, currentPassword, newPassword });

      return { success: true }
    } catch (error) {
      const err = error as Error
      return { success: false, error: err.message || "Failed to change password" }
    }
  }

  const value = useMemo(
    () => ({ user, setUser, login, register, logout, resetPassword, confirmResetPassword, forgotPassword, changePassword, isLoading }),
    [user, isLoading],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
