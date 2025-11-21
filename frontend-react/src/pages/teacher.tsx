import { useEffect, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useAuth } from "@/contexts/auth-context"
import { DashboardHeader } from "@/components/dashboard-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PlusCircle, Edit, Trash2, ClipboardCheck, Clock, X, BarChart3, TrendingUp, Users, Video } from "lucide-react"
import { api } from "@/lib/api"
import type { ExamDTO, SubmissionDTO } from "@/lib/types"
import { Spinner } from "@/components/ui/spinner"
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

export function TeacherPage() {
  const { user, isLoading: isAuthLoading } = useAuth()
  const navigate = useNavigate()
  const [exams, setExams] = useState<ExamDTO[]>([])
  const [pendingSubmissions, setPendingSubmissions] = useState<SubmissionDTO[]>([])
  const [allSubmissions, setAllSubmissions] = useState<SubmissionDTO[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isPendingLoading, setIsPendingLoading] = useState(true)
  const [isStatsLoading, setIsStatsLoading] = useState(true)
  const [deletingSubmissionId, setDeletingSubmissionId] = useState<string | null>(null)
  const [showDeleteSubmissionDialog, setShowDeleteSubmissionDialog] = useState(false)
  const [selectedExamForStats, setSelectedExamForStats] = useState<string>("all")

  useEffect(() => {
    if (!isAuthLoading && user?.role !== "teacher") {
      navigate("/dashboard", { replace: true })
    }
  }, [user, isAuthLoading, navigate])

  useEffect(() => {
    if (user?.id) {
      api.getExams({ created_by: user.id })
        .then(response => setExams(response.exams))
        .catch(err => console.error("Failed to fetch exams:", err))
        .finally(() => setIsLoading(false))

      api.getPendingSubmissions()
        .then(response => setPendingSubmissions(response.submissions))
        .catch(err => console.error("Failed to fetch pending submissions:", err))
        .finally(() => setIsPendingLoading(false))

      // Load all submissions for statistics
      Promise.all(
        exams.map(exam => api.getExamSubmissions(exam.id).catch(() => ({ submissions: [] })))
      ).then(results => {
        const combined = results.flatMap(r => r.submissions)
        setAllSubmissions(combined)
      }).catch(err => console.error("Failed to fetch submissions for stats:", err))
        .finally(() => setIsStatsLoading(false))
    }
  }, [user?.id])

  const handleEditExam = (examId: string) => {
    navigate(`/teacher/edit-test/${examId}`)
  }

  const handleDeleteExam = async (examId: string) => {
    if (!window.confirm("Are you sure you want to delete this exam? This action cannot be undone.")) {
      return
    }

    try {
      await api.deleteExam(examId)
      setExams((prevExams) => prevExams.filter((exam) => exam.id !== examId))
      // Optionally, show a success message
    } catch (err) {
      console.error("Failed to delete exam:", err)
      alert("Failed to delete the exam. Please try again.")
    }
  }

  const handleDeleteSubmissionClick = (submissionId: string) => {
    setDeletingSubmissionId(submissionId)
    setShowDeleteSubmissionDialog(true)
  }

  const handleDeleteSubmissionConfirm = async () => {
    if (!deletingSubmissionId) return

    try {
      await api.deleteSubmission(deletingSubmissionId)
      setPendingSubmissions(prev => prev.filter(s => s.id !== deletingSubmissionId))
      toast({
        title: "Success",
        description: "Submission deleted successfully",
      })
    } catch (err) {
      console.error("Failed to delete submission:", err)
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to delete submission",
        variant: "destructive",
      })
    } finally {
      setShowDeleteSubmissionDialog(false)
      setDeletingSubmissionId(null)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "published": return <Badge className="bg-green-600">Published</Badge>
      case "pending": return <Badge variant="secondary">Pending Review</Badge>
      case "rejected": return <Badge variant="destructive">Rejected</Badge>
      default: return <Badge variant="outline">{status}</Badge>
    }
  }

  // Calculate statistics
  const filteredSubmissions = selectedExamForStats === "all" 
    ? allSubmissions 
    : allSubmissions.filter(s => s.exam_id === selectedExamForStats)

  const totalStudents = new Set(filteredSubmissions.map(s => s.student_id)).size
  const totalSubmissions = filteredSubmissions.length
  const averageScore = filteredSubmissions.length > 0
    ? filteredSubmissions.reduce((sum, s) => sum + (Number(s.percentage) || 0), 0) / filteredSubmissions.length
    : 0
  const passRate = filteredSubmissions.length > 0
    ? (filteredSubmissions.filter(s => (Number(s.percentage) || 0) >= 60).length / filteredSubmissions.length) * 100
    : 0

  if (isAuthLoading || !user) {
    return <div className="flex min-h-screen items-center justify-center"><Spinner className="h-8 w-8" /></div>
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Teacher Dashboard</h1>
            <p className="text-muted-foreground">Quản lý giáo viên.</p>
          </div>
          <div className="flex gap-2">
            <Link to="/teacher/videos">
              <Button variant="outline"><Video className="mr-2 h-4 w-4" /> Video học tập</Button>
            </Link>
            <Link to="/teacher/create-test">
              <Button><PlusCircle className="mr-2 h-4 w-4" /> Tạo bài kiểm tra mới</Button>
            </Link>
          </div>
        </div>

        <Tabs defaultValue="exams" className="space-y-4">
          <TabsList>
            <TabsTrigger value="exams">
              <Edit className="mr-2 h-4 w-4" />
              Bài kiểm tra của tôi
            </TabsTrigger>
            <TabsTrigger value="grading">
              <ClipboardCheck className="mr-2 h-4 w-4" />
              Chấm điểm đang chờ
              {pendingSubmissions.length > 0 && (
                <Badge className="ml-2" variant="destructive">{pendingSubmissions.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="statistics">
              <BarChart3 className="mr-2 h-4 w-4" />
              Thống kê
            </TabsTrigger>
          </TabsList>

          <TabsContent value="exams">
            <Card>
              <CardHeader>
                <CardTitle>Bài kiểm tra của tôi</CardTitle>
                <CardDescription>Danh sách tất cả các bài kiểm tra bạn đã tạo.</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? <div className="flex justify-center py-8"><Spinner /></div> : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tiêu đề</TableHead>
                        <TableHead>Môn học</TableHead>
                        <TableHead>Trạng thái</TableHead>
                        <TableHead className="text-right"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {exams.length > 0 ? exams.map((exam) => (
                        <TableRow key={exam.id}>
                          <TableCell className="font-medium">{exam.title}</TableCell>
                          <TableCell>{exam.subject}</TableCell>
                          <TableCell>{getStatusBadge(exam.status || 'draft')}</TableCell>
                          <TableCell className="text-right space-x-2">
                            <Button variant="ghost" size="icon" onClick={() => handleEditExam(exam.id)}><Edit className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDeleteExam(exam.id)}><Trash2 className="h-4 w-4" /></Button>
                          </TableCell>
                        </TableRow>
                      )) : (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center h-24">Bạn chưa tạo bài kiểm tra nào.</TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="grading">
            <Card>
              <CardHeader>
                <CardTitle>Chấm điểm đang chờ</CardTitle>
                <CardDescription>Các bài nộp có câu hỏi tự luận đang chờ chấm điểm thủ công.</CardDescription>
              </CardHeader>
              <CardContent>
                {isPendingLoading ? <div className="flex justify-center py-8"><Spinner /></div> : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Học sinh</TableHead>
                        <TableHead>Bài kiểm tra</TableHead>
                        <TableHead>Ngày nộp</TableHead>
                        <TableHead>Điểm</TableHead>
                        <TableHead className="text-right"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendingSubmissions.length > 0 ? pendingSubmissions.map((submission) => (
                        <TableRow key={submission.id}>
                          <TableCell className="font-medium">{submission.student_name || "Unknown"}</TableCell>
                          <TableCell>{submission.exam_title || "Untitled"}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-muted-foreground" />
                              {new Date(submission.submitted_at).toLocaleDateString()}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">
                              {submission.score || 0} / {submission.total_marks}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                size="sm"
                                onClick={() => navigate(`/teacher/grading?id=${submission.id}`)}
                              >
                                <ClipboardCheck className="mr-2 h-4 w-4" />
                                Chấm điểm ngay
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-destructive hover:text-destructive"
                                onClick={() => handleDeleteSubmissionClick(submission.id)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      )) : (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center h-24">
                            Không có bài nộp nào đang chờ chấm điểm.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="statistics">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Thống kê kết quả học sinh</CardTitle>
                  <CardDescription>
                    Tổng quan về hiệu suất học tập của học sinh qua các đề thi.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-2">Lọc theo đề thi:</label>
                    <select
                      className="w-full max-w-xs p-2 border rounded-md bg-background"
                      value={selectedExamForStats}
                      onChange={(e) => setSelectedExamForStats(e.target.value)}
                    >
                      <option value="all">Tất cả</option>
                      {exams.map(exam => (
                        <option key={exam.id} value={exam.id}>{exam.title}</option>
                      ))}
                    </select>
                  </div>

                  {isStatsLoading ? (
                    <div className="flex justify-center py-8">
                      <Spinner />
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Tổng số học sinh</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4 text-muted-foreground" />
                              <span className="text-2xl font-bold">{totalStudents}</span>
                            </div>
                          </CardContent>
                        </Card>

                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Tổng số bài nộp</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="flex items-center gap-2">
                              <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
                              <span className="text-2xl font-bold">{totalSubmissions}</span>
                            </div>
                          </CardContent>
                        </Card>

                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Điểm trung bình</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="flex items-center gap-2">
                              <TrendingUp className="h-4 w-4 text-muted-foreground" />
                              <span className="text-2xl font-bold">{averageScore.toFixed(1)}%</span>
                            </div>
                          </CardContent>
                        </Card>

                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Tỷ lệ đạt</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="flex items-center gap-2">
                              <BarChart3 className="h-4 w-4 text-muted-foreground" />
                              <span className="text-2xl font-bold">{passRate.toFixed(1)}%</span>
                            </div>
                          </CardContent>
                        </Card>
                      </div>

                      <Card>
                        <CardHeader>
                          <CardTitle>Bài nộp gần đây</CardTitle>
                        </CardHeader>
                        <CardContent>
                          {filteredSubmissions.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                              Không có bài nộp nào
                            </div>
                          ) : (
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Học sinh</TableHead>
                                  <TableHead>Đề thi</TableHead>
                                  <TableHead>Điểm</TableHead>
                                  <TableHead>Trạng thái</TableHead>
                                  <TableHead>Ngày</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {filteredSubmissions
                                  .sort((a, b) => new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime())
                                  .slice(0, 10)
                                  .map((submission) => (
                                    <TableRow key={submission.id}>
                                      <TableCell className="font-medium">
                                        {submission.student_name || "Unknown"}
                                      </TableCell>
                                      <TableCell>{submission.exam_title || "Untitled"}</TableCell>
                                      <TableCell>
                                        <Badge variant="secondary">
                                          {Number(submission.percentage || 0).toFixed(1)}%
                                        </Badge>
                                      </TableCell>
                                      <TableCell>
                                        {submission.grading_status === "pending_manual" ? (
                                          <Badge variant="secondary">Đang chờ</Badge>
                                        ) : submission.grading_status === "manually_graded" || submission.grading_status === "completed" ? (
                                          <Badge>Đã chấm</Badge>
                                        ) : (
                                          <Badge variant="outline">Tự động</Badge>
                                        )}
                                      </TableCell>
                                      <TableCell>
                                        {new Date(submission.submitted_at).toLocaleDateString()}
                                      </TableCell>
                                    </TableRow>
                                  ))}
                              </TableBody>
                            </Table>
                          )}
                        </CardContent>
                      </Card>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>

      <AlertDialog open={showDeleteSubmissionDialog} onOpenChange={setShowDeleteSubmissionDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa bài nộp?</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa bài nộp này không? Hành động này không thể hoàn tác và sẽ xóa kết quả của học sinh.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteSubmissionConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}