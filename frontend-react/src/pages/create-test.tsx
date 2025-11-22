import React, { useState, useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { useAuth } from "@/contexts/auth-context"
import { DashboardHeader } from "@/components/dashboard-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert" 
import { PlusCircle, Trash2, AlertCircle, Image as ImageIcon, Paperclip } from "lucide-react"
import { FileAudio } from "lucide-react"
import { api } from "@/lib/api"
import type { ExamQuestionDTO } from "@/lib/types"

type Question = Omit<ExamQuestionDTO, "id" | "exam_id"> & {
  localId: string | number
  question_text: string
  question_type: 'multiple_choice_single' | 'multiple_choice_multiple' | 'essay'
  options: string[]
  correct_answer: number | number[]
  explanation?: string | null
  image_file?: File | null
  audio_file?: File | null
  image_upload_progress?: number | null
  audio_upload_progress?: number | null
  image_url?: string | null
  audio_url?: string | null
}

const uploadFileWithProgress = (file: File, onProgress: (percentage: number) => void): Promise<string> => {
  return new Promise((resolve, reject) => {
    const formData = new FormData()
    formData.append("file", file)

    const xhr = new XMLHttpRequest()
    xhr.open("POST", `${(import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "http://localhost:8080/api"}/upload`, true)

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        const percentage = Math.round((event.loaded * 100) / event.total)
        onProgress(percentage)
      }
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        const response = JSON.parse(xhr.responseText)
        resolve(response.url) // Giả sử API trả về { url: "..." }
      } else {
        reject(new Error(`Upload failed with status: ${xhr.status}`))
      }
    }

    xhr.onerror = () => {
      reject(new Error("Upload failed due to a network error."))
    }

    xhr.send(formData)
  })
}

