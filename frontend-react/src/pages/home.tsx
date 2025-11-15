import { useEffect } from "react"
import {  useNavigate } from "react-router-dom"
import { useAuth } from "@/contexts/auth-context"
import { ExamMenu } from "@/components/exam-menu"
//import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {  BarChart3, Trophy, Target, Clock, Users } from "lucide-react"

export function HomePage() {
  const { user, isLoading } = useAuth()
  const navigate = useNavigate()

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
      <section
        className="relative flex min-h-screen items-center justify-center overflow-hidden bg-cover bg-center"
        style={{ backgroundImage: "url('src/public/anhnen.jpg')" }}
      >
        <div className="absolute inset-0 bg-black/60" />
        <div className="container relative mx-auto px-6">
          <div className="mx-auto max-w-4xl text-center">
            <h1 className="mb-6 text-balance text-6xl font-bold leading-tight tracking-tight text-foreground md:text-7xl">
              Hệ Thống Luyện Thi Trực Tuyến{" "}
              <span className="block text-primary drop-shadow-[0_2px_4px_hsl(var(--primary)/0.8)] md:inline">
              ExamPrep
              </span>
            </h1>
            <p className="mb-10 text-pretty text-xl leading-relaxed text-primary-foreground/80 md:text-2xl">
              Chinh phục đỉnh cao, chắp cánh vươn cao
            </p>
            {/* <div className="flex flex-wrap items-center justify-center gap-4">
              <Link to="/register">
                <Button size="lg" className="h-14 rounded-full px-10 text-lg shadow-xl shadow-primary/20">
                  Start Learning Free
                </Button>
              </Link>
              <Link to="/login">
                <Button size="lg" variant="outline" className="h-14 rounded-full px-10 text-lg bg-transparent">
                  Sign In
                </Button>
              </Link>
            </div> */}
          </div>
        </div>
      </section>

      <section className="border-y border-border/40 bg-muted/30 py-16">
        <div className="container mx-auto px-6">
          <div className="grid gap-8 md:grid-cols-3">
            <div className="text-center">
              <div className="mb-2 text-5xl font-bold text-primary">10K+</div>
              <div className="text-lg text-muted-foreground">Học sinh tham gia</div>
            </div>
            <div className="text-center">
              <div className="mb-2 text-5xl font-bold text-primary">500+</div>
              <div className="text-lg text-muted-foreground">Bài luyện tập</div>
            </div>
            <div className="text-center">
              <div className="mb-2 text-5xl font-bold text-primary">95%</div>
              <div className="text-lg text-muted-foreground">Đạt kết quả cao</div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-24">
        <div className="container mx-auto px-6">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-4xl font-bold tracking-tight text-foreground md:text-5xl">
              Mọi Thứ Bạn Cần Để Xuất Sắc
            </h2>
            <p className="text-xl text-muted-foreground">Các tính năng mạnh mẽ được tích hợp hiện đại </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card className="group relative overflow-hidden border-border/50 p-8 transition-all hover:border-primary/50 hover:shadow-xl hover:shadow-primary/5">
              <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-transform group-hover:scale-110">
                <BarChart3 className="h-7 w-7" />
              </div>
              <h3 className="mb-3 text-2xl font-bold text-foreground">Phân tích lộ trình</h3>
              <p className="leading-relaxed text-muted-foreground">
                Theo dõi tiến trình của bạn với thông tin chi tiết về hiệu suất và các đề xuất được cá nhân hóa.
              </p>
            </Card>

            <Card className="group relative overflow-hidden border-border/50 p-8 transition-all hover:border-primary/50 hover:shadow-xl hover:shadow-primary/5">
              <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-transform group-hover:scale-110">
                <Trophy className="h-7 w-7" />
              </div>
              <h3 className="mb-3 text-2xl font-bold text-foreground">Bảng xếp hạng</h3>
              <p className="leading-relaxed text-muted-foreground">
                Cạnh tranh với bạn bè và leo lên thứ hạng để duy trì động lực và sự gắn kết.
              </p>
            </Card>

            <Card className="group relative overflow-hidden border-border/50 p-8 transition-all hover:border-primary/50 hover:shadow-xl hover:shadow-primary/5">
              <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-transform group-hover:scale-110">
                <Target className="h-7 w-7" />
              </div>
              <h3 className="mb-3 text-2xl font-bold text-foreground">Học tập có Mục tiêu</h3>
              <p className="leading-relaxed text-muted-foreground">
                Tập trung vào những điểm yếu của bạn bằng các đề xuất hỗ trợ bởi AI và thử nghiệm thích ứng.
              </p>
            </Card>

            <Card className="group relative overflow-hidden border-border/50 p-8 transition-all hover:border-primary/50 hover:shadow-xl hover:shadow-primary/5">
              <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-transform group-hover:scale-110">
                <Clock className="h-7 w-7" />
              </div>
              <h3 className="mb-3 text-2xl font-bold text-foreground">Mô phỏng theo thời gian thực</h3>
              <p className="leading-relaxed text-muted-foreground">
                Mô phỏng các điều kiện thi thực tế với các bài kiểm tra có tính thời gian và xây dựng kỹ năng quản lý thời gian của bạn.
              </p>
            </Card>

            <Card className="group relative overflow-hidden border-border/50 p-8 transition-all hover:border-primary/50 hover:shadow-xl hover:shadow-primary/5">
              <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-transform group-hover:scale-110">
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

      {/* <section className="py-24">
        <div className="container mx-auto px-6">
          <Card className="relative overflow-hidden border-0 bg-linear-to-br from-primary to-primary/80 p-12 text-center shadow-2xl shadow-primary/20 md:p-16">
            <div className="absolute inset-0 bg-[url('/abstract-geometric-flow.png')] opacity-10" />
            <div className="relative">
              <h2 className="mb-4 text-4xl font-bold text-primary-foreground md:text-5xl">
                Ready to Transform Your Learning?
              </h2>
              <p className="mb-8 text-xl leading-relaxed text-primary-foreground/90">
                Join thousands of students achieving their academic goals with ExamPrep
              </p>
              <Link to="/register">
                <Button size="lg" variant="secondary" className="h-14 rounded-full px-10 text-lg shadow-xl hover:scale-105">
                  Create Free Account
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </section> */}

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
