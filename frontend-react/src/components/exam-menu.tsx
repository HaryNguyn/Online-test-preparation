import { Suspense, lazy } from "react"
import { useAuth } from "@/contexts/auth-context.tsx"

const StaggeredMenu = lazy(() => import("./staggered-menu"))

// Define types that match StaggeredMenu's expectations
type MenuItem = {
  label: string
  ariaLabel: string
  link: string
}

type SocialItem = {
  label: string
  link: string
}

export function ExamMenu() {
  const { user } = useAuth()

  const getMenuItems = (): MenuItem[] => {
    if (!user) {
      return [
        { label: "Home", ariaLabel: "Go to home page", link: "/" },
        { label: "Login", ariaLabel: "Login to your account", link: "/login" },
        { label: "Register", ariaLabel: "Create new account", link: "/register" },
      ]
    }

    if (user.role === "student" || user.role === "parent") {
      return [
        { label: "Dashboard", ariaLabel: "Go to dashboard", link: "/dashboard" },
        { label: "Tests", ariaLabel: "Browse all tests", link: "/tests" },
        { label: "Results", ariaLabel: "View your results", link: "/results" },
        { label: "Leaderboard", ariaLabel: "View leaderboard", link: "/leaderboard" },
      ]
    }

    if (user.role === "teacher") {
      return [
        { label: "Dashboard", ariaLabel: "Go to teacher dashboard", link: "/teacher" },
        { label: "Create Test", ariaLabel: "Create new test", link: "/teacher/create-test" },
      ]
    }

    if (user.role === "admin") {
      return [
        { label: "Dashboard", ariaLabel: "Go to admin dashboard", link: "/admin" },
        { label: "Users", ariaLabel: "Manage users", link: "/admin" },
      ]
    }

    return []
  }

  const socialItems: SocialItem[] = [
    { label: "Facebook", link: "https://web.facebook.com/lee.ang.739353" },
    { label: "Instagram", link: "https://www.instagram.com/ang_hari24/" },
    { label: "GitHub", link: "https://github.com/HaryNguyn" },
  ]

  return (
    <Suspense fallback={null}>
      <StaggeredMenu
        position="right"
        items={getMenuItems() as never[]}
        socialItems={socialItems as never[]}
        displaySocials
        displayItemNumbering
        menuButtonColor="#fff"
        openMenuButtonColor="#000"
        changeMenuColorOnOpen
        colors={["#6366f1", "#4f46e5"]}
        logoUrl="/hnue-logo.png"
        accentColor="#6366f1"
        isFixed
        className=""
        onMenuOpen={() => { }}
        onMenuClose={() => { }}
      />
    </Suspense>
  )
}