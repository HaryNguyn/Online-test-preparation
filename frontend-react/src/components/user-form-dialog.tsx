import { useState, useEffect, type FormEvent } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { User as UserType, UserRole } from "@/lib/types"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Eye, EyeOff } from "lucide-react"

type DemoUser = UserType & { id: string }

interface UserFormDialogProps {
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
  onSave: (user: DemoUser) => void
  user: DemoUser | null
}

export function UserFormDialog({ isOpen, onOpenChange, onSave, user }: UserFormDialogProps) {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [role, setRole] = useState<UserRole>("student")
  const [grade, setGrade] = useState("")
  const [error, setError] = useState("")
  const [showPassword, setShowPassword] = useState(false)

  const isNewUser = !user

  useEffect(() => {
    if (isOpen) {
      setError("")
      if (user) {
        setName(user.name)
        setEmail(user.email)
        setRole(user.role)
        setGrade(user.grade || "")
        setPassword("") // Clear password field for editing
      } else {
        // Reset form for new user
        setName("")
        setEmail("")
        setPassword("")
        setRole("student")
        setGrade("")
      }
    }
  }, [isOpen, user])

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError("")

    if (role === "student" && !grade) {
      setError("Please select a grade for the student.")
      return
    }

    if (isNewUser && password) {
      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
      if (!passwordRegex.test(password)) {
        setError(
          "Password must be at least 8 characters, and include an uppercase letter, a lowercase letter, a number, and a special character.",
        )
        return
      }
    }

    const savedUser: DemoUser = {
      id: user?.id || Date.now().toString(), // Create a new ID for new user
      name,
      email,
      role,
      grade: role === "student" ? grade : undefined,
      createdAt: user?.createdAt || new Date().toISOString(),
      ...(isNewUser && password ? { password } : {}),
    }

    onSave(savedUser)
    onOpenChange(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{isNewUser ? "Add New User" : "Edit User"}</DialogTitle>
            <DialogDescription>
              {isNewUser ? "Fill in the details to create a new user." : `Editing details for ${user?.name}.`}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            {isNewUser && (
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input id="password" type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} className="pr-10" />
                  <Button type="button" variant="ghost" size="sm" className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent" onClick={() => setShowPassword((prev) => !prev)}>
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select value={role} onValueChange={(value) => setRole(value as UserRole)}>
                <SelectTrigger id="role"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="student">Student</SelectItem>
                  <SelectItem value="teacher">Teacher</SelectItem>
                  <SelectItem value="parent">Parent</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {role === "student" && (
              <div className="space-y-2">
                <Label htmlFor="grade">Grade</Label>
                <Input id="grade" value={grade} onChange={(e) => setGrade(e.target.value)} placeholder="e.g., Grade 10" />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button type="submit">Save changes</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}