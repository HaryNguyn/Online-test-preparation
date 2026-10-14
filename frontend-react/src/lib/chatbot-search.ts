import { api } from "./api"
import { mapExamToTest } from "./mappers"
import type { Test, VideoDTO, TestResult, SubmissionDTO, LeaderboardEntry } from "./types"

export interface SearchResult {
  type: "test" | "video" | "result" | "leaderboard"
  data: Test | VideoDTO | TestResult | LeaderboardEntry
}

export interface SearchResponse {
  tests?: Test[]
  videos?: VideoDTO[]
  results?: TestResult[]
  leaderboard?: LeaderboardEntry[]
  userRank?: number
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
    
    // Enhanced subject mapping with synonyms
    const subjectMap: { [key: string]: string } = {
      "toán": "Toán",
      "toan": "Toán",
      "math": "Toán",
      "văn": "Văn",
      "van": "Văn",
      "ngữ văn": "Văn",
      "ngu van": "Văn",
      "literature": "Văn",
      "anh": "Anh",
      "tiếng anh": "Anh",
      "tieng anh": "Anh",
      "english": "Anh",
      "lý": "Lý",
      "ly": "Lý",
      "vật lý": "Lý",
      "vat ly": "Lý",
      "physics": "Lý",
      "hóa": "Hóa",
      "hoa": "Hóa",
      "hóa học": "Hóa",
      "hoa hoc": "Hóa",
      "chemistry": "Hóa",
      "sinh": "Sinh",
      "sinh học": "Sinh",
      "sinh hoc": "Sinh",
      "biology": "Sinh",
      "sử": "Sử",
      "su": "Sử",
      "lịch sử": "Sử",
      "lich su": "Sử",
      "history": "Sử",
      "địa": "Địa",
      "dia": "Địa",
      "địa lý": "Địa",
      "dia ly": "Địa",
      "geography": "Địa",
    }
    
    const grades = ["6", "7", "8", "9", "10", "11", "12"]

    // Extract subject
    for (const [key, value] of Object.entries(subjectMap)) {
      if (lowerQuery.includes(key)) {
        params.subject = value
        break
      }
    }

