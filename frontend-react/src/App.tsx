import { Suspense, lazy } from "react"
import type { ReactElement } from "react"
import { Navigate, Route, Routes } from "react-router-dom"
import { HomePage } from "@/pages/home"
import { LoginPage } from "@/pages/login"
import { RegisterPage } from "@/pages/register" 
import { ForgotPasswordPage } from "@/pages/forgot-password" 
import { ChangePasswordPage } from "@/pages/change-password"
import { TeacherPage } from "@/pages/teacher"
import { CreateTestPage } from "@/pages/create-test"
import TeacherGrading from "@/pages/teacher-grading"
import { DashboardPage } from "@/pages/dashboard"
import { TestsPage } from "@/pages/tests"
import { TestDetailPage } from "@/pages/test-detail"
import { ResultsPage } from "@/pages/results"
import { ResultDetailPage } from "@/pages/result-detail"
import { LeaderboardPage } from "@/pages/leaderboard"
import { ProfilePage } from "@/pages/profile"
import { AdminPage } from "@/pages/admin.tsx"
import { useAuth } from "@/contexts/auth-context"
import type { UserRole } from "@/lib/types"

const LazyNotFound = lazy(() => import("@/pages/not-found"))

function ProtectedRoute({ children, roles }: { children: ReactElement; roles?: UserRole[] }) {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg text-muted-foreground">Loading...</div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />
  }

  return children
}

function App() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-lg text-muted-foreground">Loading...</div>
        </div>
      }
    >
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} /> 
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/change-password"
          element={
            <ProtectedRoute>
              <ChangePasswordPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher"
          element={
            <ProtectedRoute roles={["teacher"]}>
              <TeacherPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/create-test"
          element={
            <ProtectedRoute roles={["teacher"]}>
              <CreateTestPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/edit-test/:id"
          element={
            <ProtectedRoute roles={["teacher"]}>
              <CreateTestPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/grading"
          element={
            <ProtectedRoute roles={["teacher"]}>
              <TeacherGrading />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/tests"
          element={
            <ProtectedRoute>
              <TestsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/test/:id"
          element={
            <ProtectedRoute>
              <TestDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/results"
          element={
            <ProtectedRoute>
              <ResultsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/result/:id"
          element={
            <ProtectedRoute>
              <ResultDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/leaderboard"
          element={
            <ProtectedRoute>
              <LeaderboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute roles={["admin"]}>
              <AdminPage />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<LazyNotFound />} />
      </Routes>
    </Suspense>
  )
}

export default App
