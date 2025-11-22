import { useCallback, useEffect, useMemo, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useAuth } from "@/contexts/auth-context"
import { DashboardHeader } from "@/components/dashboard-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { api } from "@/lib/api"
import { storage } from "@/lib/storage"
import type { SubmissionDTO, Test, TestResult } from "@/lib/types"
import { Trophy, Clock, BookOpen, TrendingUp, ArrowLeft, Calendar, Trash2 } from "lucide-react"
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
import { toast } from "@/hooks/use-toast"

export function ResultsPage() {
  const { user, isLoading } = useAuth()
  const navigate = useNavigate()
  const [results, setResults] = useState<TestResult[]>([])
  const [testsById, setTestsById] = useState<Record<string, Test>>({})
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const handleDeleteClick = (resultId: string) => {
    setDeletingId(resultId)
    setShowDeleteDialog(true)
  }

  const handleDeleteConfirm = async () => {
    if (!deletingId) return

    try {
      await api.deleteSubmission(deletingId)
      setResults(prev => prev.filter(r => r.id !== deletingId))
      toast({
        title: "Success",
        description: "Submission deleted successfully",
      })
    } catch (error) {
      console.error("Failed to delete submission:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete submission",
        variant: "destructive",
      })
    } finally {
      setShowDeleteDialog(false)
      setDeletingId(null)
    }
  }

  const mapSubmissionToResult = useCallback((submission: SubmissionDTO): TestResult & { totalMarks?: number; percentage?: number } => {
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
  }, [])

  useEffect(() => {
    if (!isLoading && !user) {
      navigate("/login", { replace: true })
    }
  }, [user, isLoading, navigate])

  useEffect(() => {
    if (!user) return

    let mounted = true

    const loadResults = async () => {
      try {
        const submissionsResponse = await api.getStudentSubmissions(user.id)
        const mappedResults = submissionsResponse.submissions.map(mapSubmissionToResult)

        const sortedResults = mappedResults.sort(
          (a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime(),
        )

        const examsMap: Record<string, Test> = {}
        for (const submission of submissionsResponse.submissions) {
          if (!examsMap[submission.exam_id]) {
            examsMap[submission.exam_id] = {
              id: submission.exam_id,
              title: submission.exam_title || "Exam",
              description: "",
              subject: submission.subject || "",
              grade: submission.grade_level || "",
              duration: 0,
              totalMarks: submission.total_marks || 0,
              questions: [],
              createdBy: "",
              createdAt: submission.submitted_at,
            }
          }
        }

        if (mounted) {
          setResults(sortedResults)
          setTestsById(examsMap)
          return
        }
      } catch (error) {
        console.error("Failed to load results from API:", error)
      }

      if (!mounted) return

      const localResults = storage
        .getResults()
        .filter((result) => result.userId === user.id)
        .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())

      const testsMap = storage.getTests().reduce<Record<string, Test>>((acc, test) => {
        acc[test.id] = test
        return acc
      }, {})

      setResults(localResults)
      setTestsById(testsMap)
    }

    loadResults()

    return () => {
      mounted = false
    }
  }, [user, mapSubmissionToResult])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}m ${secs}s`
  }

  const getPerformanceBadge = (percentage: number) => {
    if (percentage >= 90)
      return { label: "Excellent", variant: "default" as const, className: "bg-success text-success-foreground" }
    if (percentage >= 75)
      return { label: "Good", variant: "default" as const, className: "bg-success text-success-foreground" }
    if (percentage >= 60) return { label: "Average", variant: "secondary" as const, className: "" }
    return { label: "Needs Work", variant: "destructive" as const, className: "" }
  }

  const totalTests = results.length
  const getResultPercentage = (result: TestResult & { totalMarks?: number; percentage?: number }) => {
    // Use percentage from backend if available
    if (result.percentage !== undefined) {
      return Math.min(100, Math.max(0, result.percentage))
    }
    
    // Calculate percentage correctly - score is marks, not count
    if (result.totalMarks && result.totalMarks > 0) {
      const percentage = (result.score / result.totalMarks) * 100
      return Math.min(100, Math.max(0, percentage))
    }
    
    // Fallback: assume 10 marks per question
    const marksPerQuestion = 10
    const totalMarks = result.totalQuestions * marksPerQuestion
    if (!totalMarks || totalMarks === 0) return 0
    const percentage = (result.score / totalMarks) * 100
    return Math.min(100, Math.max(0, percentage))
  }
  const averageScore = useMemo(() => {
    if (totalTests === 0) return 0
    const sum = results.reduce((acc, result) => acc + getResultPercentage(result), 0)
    return sum / totalTests
  }, [results, totalTests])
  const bestScore = useMemo(() => {
    if (totalTests === 0) return 0
    return Math.max(...results.map(getResultPercentage))
  }, [results, totalTests])
  const totalTimeTaken = useMemo(() => results.reduce((acc, result) => acc + result.timeTaken, 0), [results])

  if (isLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg text-muted-foreground">Đang tải...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Button asChild variant="ghost" size="sm" className="mb-4">
            <Link to="/dashboard">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Quay lại trang chính
            </Link>
          </Button>
          <h1 className="mb-2 text-3xl font-bold text-foreground">Kết quả của tôi</h1>
          <p className="text-muted-foreground">Xem lịch sử bài kiểm tra và phân tích hiệu suất của bạn</p>
        </div>

        <div className="mb-8 grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tổng số bài kiểm tra</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalTests}</div>
              <p className="text-xs text-muted-foreground">Đã hoàn thành</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Điểm trung bình</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{averageScore.toFixed(0)}%</div>
              <p className="text-xs text-muted-foreground">Hiệu suất tổng thể</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Thành tích cao nhất</CardTitle>
              <Trophy className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{bestScore.toFixed(0)}%</div>
              <p className="text-xs text-muted-foreground">Thành tích cao nhất</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tổng thời gian</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{Math.floor(totalTimeTaken / 60)}m</div>
              <p className="text-xs text-muted-foreground">Thời gian học</p>
            </CardContent>
          </Card>
        </div>

        <div>
          <h2 className="mb-4 text-xl font-bold text-foreground">Lịch sử bài kiểm tra</h2>
          {results.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <BookOpen className="mb-4 h-12 w-12 text-muted-foreground" />
                <p className="mb-2 text-lg font-medium text-foreground">Chưa có kết quả nào</p>
                <p className="mb-4 text-sm text-muted-foreground">Hãy làm bài kiểm tra đầu tiên để xem kết quả tại đây</p>
                <Button asChild>
                  <Link to="/tests">Duyệt các bài kiểm tra</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {results.map((result) => {
                const test = testsById[result.testId]
                if (!test) return null

                const resultWithExtras = result as TestResult & { totalMarks?: number; percentage?: number }
                // Calculate percentage correctly
                let percentage = 0
                if (resultWithExtras.percentage !== undefined) {
                  percentage = resultWithExtras.percentage
                } else if (resultWithExtras.totalMarks && resultWithExtras.totalMarks > 0) {
                  percentage = (result.score / resultWithExtras.totalMarks) * 100
                } else {
                  // Fallback: assume 10 marks per question
                  const marksPerQuestion = 10
                  const totalMarks = result.totalQuestions * marksPerQuestion
                  percentage = totalMarks > 0 ? (result.score / totalMarks) * 100 : 0
                }
                percentage = Math.min(100, Math.max(0, percentage))
                const performanceBadge = getPerformanceBadge(percentage)

                return (
                  <Card key={result.id}>
                    <CardHeader>
                      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="mb-2 flex flex-wrap items-center gap-2">
                            <Badge variant="secondary">{test.subject}</Badge>
                            <Badge className={performanceBadge.className} variant={performanceBadge.variant}>
                              {performanceBadge.label}
                            </Badge>
                          </div>
                          <CardTitle className="mb-1 text-xl break-words">{test.title}</CardTitle>
                          <CardDescription className="flex items-center gap-2">
                            <Calendar className="h-3 w-3 flex-shrink-0" />
                            {formatDate(result.completedAt)}
                          </CardDescription>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className="text-3xl font-bold text-primary">{percentage.toFixed(0)}%</div>
                          <p className="text-sm text-muted-foreground whitespace-nowrap">
                            {result.score}/{resultWithExtras.totalMarks || result.totalQuestions * 10} điểm
                          </p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            <span>{formatTime(result.timeTaken)}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <BookOpen className="h-4 w-4" />
                            <span>{test.questions.length} câu hỏi</span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button asChild variant="outline" size="sm">
                            <Link to={`/result/${result.id}`}>Xem chi tiết</Link>
                          </Button>
                          <Button size="sm" onClick={() => navigate(`/test/${test.id}`)}>
                            Làm lại
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleDeleteClick(result.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      </main>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa bài nộp?</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa bài nộp này? Hành động này không thể hoàn tác và sẽ xóa kết quả của bạn khỏi bảng xếp hạng.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
