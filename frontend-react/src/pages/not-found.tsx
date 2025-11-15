import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"

function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center">
      <h1 className="text-6xl font-bold text-foreground">404</h1>
      <p className="mt-4 text-lg text-muted-foreground">Oops! The page you are looking for does not exist.</p>
      <Link to="/">
        <Button className="mt-6">Go Home</Button>
      </Link>
    </div>
  )
}

export default NotFoundPage
