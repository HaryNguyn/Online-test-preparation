import { useCallback, useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { useAuth } from "@/contexts/auth-context"
import { DashboardHeader } from "@/components/dashboard-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { api } from "@/lib/api"
import { mapExamToTest } from "@/lib/mappers"
import type { Test } from "@/lib/types"
import { Clock, CheckCircle2, AlertCircle } from "lucide-react"

export function TestDetailPage() {
  const { user, isLoading } = useAuth()
  const navigate = useNavigate()
  const { id: testId } = useParams()

  const [test, setTest] = useState<Test | null>(null)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  // answers can be number (single), number[] (multiple), string (essay) or null
  const [answers, setAnswers] = useState<Array<number | number[] | string | null>>([])
  const [timeRemaining, setTimeRemaining] = useState(0)
  const [isStarted, setIsStarted] = useState(false)
  const [showSubmitDialog, setShowSubmitDialog] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [dataSource, setDataSource] = useState<"backend" | "local">("backend")

  useEffect(() => {
    if (!isLoading && !user) {
      navigate("/login", { replace: true })
    }
  }, [user, isLoading, navigate])

  useEffect(() => {
    if (!testId) return

    let mounted = true

    const loadTest = async () => {
      try {
        const { exam } = await api.getExam(testId)
        const mapped = mapExamToTest(exam)
        const durationMinutes = Number(mapped.duration) || Math.max(mapped.questions.length * 2, 1)

        if (mounted) {
          setTest(mapped)
          setDataSource("backend")
          // initialize answers as nulls
          setAnswers(new Array(mapped.questions.length).fill(null))
          setTimeRemaining(durationMinutes * 60)
        }
        return
      } catch (error) {
        console.error("Failed to load exam from API:", error)
      }

      // Fallback to local storage is removed to simplify and rely on the API.
      // If API fails, an error should be shown.
    }

    loadTest()

    return () => {
      mounted = false
    }
  }, [testId, navigate])

  const handleSubmit = useCallback(async (currentTime: number) => {
    if (!test || !user || isSubmitting) return

    setShowSubmitDialog(false)
    setIsSubmitting(true)

  // Auto-grade objective questions (single & multiple choice). Essays remain pending.
  let calculatedScore = 0
    for (let i = 0; i < test.questions.length; i++) {
      const q = test.questions[i] as any
      const studentAnswer = answers[i]
      const questionMarks = (q as any).marks || 10; // Default to 10 if not set
      
      if (q.questionType === 'essay') {
        // essays are graded manually; skip from auto-grading
        continue
      }

      if (q.questionType === 'multiple_choice_single') {
        if (typeof studentAnswer === 'number' && typeof q.correctAnswer === 'number' && studentAnswer === q.correctAnswer) {
          calculatedScore += questionMarks
        }
      } else if (q.questionType === 'multiple_choice_multiple') {
        if (Array.isArray(studentAnswer) && Array.isArray(q.correctAnswer)) {
          const sortedStudent = [...studentAnswer].map(Number).sort()
          const sortedCorrect = [...q.correctAnswer].map(Number).sort()
          if (JSON.stringify(sortedStudent) === JSON.stringify(sortedCorrect)) {
            calculatedScore += questionMarks
          }
        }
      }
    }

    const totalQuestions = test.questions.length
    if (totalQuestions === 0) {
      window.alert("This test has no questions to submit.")
      return
    }
  const durationMinutes = Number(test.duration)
  const effectiveDurationMinutes = durationMinutes > 0 ? durationMinutes : Math.max(totalQuestions * 2, 1)
  const plannedDurationSeconds = effectiveDurationMinutes * 60
    const timeTaken = Math.max(0, plannedDurationSeconds - currentTime)
  const totalMarks = test.totalMarks || (totalQuestions * 10)
  const percentage = totalMarks > 0 ? Math.round((calculatedScore / totalMarks) * 100) : 0

    if (dataSource === "backend") {
      try {
        console.log(' Submitting answers:', answers)
        console.log(' Answer types:', answers.map((a, i) => ({ index: i, type: typeof a, value: a })))
        
        const { submission } = await api.createSubmission({
          exam_id: test.id,
          student_id: user.id,
          answers,
          score: calculatedScore,
          total_marks: totalMarks,
          percentage,
          time_taken: timeTaken,
        })
        
        console.log('✅ Submission response:', submission)
        // Small delay to ensure submission is saved before redirect
        await new Promise(resolve => setTimeout(resolve, 100))
        navigate(`/result/${submission.id}`, { replace: true })
        return
      } catch (error) {
        console.error("Failed to submit via API:", error)
        setIsSubmitting(false)
        window.alert("Could not submit test to the server. Please check your connection and try again.")
        return
      }
    }

    // Fallback logic removed for clarity. The primary path is via API.
    setIsSubmitting(false)
    window.alert("Could not submit test to the server. Please check your connection and try again.")
  }, [answers, dataSource, navigate, test, user, isSubmitting])

  useEffect(() => {
    if (!isStarted) return

    const timer = setInterval(() => {
      setTimeRemaining((previous) => {
        if (previous <= 1) { // Auto-submit when time is up
          clearInterval(timer)
          handleSubmit(0)
          return 0
        }
        return previous - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [isStarted, handleSubmit])

  const handleStartTest = () => {
    setIsStarted(true)
  }

  const handleAnswerChange = (questionIndex: number, answerIndex: number) => {
    const newAnswers = [...answers]
    newAnswers[questionIndex] = answerIndex
    setAnswers(newAnswers)
  }

  const handleMultiToggle = (questionIndex: number, optionIndex: number) => {
    const newAnswers = [...answers]
    const current = newAnswers[questionIndex]
    if (!Array.isArray(current)) {
      newAnswers[questionIndex] = [optionIndex]
    } else {
      if (current.includes(optionIndex)) {
        newAnswers[questionIndex] = current.filter((v) => v !== optionIndex)
      } else {
        newAnswers[questionIndex] = [...current, optionIndex]
      }
    }
    setAnswers(newAnswers)
  }

  const handleEssayChange = (questionIndex: number, text: string) => {
    const newAnswers = [...answers]
    newAnswers[questionIndex] = text
    setAnswers(newAnswers)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  } 

  const answeredCount = answers.filter((answer) => answer !== -1).length
  const progress = test ? (answeredCount / test.questions.length) * 100 : 0

  if (isLoading || !user || !test) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg text-muted-foreground">Đang tải...</div>
      </div>
    )
  }

  if (test.questions.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardHeader />
        <main className="container mx-auto flex items-center justify-center px-4 py-8">
          <Card className="w-full max-w-md text-center">
            <CardHeader>
              <CardTitle>Không tìm thấy câu hỏi nào</CardTitle>
              <CardDescription>Bài kiểm tra này chưa có câu hỏi nào. Vui lòng quay lại sau.</CardDescription>
            </CardHeader>
          </Card>
        </main>
      </div>
    )
  }

  if (!isStarted) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardHeader />
        <main className="container mx-auto px-4 py-8">
          <div className="mx-auto max-w-2xl">
            <Card>
              <CardHeader>
                <Badge variant="secondary" className="mb-2 w-fit">
                  {test.subject}
                </Badge>
                <CardTitle className="text-2xl">{test.title}</CardTitle>
                <CardDescription>{test.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between rounded-lg border border-border p-4">
                    <span className="text-sm font-medium text-foreground">Thời lượng</span>
                    <span className="text-sm text-muted-foreground">{test.duration} phút</span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-border p-4">
                    <span className="text-sm font-medium text-foreground">Câu hỏi</span>
                    <span className="text-sm text-muted-foreground">{test.questions.length}</span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-border p-4">
                    <span className="text-sm font-medium text-foreground">Tổng điểm</span>
                    <span className="text-sm text-muted-foreground">{test.totalMarks}</span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-border p-4">
                    <span className="text-sm font-medium text-foreground">Lớp</span>
                    <span className="text-sm text-muted-foreground">{test.grade}</span>
                  </div>
                </div>

                <div className="rounded-lg bg-muted p-4">
                  <h3 className="mb-2 font-semibold text-foreground">Hướng dẫn:</h3>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li>• Trả lời tất cả các câu hỏi một cách tốt nhất có thể</li>
                    <li>• Bạn có thể điều hướng giữa các câu hỏi bằng cách sử dụng bảng câu hỏi</li>
                    <li>• Bộ đếm thời gian sẽ bắt đầu khi bạn nhấn "Bắt đầu bài kiểm tra"</li>
                    <li>• Bài kiểm tra sẽ tự động gửi khi hết thời gian</li>
                    <li>• Bạn có thể xem lại câu trả lời trước khi gửi</li>
                  </ul>
                </div>

                <div className="flex gap-3">
                  <Button onClick={handleStartTest} className="flex-1">
                    Bắt đầu bài kiểm tra
                  </Button>
                  <Button variant="outline" onClick={() => navigate("/dashboard", { replace: true })}>
                    Hủy
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    )
  }

  const currentQuestion = test.questions[currentQuestionIndex]

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />

      <div className="sticky top-16 z-40 border-b border-border bg-card">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                <span className={`text-lg font-semibold ${timeRemaining < 60 ? "text-destructive" : "text-foreground"}`}>
                  {formatTime(timeRemaining)}
                </span>
              </div>
              <div className="text-sm text-muted-foreground">
                Question {currentQuestionIndex + 1} of {test.questions.length}
              </div>
            </div>
            <Button onClick={() => setShowSubmitDialog(true)} disabled={isSubmitting}>
              {isSubmitting ? "Submitting..." : "Submit Test"}
            </Button>
          </div>
        </div>
      </div>

      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
          <div className="space-y-6">
            <Card>
              <CardContent className="pt-6">
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="font-medium text-foreground">
                    {answeredCount} / {test.questions.length} answered
                  </span>
                </div>
                <Progress value={progress} className="h-2" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="mb-2 flex items-center justify-between">
                  <Badge variant="outline">Question {currentQuestionIndex + 1}</Badge>
                  {answers[currentQuestionIndex] !== -1 && (
                    <Badge className="bg-success text-success-foreground">
                      <CheckCircle2 className="mr-1 h-3 w-3" />
                      Answered
                    </Badge>
                  )}
                </div>
                <CardTitle className="text-lg leading-relaxed">{currentQuestion.question}</CardTitle>
                {(currentQuestion as any).imageUrl && (
                  <div className="mt-4">
                    <img
                      src={(currentQuestion as any).imageUrl}
                      alt="Question visual aid"
                      className="max-w-full rounded-lg border"
                    />
                  </div>
                )}
                {(currentQuestion as any).audioUrl && (
                  <div className="mt-4">
                    <audio controls src={(currentQuestion as any).audioUrl} className="w-full">Your browser does not support the audio element.</audio>
                  </div>
                )}
              </CardHeader>
              <CardContent>
                {/* Render by question type */}
                {currentQuestion.questionType === 'multiple_choice_single' && (
                  <RadioGroup
                    value={typeof answers[currentQuestionIndex] === 'number' ? String(answers[currentQuestionIndex]) : undefined}
                    onValueChange={(value) => handleAnswerChange(currentQuestionIndex, Number(value))}
                    className="space-y-3"
                  >
                    {currentQuestion.options.map((option, index) => (
                      <Label
                        key={index}
                        htmlFor={`option-${index}`}
                        className={`flex items-center space-x-3 rounded-lg border p-4 transition-colors cursor-pointer ${
                          answers[currentQuestionIndex] === index
                            ? "border-primary bg-primary/5"
                            : "border-border hover:bg-muted/50"
                        }`}
                      >
                        <RadioGroupItem value={index.toString()} id={`option-${index}`} />
                        <span className="flex-1 text-base">{option}</span>
                      </Label>
                    ))}
                  </RadioGroup>
                )}

                {currentQuestion.questionType === 'multiple_choice_multiple' && (
                  <div className="space-y-3">
                    {currentQuestion.options.map((option, index) => (
                      <label key={index} className={`flex items-center space-x-3 rounded-lg border p-4 transition-colors cursor-pointer ${Array.isArray(answers[currentQuestionIndex]) && (answers[currentQuestionIndex] as number[]).includes(index) ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/50'}`}>
                        <input 
                          type="checkbox" 
                          id={`multi-${currentQuestionIndex}-${index}`}
                          name={`multi-${currentQuestionIndex}`}
                          checked={Array.isArray(answers[currentQuestionIndex]) && (answers[currentQuestionIndex] as number[]).includes(index)} 
                          onChange={() => handleMultiToggle(currentQuestionIndex, index)} 
                        />
                        <span className="flex-1 text-base">{option}</span>
                      </label>
                    ))}
                  </div>
                )}

                {currentQuestion.questionType === 'essay' && (
                  <div className="space-y-2">
                    <Textarea 
                      id={`essay-${currentQuestionIndex}`}
                      name={`essay-${currentQuestionIndex}`}
                      value={(answers[currentQuestionIndex] as string) || ""} 
                      onChange={(e: any) => handleEssayChange(currentQuestionIndex, e.target.value)} 
                      placeholder="Write your essay answer here..." 
                      className="min-h-[200px]"
                    />
                    <p className="text-sm text-muted-foreground">This answer will be graded manually by a teacher.</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                onClick={() => setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))}
                disabled={currentQuestionIndex === 0}
              >
                Previous
              </Button>
              <Button
                onClick={() => setCurrentQuestionIndex((prev) => Math.min(test.questions.length - 1, prev + 1))}
                disabled={currentQuestionIndex === test.questions.length - 1}
              >
                Next
              </Button>
            </div>
          </div>

          <div className="lg:sticky lg:top-32 lg:h-fit">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Question Palette</CardTitle>
                <CardDescription>Click to navigate</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-5 gap-2">
                  {test.questions.map((_, index) => (
                    <Button
                      key={index}
                      variant={currentQuestionIndex === index ? "default" : "outline"}
                      size="sm"
                      className={`h-10 w-full ${
                        answers[index] !== -1 && currentQuestionIndex !== index ? "border-success text-success" : ""
                      }`}
                      onClick={() => setCurrentQuestionIndex(index)}
                    >
                      {answers[index] !== -1 ? <CheckCircle2 className="h-4 w-4" /> : index + 1}
                    </Button>
                  ))}
                </div>

                <div className="mt-4 space-y-2 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 rounded border-2 border-success bg-success/10" />
                    <span className="text-muted-foreground">Answered</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 rounded border-2 border-border" />
                    <span className="text-muted-foreground">Not Answered</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 rounded bg-primary" />
                    <span className="text-muted-foreground">Current</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <AlertDialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Submit Test?</AlertDialogTitle>
            <AlertDialogDescription>
              {answeredCount < test.questions.length ? (
                <>
                  <div className="flex items-start gap-2 text-destructive mb-2">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>
                      You have answered {answeredCount} out of {test.questions.length} questions. {" "}
                      {test.questions.length - answeredCount} questions are unanswered.
                    </span>
                  </div>
                  <span className="text-foreground">Are you sure you want to submit?</span>
                </>
              ) : (
                "You have answered all questions. Are you sure you want to submit your test?"
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Review Answers</AlertDialogCancel> 
            <AlertDialogAction onClick={() => handleSubmit(timeRemaining)} disabled={isSubmitting}>
              {isSubmitting ? "Submitting..." : "Submit Test"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
