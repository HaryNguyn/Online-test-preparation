import { useEffect, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useAuth } from "@/contexts/auth-context"
import { DashboardHeader } from "@/components/dashboard-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PlusCircle, Edit, Trash2, ClipboardCheck, Clock } from "lucide-react"
import { api } from "@/lib/api"
import type { ExamDTO, SubmissionDTO } from "@/lib/types"
import { Spinner } from "@/components/ui/spinner"

export function TeacherPage() {
  const { user, isLoading: isAuthLoading } = useAuth()
  const navigate = useNavigate()
  const [exams, setExams] = useState<ExamDTO[]>([])
  const [pendingSubmissions, setPendingSubmissions] = useState<SubmissionDTO[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isPendingLoading, setIsPendingLoading] = useState(true)

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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "published": return <Badge className="bg-green-600">Published</Badge>
      case "pending": return <Badge variant="secondary">Pending Review</Badge>
      case "rejected": return <Badge variant="destructive">Rejected</Badge>
      default: return <Badge variant="outline">{status}</Badge>
    }
  }

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
            <p className="text-muted-foreground">Manage your created exams.</p>
          </div>
          <Link to="/teacher/create-test">
            <Button><PlusCircle className="mr-2 h-4 w-4" /> Create New Exam</Button>
          </Link>
        </div>

        <Tabs defaultValue="exams" className="space-y-4">
          <TabsList>
            <TabsTrigger value="exams">
              <Edit className="mr-2 h-4 w-4" />
              My Exams
            </TabsTrigger>
            <TabsTrigger value="grading">
              <ClipboardCheck className="mr-2 h-4 w-4" />
              Pending Grading
              {pendingSubmissions.length > 0 && (
                <Badge className="ml-2" variant="destructive">{pendingSubmissions.length}</Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="exams">
            <Card>
              <CardHeader>
                <CardTitle>My Exams</CardTitle>
                <CardDescription>A list of all exams you have created.</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? <div className="flex justify-center py-8"><Spinner /></div> : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>Subject</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
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
                          <TableCell colSpan={4} className="text-center h-24">You haven't created any exams yet.</TableCell>
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
                <CardTitle>Pending Grading</CardTitle>
                <CardDescription>Submissions with essay questions waiting for manual grading.</CardDescription>
              </CardHeader>
              <CardContent>
                {isPendingLoading ? <div className="flex justify-center py-8"><Spinner /></div> : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Student</TableHead>
                        <TableHead>Exam</TableHead>
                        <TableHead>Submitted</TableHead>
                        <TableHead>Score</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
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
                            <Button
                              size="sm"
                              onClick={() => navigate(`/teacher/grading?id=${submission.id}`)}
                            >
                              <ClipboardCheck className="mr-2 h-4 w-4" />
                              Grade Now
                            </Button>
                          </TableCell>
                        </TableRow>
                      )) : (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center h-24">
                            No submissions pending grading.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}