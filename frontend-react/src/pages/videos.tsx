import { useEffect, useState } from "react"
import { DashboardHeader } from "@/components/dashboard-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Video, Play } from "lucide-react"
import { api } from "@/lib/api"
import type { VideoDTO } from "@/lib/types"
import { toast } from "@/hooks/use-toast"

export default function VideosPage() {
  const [videos, setVideos] = useState<VideoDTO[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedVideo, setSelectedVideo] = useState<VideoDTO | null>(null)
  const [showVideoDialog, setShowVideoDialog] = useState(false)

  const [filterSubject, setFilterSubject] = useState("")
  const [filterGrade, setFilterGrade] = useState("")

  useEffect(() => {
    loadVideos()
  }, [filterSubject, filterGrade])

  const loadVideos = async () => {
    try {
      setLoading(true)
      const params: any = {}
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

  const openVideoDialog = (video: VideoDTO) => {
    setSelectedVideo(video)
    setShowVideoDialog(true)
  }

  const getYouTubeEmbedUrl = (youtubeId: string) => {
    return `https://www.youtube.com/embed/${youtubeId}?autoplay=1`
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
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Video học tập</h1>
          <p className="text-muted-foreground">Xem các video bài giảng từ giáo viên</p>
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
              <p className="text-sm text-muted-foreground">
                {filterSubject || filterGrade
                  ? "Không tìm thấy video với bộ lọc này"
                  : "Chưa có video học tập nào được thêm"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {videos.map((video) => (
              <Card
                key={video.id}
                className="overflow-hidden cursor-pointer transition-all hover:shadow-lg"
                onClick={() => openVideoDialog(video)}
              >
                <div className="relative aspect-video bg-muted group">
                  <img
                    src={video.thumbnail_url || undefined}
                    alt={video.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Play className="h-12 w-12 text-white" />
                  </div>
                </div>
                <CardHeader>
                  <CardTitle className="text-lg line-clamp-2">{video.title}</CardTitle>
                  {video.description && (
                    <CardDescription className="line-clamp-2">
                      {video.description}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {video.subject && (
                      <Badge variant="secondary">{video.subject}</Badge>
                    )}
                    {video.grade_level && (
                      <Badge variant="outline">{video.grade_level}</Badge>
                    )}
                  </div>
                  {video.creator_name && (
                    <p className="text-sm text-muted-foreground">
                      Giáo viên: {video.creator_name}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* Video Player Dialog */}
      <Dialog open={showVideoDialog} onOpenChange={setShowVideoDialog}>
        <DialogContent className="max-w-5xl">
          <DialogHeader>
            <DialogTitle>{selectedVideo?.title}</DialogTitle>
            {selectedVideo?.description && (
              <DialogDescription>
                {selectedVideo.description}
              </DialogDescription>
            )}
          </DialogHeader>
          <div className="aspect-video w-full">
            {selectedVideo && (
              <iframe
                src={getYouTubeEmbedUrl(selectedVideo.youtube_id)}
                title={selectedVideo.title}
                className="w-full h-full rounded-md"
                allowFullScreen
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              />
            )}
          </div>
          {selectedVideo && (
            <div className="flex flex-wrap gap-2 pt-4">
              {selectedVideo.subject && (
                <Badge variant="secondary">{selectedVideo.subject}</Badge>
              )}
              {selectedVideo.grade_level && (
                <Badge variant="outline">{selectedVideo.grade_level}</Badge>
              )}
              {selectedVideo.creator_name && (
                <Badge variant="outline">GV: {selectedVideo.creator_name}</Badge>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
