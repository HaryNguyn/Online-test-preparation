import { useEffect, useRef } from "react"
import {  useNavigate } from "react-router-dom"
import { useAuth } from "@/contexts/auth-context"
import { useTheme } from "@/contexts/theme-context"
import { ExamMenu } from "@/components/exam-menu"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {  BarChart3, Trophy, Target, Clock, Users, Sun, Moon, Monitor } from "lucide-react"
import "@/components/floating-effects.css"

export function HomePage() {
  const { user, isLoading } = useAuth()
  const { theme, setTheme, resolvedTheme } = useTheme()
  const navigate = useNavigate()
  const heroSectionRef = useRef<HTMLElement>(null)
  const backgroundRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    if (!isLoading && user) {
      if (user.role === "student" || user.role === "parent") {
        navigate("/dashboard", { replace: true })
      } else if (user.role === "teacher") {
        navigate("/teacher", { replace: true })
      } else if (user.role === "admin") {
        navigate("/admin", { replace: true })
      }
    }
  }, [user, isLoading, navigate])

  // Parallax effect on scroll
  useEffect(() => {
    const handleScroll = () => {
      if (!heroSectionRef.current || !backgroundRef.current) return
      
      const scrolled = window.scrollY
      const rate = scrolled * 0.5
      
      if (backgroundRef.current) {
        backgroundRef.current.style.transform = `translateY(${rate}px)`
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Video auto play/pause on scroll
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handleScroll = () => {
      if (!video) return
      
      const rect = video.getBoundingClientRect()
      
      // Kiểm tra nếu video hoàn toàn trong viewport
      if (rect.top >= 0 && rect.bottom <= window.innerHeight) {
        video.play().catch((error) => {
          console.log("Video play failed:", error)
        })
      } else {
        video.pause()
      }
    }

    // Kiểm tra ngay khi video load xong
    const handleLoadedMetadata = () => {
      handleScroll()
    }

    video.addEventListener('loadedmetadata', handleLoadedMetadata)
    window.addEventListener('scroll', handleScroll, { passive: true })

    // Kiểm tra ngay lần đầu
    if (video.readyState >= 2) {
      handleScroll()
    }

    return () => {
      window.removeEventListener('scroll', handleScroll)
      video.removeEventListener('loadedmetadata', handleLoadedMetadata)
      if (video) {
        video.pause()
      }
    }
  }, [])

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg text-muted-foreground">Loading...</div>
      </div>
    )
  }

  if (user) return null

  return (
    <div className="relative min-h-screen">
      <ExamMenu />
      
      {/* Theme Toggle Button - Fixed position bottom left */}
      <div className="fixed bottom-6 left-6 z-50">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" className="h-10 w-10 rounded-full shadow-lg bg-background/80 backdrop-blur-sm">
              {resolvedTheme === "dark" ? (
                <Moon className="h-5 w-5" />
              ) : (
                <Sun className="h-5 w-5" />
              )}
              <span className="sr-only">Chuyển đổi theme</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" side="top">
            <DropdownMenuItem onClick={() => setTheme("light")}>
              <Sun className="mr-2 h-4 w-4" />
              <span>Sáng</span>
              {theme === "light" && <span className="ml-auto">✓</span>}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme("dark")}>
              <Moon className="mr-2 h-4 w-4" />
              <span>Tối</span>
              {theme === "dark" && <span className="ml-auto">✓</span>}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme("system")}>
              <Monitor className="mr-2 h-4 w-4" />
              <span>Theo hệ thống</span>
              {theme === "system" && <span className="ml-auto">✓</span>}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <section
        ref={heroSectionRef}
        className="relative flex min-h-screen items-center justify-center overflow-hidden parallax-container"
      >
        <div 
          ref={backgroundRef}
          className="absolute inset-0 bg-cover bg-center parallax-background"
          style={{ backgroundImage: "url('src/public/anhnendemo1.png')" }}
        />
        <div className="absolute inset-0 bg-black/60 z-[1]" />
        <div className="container relative mx-auto px-6 z-10">
          <div className="mx-auto max-w-4xl text-center">
            <h1 className="mb-6 text-balance text-6xl font-bold leading-tight tracking-tight text-foreground md:text-7xl">
              <span className="text-floating inline-block">Hệ Thống Luyện Thi Trực Tuyến</span>{" "}
              <span className="block text-primary drop-shadow-[0_2px_4px_hsl(var(--primary)/0.8)] md:inline floating-element">
              ExamPrep
              </span>
            </h1>
            <p className="mb-10 text-pretty text-xl font-semibold leading-relaxed text-primary-foreground/80 md:text-3xl floating-element-slow">
              Chinh phục đỉnh cao, chắp cánh vươn cao
            </p>
            
          </div>
        </div>
      </section>
      {/* Số liệu thống kê */}
      <section className="border-y border-border/40 bg-muted/30 py-16">
        <div className="container mx-auto px-6">
          <div className="grid gap-8 md:grid-cols-3">
            <div className="text-center floating-element">
              <div className="mb-2 text-5xl font-bold text-primary">10K+</div>
              <div className="text-lg text-muted-foreground">Học sinh tham gia</div>
            </div>
            <div className="text-center floating-element-slow">
              <div className="mb-2 text-5xl font-bold text-primary">500+</div>
              <div className="text-lg text-muted-foreground">Bài luyện tập</div>
            </div>
            <div className="text-center floating-element-reverse">
              <div className="mb-2 text-5xl font-bold text-primary">95%</div>
              <div className="text-lg text-muted-foreground">Đạt kết quả cao</div>
            </div>
          </div>
        </div>
      </section>
      {/* Video autoplay on scroll */}
      <section className="card-3d floating-element-slow group relative overflow-hidden border-border/50 p-8 transition-all hover:border-primary/50 hover:shadow-xl hover:shadow-primary/5">
        <div className="container mx-auto px-6">
          <Card className="relative overflow-hidden border-0 bg-linear-to-br from-primary to-primary/80 p-12 text-center shadow-2xl shadow-primary/20 md:p-16">
            <div className="absolute inset-0 bg-[url('/abstract-geometric-flow.png')] opacity-10" />
             <div className="relative z-10">
               <video 
                 ref={videoRef}
                 id="autoVideo"
                 src="..\public\videodemo.mp4" 
                 width="800" 
                 muted
                 loop
                 autoPlay
                 preload="auto"
                 className="mx-auto rounded-lg shadow-2xl w-full max-w-4xl"
                 style={{ maxWidth: '800px' }}
               >
                 Trình duyệt của bạn không hỗ trợ video.
               </video>
             </div>
          </Card>
        </div>
      </section>

      {/* Có Tất Cả Mọi Thứ Bạn Cần Để Học Tập */}
      <section className="py-24">
        <div className="container mx-auto px-6">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-4xl font-bold tracking-tight text-foreground md:text-5xl">
              Có Tất Cả Mọi Thứ Bạn Cần Để Học Tập
            </h2>
            <p className="text-xl text-muted-foreground">Các tính năng mạnh mẽ được tích hợp hiện đại </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card className="card-3d floating-element group relative overflow-hidden border-border/50 p-8 transition-all hover:border-primary/50 hover:shadow-xl hover:shadow-primary/5">
              <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-transform group-hover:scale-110 floating-parallax">
                <BarChart3 className="h-7 w-7" />
              </div>
              <h3 className="mb-3 text-2xl font-bold text-foreground">Phân tích lộ trình</h3>
              <p className="leading-relaxed text-muted-foreground">
                Theo dõi tiến trình của bạn với thông tin chi tiết về hiệu suất và các đề xuất được cá nhân hóa.
              </p>
            </Card>

            <Card className="card-3d floating-element-slow group relative overflow-hidden border-border/50 p-8 transition-all hover:border-primary/50 hover:shadow-xl hover:shadow-primary/5">
              <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-transform group-hover:scale-110 floating-parallax">
                <Trophy className="h-7 w-7" />
              </div>
              <h3 className="mb-3 text-2xl font-bold text-foreground">Bảng xếp hạng</h3>
              <p className="leading-relaxed text-muted-foreground">
                Cạnh tranh với bạn bè và leo lên thứ hạng để duy trì động lực và sự gắn kết.
              </p>
            </Card>

            <Card className="card-3d floating-element-reverse group relative overflow-hidden border-border/50 p-8 transition-all hover:border-primary/50 hover:shadow-xl hover:shadow-primary/5">
              <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-transform group-hover:scale-110 floating-parallax">
                <Target className="h-7 w-7" />
              </div>
              <h3 className="mb-3 text-2xl font-bold text-foreground">Học tập có Mục tiêu</h3>
              <p className="leading-relaxed text-muted-foreground">
                Tập trung vào những điểm yếu của bạn bằng các đề xuất hỗ trợ bởi AI và thử nghiệm thích ứng.
              </p>
            </Card>

            <Card className="card-3d floating-parallax group relative overflow-hidden border-border/50 p-8 transition-all hover:border-primary/50 hover:shadow-xl hover:shadow-primary/5">
              <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-transform group-hover:scale-110 floating-element">
                <Clock className="h-7 w-7" />
              </div>
              <h3 className="mb-3 text-2xl font-bold text-foreground">Mô phỏng theo thời gian thực</h3>
              <p className="leading-relaxed text-muted-foreground">
                Mô phỏng các điều kiện thi thực tế với các bài kiểm tra có tính thời gian và xây dựng kỹ năng quản lý thời gian của bạn.
              </p>
            </Card>

            <Card className="card-3d floating-element-slow group relative overflow-hidden border-border/50 p-8 transition-all hover:border-primary/50 hover:shadow-xl hover:shadow-primary/5">
              <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-transform group-hover:scale-110 floating-element-reverse">
                <Users className="h-7 w-7" />
              </div>
              <h3 className="mb-3 text-2xl font-bold text-foreground">Ai cũng được tham gia</h3>
              <p className="leading-relaxed text-muted-foreground">
                Xây dựng cho mọi người đều cùng nhau luyện tập kiến thức.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Liên hệ  */}
      <footer className="border-t border-border/40 bg-background py-8">
        <div className="container mx-auto px-6">
          <div className="flex flex-col items-center justify-between gap-6 text-center md:flex-row md:text-left">
            <div className="flex items-center gap-3 self-center">
              <img src="src/public/hnue-logo.png" alt="HNUE Logo" className="h-8 w-8" width={32} height={32} />
              <span className="text-lg font-bold text-foreground">ExamPrep</span>
            </div>
            <div className="text-sm text-muted-foreground">
              <p className="text-lg font-bold text-foreground">Mọi Thông Tin Xin Liên Hệ</p>
              <p>Trường Đại Học Sư Phạm Hà Nội</p>
              <p>SĐT: 0813896333 | Địa chỉ: Tòa học liệu số 145 Xuân Thủy, Cầu Giấy, Hà Nội</p>
              <p>Email: haij2004@gmail.com</p>
              <p className="mt-2">&copy; 2025 ExamPrep. </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