    // Extract grade with more patterns
    for (const grade of grades) {
      if (
        lowerQuery.includes(`lớp ${grade}`) || 
        lowerQuery.includes(`khối ${grade}`) ||
        lowerQuery.includes(`${grade}`) && /\d/.test(grade)
      ) {
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
    
    // Enhanced subject mapping with synonyms (same as tests)
    const subjectMap: { [key: string]: string } = {
      "toán": "Toán",
      "toan": "Toán",
      "math": "Toán",
      "văn": "Văn",
      "van": "Văn",
      "ngữ văn": "Văn",
      "ngu van": "Văn",
      "literature": "Văn",
      "anh": "Anh",
      "tiếng anh": "Anh",
      "tieng anh": "Anh",
      "english": "Anh",
      "lý": "Lý",
      "ly": "Lý",
      "vật lý": "Lý",
      "vat ly": "Lý",
      "physics": "Lý",
      "hóa": "Hóa",
      "hoa": "Hóa",
      "hóa học": "Hóa",
      "hoa hoc": "Hóa",
      "chemistry": "Hóa",
      "sinh": "Sinh",
      "sinh học": "Sinh",
      "sinh hoc": "Sinh",
      "biology": "Sinh",
      "sử": "Sử",
      "su": "Sử",
      "lịch sử": "Sử",
      "lich su": "Sử",
      "history": "Sử",
      "địa": "Địa",
      "dia": "Địa",
      "địa lý": "Địa",
      "dia ly": "Địa",
      "geography": "Địa",
    }
    
    const grades = ["6", "7", "8", "9", "10", "11", "12"]

    // Extract subject
    for (const [key, value] of Object.entries(subjectMap)) {
      if (lowerQuery.includes(key)) {
        params.subject = value
        break
      }
    }

    // Extract grade with more patterns
    for (const grade of grades) {
      if (
        lowerQuery.includes(`lớp ${grade}`) || 
        lowerQuery.includes(`khối ${grade}`) ||
        lowerQuery.includes(`${grade}`) && /\d/.test(grade)
      ) {
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
 * Search for leaderboard and find user's rank
 */
export async function searchLeaderboard(
  query: string,
  userId?: string
): Promise<{ leaderboard: LeaderboardEntry[]; userRank?: number }> {
  try {
    const lowerQuery = query.toLowerCase()
    
    console.log("🔍 searchLeaderboard called with:", { query, userId })
    
    // Enhanced subject mapping (same as tests/videos)
    const subjectMap: { [key: string]: string } = {
      "toán": "Toán",
      "toan": "Toán",
      "math": "Toán",
      "văn": "Văn",
      "van": "Văn",
      "ngữ văn": "Văn",
      "ngu van": "Văn",
      "literature": "Văn",
      "anh": "Anh",
      "tiếng anh": "Anh",
      "tieng anh": "Anh",
      "english": "Anh",
      "lý": "Lý",
      "ly": "Lý",
      "vật lý": "Lý",
      "vat ly": "Lý",
      "physics": "Lý",
      "hóa": "Hóa",
      "hoa": "Hóa",
      "hóa học": "Hóa",
      "hoa hoc": "Hóa",
      "chemistry": "Hóa",
      "sinh": "Sinh",
      "sinh học": "Sinh",
      "sinh hoc": "Sinh",
      "biology": "Sinh",
      "sử": "Sử",
      "su": "Sử",
      "lịch sử": "Sử",
      "lich su": "Sử",
      "history": "Sử",
      "địa": "Địa",
      "dia": "Địa",
      "địa lý": "Địa",
      "dia ly": "Địa",
      "geography": "Địa",
    }
    
    const grades = ["6", "7", "8", "9", "10", "11", "12"]
    
    // Build params
    const params: { limit?: number; subject?: string; grade_level?: string } = {
      limit: 100, // Get top 100 to find user's rank
    }
    
    // Extract subject
    for (const [key, value] of Object.entries(subjectMap)) {
      if (lowerQuery.includes(key)) {
        params.subject = value
        break
      }
    }
    
    // Extract grade
    for (const grade of grades) {
      if (
        lowerQuery.includes(`lớp ${grade}`) || 
        lowerQuery.includes(`khối ${grade}`) ||
        lowerQuery.includes(`${grade}`) && /\d/.test(grade)
      ) {
        params.grade_level = grade
        break
      }
    }
    
    console.log("📊 API params:", params)
    
    const response = await api.getGlobalLeaderboard(params)
    console.log("✅ API response:", response)
    
    const leaderboard = response.leaderboard || []
    console.log("📋 Leaderboard entries:", leaderboard.length)
    
    // Find user's rank if userId provided
    let userRank: number | undefined
    if (userId && leaderboard.length > 0) {
      const userIndex = leaderboard.findIndex(entry => entry.userId === userId)
      if (userIndex !== -1) {
        userRank = userIndex + 1 // Rank starts from 1
        console.log("🎯 User rank found:", userRank)
      } else {
        console.log("⚠️ User not found in leaderboard")
      }
    }
    
    return {
      leaderboard: leaderboard.slice(0, 10), // Return top 10 for display
      userRank,
    }
  } catch (error) {
    console.error("❌ Error searching leaderboard:", error)
    return { leaderboard: [] }
  }
}

/**
 * Unified search function that searches all types
 */
export async function searchAll(
  query: string,
  userId?: string
): Promise<SearchResponse> {
  const lowerQuery = query.toLowerCase()
  
  console.log("🔎 searchAll called with:", { query, userId })
  
  // Check if it's a leaderboard query
  const isLeaderboardQuery = /bảng xếp hạng|xếp hạng|leaderboard|ranking|top|hạng|rank/i.test(lowerQuery)
  
  console.log("🎯 Is leaderboard query?", isLeaderboardQuery)
  
  if (isLeaderboardQuery) {
    // Only search leaderboard
    console.log("📊 Searching leaderboard...")
    const { leaderboard, userRank } = await searchLeaderboard(query, userId)
    console.log("✅ Leaderboard search result:", { count: leaderboard.length, userRank })
    return {
      leaderboard,
      userRank,
    }
  }
  
  // Normal search for tests, videos, results
  console.log("🔍 Searching tests, videos, results...")
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