export function CreateTestPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { id: examId } = useParams<{ id: string }>()

  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [subject, setSubject] = useState("")
  const [gradeLevel, setGradeLevel] = useState("")
  const [duration, setDuration] = useState(30)
  const [questions, setQuestions] = useState<Question[]>([
    {
      localId: Date.now(), question_text: "", question_type: 'multiple_choice_single', options: ["", "", "", ""], correct_answer: 0, explanation: "",
      image_file: null, audio_file: null, image_upload_progress: null, audio_upload_progress: null,
    },
  ])
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const isEditing = !!examId

  useEffect(() => {
    if (isEditing) {
      setIsLoading(true)
      api.getExam(examId)
        .then(response => {
          const exam = response.exam
          setTitle(exam.title)
          setDescription(exam.description || "")
          setSubject(exam.subject || "")
          setGradeLevel(exam.grade_level || "")
          setDuration(exam.duration)
          setQuestions((exam.questions || []).map((q) => ({
            localId: q.id, // Use the actual question ID from backend
            question_text: q.question_text,
            question_type: (q.question_type as any) || 'multiple_choice_single',
            options: Array.isArray(q.options) ? q.options : [],
            correct_answer: q.question_type === 'multiple_choice_multiple'
              ? (Array.isArray(q.correct_answer) ? q.correct_answer : [])
              : (typeof q.correct_answer === 'number' ? q.correct_answer : 0),
            explanation: q.explanation || null,
            image_file: null,
            audio_file: null,
            image_upload_progress: null,
            audio_upload_progress: null,
            image_url: q.image_url || null,
            audio_url: q.audio_url || null,
          })))
        })
        .catch(() => setError("Failed to load exam data for editing."))
        .finally(() => setIsLoading(false))
    }
  }, [isEditing, examId])

  const addQuestion = () => {
    const newQuestion: Question = {
      localId: Date.now(), question_text: "", question_type: 'multiple_choice_single', options: ["", "", "", ""], correct_answer: 0, explanation: "",
      image_file: null, audio_file: null, image_upload_progress: null, audio_upload_progress: null,
    }
    setQuestions([...questions, newQuestion])
  }

  const removeQuestion = (localId: string | number) => {
    if (questions.length > 1) {
      setQuestions(questions.filter(q => q.localId !== localId))
    }
  }

  const handleQuestionChange = (localId: string | number, field: keyof Question, value: any) => {
    setQuestions(questions.map(q => q.localId === localId ? { ...q, [field]: value } : q))
  }

  const handleOptionChange = (qLocalId: string | number, optIndex: number, value: string) => {
    setQuestions(questions.map(q => {
      if (q.localId === qLocalId) {
        const newOptions = [...q.options]
        newOptions[optIndex] = value
        return { ...q, options: newOptions }
      }
      return q
    }))
  }
  
  const handleFileChange = (qLocalId: string | number, fileType: 'image' | 'audio', file: File | null) => {
    if (file && file.size > 500 * 1024 * 1024) { // 500MB check
      alert(`File is too large. Maximum size is 500MB.`)
      return
    }

    setQuestions(questions.map(q => q.localId === qLocalId ? { 
      ...q, 
      [`${fileType}_file`]: file,
      [`${fileType}_upload_progress`]: file ? 0 : null, // Reset progress when file changes
    } : q))
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError("")
    setSuccess("")
    setIsLoading(true)

    if (!title || !subject || !gradeLevel) {
      setError("Title, Subject, and Grade are required.")
      setIsLoading(false)
      return
    }

    try {
      const processedQuestions = await Promise.all(
        questions.map(async (q: Question) => {
          let imageUrl = q.image_url || null
          let audioUrl = q.audio_url || null

          if (q.image_file) {
            imageUrl = await uploadFileWithProgress(q.image_file, (percentage: number) => {
              handleQuestionChange(q.localId, 'image_upload_progress', percentage)
            })
          }
          if (q.audio_file) {
            audioUrl = await uploadFileWithProgress(q.audio_file, (percentage: number) => {
              handleQuestionChange(q.localId, 'audio_upload_progress', percentage)
            })
          }

          // Exclude properties that should not be sent to the backend
          const { localId, image_file, audio_file, image_upload_progress, audio_upload_progress, ...rest } = q;

          const baseQuestion = {
            ...rest,
            image_url: imageUrl,
            audio_url: audioUrl,
          };

          return {
            ...baseQuestion,
            id: typeof localId === "string" ? localId : `temp-${localId}`,
          };
        })
      )

      const examData = {
          title,
          description,
          subject,
          grade_level: gradeLevel,
          duration,
          created_by: user?.id,
          status: 'pending', // Always submit for review on save
          questions: processedQuestions,
      }

      if (isEditing) {
        // For updates, ensure all questions have proper IDs
        await api.updateExam(examId, examData);
        setSuccess("Exam updated successfully!");
        setTimeout(() => setSuccess(""), 5000); // Clear success message after 5 seconds
      } else {
        await api.createExam(examData);
        navigate("/teacher");
      }
    } catch (err) {
      setError((err as Error).message || "Failed to create exam.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      <main className="container mx-auto px-4 py-8">
        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle className="text-2xl">{isEditing ? "Edit Exam" : "Create a New Exam"}</CardTitle>
            <CardDescription>{isEditing ? "Update the exam details and questions." : "Fill in the details and add questions for your exam."}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-8">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              {success && (
                <Alert variant="default" className="border-green-500/50 bg-green-500/10 text-green-700 dark:text-green-400">
                  <AlertCircle className="h-4 w-4 text-green-500!" />
                  <AlertTitle>Success</AlertTitle>
                  <AlertDescription>{success}</AlertDescription>
                </Alert>
              )}

              {/* Exam Details */}
              <div className="space-y-4 rounded-lg border p-4">
                <h3 className="text-lg font-medium">Chi tiết bài kiểm tra</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2"><Label htmlFor="title">Tiêu đề</Label><Input id="title" value={title} onChange={e => setTitle(e.target.value)} required /></div>
                  <div className="space-y-2"><Label htmlFor="subject">Môn học</Label><Input id="subject" value={subject} onChange={e => setSubject(e.target.value)} required /></div>
                  <div className="space-y-2"><Label htmlFor="grade">Cấp lớp</Label><Input id="grade" value={gradeLevel} onChange={e => setGradeLevel(e.target.value)} required /></div>
                  <div className="space-y-2"><Label htmlFor="duration">Thời lượng (phút)</Label><Input id="duration" type="number" value={duration} onChange={e => setDuration(Number(e.target.value))} required /></div>
                </div>
                <div className="space-y-2"><Label htmlFor="description">Mô tả</Label><Textarea id="description" value={description} onChange={e => setDescription(e.target.value)} /></div>
              </div>

              {/* Questions */}
              <div className="space-y-6">
                <h3 className="text-lg font-medium">Câu hỏi</h3>
                {questions.map((q, qIndex) => (
                  <div key={q.localId} className="space-y-4 rounded-lg border p-4 relative">
                    <div className="flex justify-between items-center">
                      <Label className="text-base">Câu hỏi {qIndex + 1}</Label>
                      {questions.length > 1 && <Button type="button" variant="ghost" size="icon" className="text-destructive" onClick={() => removeQuestion(q.localId)}><Trash2 className="h-4 w-4" /></Button>}
                    </div>
                    <div className="space-y-2">
                      <Label>Loại câu hỏi</Label>
                      <Select value={q.question_type} onValueChange={value => handleQuestionChange(q.localId, 'question_type', value as any)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="multiple_choice_single">Lựa chọn đơn</SelectItem>
                          <SelectItem value="multiple_choice_multiple">Lựa chọn nhiều</SelectItem>
                          <SelectItem value="essay">Tự luận</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Textarea placeholder="Nhập nội dung câu hỏi..." value={q.question_text} onChange={e => handleQuestionChange(q.localId, 'question_text', e.target.value)} required />
                    {q.question_type !== 'essay' && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {q.options.map((opt, optIndex) => (
                          <div key={optIndex} className="space-y-2">
                            <Label htmlFor={`q${q.localId}-opt${optIndex}`}>Lựa chọn {optIndex + 1}</Label>
                            <Input id={`q${q.localId}-opt${optIndex}`} value={opt} onChange={e => handleOptionChange(q.localId as any, optIndex, e.target.value)} required />
                          </div>
                        ))}
                      </div>
                    )}
                    {q.question_type === 'multiple_choice_single' && (
                      <div className="space-y-2">
                        <Label>Đáp án đúng</Label>
                        <Select value={String(q.correct_answer)} onValueChange={value => handleQuestionChange(q.localId, 'correct_answer', Number(value))}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {q.options.map((_, optIndex) => (
                              <SelectItem key={optIndex} value={String(optIndex)}>Lựa chọn {optIndex + 1}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    {q.question_type === 'multiple_choice_multiple' && (
                      <div className="space-y-2">
                        <Label>Đáp án đúng (Chọn tất cả các đáp án phù hợp)</Label>
                        <div className="space-y-2">
                          {q.options.map((opt, optIndex) => (
                            <div key={optIndex} className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                id={`q${q.localId}-correct-${optIndex}`}
                                checked={Array.isArray(q.correct_answer) && q.correct_answer.includes(optIndex)}
                                onChange={(e) => {
                                  const currentAnswers = Array.isArray(q.correct_answer) ? q.correct_answer : [];
                                  if (e.target.checked) {
                                    handleQuestionChange(q.localId, 'correct_answer', [...currentAnswers, optIndex]);
                                  } else {
                                    handleQuestionChange(q.localId, 'correct_answer', currentAnswers.filter(ans => ans !== optIndex));
                                  }
                                }}
                              />
                              <Label htmlFor={`q${q.localId}-correct-${optIndex}`}>{opt || `Option ${optIndex + 1}`}</Label>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {q.question_type === 'essay' && (
                      <div className="space-y-2">
                        <Label>Câu hỏi tự luận</Label>
                        <p className="text-sm text-muted-foreground">Học sinh sẽ cung cấp câu trả lời bằng văn bản. Không cần đáp án đúng định trước.</p>
                      </div>
                    )}
                    <div className="space-y-2">
                      <Label htmlFor={`q${q.localId}-explanation`}>Giải thích (Tùy chọn)</Label>
                      <Textarea id={`q${q.localId}-explanation`} placeholder="Giải thích tại sao đây là đáp án đúng..." value={q.explanation || ""} onChange={e => handleQuestionChange(q.localId, 'explanation', e.target.value)} />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor={`q${q.localId}-image`}>Đính kèm hình ảnh (Tối đa 500MB)</Label>
                        <div className="flex items-center gap-2">
                          <ImageIcon className="h-5 w-5 text-muted-foreground" />
                          <Input id={`q${q.localId}-image`} type="file" accept="image/*" className="text-xs" onChange={e => handleFileChange(q.localId, 'image', e.target.files ? e.target.files[0] : null)} />
                        </div>
                        {q.image_file && (
                          <div className="mt-2">
                            <p className="text-xs text-muted-foreground flex items-center gap-1"><Paperclip className="h-3 w-3" /> {q.image_file.name}</p>
                            {q.image_upload_progress != null && q.image_upload_progress < 100 && <Progress value={q.image_upload_progress} className="h-1 mt-1" />}
                          </div>
                        )}
                        {q.image_url && !q.image_file && (
                          <div className="mt-2">
                            <p className="text-xs text-muted-foreground flex items-center gap-1"><ImageIcon className="h-3 w-3" /> Hình ảnh đã đính kèm</p>
                          </div>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`q${q.localId}-audio`}>Đính kèm tệp âm thanh</Label>
                        <div className="flex items-center gap-2">
                          <FileAudio className="h-5 w-5 text-muted-foreground" />
                          <Input id={`q${q.localId}-audio`} type="file" accept="audio/*" className="text-xs" onChange={e => handleFileChange(q.localId, 'audio', e.target.files ? e.target.files[0] : null)} />
                        </div>
                        {q.audio_file && (
                          <div className="mt-2">
                            <p className="text-xs text-muted-foreground flex items-center gap-1"><Paperclip className="h-3 w-3" /> {q.audio_file.name}</p>
                            {q.audio_upload_progress != null && q.audio_upload_progress < 100 && <Progress value={q.audio_upload_progress} className="h-1 mt-1" />}
                          </div>
                        )}
                        {q.audio_url && !q.audio_file && (
                          <div className="mt-2">
                            <p className="text-xs text-muted-foreground flex items-center gap-1"><FileAudio className="h-3 w-3" /> Âm thanh đã đính kèm</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                <Button type="button" variant="outline" onClick={addQuestion}><PlusCircle className="mr-2 h-4 w-4" /> Thêm câu hỏi</Button>
              </div>

              <div className="flex justify-end">
                <Button type="submit" disabled={isLoading}>{isLoading ? "Đang lưu..." : "Lưu và gửi để xem xét"}</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}