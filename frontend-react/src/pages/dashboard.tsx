import { useEffect, useMemo, useState } from "react"
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
import type { Test, TestResult } from "@/lib/types"
import { BookOpen, Clock, Trophy, TrendingUp, Search, Filter } from "lucide-react"

export function DashboardPage() {
  const { user, isLoading } = useAuth()
  const navigate = useNavigate()
  const [tests, setTests] = useState<Test[]>([])
  const [results, setResults] = useState<TestResult[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [subjectFilter, setSubjectFilter] = useState("all")
  const [gradeFilter, setGradeFilter] = useState("all")

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
          ]);
          setTests(examsRes.exams.map(mapExamToTest));
          setResults(submissionsRes.submissions.map(sub => ({
            id: sub.id,
            userId: sub.student_id,
            testId: sub.exam_id,
            answers: Array.isArray(sub.answers) ? sub.answers : [],
            score: sub.score,
            totalQuestions: (sub.total_marks ?? 0) / 10,
            timeTaken: sub.time_taken ?? 0,
            completedAt: sub.submitted_at
          } as TestResult)));
        } catch (error) {
          console.error("Failed to load dashboard data:", error);
        }
      };
      loadData();
    }
  }, [user])

  const stats = useMemo(() => {
    const totalTestsTaken = results.length
    const averageScore =
      results.length > 0
        ? Math.round(results.reduce((acc, result) => acc + (result.score / result.totalQuestions) * 100, 0) / results.length)
        : 0
    const bestScore =
      results.length > 0 ? Math.max(...results.map((result) => (result.score / result.totalQuestions) * 100)) : 0

    return { totalTestsTaken, averageScore, bestScore }
  }, [results])

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
          <h1 className="mb-2 text-3xl font-bold text-foreground">Welcome back, {user.name}!</h1>
          <p className="text-muted-foreground">Track your progress and continue your learning journey</p>
        </div>

        <div className="mb-8 grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tests Taken</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalTestsTaken}</div>
              <p className="text-xs text-muted-foreground">Total completed tests</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Score</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.averageScore}%</div>
              <p className="text-xs text-muted-foreground">Across all tests</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Best Score</CardTitle>
              <Trophy className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.bestScore.toFixed(0)}%</div>
              <p className="text-xs text-muted-foreground">Your highest score</p>
            </CardContent>
          </Card>
        </div>

        <div className="mb-8 flex flex-wrap items-center gap-4">
          <Button asChild>
            <Link to="/tests">
              <BookOpen className="mr-2 h-4 w-4" />
              Browse All Tests
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/leaderboard">
              <Trophy className="mr-2 h-4 w-4" />
              View Leaderboard
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/results">
              <TrendingUp className="mr-2 h-4 w-4" />
              My Results
            </Link>
          </Button>
        </div>

        <div>
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-foreground">Available Tests</h2>
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
                <SelectItem value="all">All Subjects</SelectItem>
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
                <SelectItem value="all">All Grades</SelectItem>
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
                <p className="text-lg font-medium text-foreground">No tests found</p>
                <p className="text-sm text-muted-foreground">Try adjusting your filters</p>
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
                        {hasCompleted && <Badge className="bg-success text-success-foreground">Completed</Badge>}
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
                          <span>{test.questions.length} questions</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Trophy className="h-4 w-4" />
                          <span>{test.grade}</span>
                        </div>
                      </div>
                      {hasCompleted && userResult && (
                        <div className="mb-4 rounded-lg bg-muted p-3">
                          <p className="text-sm font-medium text-foreground">
                            Your Score: {((userResult.score / userResult.totalQuestions) * 100).toFixed(0)}%
                          </p>
                        </div>
                      )}
                      <Button className="w-full" onClick={() => navigate(`/test/${test.id}`)}>
                        {hasCompleted ? "Retake Test" : "Start Test"}
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
