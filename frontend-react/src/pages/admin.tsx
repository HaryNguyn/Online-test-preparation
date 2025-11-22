import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { DashboardHeader } from "@/components/dashboard-header"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useAuth } from "@/contexts/auth-context"
import { MoreHorizontal, PlusCircle, User, ShieldCheck, FileText, AlertCircle } from "lucide-react"
import { UserFormDialog } from "@/components/user-form-dialog" 
import type { User as UserType, ExamDTO } from "@/lib/types"
import { api } from "@/lib/api"
import { storage } from "@/lib/storage"
import { Spinner } from "@/components/ui/spinner"

type ApiUser = UserType & { id: string } 

export function AdminPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [users, setUsers] = useState<ApiUser[]>([])
  const [pendingExams, setPendingExams] = useState<ExamDTO[]>([])
  const [isUserFormOpen, setIsUserFormOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<ApiUser | null>(null)
  const [isLoadingUsers, setIsLoadingUsers] = useState(true)
  const [errorUsers, setErrorUsers] = useState<string | null>(null)
  const [isLoadingExams, setIsLoadingExams] = useState(true)
  const [errorExams, setErrorExams] = useState<string | null>(null)

  useEffect(() => {
    if (user?.role !== "admin") {
      navigate("/dashboard", { replace: true })
      return
    }

    const fetchUsers = () => {
      try {
        setIsLoadingUsers(true)
        setErrorUsers(null)
        const storedUsers = storage.getUsers()
        setUsers(storedUsers as ApiUser[])
      } catch (err) {
        setErrorUsers((err as Error).message || "Failed to load users from storage.")
      } finally {
        setIsLoadingUsers(false)
      }
    }

    const fetchPendingExams = async () => {
      try {
        setIsLoadingExams(true)
        setErrorExams(null)
        const response = await api.getExams({ status: "pending" })
        setPendingExams(response.exams)
      } catch (err) {
        setErrorExams((err as Error).message || "Failed to fetch pending exams.")
      } finally {
        setIsLoadingExams(false)
      }
    }

    fetchUsers()
    fetchPendingExams()
  }, [user, navigate])
  
  const handleApprove = async (examId: string) => {
    try {
      await api.updateExam(examId, { status: "published" })
      setPendingExams((prevExams) => prevExams.filter((exam) => exam.id !== examId))
    } catch (err) {
      alert((err as Error).message || "Failed to approve exam.")
    }
  }

  const handleReject = async (examId: string) => {
    try {
      await api.updateExam(examId, { status: "rejected" })
      setPendingExams((prevExams) => prevExams.filter((exam) => exam.id !== examId))
    } catch (err) {
      alert((err as Error).message || "Failed to reject exam.")
    }
  }

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return

    try {
      const nextUsers = users.filter((u) => u.id !== userId)
      storage.saveUsers(nextUsers)
      setUsers(nextUsers)
    } catch (err) {
      alert((err as Error).message || "Failed to delete user.")
    }
  }
  
  const handleSaveUser = async (savedUser: ApiUser & { password?: string }): Promise<void> => {
    try {
      const isNew = !savedUser.id || !users.some(u => u.id === savedUser.id)
      if (isNew) {
        // Call the actual register API instead of saving to local storage
        const payload = {
          email: savedUser.email,
          password: savedUser.password || Math.random().toString(36).slice(2, 10),
          name: savedUser.name,
          role: savedUser.role,
        }
        const { user: newUser } = await api.register(payload)
        // We need to fetch all users again from a real API if we want this to be robust.
        // For now, just add to the local state. A real app would have a GET /api/users endpoint.
        setUsers(prevUsers => [newUser as ApiUser, ...prevUsers]);
      } else {
        // This part would call an "update user" API endpoint.
        // For now, it updates local state which is not ideal but works for the demo.
        // A proper implementation would require a PUT /api/users/:id endpoint.
        console.warn("User update is not implemented on the backend. Updating local state only.");
        const updatedUsers = users.map((u) => (u.id === savedUser.id ? { ...u, ...savedUser } : u));
        storage.saveUsers(updatedUsers); // Keep this for now to persist edits locally
        setUsers(updatedUsers);
      }
    } catch (err) {
      // The dialog will show its own error, but we can log it here.
      console.error("Failed to save user:", err)
      // Re-throw to be caught by the dialog form
      throw err
    }
  }

  const handleAddNewUser = () => {
    setEditingUser(null)
    setIsUserFormOpen(true)
  }

  const handleEditUser = (userToEdit: ApiUser) => {
    setEditingUser(userToEdit)
    setIsUserFormOpen(true)
  }

  const resolveCreatorName = (exam: ExamDTO): string => {
    const creator = exam.created_by as unknown
    if (typeof creator === "string") {
      return creator
    }
    if (creator && typeof creator === "object" && "name" in (creator as Record<string, unknown>)) {
      const nameValue = (creator as Record<string, unknown>).name
      if (typeof nameValue === "string") {
        return nameValue
      }
    }
    return "N/A"
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Admin quản lý</h1>
            <p className="text-muted-foreground">Quản lý người dùng, bài thi, và hoạt động nền tảng</p>
          </div>
        </div>

        <Tabs defaultValue="users">
          <TabsList className="grid w-full grid-cols-2 md:w-[400px]">
            <TabsTrigger value="users"><User className="mr-2 h-4 w-4" /> Quản lý người dùng</TabsTrigger>
            <TabsTrigger value="exams"><ShieldCheck className="mr-2 h-4 w-4" /> Kiểm duyệt bài thi</TabsTrigger>
          </TabsList>
          <TabsContent value="users" className="mt-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Người dùng</CardTitle>
                    <CardDescription>Thêm, sửa, hoặc xóa người dùng khỏi hệ thống.</CardDescription>
                  </div>
                  <Button size="sm" onClick={handleAddNewUser}><PlusCircle className="mr-2 h-4 w-4" /> Thêm người dùng</Button>
                </div>
              </CardHeader>
              <CardContent>
                {isLoadingUsers ? (
                  <div className="flex items-center justify-center py-8">
                    <Spinner className="h-8 w-8" />
                  </div>
                ) : errorUsers ? (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{errorUsers}</AlertDescription>
                  </Alert>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tên</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Vai trò</TableHead>
                        <TableHead className="text-right">Hành động</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((u) => (
                        <TableRow key={u.id}>
                          <TableCell className="font-medium">{u.name}</TableCell>
                          <TableCell>{u.email}</TableCell>
                          <TableCell><Badge variant="outline" className="capitalize">{u.role}</Badge></TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleEditUser(u)}>Sửa</DropdownMenuItem>
                                <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteUser(u.id)}>Xóa</DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="exams" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Bài thi chờ duyệt</CardTitle>
                <CardDescription>Xem và phê duyệt các bài thi mới được tạo.</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingExams ? (
                  <div className="flex items-center justify-center py-8">
                    <Spinner className="h-8 w-8" />
                  </div>
                ) : errorExams ? (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{errorExams}</AlertDescription>
                  </Alert>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tiêu đề bài thi</TableHead>
                        <TableHead>Môn học</TableHead>
                        <TableHead>Người tạo</TableHead>
                        <TableHead className="text-right">Hành động</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendingExams.map((exam) => (
                        <TableRow key={exam.id}>
                          <TableCell className="font-medium">{exam.title}</TableCell>
                          <TableCell>{exam.subject}</TableCell>
                          <TableCell>{resolveCreatorName(exam)}</TableCell>
                          <TableCell className="text-right space-x-2">
                            <Button variant="outline" size="sm" onClick={() => navigate(`/test/${exam.id}`)}><FileText className="mr-2 h-4 w-4" /> Xem trước</Button>
                            <Button variant="outline" size="sm" className="text-red-600 hover:bg-red-50 hover:text-red-700" onClick={() => handleReject(exam.id)}>Từ chối</Button>
                            <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => handleApprove(exam.id)}>Phê duyệt</Button>
                          </TableCell>
                        </TableRow>
                      ))}
                      {pendingExams.length === 0 && (
                        <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">Không có bài thi nào đang chờ duyệt.</TableCell></TableRow>
                      )}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        <UserFormDialog
          isOpen={isUserFormOpen}
          onOpenChange={setIsUserFormOpen}
          onSave={handleSaveUser}
          user={editingUser}
        />
      </main>
    </div>
  )
}
