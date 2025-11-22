import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"

function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center">
      <h1 className="text-6xl font-bold text-foreground">404</h1>
      <p className="mt-4 text-lg text-muted-foreground">Oops! Không tìm thấy trang bạn muốn tìm.</p>
      <Link to="/">
        <Button className="mt-6">Về trang chính</Button>
      </Link>
    </div>
  )
}

export default NotFoundPage
