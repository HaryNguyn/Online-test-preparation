import { useEffect, useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { api } from "@/lib/api"
import { useAuth } from "@/contexts/auth-context"
import { DashboardHeader } from "@/components/dashboard-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import type { ExamDTO, ExamQuestionDTO, SubmissionDTO } from "@/lib/types"
import { CheckCircle2, Clock, FileText, Save, ArrowLeft } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { normalizeAnswers } from "@/lib/utils"

export default function TeacherGrading() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const submissionId = searchParams.get("id")

  const [submission, setSubmission] = useState<SubmissionDTO | null>(null)
  const [exam, setExam] = useState<ExamDTO | null>(null)
  const [questions, setQuestions] = useState<ExamQuestionDTO[]>([])
  const [essayScores, setEssayScores] = useState<Record<number, number>>({})
  const [studentAnswers, setStudentAnswers] = useState<Array<number | number[] | string | null>>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (user?.role !== "teacher") {
      navigate("/")
      return
    }

    if (!submissionId) {
      navigate("/teacher")
      return
    }

    loadSubmission()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submissionId, user, navigate])

  const loadSubmission = async () => {
    if (!submissionId) {
      console.error("No submission ID provided")
      navigate("/teacher")
      return
    }
    
    try {
      setLoading(true)
      console.log("Loading submission:", submissionId)
      
      const { submission: sub } = await api.getSubmission(submissionId)
      console.log("Submission loaded:", sub)
      
      if (!sub) {
        throw new Error("Submission not found")
      }
      
      setSubmission(sub)

      console.log("Loading exam:", sub.exam_id)
      const { exam: examData } = await api.getExam(sub.exam_id)
      console.log("Exam loaded:", examData)
      
      if (!examData) {
        throw new Error("Exam not found")
      }
      
      setExam(examData)
      const questionList = examData.questions || []
      setQuestions(questionList)

      console.log('🔍 Raw submission.answers:', sub.answers)
      console.log('📋 Questions count:', questionList.length)
      const normalized = normalizeAnswers(sub.answers, questionList)
      console.log('✅ Normalized answers:', normalized)
      setStudentAnswers(normalized)

      // Initialize essay scores with current partial scores if exists
      if (sub.partial_scores) {
        try {
          const scores = typeof sub.partial_scores === "string" 
            ? JSON.parse(sub.partial_scores) 
            : sub.partial_scores
          setEssayScores(scores)
          console.log("Partial scores initialized:", scores)
        } catch (e) {
          console.error("Failed to parse partial scores:", e)
        }
      }
    } catch (error) {
      console.error("Failed to load submission:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to load submission",
        variant: "destructive",
      })
      setTimeout(() => navigate("/teacher"), 2000)
    } finally {
      setLoading(false)
    }
  }

  const handleScoreChange = (questionIndex: number, score: string) => {
    const numScore = parseFloat(score)
    const question = questions[questionIndex]
    const maxMarks = question?.marks ?? 10

    if (isNaN(numScore) || numScore < 0 || numScore > maxMarks) {
      return
    }

    setEssayScores((prev) => ({
      ...prev,
      [questionIndex]: numScore,
    }))
  }

  const handleSubmit = async () => {
    if (!submission || !user) return

    // Validate all essay questions have scores
    const essayQuestions = questions.filter((q) => q.question_type === "essay")
    const missingScores = essayQuestions.some((_, idx) => {
      const questionIndex = questions.findIndex((q) => q === essayQuestions[idx])
      return essayScores[questionIndex] === undefined || essayScores[questionIndex] === null
    })

    if (missingScores) {
      toast({
        title: "Missing Scores",
        description: "Please provide scores for all essay questions",
        variant: "destructive",
      })
      return
    }

    try {
      setSubmitting(true)
      await api.gradeSubmission(submission.id, {
        essay_scores: essayScores,
        graded_by: user.id,
      })

      toast({
        title: "Success",
        description: "Submission graded successfully",
      })

      navigate("/teacher")
    } catch (error) {
      console.error("Failed to grade submission:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to grade submission",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardHeader />
        <div className="flex items-center justify-center min-h-[calc(100vh-80px)]">
          <div className="text-center">
            <Clock className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading submission...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!submission || !exam) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardHeader />
        <div className="container max-w-4xl py-8">
          <Alert variant="destructive">
            <AlertDescription>
              Submission not found. Redirecting to teacher dashboard...
            </AlertDescription>
          </Alert>
        </div>
      </div>
    )
  }

  const essayQuestions = questions.filter((q) => q.question_type === "essay")
  console.log("Essay questions found:", essayQuestions.length)
  console.log(" All questions:", questions.map((q, i) => ({ idx: i, type: q.question_type, text: q.question_text?.substring(0, 50) })))
  console.log(" Student answers array:", studentAnswers)
  console.log(" Student answers detail:", studentAnswers.map((a, i) => ({ idx: i, type: typeof a, value: typeof a === 'string' ? a.substring(0, 100) : a })))

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      <div className="container max-w-5xl py-8">
        <Button variant="ghost" onClick={() => navigate("/teacher")} className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Pending Submissions
        </Button>

        <Card className="mb-6">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-2xl mb-2">{exam.title}</CardTitle>
              <CardDescription className="space-y-1">
                <div>Student: <strong>{submission.student_name || "Unknown"}</strong></div>
                <div>Submitted: {new Date(submission.submitted_at).toLocaleString()}</div>
                <div>Time taken: {submission.time_taken ? `${Math.floor(submission.time_taken / 60)}m ${submission.time_taken % 60}s` : 'N/A'}</div>
              </CardDescription>
            </div>
            <Badge
              variant={submission.grading_status === "completed" ? "default" : "secondary"}
            >
              {submission.grading_status === "completed"
                ? "Graded"
                : submission.grading_status === "pending_manual"
                  ? "Pending Manual"
                  : "Pending"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold">{submission.score ?? 0}</div>
              <div className="text-sm text-muted-foreground">Current Score</div>
            </div>
            <div>
              <div className="text-2xl font-bold">{submission.total_marks ?? 0}</div>
              <div className="text-sm text-muted-foreground">Total Marks</div>
            </div>
            <div>
              <div className="text-2xl font-bold">
                {submission.percentage != null ? Number(submission.percentage).toFixed(1) : 0}%
              </div>
              <div className="text-sm text-muted-foreground">Percentage</div>
            </div>
          </div>
        </CardContent>
      </Card>

        {essayQuestions.length === 0 ? (
          <Alert>
            <AlertDescription>This submission has no essay questions to grade.</AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Essay Questions
            </h2>

            {questions.map((question, idx) => {
              if (question.question_type !== "essay") return null

              const studentAnswer = studentAnswers[idx]
              console.log(` Question ${idx + 1} (essay):`, {
                questionText: question.question_text?.substring(0, 50),
                answerType: typeof studentAnswer,
                answerValue: typeof studentAnswer === 'string' ? studentAnswer.substring(0, 100) : studentAnswer,
                answerLength: typeof studentAnswer === 'string' ? studentAnswer.length : 'N/A'
              })
              const maxMarks = question.marks ?? 10
              const currentScore = essayScores[idx]

              return (
                <Card key={idx}>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      Question {idx + 1} ({maxMarks} marks)
                    </CardTitle>
                    <CardDescription>{question.question_text}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-base font-semibold mb-2">Student's Answer:</p>
                      <div className="bg-muted p-4 rounded-md min-h-[100px] whitespace-pre-wrap">
                        {studentAnswer && String(studentAnswer).trim() ? (
                          String(studentAnswer)
                        ) : (
                          <span className="text-muted-foreground italic">No answer provided</span>
                        )}
                      </div>
                    </div>

                    <Separator />

                    <div className="grid gap-2">
                      <Label htmlFor={`score-${idx}`} className="text-base font-semibold">
                        Score (0 - {maxMarks})
                      </Label>
                      <div className="flex gap-2 items-center">
                        <Input
                          id={`score-${idx}`}
                          name={`score-${idx}`}
                          type="number"
                          min="0"
                          max={maxMarks}
                          step="0.5"
                          value={currentScore ?? ""}
                          onChange={(e) => handleScoreChange(idx, e.target.value)}
                          className="max-w-[150px]"
                          placeholder="Enter score"
                        />
                        <span className="text-muted-foreground">/ {maxMarks}</span>
                        {currentScore !== undefined && currentScore !== null && (
                          <CheckCircle2 className="h-5 w-5 text-green-600" />
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => navigate("/teacher")}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={submitting}>
                <Save className="mr-2 h-4 w-4" />
                {submitting ? "Saving..." : "Submit Grades"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
