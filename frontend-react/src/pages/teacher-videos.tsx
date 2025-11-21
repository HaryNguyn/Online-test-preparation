import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "@/contexts/auth-context"
import { DashboardHeader } from "@/components/dashboard-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
import { Video, Plus, Trash2, Edit, ArrowLeft } from "lucide-react"
import { api } from "@/lib/api"
import type { VideoDTO } from "@/lib/types"
import { toast } from "@/hooks/use-toast"

export default function TeacherVideos() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [videos, setVideos] = useState<VideoDTO[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [selectedVideo, setSelectedVideo] = useState<VideoDTO | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    youtube_url: "",
    subject: "",
    grade_level: "",
  })

  const [filterSubject, setFilterSubject] = useState("")
  const [filterGrade, setFilterGrade] = useState("")

  useEffect(() => {
    if (user?.role !== "teacher") {
      navigate("/")
      return
    }
    loadVideos()
  }, [user, navigate, filterSubject, filterGrade])

  const loadVideos = async () => {
    try {
      setLoading(true)
      const params: any = { created_by: user?.id }
      if (filterSubject) params.subject = filterSubject
      if (filterGrade) params.grade_level = filterGrade
      
      const { videos: data } = await api.getVideos(params)
      setVideos(data)
    } catch (error) {
      console.error("Failed to load videos:", error)
      toast({
        title: "Lỗi",
        description: "Không thể tải danh sách video",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async () => {
    if (!formData.title || !formData.youtube_url || !user) return

    try {
      setSubmitting(true)
      await api.createVideo({
        ...formData,
        created_by: user.id,
      })
      
      toast({
        title: "Thành công",
        description: "Video đã được thêm",
      })
      
      setShowCreateDialog(false)
      resetForm()
      loadVideos()
    } catch (error) {
      toast({
        title: "Lỗi",
        description: error instanceof Error ? error.message : "Không thể tạo video",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleUpdate = async () => {
    if (!selectedVideo || !formData.title || !formData.youtube_url) return

    try {
      setSubmitting(true)
      await api.updateVideo(selectedVideo.id, formData)
      
      toast({
        title: "Thành công",
        description: "Video đã được cập nhật",
      })
      
      setShowEditDialog(false)
      setSelectedVideo(null)
      resetForm()
      loadVideos()
    } catch (error) {
      toast({
        title: "Lỗi",
        description: error instanceof Error ? error.message : "Không thể cập nhật video",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedVideo) return

    try {
      await api.deleteVideo(selectedVideo.id)
      
      toast({
        title: "Thành công",
        description: "Video đã được xóa",
      })
      
      setShowDeleteDialog(false)
      setSelectedVideo(null)
      loadVideos()
    } catch (error) {
      toast({
        title: "Lỗi",
        description: error instanceof Error ? error.message : "Không thể xóa video",
        variant: "destructive",
      })
    }
  }

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      youtube_url: "",
      subject: "",
      grade_level: "",
    })
  }

  const openEditDialog = (video: VideoDTO) => {
    setSelectedVideo(video)
    setFormData({
      title: video.title,
      description: video.description || "",
      youtube_url: video.youtube_url,
      subject: video.subject || "",
      grade_level: video.grade_level || "",
    })
    setShowEditDialog(true)
  }

  const openDeleteDialog = (video: VideoDTO) => {
    setSelectedVideo(video)
    setShowDeleteDialog(true)
  }

  const getYouTubeEmbedUrl = (youtubeId: string) => {
    return `https://www.youtube.com/embed/${youtubeId}`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardHeader />
        <div className="flex items-center justify-center min-h-[calc(100vh-80px)]">
          <p className="text-muted-foreground">Đang tải...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <Button variant="ghost" onClick={() => navigate("/teacher")} className="mb-2">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Quay lại
            </Button>
            <h1 className="text-3xl font-bold">Video học tập</h1>
            <p className="text-muted-foreground">Quản lý video YouTube cho học sinh</p>
          </div>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Thêm video mới
          </Button>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Môn học</Label>
                <select
                  className="w-full p-2 border rounded-md bg-background mt-1"
                  value={filterSubject}
                  onChange={(e) => setFilterSubject(e.target.value)}
                >
                  <option value="">Tất cả môn</option>
                  <option value="Toán">Toán</option>
                  <option value="Văn">Văn</option>
                  <option value="Anh">Tiếng Anh</option>
                  <option value="Lý">Vật lý</option>
                  <option value="Hóa">Hóa học</option>
                  <option value="Sinh">Sinh học</option>
                  <option value="Sử">Lịch sử</option>
                  <option value="Địa">Địa lý</option>
                </select>
              </div>
              <div>
                <Label>Lớp</Label>
                <select
                  className="w-full p-2 border rounded-md bg-background mt-1"
                  value={filterGrade}
                  onChange={(e) => setFilterGrade(e.target.value)}
                >
                  <option value="">Tất cả lớp</option>
                  {[6, 7, 8, 9, 10, 11, 12].map(grade => (
                    <option key={grade} value={`Lớp ${grade}`}>Lớp {grade}</option>
                  ))}
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Videos Grid */}
        {videos.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Video className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium mb-2">Chưa có video nào</p>
              <p className="text-sm text-muted-foreground mb-4">Thêm video YouTube để học sinh có thể xem</p>
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Thêm video đầu tiên
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {videos.map((video) => (
              <Card key={video.id} className="overflow-hidden">
                <div className="relative aspect-video bg-muted">
                  <iframe
                    src={getYouTubeEmbedUrl(video.youtube_id)}
                    title={video.title}
                    className="w-full h-full"
                    allowFullScreen
                  />
                </div>
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-lg line-clamp-2">{video.title}</CardTitle>
                    <div className="flex gap-1 flex-shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditDialog(video)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive"
                        onClick={() => openDeleteDialog(video)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  {video.description && (
                    <CardDescription className="line-clamp-2">
                      {video.description}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {video.subject && (
                      <Badge variant="secondary">{video.subject}</Badge>
                    )}
                    {video.grade_level && (
                      <Badge variant="outline">{video.grade_level}</Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Thêm video mới</DialogTitle>
            <DialogDescription>
              Nhập link YouTube và thông tin video
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="youtube_url">Link YouTube *</Label>
              <Input
                id="youtube_url"
                placeholder="https://www.youtube.com/watch?v=..."
                value={formData.youtube_url}
                onChange={(e) => setFormData({ ...formData, youtube_url: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="title">Tiêu đề *</Label>
              <Input
                id="title"
                placeholder="Tên bài học"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="description">Mô tả</Label>
              <Textarea
                id="description"
                placeholder="Mô tả nội dung video..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="subject">Môn học</Label>
                <select
                  id="subject"
                  className="w-full p-2 border rounded-md bg-background"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                >
                  <option value="">Chọn môn</option>
                  <option value="Toán">Toán</option>
                  <option value="Văn">Văn</option>
                  <option value="Anh">Tiếng Anh</option>
                  <option value="Lý">Vật lý</option>
                  <option value="Hóa">Hóa học</option>
                  <option value="Sinh">Sinh học</option>
                  <option value="Sử">Lịch sử</option>
                  <option value="Địa">Địa lý</option>
                </select>
              </div>
              <div>
                <Label htmlFor="grade_level">Lớp</Label>
                <select
                  id="grade_level"
                  className="w-full p-2 border rounded-md bg-background"
                  value={formData.grade_level}
                  onChange={(e) => setFormData({ ...formData, grade_level: e.target.value })}
                >
                  <option value="">Chọn lớp</option>
                  {[6, 7, 8, 9, 10, 11, 12].map(grade => (
                    <option key={grade} value={`Lớp ${grade}`}>Lớp {grade}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowCreateDialog(false); resetForm(); }}>
              Hủy
            </Button>
            <Button onClick={handleCreate} disabled={submitting || !formData.title || !formData.youtube_url}>
              {submitting ? "Đang thêm..." : "Thêm video"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Chỉnh sửa video</DialogTitle>
            <DialogDescription>
              Cập nhật thông tin video
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit_youtube_url">Link YouTube *</Label>
              <Input
                id="edit_youtube_url"
                placeholder="https://www.youtube.com/watch?v=..."
                value={formData.youtube_url}
                onChange={(e) => setFormData({ ...formData, youtube_url: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit_title">Tiêu đề *</Label>
              <Input
                id="edit_title"
                placeholder="Tên bài học"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit_description">Mô tả</Label>
              <Textarea
                id="edit_description"
                placeholder="Mô tả nội dung video..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit_subject">Môn học</Label>
                <select
                  id="edit_subject"
                  className="w-full p-2 border rounded-md bg-background"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                >
                  <option value="">Chọn môn</option>
                  <option value="Toán">Toán</option>
                  <option value="Văn">Văn</option>
                  <option value="Anh">Tiếng Anh</option>
                  <option value="Lý">Vật lý</option>
                  <option value="Hóa">Hóa học</option>
                  <option value="Sinh">Sinh học</option>
                  <option value="Sử">Lịch sử</option>
                  <option value="Địa">Địa lý</option>
                </select>
              </div>
              <div>
                <Label htmlFor="edit_grade_level">Lớp</Label>
                <select
                  id="edit_grade_level"
                  className="w-full p-2 border rounded-md bg-background"
                  value={formData.grade_level}
                  onChange={(e) => setFormData({ ...formData, grade_level: e.target.value })}
                >
                  <option value="">Chọn lớp</option>
                  {[6, 7, 8, 9, 10, 11, 12].map(grade => (
                    <option key={grade} value={`Lớp ${grade}`}>Lớp {grade}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowEditDialog(false); setSelectedVideo(null); resetForm(); }}>
              Hủy
            </Button>
            <Button onClick={handleUpdate} disabled={submitting || !formData.title || !formData.youtube_url}>
              {submitting ? "Đang lưu..." : "Lưu thay đổi"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa video?</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc muốn xóa video "{selectedVideo?.title}"? Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedVideo(null)}>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
