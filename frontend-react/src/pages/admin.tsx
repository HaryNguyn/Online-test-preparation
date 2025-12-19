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
import { Spinner } from "@/components/ui/spinner"
import { useNotification } from "@/lib/notification-store"
import { ConfirmDialog } from "@/components/confirm-dialog"

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
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean
    title: string
    description: string
    onConfirm: () => void | Promise<void>
    variant?: 'default' | 'destructive'
  }>({ open: false, title: '', description: '', onConfirm: () => {} })
  
  const notification = useNotification()

  useEffect(() => {
    if (user?.role !== "admin") {
      navigate("/dashboard", { replace: true })
      return
    }

    const fetchUsers = async () => {
      try {
        setIsLoadingUsers(true)
        setErrorUsers(null)
        const response = await api.getAllUsers()
        setUsers(response.users as ApiUser[])
      } catch (err) {
        setErrorUsers((err as Error).message || "Failed to load users from database.")
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
    const exam = pendingExams.find(e => e.id === examId)
    setConfirmDialog({
      open: true,
      title: 'Phê duyệt bài thi',
      description: `Bạn có chắc chắn muốn phê duyệt bài thi "${exam?.title}"? Bài thi sẽ được xuất bản và học sinh có thể làm bài.`,
      variant: 'default',
      onConfirm: async () => {
        try {
          await api.updateExam(examId, { status: "published" })
          setPendingExams((prevExams) => prevExams.filter((exam) => exam.id !== examId))
          notification.success('Thành công', 'Bài thi đã được phê duyệt và xuất bản')
        } catch (err) {
          notification.error('Lỗi', (err as Error).message || 'Không thể phê duyệt bài thi')
        }
      }
    })
  }

  const handleReject = async (examId: string) => {
    const exam = pendingExams.find(e => e.id === examId)
    setConfirmDialog({
      open: true,
      title: 'Từ chối bài thi',
      description: `Bạn có chắc chắn muốn từ chối bài thi "${exam?.title}"? Bài thi sẽ không được xuất bản.`,
      variant: 'destructive',
      onConfirm: async () => {
        try {
          await api.updateExam(examId, { status: "rejected" })
          setPendingExams((prevExams) => prevExams.filter((exam) => exam.id !== examId))
          notification.warning('Từ chối', 'Bài thi đã bị từ chối')
        } catch (err) {
          notification.error('Lỗi', (err as Error).message || 'Không thể từ chối bài thi')
        }
      }
    })
  }

  const handleDeleteUser = async (userId: string) => {
    const user = users.find(u => u.id === userId)
    setConfirmDialog({
      open: true,
      title: 'Xóa người dùng',
      description: `Bạn có chắc chắn muốn xóa người dùng "${user?.name}"? Hành động này không thể hoàn tác.`,
      variant: 'destructive',
      onConfirm: async () => {
        try {
          await api.deleteUser(userId)
          setUsers(prevUsers => prevUsers.filter((u) => u.id !== userId))
          notification.success('Thành công', 'Người dùng đã được xóa')
        } catch (err) {
          notification.error('Lỗi', (err as Error).message || 'Không thể xóa người dùng')
        }
      }
    })
  }
  
  const handleSaveUser = async (savedUser: ApiUser & { password?: string }): Promise<void> => {
    try {
      const isNew = !savedUser.id || !users.some(u => u.id === savedUser.id)
      if (isNew) {
        // Create new user via API
        const payload = {
          email: savedUser.email,
          password: savedUser.password || Math.random().toString(36).slice(2, 10),
          name: savedUser.name,
          role: savedUser.role,
          grade: savedUser.grade,
        }
        const { user: newUser } = await api.createUser(payload)
        setUsers(prevUsers => [newUser as ApiUser, ...prevUsers])
        notification.success('Thành công', 'Người dùng mới đã được tạo')
      } else {
        // Update existing user via API
        const payload: any = {
          name: savedUser.name,
          email: savedUser.email,
          role: savedUser.role,
          grade: savedUser.grade,
        }
        if (savedUser.password) {
          payload.password = savedUser.password
        }
        const { user: updatedUser } = await api.updateUser(savedUser.id, payload)
        setUsers(prevUsers => prevUsers.map((u) => (u.id === savedUser.id ? updatedUser as ApiUser : u)))
        notification.success('Thành công', 'Thông tin người dùng đã được cập nhật')
      }
    } catch (err) {
      console.error("Failed to save user:", err)
      notification.error('Lỗi', (err as Error).message || 'Không thể lưu thông tin người dùng')
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
        <ConfirmDialog
          open={confirmDialog.open}
          onOpenChange={(open) => setConfirmDialog({ ...confirmDialog, open })}
          title={confirmDialog.title}
          description={confirmDialog.description}
          variant={confirmDialog.variant}
          onConfirm={confirmDialog.onConfirm}
        />
      </main>
    </div>
  )
}
