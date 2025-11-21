import { useAuth } from "@/contexts/auth-context.tsx"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { LogOut, KeyRound, User, Video, ArrowLeft } from "lucide-react"
import { Link, useNavigate, useLocation } from "react-router-dom"

export function DashboardHeader() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = () => {
    logout()
    navigate("/", { replace: true })
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
  }

  const getDashboardLink = () => {
    if (!user) return "/dashboard"
    if (user.role === "admin") return "/admin"
    if (user.role === "teacher") return "/teacher"
    return "/dashboard"
  }

  const showBackButton = user?.role === "student" && location.pathname === "/videos"

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to={getDashboardLink()} className="flex items-center gap-2">
          <img src="/src/public/hnue-logo.png" alt="HNUE Logo" className="h-10 w-10" width={100} height={100} />
          <span className="text-xl font-semibold text-foreground">ExamPrep</span>
        </Link>

        <div className="flex items-center gap-4">
          {showBackButton && (
            <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Quay lại 
            </Button>
          )}
          {user?.role === "student" && !showBackButton && (
            <Link to="/videos">
              <Button variant="ghost" size="sm">
                <Video className="mr-2 h-4 w-4" />
                 Khóa học
              </Button>
            </Link>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                <Avatar>
                  {user?.avatar_url ? (
                    <AvatarImage src={user.avatar_url} alt={user.name} />
                  ) : null}
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {user ? getInitials(user.name) : "U"}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{user?.name}</p>
                  <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                  {user?.grade && <p className="text-xs leading-none text-muted-foreground">{user.grade}</p>}
                  {user?.role && (
                    <p className="text-xs font-medium capitalize leading-none text-primary">{user.role}</p>
                  )}
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/profile" className="flex items-center cursor-pointer">
                  <User className="mr-2 h-4 w-4" />
                  <span>Chỉnh sửa tài khoản</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/change-password" className="flex items-center cursor-pointer">
                  <KeyRound className="mr-2 h-4 w-4" />
                  <span>Đổi mật khẩu</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Đăng xuất</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
