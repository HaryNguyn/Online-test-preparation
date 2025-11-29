import type { ExamDTO, SubmissionDTO, Test, TestResult } from "@/lib/types"

/**
 * Maps an ExamDTO from the API to a Test object for the frontend.
 * This function robustly handles various formats for question options.
 */
export const mapExamToTest = (exam: ExamDTO): Test => {
  const questions = (exam.questions ?? []).map((question, index) => {
    let options: string[] = []
    if (typeof question.options === "string") {
      try {
        const parsed = JSON.parse(question.options)
        if (Array.isArray(parsed)) {
          options = parsed.map(String)
        } else if (parsed && typeof parsed === "object") {
          options = Object.values(parsed).map(String)
        }
      } catch {
        options = [] // Invalid JSON
      }
    } else if (Array.isArray(question.options)) {
      options = question.options.map(String)
    } else if (question.options && typeof question.options === "object") {
      options = Object.values(question.options).map(String)
    }

    // Determine correct answer shape based on question type
    let correctAnswer: number | number[] | null = null
    if (question.question_type === 'multiple_choice_single') {
      correctAnswer = Number.isInteger(question.correct_answer) ? Number(question.correct_answer) : 0
    } else if (question.question_type === 'multiple_choice_multiple') {
      if (Array.isArray(question.correct_answer)) {
        correctAnswer = question.correct_answer.map(Number)
      } else {
        try {
          const parsed = JSON.parse(String(question.correct_answer ?? '[]'))
          correctAnswer = Array.isArray(parsed) ? parsed.map(Number) : []
        } catch {
          correctAnswer = []
        }
      }
    } else if (question.question_type === 'essay') {
      correctAnswer = null
    } else {
      // Fallback to single
      correctAnswer = Number.isInteger(question.correct_answer) ? Number(question.correct_answer) : 0
    }

    return {
      id: question.id || String(index + 1),
      question: question.question_text,
      options,
      correctAnswer,
      questionType: (question.question_type as any) || 'multiple_choice_single',
      marks: question.marks || 10,
      explanation: question.explanation ?? undefined,
      imageUrl: (question as any).image_url || undefined,
      audioUrl: (question as any).audio_url || undefined,
    }
  })

  const totalMarks = exam.total_marks ?? (questions.length > 0 ? questions.length * 10 : 100)

  return {
    id: exam.id,
    title: exam.title,
    description: exam.description || "",
    subject: exam.subject || "",
    grade: exam.grade_level || "",
    duration: Number(exam.duration) || 0,
    totalMarks,
    questions,
    createdBy: exam.created_by,
    createdAt: exam.created_at,
    shuffleQuestions: exam.shuffle_questions || false,
    shuffleOptions: exam.shuffle_options || false,
  }
}

/**
 * Maps a SubmissionDTO from the API to a TestResult object for the frontend.
 */
export const mapSubmissionToResult = (_submission: SubmissionDTO): TestResult => {
  // This function is provided for completeness but is not the focus of the fix.
  // The existing logic in result-detail.tsx and tests.tsx for this is likely sufficient.
  // You can move that logic here as well for consistency.
  // For now, we will focus on mapExamToTest.
  return {} as TestResult // Placeholder
}