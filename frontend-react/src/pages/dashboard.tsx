import { useEffect, useMemo, useState, useCallback } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useAuth } from "@/contexts/auth-context"
// import { ExamMenu } from "@/components/exam-menu"
import { DashboardHeader } from "@/components/dashboard-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { api } from "@/lib/api"
import { mapExamToTest } from "@/lib/mappers"
import type { Test, TestResult, SubmissionDTO } from "@/lib/types"
import { BookOpen, Clock, Trophy, TrendingUp, Search, Filter } from "lucide-react"

type DashboardResult = TestResult & { totalMarks?: number; percentage?: number }

export function DashboardPage() {
  const { user, isLoading } = useAuth()
  const navigate = useNavigate()
  const [tests, setTests] = useState<Test[]>([])
  const [results, setResults] = useState<DashboardResult[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [subjectFilter, setSubjectFilter] = useState("all")
  const [gradeFilter, setGradeFilter] = useState("all")

  const mapSubmissionToResult = useCallback((sub: SubmissionDTO): DashboardResult => {
    const answersArray = Array.isArray(sub.answers)
      ? sub.answers
      : sub.answers && typeof sub.answers === "object"
        ? Object.values(sub.answers)
        : []

    return {
      id: sub.id,
      userId: sub.student_id,
      testId: sub.exam_id,
      answers: answersArray as DashboardResult["answers"],
      score: Number(sub.score) || 0,
      // totalQuestions is not used for percentage on dashboard; keep a sane fallback
      totalQuestions: answersArray.length || 0,
      timeTaken: Number(sub.time_taken) || 0,
      completedAt: sub.submitted_at,
      totalMarks: sub.total_marks ?? undefined,
      percentage: sub.percentage !== null && sub.percentage !== undefined ? Number(sub.percentage) : undefined,
    }
  }, [])

  const getResultPercentage = useCallback((result: DashboardResult): number => {
    // Ưu tiên dùng percentage từ backend nếu có
    if (result.percentage !== undefined) {
      return Math.min(100, Math.max(0, result.percentage))
    }

    // Nếu có totalMarks thì tính theo điểm / tổng điểm
    if (result.totalMarks && result.totalMarks > 0) {
      const percentage = (result.score / result.totalMarks) * 100
      return Math.min(100, Math.max(0, percentage))
    }

    // Fallback: giả sử mỗi câu 10 điểm
    const marksPerQuestion = 10
    const totalMarks = result.totalQuestions * marksPerQuestion
    if (!totalMarks || totalMarks === 0) return 0
    const percentage = (result.score / totalMarks) * 100
    return Math.min(100, Math.max(0, percentage))
  }, [])

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        navigate("/login", { replace: true })
      } else if (user.role === "admin") {
        navigate("/admin", { replace: true }) 
      } else if (user.role === "teacher") {
        navigate("/teacher", { replace: true })
      }
    }
  }, [user, isLoading, navigate])

  useEffect(() => {
    if (user && (user.role === "student" || user.role === "parent")) {      
      const loadData = async () => {
        try {
          const [examsRes, submissionsRes] = await Promise.all([
            api.getExams({ status: "published" }),
            api.getStudentSubmissions(user.id)
          ])
          setTests(examsRes.exams.map(mapExamToTest))
          setResults(submissionsRes.submissions.map(mapSubmissionToResult))
        } catch (error) {
          console.error("Failed to load dashboard data:", error)
        }
      }
      loadData()
    }
  }, [user, mapSubmissionToResult])

  const stats = useMemo(() => {
    const totalTestsTaken = results.length
    const percentages = results.map((result) => getResultPercentage(result))
    const averageScore =
      percentages.length > 0
        ? Math.round(percentages.reduce((acc, value) => acc + value, 0) / percentages.length)
        : 0
    const bestScore = percentages.length > 0 ? Math.max(...percentages) : 0

    return { totalTestsTaken, averageScore, bestScore }
  }, [results, getResultPercentage])

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

  if (isLoading || !user || user.role === "admin" || user.role === "teacher") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg text-muted-foreground">Loading...</div>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen bg-background">
      {/* <ExamMenu /> */}
      <DashboardHeader />

      <main className="container mx-auto px-4 py-8 pt-24">
        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-bold text-foreground">Chào Mừng, {user.name}!</h1>
          <p className="text-muted-foreground">Luyện tập để cùng đạt kết quả cáo nhé ^.^</p>
        </div>

        <div className="mb-8 grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Số bài kiểm tra</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalTestsTaken}</div>
              <p className="text-xs text-muted-foreground">đã làm</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Điểm trung bình</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.averageScore}%</div>
              <p className="text-xs text-muted-foreground">Trung bình tất cả các bài kiểm tra</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Điểm cao nhất</CardTitle>
              <Trophy className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.bestScore.toFixed(0)}%</div>
              <p className="text-xs text-muted-foreground">Điểm cao nhất của bạn</p>
            </CardContent>
          </Card>
        </div>

        <div className="mb-8 flex flex-wrap items-center gap-4">
          <Button asChild>
            <Link to="/tests">
              <BookOpen className="mr-2 h-4 w-4" />
              Bài kiểm tra
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/leaderboard">
              <Trophy className="mr-2 h-4 w-4" />
              Bảng xếp hạng
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/results">
              <TrendingUp className="mr-2 h-4 w-4" />
              Kết quả của tôi
            </Link>
          </Button>
        </div>

        <div>
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-foreground">Bài kiểm tra hiện có</h2>
            <Badge variant="secondary">{filteredTests.length} tests</Badge>
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
                <SelectItem value="all">Môn học</SelectItem>
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
                        {hasCompleted && <Badge className="bg-success text-success-foreground">hoàn thành</Badge>}
                      </div>
                      <CardTitle className="text-lg">{test.title}</CardTitle>
                      <CardDescription className="line-clamp-2">{test.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1">
                      <div className="mb-4 space-y-2 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          <span>{test.duration} minutes</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <BookOpen className="h-4 w-4" />
                          <span>{test.questions.length} câu hỏi</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Trophy className="h-4 w-4" />
                          <span>{test.grade}</span>
                        </div>
                      </div>
                      {hasCompleted && userResult && (
                        <div className="mb-4 rounded-lg bg-muted p-3">
                          <p className="text-sm font-medium text-foreground">
                            Điểm của bạn: {getResultPercentage(userResult).toFixed(0)}%
                          </p>
                        </div>
                      )}
                      <Button className="w-full" onClick={() => navigate(`/test/${test.id}`)}>
                        {hasCompleted ? "Làm lại bài kiểm tra" : "Bắt đầu bài kiểm tra"}
                      </Button>
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
