import { useEffect, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useAuth } from "@/contexts/auth-context"
import { DashboardHeader } from "@/components/dashboard-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { api } from "@/lib/api"
import { storage } from "@/lib/storage"
import { ArrowLeft, User, Upload, X } from "lucide-react"
import { Progress } from "@/components/ui/progress"

export function ProfilePage() {
  const { user, setUser } = useAuth()
  const navigate = useNavigate()
  const [name, setName] = useState("")
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [uploadProgress, setUploadProgress] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    if (user) {
      setName(user.name)
      if (user.avatar_url) {
        setAvatarPreview(user.avatar_url)
      }
    }
  }, [user])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        setError("Please select an image file")
        return
      }
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError("Image size must be less than 5MB")
        return
      }
      setError(null)
      setAvatarFile(file)
      // Create preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const removeAvatar = () => {
    setAvatarFile(null)
    setAvatarPreview(user?.avatar_url || null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setIsLoading(true)
    setError(null)
    setSuccess(null)

    try {
      let avatarUrl = user.avatar_url || null

      // Upload avatar if a new file is selected
      if (avatarFile) {
        setUploadProgress(0)
        try {
          const formData = new FormData()
          formData.append("file", avatarFile)

          const xhr = new XMLHttpRequest()
          xhr.open("POST", `${(import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "http://localhost:8080/api"}/upload`, true)

          xhr.upload.onprogress = (event) => {
            if (event.lengthComputable) {
              const percentage = Math.round((event.loaded * 100) / event.total)
              setUploadProgress(percentage)
            }
          }

          await new Promise<void>((resolve, reject) => {
            xhr.onload = () => {
              if (xhr.status >= 200 && xhr.status < 300) {
                const response = JSON.parse(xhr.responseText)
                avatarUrl = response.url
                resolve()
              } else {
                reject(new Error(`Upload failed with status: ${xhr.status}`))
              }
            }
            xhr.onerror = () => reject(new Error("Upload failed due to a network error."))
            xhr.send(formData)
          })
        } catch (uploadError) {
          console.error("Avatar upload error:", uploadError)
          setError("Failed to upload avatar. Please try again.")
          setIsLoading(false)
          setUploadProgress(null)
          return
        } finally {
          setUploadProgress(null)
        }
      }

      // Update profile
      const updatePayload: { name: string; avatar_url?: string | null } = {
        name: name.trim(),
      }
      // Only update avatar_url if we have a new file or explicitly want to remove it
      if (avatarFile) {
        updatePayload.avatar_url = avatarUrl
      } else if (!avatarPreview && user.avatar_url) {
        // If preview was removed and user had an avatar, set to null
        updatePayload.avatar_url = null
      }

      const response = await api.updateProfile(user.id, updatePayload)
      
      // Update user in context and storage
      if (response.user) {
        setUser(response.user)
        storage.saveCurrentUser(response.user)
      }

      setSuccess("Profile updated successfully!")
      setTimeout(() => {
        setSuccess(null)
      }, 3000)
    } catch (err: any) {
      console.error("Update profile error:", err)
      setError(err.message || "Failed to update profile. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg text-muted-foreground">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Button asChild variant="ghost" size="sm" className="mb-4">
            <Link to="/dashboard">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Link>
          </Button>
          <h1 className="mb-2 text-3xl font-bold text-foreground">Profile Settings</h1>
          <p className="text-muted-foreground">Update your profile information and avatar</p>
        </div>

        <div className="mx-auto max-w-2xl">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>Manage your account settings and preferences</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Avatar Section */}
                <div className="space-y-4">
                  <Label>Profile Picture</Label>
                  <div className="flex items-center gap-6">
                    <Avatar className="h-24 w-24">
                      {avatarPreview ? (
                        <AvatarImage src={avatarPreview} alt={user.name} />
                      ) : null}
                      <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                        {getInitials(user.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-2">
                      <div className="flex gap-2">
                        <Input
                          id="avatar-upload"
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleFileChange}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => document.getElementById('avatar-upload')?.click()}
                        >
                          <Upload className="mr-2 h-4 w-4" />
                          {avatarFile ? "Change Image" : "Upload Image"}
                        </Button>
                        {avatarPreview && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={removeAvatar}
                          >
                            <X className="mr-2 h-4 w-4" />
                            Remove
                          </Button>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Recommended: Square image, at least 200x200 pixels. Max size: 5MB
                      </p>
                      {uploadProgress !== null && (
                        <div className="space-y-1">
                          <Progress value={uploadProgress} className="h-2" />
                          <p className="text-xs text-muted-foreground">
                            Uploading... {uploadProgress}%
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Name Section */}
                <div className="space-y-2">
                  <Label htmlFor="name">
                    <User className="mr-2 inline h-4 w-4" />
                    Full Name
                  </Label>
                  <Input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your full name"
                    required
                    minLength={2}
                    maxLength={100}
                  />
                </div>

                {/* Email (read-only) */}
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={user.email}
                    disabled
                    className="bg-muted"
                  />
                  <p className="text-xs text-muted-foreground">
                    Email cannot be changed. Contact administrator if you need to update it.
                  </p>
                </div>

                {/* Role (read-only) */}
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Input
                    id="role"
                    type="text"
                    value={user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                    disabled
                    className="bg-muted"
                  />
                </div>

                {/* Error Message */}
                {error && (
                  <div className="rounded-lg border border-destructive bg-destructive/10 p-3">
                    <p className="text-sm text-destructive">{error}</p>
                  </div>
                )}

                {/* Success Message */}
                {success && (
                  <div className="rounded-lg border border-success bg-success/10 p-3">
                    <p className="text-sm text-success">{success}</p>
                  </div>
                )}

                {/* Submit Button */}
                <div className="flex justify-end gap-3">
                  <Button type="button" variant="outline" onClick={() => navigate(-1)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isLoading || uploadProgress !== null}>
                    {isLoading ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}

