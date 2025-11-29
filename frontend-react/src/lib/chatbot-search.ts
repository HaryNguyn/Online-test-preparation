import { api } from "./api"
import { mapExamToTest } from "./mappers"
import type { Test, VideoDTO, TestResult, SubmissionDTO } from "./types"

export interface SearchResult {
  type: "test" | "video" | "result"
  data: Test | VideoDTO | TestResult
}

export interface SearchResponse {
  tests?: Test[]
  videos?: VideoDTO[]
  results?: TestResult[]
  message?: string
}

/**
 * Search for tests based on query
 */
export async function searchTests(
  query: string,
  userId?: string
): Promise<Test[]> {
  try {
    const params: { status?: string; subject?: string; grade_level?: string } = {
      status: "published",
    }

    // Try to extract subject or grade from query
    const lowerQuery = query.toLowerCase()
    const subjects = ["toán", "văn", "anh", "lý", "hóa", "sinh", "sử", "địa"]
    const grades = ["6", "7", "8", "9", "10", "11", "12"]

    for (const subject of subjects) {
      if (lowerQuery.includes(subject)) {
        params.subject = subject.charAt(0).toUpperCase() + subject.slice(1)
        break
      }
    }

    for (const grade of grades) {
      if (lowerQuery.includes(`lớp ${grade}`) || lowerQuery.includes(`khối ${grade}`)) {
        params.grade_level = grade
        break
      }
    }

    const response = await api.getExams(params)
    const tests = response.exams.map(mapExamToTest)

    // Filter by query if it's not a subject/grade search
    if (!params.subject && !params.grade_level) {
      return tests.filter(
        (test) =>
          test.title.toLowerCase().includes(lowerQuery) ||
          test.description.toLowerCase().includes(lowerQuery) ||
          test.subject.toLowerCase().includes(lowerQuery)
      )
    }

    return tests
  } catch (error) {
    console.error("Error searching tests:", error)
    return []
  }
}

/**
 * Search for videos based on query
 */
export async function searchVideos(
  query: string,
  userId?: string
): Promise<VideoDTO[]> {
  try {
    const params: { subject?: string; grade_level?: string; created_by?: string } = {}

    // Try to extract subject or grade from query
    const lowerQuery = query.toLowerCase()
    const subjects = ["toán", "văn", "anh", "lý", "hóa", "sinh", "sử", "địa"]
    const grades = ["6", "7", "8", "9", "10", "11", "12"]

    for (const subject of subjects) {
      if (lowerQuery.includes(subject)) {
        params.subject = subject.charAt(0).toUpperCase() + subject.slice(1)
        break
      }
    }

    for (const grade of grades) {
      if (lowerQuery.includes(`lớp ${grade}`) || lowerQuery.includes(`khối ${grade}`)) {
        params.grade_level = grade
        break
      }
    }

    const response = await api.getVideos(params)
    let videos = response.videos

    // Filter by query if it's not a subject/grade search
    if (!params.subject && !params.grade_level) {
      videos = videos.filter(
        (video) =>
          video.title.toLowerCase().includes(lowerQuery) ||
          (video.description && video.description.toLowerCase().includes(lowerQuery)) ||
          (video.subject && video.subject.toLowerCase().includes(lowerQuery))
      )
    }

    return videos
  } catch (error) {
    console.error("Error searching videos:", error)
    return []
  }
}

/**
 * Search for results based on query
 */
export async function searchResults(
  query: string,
  userId: string
): Promise<TestResult[]> {
  try {
    const response = await api.getStudentSubmissions(userId)
    
    const mapSubmissionToResult = (submission: SubmissionDTO): TestResult & { totalMarks?: number; percentage?: number } => {
      const answersArray = Array.isArray(submission.answers)
        ? submission.answers
        : submission.answers && typeof submission.answers === "object"
          ? Object.values(submission.answers)
          : []

      const normalizedAnswers = answersArray.map((answer) => {
        if (typeof answer === "number") return answer
        const parsed = Number.parseInt(String(answer), 10)
        return Number.isNaN(parsed) ? -1 : parsed
      })

      const totalMarks = submission.total_marks ?? normalizedAnswers.length * 10
      const derivedQuestionCount = totalMarks && totalMarks > 0 ? Math.round(totalMarks / 10) : normalizedAnswers.length

      return {
        id: submission.id,
        userId: submission.student_id,
        testId: submission.exam_id,
        answers: normalizedAnswers,
        score: Number(submission.score) || 0,
        totalQuestions: derivedQuestionCount,
        timeTaken: Number(submission.time_taken) || 0,
        completedAt: submission.submitted_at,
        totalMarks: totalMarks,
        percentage: submission.percentage ? Number(submission.percentage) : undefined,
      }
    }

    const results = response.submissions.map(mapSubmissionToResult)

    // Filter by query
    const lowerQuery = query.toLowerCase()
    return results.filter((result) => {
      // We'll need to fetch exam details to match by title, but for now just return all
      // In a real implementation, you'd want to join with exam data
      return true
    })
  } catch (error) {
    console.error("Error searching results:", error)
    return []
  }
}

/**
 * Unified search function that searches all types
 */
export async function searchAll(
  query: string,
  userId?: string
): Promise<SearchResponse> {
  const [tests, videos, results] = await Promise.all([
    searchTests(query, userId),
    searchVideos(query, userId),
    userId ? searchResults(query, userId) : Promise.resolve([]),
  ])

  return {
    tests: tests.slice(0, 5), // Limit to 5 results per type
    videos: videos.slice(0, 5),
    results: results.slice(0, 5),
  }
}

