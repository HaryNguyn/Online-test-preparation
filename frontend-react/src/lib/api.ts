import type { ExamDTO, LeaderboardEntry, SubmissionDTO, User } from "./types"

export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE"

const API_BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "http://localhost:8080/api"

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`.replace(/([^:]\/)(\/+)/g, "$1/"), {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    credentials: "include",
    ...options,
  })

  if (!res.ok) {
    let message = `HTTP ${res.status}`
    try {
      const data = await res.json()
      message = (data && (data.error || data.message)) || message
    } catch {
      // ignore json parse errors
    }
    throw new Error(message)
  }

  if (res.status === 204) {
    return {} as T
  }

  return res.json()
}

export const api = {
  login: (email: string, password: string) =>
    request<{ user: User }>(`/auth/login`, {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  register: (payload: { email: string; password: string; name: string; role: string; grade?: string }) =>
    request<{ user: User }>(`/auth/register`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  me: (userId: string) => request<{ user: User }>(`/auth/me?userId=${encodeURIComponent(userId)}`),

  changePassword: (payload: { email: string; newPassword: string }) =>
    request<{ message: string }>(`/auth/change-password`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),

  getExams: (params?: { status?: string; subject?: string; grade_level?: string; created_by?: string }) => {
    const qs = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value) qs.append(key, value)
      })
    }
    const suffix = qs.toString() ? `?${qs.toString()}` : ""
    return request<{ exams: ExamDTO[] }>(`/exams${suffix}`)
  },

  getExam: (id: string) => request<{ exam: ExamDTO }>(`/exams/${id}`),

  createExam: (payload: Partial<ExamDTO>) =>
    request<{ exam: ExamDTO }>(`/exams`, { method: "POST", body: JSON.stringify(payload) }),

  updateExam: (id: string, payload: Partial<ExamDTO>) =>
    request<{ message: string }>(`/exams/${id}`, { method: "PUT", body: JSON.stringify(payload) }),

  deleteExam: (id: string) => request<{ message: string }>(`/exams/${id}`, { method: "DELETE" }),

  createSubmission: (payload: {
    exam_id: string
    student_id: string
    answers: unknown
    score: number
    total_marks: number
    percentage: number
    time_taken: number
  }) => request<{ submission: SubmissionDTO }>(`/submissions`, { method: "POST", body: JSON.stringify(payload) }),

  getStudentSubmissions: (studentId: string) =>
    request<{ submissions: SubmissionDTO[] }>(`/submissions/student/${studentId}`),

  getExamSubmissions: (examId: string) => request<{ submissions: SubmissionDTO[] }>(`/submissions/exam/${examId}`),

  getSubmission: (id: string) => request<{ submission: SubmissionDTO }>(`/submissions/${id}`),

  getExamLeaderboard: (examId: string, limit = 10) =>
    request<{ leaderboard: LeaderboardEntry[] }>(`/leaderboard/exam/${examId}?limit=${limit}`),

  getGlobalLeaderboard: (params?: { limit?: number; subject?: string; grade_level?: string }) => {
    const qs = new URLSearchParams()
    if (params?.limit) qs.set("limit", String(params.limit))
    if (params?.subject) qs.set("subject", params.subject)
    if (params?.grade_level) qs.set("grade_level", params.grade_level)
    const suffix = qs.toString() ? `?${qs.toString()}` : ""
    return request<{ leaderboard: LeaderboardEntry[] }>(`/leaderboard/global${suffix}`)
  },

  resolveUserMapping: (params: { mockId?: string; backendId?: string; email?: string }) => {
    const qs = new URLSearchParams()
    if (params.mockId) qs.set("mockId", params.mockId)
    if (params.backendId) qs.set("backendId", params.backendId)
    if (params.email) qs.set("email", params.email)
    return request<{ success: boolean; mapping?: any; error?: string }>(`/user-mapping/resolve?${qs.toString()}`)
  },
}
