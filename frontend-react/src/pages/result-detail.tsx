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
import { Trophy, Clock, CheckCircle2, XCircle, ArrowLeft } from "lucide-react"

export function ResultDetailPage() {
  const { user, isLoading } = useAuth()
  const navigate = useNavigate()
  const { id: resultId } = useParams()

  const [result, setResult] = useState<TestResult | null>(null)
  const [test, setTest] = useState<Test | null>(null)

  const mapSubmissionToResult = useCallback((submission: SubmissionDTO): TestResult => {
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
      try {
        const { submission } = await api.getSubmission(resultId)
        if (submission.student_id !== user.id) {
          navigate("/dashboard", { replace: true })
          return
        }

        const mappedResult = mapSubmissionToResult(submission)
        const { exam } = await api.getExam(submission.exam_id)
        const mappedTest = mapExamToTest(exam)

        if (mounted) {
          setResult(mappedResult)
          setTest(mappedTest)
          return
        }
      } catch (error) {
        console.error("Failed to load result from API:", error)
      }

      // Fallback logic to local storage removed for consistency and reliance on API
    }

    loadResult()

    return () => {
      mounted = false
    }
  }, [resultId, user, navigate, mapSubmissionToResult])

  const stats = useMemo(() => {
    if (!result || !test) {
      return null
    }

    const total = test.questions.length || result.totalQuestions || result.answers.length
    let correct = 0
    let incorrect = 0
    let skipped = 0

    test.questions.forEach((question, index) => {
      const userAnswer = result.answers[index]
      if (userAnswer === undefined || userAnswer === null || userAnswer === -1) {
        skipped += 1
        return
      }

      if (userAnswer === question.correctAnswer) {
        correct += 1
      } else {
        incorrect += 1
      }
    })

    return {
      totalQuestions: total,
      correctAnswers: correct,
      incorrectAnswers: incorrect,
      skippedAnswers: skipped,
    }
  }, [result, test])

  const totalQuestions = stats?.totalQuestions ?? 0
  const correctAnswers = stats?.correctAnswers ?? 0
  const incorrectAnswers = stats ? Math.max(0, stats.incorrectAnswers + stats.skippedAnswers) : 0
  const percentage = totalQuestions ? Math.min(100, Math.max(0, (correctAnswers / totalQuestions) * 100)) : 0

  if (isLoading || !user || !result || !test || !stats) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg text-muted-foreground">Loading...</div>
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
              <CardDescription className="text-lg">{test.title}</CardDescription>
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
                <Button
                  variant="outline"
                  className="flex-1 bg-transparent"
                  onClick={() => navigate(`/test/${test.id}`)}
                >
                  Retake Test
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <h2 className="mb-4 text-2xl font-bold text-foreground">Answer Review</h2>
          <div className="space-y-4">
            {test.questions.map((question, index) => {
              const userAnswer = result.answers[index]
              const isCorrect = userAnswer === question.correctAnswer
              const wasAnswered = userAnswer !== undefined && userAnswer !== null && userAnswer !== -1

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
                    <div className="space-y-2">
                      {question.options.map((option, optionIndex) => {
                        const isUserAnswer = userAnswer === optionIndex
                        const isCorrectAnswer = question.correctAnswer === optionIndex

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
        </div>
      </main>
    </div>
  )
}
