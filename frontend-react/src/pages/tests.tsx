import { useCallback, useEffect, useMemo, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useAuth } from "@/contexts/auth-context"
import { DashboardHeader } from "@/components/dashboard-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { api } from "@/lib/api"
import { mapExamToTest } from "@/lib/mappers"
import type { SubmissionDTO, Test, TestResult } from "@/lib/types"
import { BookOpen, Clock, Trophy, Search, Filter, ArrowLeft } from "lucide-react"

export function TestsPage() {
  const { user, isLoading } = useAuth()
  const navigate = useNavigate()
  const [tests, setTests] = useState<Test[]>([])
  const [results, setResults] = useState<TestResult[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [subjectFilter, setSubjectFilter] = useState("all")
  const [gradeFilter, setGradeFilter] = useState("all")

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

    const loadData = async () => {
      try {
        const [examsRes, submissionsRes] = await Promise.all([api.getExams({ status: "published" }), api.getStudentSubmissions(user.id)])

        const mappedTests = examsRes.exams.map(mapExamToTest)
        const mappedResults = submissionsRes.submissions.map(mapSubmissionToResult)

        if (mounted) {
          setTests(mappedTests)
          setResults(mappedResults)
        }
      } catch (error) {
        console.error("Failed to load tests from API:", error)
      }
    }

    loadData()

    return () => {
      mounted = false
    }
  }, [user, mapSubmissionToResult])

  const filteredTests = useMemo(() => {
    return tests.filter((test) => {
      const matchesSearch =
        test.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        test.subject.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesSubject = subjectFilter === "all" || test.subject === subjectFilter
      const matchesGrade = gradeFilter === "all" || test.grade === gradeFilter
      return matchesSearch && matchesSubject && matchesGrade
    })
  }, [tests, searchQuery, subjectFilter, gradeFilter])

  const subjects = useMemo(() => Array.from(new Set(tests.map((test) => test.subject))), [tests])
  const grades = useMemo(() => Array.from(new Set(tests.map((test) => test.grade))), [tests])

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
              Quay lại Trang chính
            </Link>
          </Button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="mb-2 text-3xl font-bold text-foreground">Tất cả các bài kiểm tra</h1>
              <p className="text-muted-foreground">Duyệt và làm các bài kiểm tra thực hành</p>
            </div>
            <Badge variant="secondary" className="text-base">
              {filteredTests.length} bài kiểm tra
            </Badge>
          </div>
        </div>

        <div className="mb-6 flex flex-col gap-4 md:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search tests..."
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={subjectFilter} onValueChange={setSubjectFilter}>
            <SelectTrigger className="w-full md:w-[180px]">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Subject" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả các môn</SelectItem>
              {subjects.map((subject) => (
                <SelectItem key={subject} value={subject}>
                  {subject}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={gradeFilter} onValueChange={setGradeFilter}>
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="Grade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả các lớp</SelectItem>
              {grades.map((grade) => (
                <SelectItem key={grade} value={grade}>
                  {grade}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {filteredTests.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <BookOpen className="mb-4 h-12 w-12 text-muted-foreground" />
              <p className="text-lg font-medium text-foreground">Không tìm thấy bài kiểm tra</p>
              <p className="text-sm text-muted-foreground">Thử điều chỉnh bộ lọc của bạn</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredTests.map((test) => {
              const userResult = results.find((result) => result.testId === test.id)
              const hasCompleted = Boolean(userResult)

              return (
                <Card key={test.id} className="flex flex-col">
                  <CardHeader>
                    <div className="mb-2 flex items-start justify-between">
                      <Badge variant="secondary">{test.subject}</Badge>
                      {hasCompleted && <Badge className="bg-success text-success-foreground">Hoàn thành</Badge>}
                    </div>
                    <CardTitle className="text-lg">{test.title}</CardTitle>
                    <CardDescription className="line-clamp-2">{test.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1">
                    <div className="mb-4 space-y-2 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        <span>{test.duration} phút</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-4 w-4" />
                        <span>{test.questions.length} Câu hỏi</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Trophy className="h-4 w-4" />
                        <span>{test.grade}</span>
                      </div>
                    </div>
                    {hasCompleted && userResult && (() => {
                      // Calculate percentage correctly
                      const resultWithExtras = userResult as TestResult & { totalMarks?: number; percentage?: number }
                      let percentage = 0
                      
                      // Priority 1: Use percentage from backend if available and valid
                      if (resultWithExtras.percentage !== undefined && 
                          !Number.isNaN(resultWithExtras.percentage) && 
                          Number.isFinite(resultWithExtras.percentage)) {
                        percentage = resultWithExtras.percentage
                      } 
                      // Priority 2: Use totalMarks from test (most reliable)
                      else if (test.totalMarks && test.totalMarks > 0) {
                        percentage = (userResult.score / test.totalMarks) * 100
                      }
                      // Priority 3: Use totalMarks from result
                      else if (resultWithExtras.totalMarks && resultWithExtras.totalMarks > 0) {
                        percentage = (userResult.score / resultWithExtras.totalMarks) * 100
                      }
                      // Priority 4: Calculate from totalQuestions (assume 10 marks per question)
                      else if (userResult.totalQuestions > 0) {
                        const marksPerQuestion = 10
                        const totalMarks = userResult.totalQuestions * marksPerQuestion
                        percentage = totalMarks > 0 ? (userResult.score / totalMarks) * 100 : 0
                      }
                      // Fallback: can't calculate
                      else {
                        percentage = 0
                      }
                      
                      // Ensure percentage is between 0 and 100 and is valid
                      percentage = Math.min(100, Math.max(0, percentage))
                      if (Number.isNaN(percentage) || !Number.isFinite(percentage)) {
                        percentage = 0
                      }
                      
                      return (
                        <div className="mb-4 rounded-lg bg-muted p-3">
                          <p className="text-sm font-medium text-foreground">
                            Your Score: {percentage.toFixed(0)}%
                          </p>
                        </div>
                      )
                    })()}
                    <Button className="w-full" onClick={() => navigate(`/test/${test.id}`)}>
                      {hasCompleted ? "Retake Test" : "Start Test"}
                    </Button>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
