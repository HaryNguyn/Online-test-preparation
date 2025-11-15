export type UserRole = "student" | "teacher" | "parent" | "admin"

export interface User {
  id: string
  email: string
  password?: string
  name: string
  role: UserRole
  grade?: string
  createdAt: string
}

export interface Question {
  id: string
  question: string
  options: string[]
  correctAnswer: number | number[] | null
  questionType?: 'multiple_choice_single' | 'multiple_choice_multiple' | 'essay'
  marks?: number
  explanation?: string
  difficulty?: "easy" | "medium" | "hard"
  topic?: string
}

export interface ExamQuestionDTO {
  id: string
  question_text: string
  options?: unknown
  correct_answer?: number | number[] | null
  explanation?: string | null
  question_type?: 'multiple_choice_single' | 'multiple_choice_multiple' | 'essay' | null
  marks?: number | null
  order_number?: number | null
  image_url?: string | null
  audio_url?: string | null
}

export interface ExamDTO {
  id: string
  title: string
  description?: string | null
  subject?: string | null
  grade_level?: string | null
  duration: number
  total_marks?: number | null
  passing_marks?: number | null
  status?: string | null
  created_by: string
  created_at: string
  questions?: ExamQuestionDTO[] | null
}

export interface SubmissionDTO {
  id: string
  exam_id: string
  student_id: string
  answers: unknown
  score: number
  total_marks?: number | null
  time_taken?: number | null
  percentage?: number | null
  submitted_at: string
  exam_title?: string | null
  subject?: string | null
  grade_level?: string | null
}

export interface Test {
  id: string
  title: string
  description: string
  subject: string
  grade: string
  duration: number
  totalMarks: number
  questions: Question[]
  createdBy: string
  createdAt: string
}

export interface TestResult {
  id: string
  userId: string
  testId: string
  answers: number[]
  score: number
  totalQuestions: number
  timeTaken: number
  completedAt: string
}

export interface LeaderboardEntry {
  userId: string
  userName: string
  score: number
  timeTaken: number
  completedAt: string
}
