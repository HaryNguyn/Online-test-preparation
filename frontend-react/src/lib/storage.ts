import type { Test, TestResult, User } from "./types.ts"

const STORAGE_KEYS = {
  USERS: "exam_platform_users",
  TESTS: "exam_platform_tests",
  RESULTS: "exam_platform_results",
  CURRENT_USER: "exam_platform_current_user",
} as const

const isBrowser = () => typeof window !== "undefined"

export const storage = {
  getUsers: (): User[] => {
    if (!isBrowser()) return []
    const data = window.localStorage.getItem(STORAGE_KEYS.USERS)
    return data ? (JSON.parse(data) as User[]) : []
  },

  saveUsers: (users: User[]) => {
    if (!isBrowser()) return
    window.localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users))
  },

  getTests: (): Test[] => {
    if (!isBrowser()) return []
    const data = window.localStorage.getItem(STORAGE_KEYS.TESTS)
    return data ? (JSON.parse(data) as Test[]) : []
  },

  saveTests: (tests: Test[]) => {
    if (!isBrowser()) return
    window.localStorage.setItem(STORAGE_KEYS.TESTS, JSON.stringify(tests))
  },

  getResults: (): TestResult[] => {
    if (!isBrowser()) return []
    const data = window.localStorage.getItem(STORAGE_KEYS.RESULTS)
    return data ? (JSON.parse(data) as TestResult[]) : []
  },

  saveResults: (results: TestResult[]) => {
    if (!isBrowser()) return
    window.localStorage.setItem(STORAGE_KEYS.RESULTS, JSON.stringify(results))
  },

  getCurrentUser: (): User | null => {
    if (!isBrowser()) return null
    const data = window.localStorage.getItem(STORAGE_KEYS.CURRENT_USER)
    return data ? (JSON.parse(data) as User) : null
  },

  saveCurrentUser: (user: User | null) => {
    if (!isBrowser()) return
    if (user) {
      window.localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user))
    } else {
      window.localStorage.removeItem(STORAGE_KEYS.CURRENT_USER)
    }
  },
}
