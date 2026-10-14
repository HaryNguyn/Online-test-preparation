import { useState, useRef, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { MessageCircle, X, Send, Bot, User, BookOpen, Video, Trophy, Clock, Play, ExternalLink } from "lucide-react"
import { cn } from "@/lib/utils"
import { generateResponse, type ChatbotResponse } from "@/lib/gemini"
import type { Test, VideoDTO, TestResult, LeaderboardEntry } from "@/lib/types"
import { useAuth } from "@/contexts/auth-context"

interface Message {
  id: string
  text: string
  sender: "user" | "bot"
  timestamp: Date
  searchResults?: {
    tests?: Test[]
    videos?: VideoDTO[]
    results?: TestResult[]
    leaderboard?: LeaderboardEntry[]
    userRank?: number
  }
}

// Helper functions to manage user name in localStorage
const getUserName = (): string | null => {
  if (typeof window === "undefined") return null
  return window.localStorage.getItem("chatbot_user_name")
}

const saveUserName = (name: string): void => {
  if (typeof window === "undefined") return
  window.localStorage.setItem("chatbot_user_name", name)
}

const getGreetingMessage = (userName: string | null, userFromAuth: { name: string } | null): string => {
  const name = userName || userFromAuth?.name || null
  
  if (name) {
    return `Xin chào ${name}! 👋 Rất vui được gặp lại bạn. Tôi là trợ lý ảo của ExamPrep. Tôi có thể giúp bạn tìm kiếm và giải đáp các câu hỏi về kiến thức học tập. Bạn cần giúp gì hôm nay?`
  }
  
  return "Xin chào! Tôi là trợ lý ảo của ExamPrep. Tôi có thể giúp bạn tìm kiếm và giải đáp các câu hỏi về kiến thức học tập. Bạn cần giúp gì?"
}

export function Chatbot() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [isOpen, setIsOpen] = useState(false)
  
  // Initialize with greeting message that includes user name if available
  const [messages, setMessages] = useState<Message[]>(() => {
    const userName = getUserName()
    const greeting = getGreetingMessage(userName, user)
    return [
      {
        id: "1",
        text: greeting,
        sender: "bot",
        timestamp: new Date(),
      },
    ]
  })
  
  const [inputValue, setInputValue] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  // Update greeting when user changes or when chatbot opens
  useEffect(() => {
    if (isOpen && messages.length === 1) {
      const userName = getUserName()
      const greeting = getGreetingMessage(userName, user)
      if (messages[0].text !== greeting) {
        setMessages([
          {
            id: "1",
            text: greeting,
            sender: "bot",
            timestamp: new Date(),
          },
        ])
      }
    }
  }, [isOpen, user])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputValue,
      sender: "user",
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    const currentInput = inputValue
    setInputValue("")
    setIsTyping(true)

    try {
      // Try to extract and save user name from message
      const namePatterns = [
        /tên tôi là (.+)/i,
        /tôi tên là (.+)/i,
        /mình tên là (.+)/i,
        /tên mình là (.+)/i,
        /tôi là (.+)/i,
        /mình là (.+)/i,
      ]
      
      for (const pattern of namePatterns) {
        const match = currentInput.match(pattern)
        if (match && match[1]) {
          const extractedName = match[1].trim().split(/[.,!?]/)[0].trim()
          if (extractedName.length > 0 && extractedName.length < 50) {
            saveUserName(extractedName)
            break
          }
        }
      }

      // Build chat history for Gemini AI
      const chatHistory = messages.slice(1).map(msg => ({
        role: msg.sender === "user" ? "user" : "model",
        parts: [{ text: msg.text }],
      }))

      // Get user name for context
      const userName = getUserName() || user?.name || null

      // Get AI response from Gemini (with search capabilities)
      const botResponse: ChatbotResponse = await generateResponse(
        currentInput, 
        chatHistory,
        user?.id,
        userName
      )
      
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: botResponse.text,
        sender: "bot",
        timestamp: new Date(),
        searchResults: botResponse.searchResults,
      }
      setMessages((prev) => [...prev, botMessage])
    } catch (error) {
      console.error("Error getting bot response:", error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "Xin lỗi, tôi gặp sự cố kỹ thuật. Vui lòng thử lại sau.",
        sender: "bot",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsTyping(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <>
      {/* Chatbot Button */}
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50"
          size="icon"
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
      )}

      {/* Chatbot Window */}
      {isOpen && (
        <Card className="fixed bottom-6 right-6 w-96 h-[500px] shadow-2xl z-50 flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b">
            <div className="flex items-center gap-2">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Bot className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-base">Exambot</CardTitle>
                <p className="text-xs text-muted-foreground">Luôn sẵn sàng hỗ trợ</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>

          <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex gap-2",
                  message.sender === "user" ? "justify-end" : "justify-start"
                )}
              >
                {message.sender === "bot" && (
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                )}
                <div
                  className={cn(
                    "max-w-[75%] rounded-lg px-4 py-2",
                    message.sender === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  )}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.text}</p>
                  
                  {/* Display search results */}
                  {message.searchResults && (
                    <div className="mt-3 space-y-3">
                      {/* Test Results */}
                      {message.searchResults.tests && message.searchResults.tests.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold mb-2 flex items-center gap-1">
                            <BookOpen className="h-3 w-3" />
                            Bài kiểm tra ({message.searchResults.tests.length})
                          </p>
                          <div className="space-y-2">
                            {message.searchResults.tests.map((test) => (
                              <Card
                                key={test.id}
                                className="p-2 cursor-pointer hover:bg-accent transition-colors"
                                onClick={() => {
                                  navigate(`/test/${test.id}`)
                                  setIsOpen(false)
                                }}
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs font-medium line-clamp-1">{test.title}</p>
                                    <div className="flex items-center gap-1 mt-1">
                                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                                        {test.subject}
                                      </Badge>
                                      <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                        {test.grade}
                                      </Badge>
                                    </div>
                                    <div className="flex items-center gap-2 mt-1 text-[10px] text-muted-foreground">
                                      <Clock className="h-3 w-3" />
                                      <span>{test.duration} phút</span>
                                      <span>•</span>
                                      <span>{test.questions.length} câu</span>
                                    </div>
                                  </div>
                                  <ExternalLink className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                                </div>
                              </Card>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Video Results */}
                      {message.searchResults.videos && message.searchResults.videos.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold mb-2 flex items-center gap-1">
                            <Video className="h-3 w-3" />
                            Video học tập ({message.searchResults.videos.length})
                          </p>
                          <div className="space-y-2">
                            {message.searchResults.videos.map((video) => (
                              <Card
                                key={video.id}
                                className="p-2 cursor-pointer hover:bg-accent transition-colors"
                                onClick={() => {
                                  navigate("/videos")
                                  setIsOpen(false)
                                }}
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs font-medium line-clamp-1">{video.title}</p>
                                    <div className="flex items-center gap-1 mt-1">
                                      {video.subject && (
                                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                                          {video.subject}
                                        </Badge>
                                      )}
                                      {video.grade_level && (
                                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                          {video.grade_level}
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                  <Play className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                                </div>
                              </Card>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Result Results */}
                      {message.searchResults.results && message.searchResults.results.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold mb-2 flex items-center gap-1">
                            <Trophy className="h-3 w-3" />
                            Kết quả bài làm ({message.searchResults.results.length})
                          </p>
                          <div className="space-y-2">
                            {message.searchResults.results.map((result) => {
                              const resultWithExtras = result as TestResult & { totalMarks?: number; percentage?: number }
                              let percentage = 0
                              
                              // Calculate percentage
                              if (resultWithExtras.percentage !== undefined && 
                                  !Number.isNaN(resultWithExtras.percentage) && 
                                  Number.isFinite(resultWithExtras.percentage)) {
                                percentage = resultWithExtras.percentage
                              } else if (resultWithExtras.totalMarks && resultWithExtras.totalMarks > 0) {
                                percentage = (result.score / resultWithExtras.totalMarks) * 100
                              } else if (result.totalQuestions > 0) {
                                const totalMarks = result.totalQuestions * 10
                                percentage = totalMarks > 0 ? (result.score / totalMarks) * 100 : 0
                              }
                              
                              percentage = Math.min(100, Math.max(0, percentage))
                              const totalMarks = resultWithExtras.totalMarks || (result.totalQuestions * 10)
                              
                              return (
                                <Card
                                  key={result.id}
                                  className="p-2 cursor-pointer hover:bg-accent transition-colors"
                                  onClick={() => {
                                    navigate(`/result/${result.id}`)
                                    setIsOpen(false)
                                  }}
                                >
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="flex-1 min-w-0">
                                      <p className="text-xs font-medium">Kết quả bài kiểm tra</p>
                                      <div className="flex items-center gap-2 mt-1 text-[10px] text-muted-foreground">
                                        <Trophy className="h-3 w-3" />
                                        <span>{percentage.toFixed(0)}%</span>
                                        <span>•</span>
                                        <span>{result.score}/{totalMarks} điểm</span>
                                      </div>
                                      <p className="text-[10px] text-muted-foreground mt-1">
                                        {new Date(result.completedAt).toLocaleDateString("vi-VN")}
                                      </p>
                                    </div>
                                    <ExternalLink className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                                  </div>
                                </Card>
                              )
                            })}
                          </div>
                        </div>
                      )}

                      {/* Leaderboard Results */}
                      {message.searchResults.leaderboard && message.searchResults.leaderboard.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold mb-2 flex items-center gap-1">
                            <Trophy className="h-3 w-3" />
                            Bảng xếp hạng ({message.searchResults.leaderboard.length})
                          </p>
                          {message.searchResults.userRank && (
                            <Card className="p-2 mb-2 bg-primary/5 border-primary/20">
                              <div className="flex items-center gap-2">
                                <Trophy className="h-4 w-4 text-primary" />
                                <div className="flex-1">
                                  <p className="text-xs font-semibold">Vị trí của bạn</p>
                                  <p className="text-lg font-bold text-primary">Hạng {message.searchResults.userRank}</p>
                                </div>
                                {message.searchResults.userRank <= 3 && (
                                  <Badge variant="default" className="text-xs">Top 3!</Badge>
                                )}
                                {message.searchResults.userRank > 3 && message.searchResults.userRank <= 10 && (
                                  <Badge variant="secondary" className="text-xs">Top 10</Badge>
                                )}
                              </div>
                            </Card>
                          )}
                          <div className="space-y-2">
                            {message.searchResults.leaderboard.map((entry, index) => {
                              const rank = index + 1
                              const isCurrentUser = user && entry.userId === user.id
                              const percentage = entry.percentage || 
                                (entry.total_marks && entry.total_marks > 0 ? (entry.score / entry.total_marks) * 100 : 0)
                              
                              return (
                                <Card
                                  key={`${entry.userId}-${index}`}
                                  className={cn(
                                    "p-2 transition-colors",
                                    isCurrentUser && "bg-primary/5 border-primary/30"
                                  )}
                                >
                                  <div className="flex items-center gap-2">
                                    <div className="flex-shrink-0 w-6 text-center">
                                      {rank <= 3 ? (
                                        <span className="text-lg">
                                          {rank === 1 && "🥇"}
                                          {rank === 2 && "🥈"}
                                          {rank === 3 && "🥉"}
                                        </span>
                                      ) : (
                                        <span className="text-xs font-semibold text-muted-foreground">#{rank}</span>
                                      )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-xs font-medium truncate">
                                        {entry.userName}
                                        {isCurrentUser && (
                                          <Badge variant="outline" className="ml-1 text-[10px] px-1 py-0">Bạn</Badge>
                                        )}
                                      </p>
                                      <div className="flex items-center gap-2 mt-1 text-[10px] text-muted-foreground">
                                        <span className="font-semibold text-primary">{entry.score} điểm</span>
                                        {percentage > 0 && (
                                          <>
                                            <span>•</span>
                                            <span>{percentage.toFixed(0)}%</span>
                                          </>
                                        )}
                                        {entry.timeTaken && (
                                          <>
                                            <span>•</span>
                                            <Clock className="h-3 w-3 inline" />
                                            <span>{Math.floor(entry.timeTaken / 60)}p</span>
                                          </>
                                        )}
                                      </div>
                                      {(entry.subject || entry.grade_level) && (
                                        <div className="flex gap-1 mt-1">
                                          {entry.subject && (
                                            <Badge variant="secondary" className="text-[10px] px-1 py-0">
                                              {entry.subject}
                                            </Badge>
                                          )}
                                          {entry.grade_level && (
                                            <Badge variant="outline" className="text-[10px] px-1 py-0">
                                              Lớp {entry.grade_level}
                                            </Badge>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </Card>
                              )
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <p className="text-xs mt-1 opacity-70">
                    {message.timestamp.toLocaleTimeString("vi-VN", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                {message.sender === "user" && (
                  <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                    <User className="h-4 w-4 text-primary-foreground" />
                  </div>
                )}
              </div>
            ))}

            {isTyping && (
              <div className="flex gap-2 justify-start">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Bot className="h-4 w-4 text-primary" />
                </div>
                <div className="bg-muted rounded-lg px-4 py-2">
                  <div className="flex gap-1">
                    <div className="h-2 w-2 bg-muted-foreground rounded-full animate-bounce" />
                    <div className="h-2 w-2 bg-muted-foreground rounded-full animate-bounce [animation-delay:0.2s]" />
                    <div className="h-2 w-2 bg-muted-foreground rounded-full animate-bounce [animation-delay:0.4s]" />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </CardContent>

          <div className="p-4 border-t">
            <div className="flex gap-2">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Nhập tin nhắn..."
                className="flex-1"
              />
              <Button onClick={handleSendMessage} size="icon">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      )}
    </>
  )
}
