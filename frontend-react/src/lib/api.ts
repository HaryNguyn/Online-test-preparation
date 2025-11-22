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

  changePassword: (payload: { userId: string; currentPassword: string; newPassword: string }) =>
    request<{ message: string }>(`/auth/change-password`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),

  confirmResetPassword: (payload: { token: string; newPassword: string }) =>
    request<{ message: string }>(`/auth/confirm-reset-password`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  forgotPassword: (payload: { email: string; newPassword: string }) =>
    request<{ message: string }>(`/auth/forgot-password`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  updateProfile: (userId: string, payload: { name?: string; avatar_url?: string | null; grade?: string }) =>
    request<{ message: string; user: User }>(`/users/${userId}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),

  uploadFile: (file: File): Promise<{ url: string }> => {
    const formData = new FormData()
    formData.append("file", file)
    return fetch(`${API_BASE}/upload`, {
      method: "POST",
      body: formData,
      credentials: "include",
    }).then(async (res) => {
      if (!res.ok) {
        const error = await res.json().catch(() => ({ error: `HTTP ${res.status}` }))
        throw new Error(error.error || `HTTP ${res.status}`)
      }
      return res.json()
    })
  },

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

  getPendingSubmissions: (examId?: string) => {
    const suffix = examId ? `?exam_id=${examId}` : ""
    return request<{ submissions: SubmissionDTO[] }>(`/submissions/pending${suffix}`)
  },

  gradeSubmission: (id: string, payload: { essay_scores: Record<number, number>; graded_by: string }) =>
    request<{ message: string; submission: SubmissionDTO }>(`/submissions/${id}/grade`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),

  deleteSubmission: (id: string) =>
    request<{ message: string }>(`/submissions/${id}`, { method: "DELETE" }),

  // Video APIs
  getVideos: (params?: { subject?: string; grade_level?: string; created_by?: string }) => {
    const qs = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value) qs.append(key, value)
      })
    }
    const suffix = qs.toString() ? `?${qs.toString()}` : ""
    return request<{ videos: import("./types").VideoDTO[] }>(`/videos${suffix}`)
  },

  getVideo: (id: string) => request<{ video: import("./types").VideoDTO }>(`/videos/${id}`),

  createVideo: (payload: Partial<import("./types").VideoDTO>) =>
    request<{ video: import("./types").VideoDTO }>(`/videos`, { method: "POST", body: JSON.stringify(payload) }),

  updateVideo: (id: string, payload: Partial<import("./types").VideoDTO>) =>
    request<{ message: string }>(`/videos/${id}`, { method: "PUT", body: JSON.stringify(payload) }),

  deleteVideo: (id: string) => request<{ message: string }>(`/videos/${id}`, { method: "DELETE" }),

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
