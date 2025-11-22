import { useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { useAuth } from "@/contexts/auth-context"
import { DashboardHeader } from "@/components/dashboard-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { api } from "@/lib/api"
import type { LeaderboardEntry } from "@/lib/types"
import { Trophy, Medal, Award, ArrowLeft, Clock } from "lucide-react"

export function LeaderboardPage() {
  const { user, isLoading } = useAuth()
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [subjectFilter, setSubjectFilter] = useState<string>("all")
  const [gradeFilter, setGradeFilter] = useState<string>("all")
  const [isLoadingLeaderboard, setIsLoadingLeaderboard] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isLoading && !user) {
      // Will be handled by ProtectedRoute
      return
    }
  }, [user, isLoading])

  useEffect(() => {
    if (!user) return

    const loadLeaderboard = async () => {
      setIsLoadingLeaderboard(true)
      setError(null)
      try {
        const params: { limit?: number; subject?: string; grade_level?: string } = {
          limit: 100,
        }
        if (subjectFilter !== "all") {
          params.subject = subjectFilter
        }
        if (gradeFilter !== "all") {
          params.grade_level = gradeFilter
        }
        const response = await api.getGlobalLeaderboard(params)
        setLeaderboard(response.leaderboard || [])
      } catch (err) {
        console.error("Failed to load leaderboard:", err)
        setError("Failed to load leaderboard. Please try again later.")
      } finally {
        setIsLoadingLeaderboard(false)
      }
    }

    loadLeaderboard()
  }, [user, subjectFilter, gradeFilter])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}m ${secs}s`
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
  }

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="h-6 w-6 text-yellow-500" />
    if (rank === 2) return <Medal className="h-6 w-6 text-gray-400" />
    if (rank === 3) return <Award className="h-6 w-6 text-amber-600" />
    return null
  }

  const getRankBadgeColor = (rank: number) => {
    if (rank === 1) return "bg-yellow-500/20 text-yellow-500 border-yellow-500"
    if (rank === 2) return "bg-gray-400/20 text-gray-400 border-gray-400"
    if (rank === 3) return "bg-amber-600/20 text-amber-600 border-amber-600"
    return "bg-muted text-muted-foreground border-border"
  }

  // Get unique subjects and grades from leaderboard
  const subjects = useMemo(() => {
    const subjectSet = new Set<string>()
    leaderboard.forEach((entry) => {
      if ((entry as any).subject) {
        subjectSet.add((entry as any).subject)
      }
    })
    return Array.from(subjectSet).sort()
  }, [leaderboard])

  const grades = useMemo(() => {
    const gradeSet = new Set<string>()
    leaderboard.forEach((entry) => {
      if ((entry as any).grade_level) {
        gradeSet.add((entry as any).grade_level)
      }
    })
    return Array.from(gradeSet).sort()
  }, [leaderboard])

  if (isLoading || isLoadingLeaderboard) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg text-muted-foreground">Loading...</div>
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
              Quay lại trang
            </Link>
          </Button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="mb-2 text-3xl font-bold text-foreground">Bảng xếp hạng</h1>
              <p className="text-muted-foreground">Top xếp hạng đạt điểm cao</p>
            </div>
            <Badge variant="secondary" className="text-base">
              {leaderboard.length} mục
            </Badge>
          </div>
        </div>

        <div className="mb-6 flex flex-col gap-4 md:flex-row">
          {subjects.length > 0 && (
            <Select value={subjectFilter} onValueChange={setSubjectFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Subject" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả môn học</SelectItem>
                {subjects.map((subject) => (
                  <SelectItem key={subject} value={subject}>
                    {subject}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {grades.length > 0 && (
            <Select value={gradeFilter} onValueChange={setGradeFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Grade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả khối</SelectItem>
                {grades.map((grade) => (
                  <SelectItem key={grade} value={grade}>
                    {grade}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {error ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="mb-4 text-lg font-medium text-destructive">{error}</p>
              <Button onClick={() => window.location.reload()}>Thử lại</Button>
            </CardContent>
          </Card>
        ) : leaderboard.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Trophy className="mb-4 h-12 w-12 text-muted-foreground" />
              <p className="mb-2 text-lg font-medium text-foreground">Chưa có mục bảng xếp hạng nào</p>
              <p className="text-sm text-muted-foreground">Hoàn thành các bài kiểm tra để xem xếp hạng của bạn tại đây</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {leaderboard.map((entry, index) => {
              const rank = index + 1
              // Backend returns student_id, map it to userId
              const entryUserId = (entry as any).student_id || entry.userId
              const isCurrentUser = entryUserId === user?.id
              // Global leaderboard returns average_percentage, not percentage
              const percentage = (entry as any).average_percentage || entry.percentage || 0
              const totalScore = (entry as any).total_score || entry.score || 0
              const examsTaken = (entry as any).exams_taken || 1
              const userName = entry.userName || (entry as any).student_name || "Unknown"

              return (
                <Card
                  key={`${entryUserId}-${index}`}
                  className={`${isCurrentUser ? "border-2 border-primary" : ""}`}
                >
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="flex w-12 items-center justify-center">
                        {getRankIcon(rank) || (
                          <span className={`text-lg font-bold ${rank <= 3 ? "" : "text-muted-foreground"}`}>
                            #{rank}
                          </span>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="mb-2 flex items-center gap-2">
                          <h3 className="text-lg font-semibold text-foreground">{userName}</h3>
                          {isCurrentUser && (
                            <Badge variant="default" className="bg-primary text-primary-foreground">
                              You
                            </Badge>
                          )}
                          {rank <= 3 && (
                            <Badge variant="outline" className={getRankBadgeColor(rank)}>
                              Rank {rank}
                            </Badge>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Trophy className="h-4 w-4" />
                            <span>Trung bình: {Number(percentage).toFixed(1)}%</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span>Tổng điểm: {totalScore}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span>Bài kiểm tra: {examsTaken}</span>
                          </div>
                          {entry.timeTaken && (
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              <span>{formatTime(entry.timeTaken)}</span>
                            </div>
                          )}
                          {entry.completedAt && (
                            <div>
                              <span>{formatDate(entry.completedAt)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
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

