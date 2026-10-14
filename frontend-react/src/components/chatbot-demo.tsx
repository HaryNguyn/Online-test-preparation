/**
 * Chatbot Test Demo Component
 * 
 * Component này demo các tính năng của chatbot mới
 * Sử dụng để test và demo cho người dùng
 */

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const DEMO_COMMANDS = {
  video: [
    "Tôi cần xem video môn Toán",
    "Muốn xem video Lý lớp 10",
    "Cho tôi video Hóa học",
    "Video Tiếng Anh lớp 11",
    "Show me math videos",
  ],
  test: [
    "Tôi cần làm bài kiểm tra môn Toán",
    "Đề thi Lý khối 11",
    "Cho tôi bài kiểm tra Hóa",
    "Test for English",
    "Bài thi Sinh học lớp 9",
  ],
  results: [
    "Xem kết quả của tôi",
    "Cho tôi xem điểm",
    "Kết quả bài làm của mình",
    "Show my results",
    "Điểm số của em",
  ],
  knowledge: [
    "Định luật Newton là gì?",
    "Giải thích phương trình bậc 2",
    "Cách tính đạo hàm",
    "What is photosynthesis?",
    "Định lý Pythagoras",
  ],
  general: [
    "Tính năng nào có sẵn?",
    "Làm thế nào để làm bài thi?",
    "Cách xem video?",
    "Hướng dẫn sử dụng hệ thống",
    "ExamPrep là gì?",
  ],
};

interface CommandExample {
  text: string;
  category: string;
  description: string;
  expectedBehavior: string;
}

const COMMAND_EXAMPLES: CommandExample[] = [
  {
    text: "Tôi cần xem video môn Toán lớp 10",
    category: "Video Search",
    description: "Tìm video theo môn học và lớp",
    expectedBehavior: "Hiển thị danh sách video môn Toán lớp 10",
  },
  {
    text: "Cho tôi bài kiểm tra Lý",
    category: "Test Search",
    description: "Tìm bài kiểm tra theo môn học",
    expectedBehavior: "Hiển thị danh sách bài kiểm tra môn Lý",
  },
  {
    text: "Xem kết quả của tôi",
    category: "Results View",
    description: "Xem lịch sử kết quả bài làm",
    expectedBehavior: "Hiển thị danh sách kết quả các bài đã làm",
  },
  {
    text: "Định luật Newton là gì?",
    category: "Knowledge",
    description: "Hỏi về kiến thức học tập",
    expectedBehavior: "AI giải thích về định luật Newton",
  },
  {
    text: "Làm thế nào để làm bài thi?",
    category: "System Guide",
    description: "Hướng dẫn sử dụng hệ thống",
    expectedBehavior: "AI hướng dẫn cách làm bài thi",
  },
];

export function ChatbotDemo() {
  const [selectedCommand, setSelectedCommand] = useState<string>("");

  const handleCommandClick = (command: string) => {
    setSelectedCommand(command);
    // In thực tế, bạn sẽ gửi command này vào chatbot
    console.log("Demo command:", command);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert(`Đã copy: ${text}`);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold">🤖 Chatbot Demo</h1>
        <p className="text-muted-foreground">
          Demo các tính năng mới của Chatbot ExamPrep
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>✨ Tính năng mới</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold mb-2">🎯 Nhận diện thông minh</h3>
              <p className="text-sm text-muted-foreground">
                Hiểu nhiều cách diễn đạt và ngôn ngữ tự nhiên
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold mb-2">⚡ Phản hồi nhanh</h3>
              <p className="text-sm text-muted-foreground">
                Tìm kiếm và hiển thị kết quả ngay lập tức
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold mb-2">💡 Gợi ý thông minh</h3>
              <p className="text-sm text-muted-foreground">
                Đưa ra gợi ý hữu ích khi không tìm thấy kết quả
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="video" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="video">📹 Video</TabsTrigger>
          <TabsTrigger value="test">📝 Test</TabsTrigger>
          <TabsTrigger value="results">📊 Results</TabsTrigger>
          <TabsTrigger value="knowledge">💡 Knowledge</TabsTrigger>
          <TabsTrigger value="general">🛠️ General</TabsTrigger>
        </TabsList>

        {Object.entries(DEMO_COMMANDS).map(([category, commands]) => (
          <TabsContent key={category} value={category}>
            <Card>
              <CardHeader>
                <CardTitle className="capitalize">
                  Ví dụ câu lệnh: {category}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px] pr-4">
                  <div className="space-y-2">
                    {commands.map((command, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 p-3 border rounded-lg hover:bg-accent cursor-pointer transition-colors"
                        onClick={() => handleCommandClick(command)}
                      >
                        <span className="flex-1">{command}</span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            copyToClipboard(command);
                          }}
                        >
                          Copy
                        </Button>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle>📚 Chi tiết ví dụ</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-4">
              {COMMAND_EXAMPLES.map((example, index) => (
                <div key={index} className="border rounded-lg p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge>{example.category}</Badge>
                  </div>
                  <div className="font-mono text-sm bg-muted p-2 rounded">
                    {example.text}
                  </div>
                  <div className="text-sm">
                    <strong>Mô tả:</strong> {example.description}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <strong>Kết quả mong đợi:</strong> {example.expectedBehavior}
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleCommandClick(example.text)}
                  >
                    Test câu lệnh
                  </Button>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {selectedCommand && (
        <Card className="border-primary">
          <CardHeader>
            <CardTitle>🎯 Câu lệnh được chọn</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="font-mono text-lg bg-primary/10 p-4 rounded">
                {selectedCommand}
              </div>
              <div className="text-sm text-muted-foreground">
                Trong ứng dụng thực tế, câu lệnh này sẽ được gửi đến chatbot
                và chatbot sẽ xử lý để trả về kết quả phù hợp.
              </div>
              <div className="flex gap-2">
                <Button onClick={() => alert("Mở chatbot để test!")}>
                  Test trong Chatbot
                </Button>
                <Button
                  variant="outline"
                  onClick={() => copyToClipboard(selectedCommand)}
                >
                  Copy câu lệnh
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>📖 Hướng dẫn sử dụng</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h3 className="font-semibold">1. Mở Chatbot</h3>
            <p className="text-sm text-muted-foreground">
              Click vào icon chatbot ở góc dưới bên phải màn hình
            </p>
          </div>
          <div className="space-y-2">
            <h3 className="font-semibold">2. Nhập câu lệnh</h3>
            <p className="text-sm text-muted-foreground">
              Gõ câu lệnh của bạn vào ô chat, ví dụ: "Tôi cần xem video môn Toán"
            </p>
          </div>
          <div className="space-y-2">
            <h3 className="font-semibold">3. Xem kết quả</h3>
            <p className="text-sm text-muted-foreground">
              Chatbot sẽ hiển thị kết quả tìm kiếm hoặc trả lời câu hỏi của bạn
            </p>
          </div>
          <div className="space-y-2">
            <h3 className="font-semibold">4. Tương tác với kết quả</h3>
            <p className="text-sm text-muted-foreground">
              Click vào các kết quả để xem chi tiết hoặc thực hiện hành động
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-4 justify-center">
        <Button size="lg" onClick={() => alert("Mở chatbot!")}>
          🤖 Mở Chatbot để Test
        </Button>
        <Button
          size="lg"
          variant="outline"
          onClick={() => window.open("/CHATBOT_GUIDE.md", "_blank")}
        >
          📚 Xem tài liệu đầy đủ
        </Button>
      </div>
    </div>
  );
}
