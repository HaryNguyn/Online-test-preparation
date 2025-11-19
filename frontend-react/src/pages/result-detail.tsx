import { useCallback, useEffect, useMemo, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import { useAuth } from "@/contexts/auth-context"
import { DashboardHeader } from "@/components/dashboard-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { api } from "@/lib/api"
import { mapExamToTest } from "@/lib/mappers"
import type { SubmissionDTO, Test, TestResult } from "@/lib/types"
import { normalizeAnswers } from "@/lib/utils"
import { Trophy, Clock, CheckCircle2, XCircle, ArrowLeft } from "lucide-react"

export function ResultDetailPage() {
  const { user, isLoading } = useAuth()
  const navigate = useNavigate()
  const { id: resultId } = useParams()

  const [result, setResult] = useState<TestResult | null>(null)
  const [test, setTest] = useState<Test | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoadingResult, setIsLoadingResult] = useState(true)

  const mapSubmissionToResult = useCallback((submission: SubmissionDTO, presetAnswers?: Array<number | number[] | string | null>): TestResult => {
    // Debug: log raw submission data
    console.log('Raw submission answers:', submission.answers, typeof submission.answers)
    
    const answersArray = (presetAnswers ?? normalizeAnswers(submission.answers)) as Array<number | number[] | string | null>

    // Preserve original answer types (number, number[], string, null)
    const normalizedAnswers = answersArray.map((answer) => {
      if (answer === null || answer === undefined) return null
      if (typeof answer === "number") return answer
      if (Array.isArray(answer)) return answer
      if (typeof answer === "string") return answer
      // Try to parse as number
      const parsed = Number.parseInt(String(answer), 10)
      return Number.isNaN(parsed) ? null : parsed
    })
    
    console.log('Normalized answers:', normalizedAnswers)

    const totalMarks = submission.total_marks ?? normalizedAnswers.length * 10
    const derivedQuestionCount = totalMarks && totalMarks > 0 ? Math.round(totalMarks / 10) : normalizedAnswers.length

    return {
      id: submission.id,
      userId: submission.student_id,
      testId: submission.exam_id,
      answers: normalizedAnswers as Array<number | number[] | string | null>,
      score: Number(submission.score) || 0,
      totalQuestions: derivedQuestionCount,
      timeTaken: Number(submission.time_taken) || 0,
      completedAt: submission.submitted_at,
    }
  }, [])

  useEffect(() => {
    if (!isLoading && !user) {
      navigate("/login", { replace: true })
    }
  }, [user, isLoading, navigate])

  useEffect(() => {
    if (!user || !resultId) return

    let mounted = true

    const loadResult = async () => {
      setIsLoadingResult(true)
      setError(null)
      try {
        const { submission } = await api.getSubmission(resultId)
        if (submission.student_id !== user.id) {
          navigate("/dashboard", { replace: true })
          return
        }

        const { exam } = await api.getExam(submission.exam_id)
        const mappedTest = mapExamToTest(exam)
        const normalizedAnswers = normalizeAnswers(submission.answers, exam.questions || [])
        const mappedResult = mapSubmissionToResult(submission, normalizedAnswers)

        if (mounted) {
          setResult(mappedResult)
          setTest(mappedTest)
          setIsLoadingResult(false)
          return
        }
      } catch (error) {
        console.error("Failed to load result from API:", error)
        if (mounted) {
          setError("Failed to load result. Please try again later.")
          setIsLoadingResult(false)
        }
      }
    }

    loadResult()

    return () => {
      mounted = false
    }
  }, [resultId, user, navigate, mapSubmissionToResult])

  // Helper function to check if answer is correct based on question type
  const isAnswerCorrect = useCallback((question: any, userAnswer: any): boolean => {
    if (userAnswer === undefined || userAnswer === null) {
      return false
    }

    const questionType = question.questionType || 'multiple_choice_single'
    
    // Normalize both answers to numbers for comparison
    const normalizeAnswer = (ans: any): any => {
      if (ans === null || ans === undefined) return null
      if (typeof ans === 'number') return ans
      if (Array.isArray(ans)) return ans.map(Number)
      const parsed = Number.parseInt(String(ans), 10)
      return Number.isNaN(parsed) ? ans : parsed
    }

    const normalizedUserAnswer = normalizeAnswer(userAnswer)
    const normalizedCorrectAnswer = normalizeAnswer(question.correctAnswer)
    
    if (questionType === 'multiple_choice_single') {
      // Single choice: compare numbers (handle string numbers too)
      const userNum = Number(normalizedUserAnswer)
      const correctNum = Number(normalizedCorrectAnswer)
      return !Number.isNaN(userNum) && !Number.isNaN(correctNum) && userNum === correctNum
    } else if (questionType === 'multiple_choice_multiple') {
      // Multiple choice: compare arrays
      if (Array.isArray(normalizedUserAnswer) && Array.isArray(normalizedCorrectAnswer)) {
        const sortedUser = [...normalizedUserAnswer].map(Number).sort((a, b) => a - b)
        const sortedCorrect = [...normalizedCorrectAnswer].map(Number).sort((a, b) => a - b)
        if (sortedUser.length !== sortedCorrect.length) return false
        return sortedUser.every((val, idx) => val === sortedCorrect[idx])
      }
      return false
    } else if (questionType === 'essay') {
      // Essay questions are graded manually, so we can't determine correctness here
      // Use score from backend instead
      return false
    }
    
    // Fallback: compare normalized values
    return normalizedUserAnswer === normalizedCorrectAnswer
  }, [])

  const stats = useMemo(() => {
    if (!result || !test) {
      return null
    }

    const total = test.questions.length || result.totalQuestions || result.answers.length || 1
    let correct = 0
    let incorrect = 0
    let skipped = 0

    // Calculate stats from questions if available
    if (test.questions.length > 0) {
      test.questions.forEach((question, index) => {
        const userAnswer = result.answers[index]
        
        // Debug logging (can be removed later)
        console.log(`Question ${index + 1}:`, {
          questionType: question.questionType,
          userAnswer,
          userAnswerType: typeof userAnswer,
          correctAnswer: question.correctAnswer,
          correctAnswerType: typeof question.correctAnswer,
          isCorrect: isAnswerCorrect(question, userAnswer)
        })
        
        // Check if answer was skipped
        if (userAnswer === undefined || userAnswer === null) {
          skipped += 1
          return
        }

        // Check if answer is correct based on question type
        if (isAnswerCorrect(question, userAnswer)) {
          correct += 1
        } else {
          incorrect += 1
        }
      })
      
      // If we calculated but got 0 correct when score > 0, there might be a mismatch
      // In that case, use score from backend as fallback
      if (correct === 0 && result.score > 0) {
        console.warn('Mismatch detected: calculated 0 correct but backend score > 0. Using backend score.')
        // Calculate from backend score (assuming 10 marks per question)
        const marksPerQuestion = 10
        const correctFromScore = Math.round(result.score / marksPerQuestion)
        const totalFromScore = result.totalQuestions || total
        correct = Math.min(correctFromScore, totalFromScore)
        incorrect = Math.max(0, totalFromScore - correct - skipped)
      }
    } else {
      // Fallback: use score from result if questions are not available
      // For essay questions or when questions are not loaded, use backend score
      const scoreFromBackend = result.score || 0
      const totalFromBackend = result.totalQuestions || total
      
      // If score is in marks (not count), we need to convert
      // Assuming each question is worth 10 marks by default
      const marksPerQuestion = 10
      correct = Math.round(scoreFromBackend / marksPerQuestion)
      incorrect = Math.max(0, totalFromBackend - correct)
    }

    return {
      totalQuestions: total,
      correctAnswers: correct,
      incorrectAnswers: incorrect,
      skippedAnswers: skipped,
    }
  }, [result, test, isAnswerCorrect])

  // Use stats if available (calculated from questions), otherwise fallback to result.score
  const totalQuestions = stats?.totalQuestions ?? result?.totalQuestions ?? 1
  // If we have stats, use the calculated correctAnswers count
  // Otherwise, if result.score is in marks, we need to convert to count
  // But prefer stats since it's more accurate
  const correctAnswers = stats?.correctAnswers ?? (result?.score ? Math.round(result.score / 10) : 0)
  const incorrectAnswers = stats 
    ? Math.max(0, stats.incorrectAnswers + stats.skippedAnswers) 
    : Math.max(0, totalQuestions - correctAnswers)
  
  // Calculate percentage from correctAnswers count, not from score
  const percentage = totalQuestions > 0 
    ? Math.min(100, Math.max(0, (correctAnswers / totalQuestions) * 100)) 
    : 0

  if (isLoading || isLoadingResult || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg text-muted-foreground">Loading...</div>
      </div>
    )
  }

  if (error || !result) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardHeader />
        <main className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="mb-4 text-lg font-medium text-destructive">{error || "Result not found"}</p>
              <Button asChild>
                <Link to="/results">Back to Results</Link>
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    )
  }

  if (!test) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardHeader />
        <main className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="mb-4 text-lg font-medium text-muted-foreground">Loading test information...</p>
            </CardContent>
          </Card>
        </main>
      </div>
    )
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}m ${secs}s`
  }

  const getPerformanceMessage = (score: number) => {
    if (score >= 90) return { message: "Outstanding!", color: "text-success" }
    if (score >= 75) return { message: "Great Job!", color: "text-success" }
    if (score >= 60) return { message: "Good Effort!", color: "text-primary" }
    if (score >= 40) return { message: "Keep Practicing!", color: "text-muted-foreground" }
    return { message: "Need More Practice", color: "text-destructive" }
  }

  const performance = getPerformanceMessage(percentage)

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />

      <main className="container mx-auto px-4 py-8">
        <Button asChild variant="ghost" size="sm" className="mb-6">
          <Link to="/results">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to All Results
          </Link>
        </Button>

        <div className="mb-8">
          <Card className="border-2">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-primary/10">
                <Trophy className="h-12 w-12 text-primary" />
              </div>
              <CardTitle className="text-3xl">{performance.message}</CardTitle>
              <CardDescription className="text-lg">{test?.title || "Test Result"}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-6 text-center">
                <div className={`text-6xl font-bold ${performance.color}`}>{percentage.toFixed(0)}%</div>
                <p className="mt-2 text-muted-foreground">
                  {correctAnswers} out of {totalQuestions} correct
                </p>
              </div>

              <Progress value={percentage} className="mb-6 h-3" />

              <div className="grid gap-4 md:grid-cols-3">
                <div className="flex items-center gap-3 rounded-lg border border-border p-4">
                  <CheckCircle2 className="h-8 w-8 text-success" />
                  <div>
                    <p className="text-2xl font-bold text-foreground">{correctAnswers}</p>
                    <p className="text-sm text-muted-foreground">Correct</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 rounded-lg border border-border p-4">
                  <XCircle className="h-8 w-8 text-destructive" />
                  <div>
                    <p className="text-2xl font-bold text-foreground">{incorrectAnswers}</p>
                    <p className="text-sm text-muted-foreground">Incorrect</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 rounded-lg border border-border p-4">
                  <Clock className="h-8 w-8 text-primary" />
                  <div>
                    <p className="text-2xl font-bold text-foreground">{formatTime(result.timeTaken)}</p>
                    <p className="text-sm text-muted-foreground">Time Taken</p>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <Button asChild className="flex-1">
                  <Link to="/dashboard" className="w-full">
                    Back to Dashboard
                  </Link>
                </Button>
                {test?.id && (
                  <Button
                    variant="outline"
                    className="flex-1 bg-transparent"
                    onClick={() => navigate(`/test/${test.id}`)}
                  >
                    Retake Test
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <h2 className="mb-4 text-2xl font-bold text-foreground">Answer Review</h2>
          {test.questions.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <p className="text-muted-foreground">No questions available for review.</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Score: {result.score} / {result.totalQuestions}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {test.questions.map((question, index) => {
              const userAnswer = result.answers[index]
              const isCorrect = isAnswerCorrect(question, userAnswer)
              const wasAnswered = userAnswer !== undefined && userAnswer !== null

              return (
                <Card key={index} className={`border-l-4 ${isCorrect ? "border-l-success" : "border-l-destructive"}`}>
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="mb-2 flex items-center gap-2">
                          <Badge variant="outline">Question {index + 1}</Badge>
                          {isCorrect ? (
                            <Badge className="bg-success text-success-foreground">
                              <CheckCircle2 className="mr-1 h-3 w-3" />
                              Correct
                            </Badge>
                          ) : (
                            <Badge variant="destructive">
                              <XCircle className="mr-1 h-3 w-3" />
                              {wasAnswered ? "Incorrect" : "Not Answered"}
                            </Badge>
                          )}
                        </div>
                        <CardTitle className="text-lg leading-relaxed">{question.question}</CardTitle>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {question.questionType === 'essay' ? (
                      <div className="space-y-3">
                        <div>
                          <p className="text-sm font-semibold text-muted-foreground mb-2">Your Answer:</p>
                          <div className="rounded-lg border border-border bg-muted/30 p-4 min-h-[100px]">
                            {(() => {
                              console.log(`Essay Q${index + 1} - userAnswer:`, userAnswer, typeof userAnswer)
                              if (userAnswer !== null && userAnswer !== undefined && String(userAnswer).trim()) {
                                return <p className="text-sm whitespace-pre-wrap leading-relaxed">{String(userAnswer)}</p>
                              }
                              return <p className="text-sm text-muted-foreground italic">No answer provided</p>
                            })()}
                          </div>
                        </div>
                        {!wasAnswered && (
                          <p className="text-sm text-destructive">This question was not answered.</p>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {question.options.map((option, optionIndex) => {
                          // Handle both single and multiple choice
                          const questionType = question.questionType || 'multiple_choice_single'
                          let isUserAnswer = false
                          let isCorrectAnswer = false
                          
                          if (questionType === 'multiple_choice_single') {
                            isUserAnswer = userAnswer === optionIndex
                            isCorrectAnswer = question.correctAnswer === optionIndex
                          } else if (questionType === 'multiple_choice_multiple') {
                            isUserAnswer = Array.isArray(userAnswer) && userAnswer.includes(optionIndex)
                            isCorrectAnswer = Array.isArray(question.correctAnswer) && question.correctAnswer.includes(optionIndex)
                          }

                          return (
                            <div
                              key={optionIndex}
                              className={`rounded-lg border p-3 ${
                                isCorrectAnswer
                                  ? "border-success bg-success/5"
                                  : isUserAnswer
                                    ? "border-destructive bg-destructive/5"
                                    : "border-border"
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                {isCorrectAnswer && <CheckCircle2 className="h-4 w-4 text-success" />}
                                {isUserAnswer && !isCorrectAnswer && <XCircle className="h-4 w-4 text-destructive" />}
                                <span className={isCorrectAnswer || isUserAnswer ? "font-medium" : ""}>{option}</span>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}

                    {question.explanation && (
                      <>
                        <Separator />
                        <div className="rounded-lg bg-muted p-4">
                          <p className="mb-1 text-sm font-semibold text-foreground">Explanation:</p>
                          <p className="text-sm leading-relaxed text-muted-foreground">{question.explanation}</p>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              )
            })}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
