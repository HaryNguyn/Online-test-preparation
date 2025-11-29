import { GoogleGenerativeAI } from "@google/generative-ai";
import { searchAll, type SearchResponse } from "./chatbot-search";

const API_KEY = "AIzaSyD2s_wqOw1InYSjcF7nSsqNBiPIzDbRVSE";
const genAI = new GoogleGenerativeAI(API_KEY);

const model = genAI.getGenerativeModel({ 
  model: "gemini-pro",
  generationConfig: {
    temperature: 0.9,
    topK: 1,
    topP: 1,
    maxOutputTokens: 2048,
  },
});

const getSystemContext = (userName?: string | null): string => {
  const nameContext = userName 
    ? `\n\nQUAN TRỌNG: Tên của người dùng là "${userName}". Hãy luôn gọi họ bằng tên này khi chào hỏi hoặc trả lời để tạo cảm giác thân thiện và cá nhân hóa.`
    : `\n\nLƯU Ý: Nếu người dùng chưa cho biết tên, bạn có thể hỏi tên của họ một cách tự nhiên để tạo mối quan hệ thân thiện hơn. Khi họ cho biết tên (ví dụ: "Tên tôi là...", "Tôi tên là...", "Mình là..."), hãy nhớ và sử dụng tên đó trong các cuộc trò chuyện sau.`;

  return `Bạn là trợ lý ảo thông minh của ExamPrep - một nền tảng học tập và luyện thi trực tuyến.

Thông tin về ExamPrep:
- Nền tảng cung cấp đề thi cho các môn: Toán, Văn, Anh, Lý, Hóa, Sinh, Sử, Địa
- Học sinh có thể làm bài kiểm tra trực tuyến, xem kết quả chi tiết
- Có video học tập cho tất cả các lớp từ 6-12
- Có bảng xếp hạng để so sánh với bạn bè
- Giáo viên có thể tạo đề thi, upload video, chấm bài
- Học sinh có thể xem lại lịch sử làm bài và phân tích kết quả

Các tính năng chính:
1. Dashboard - Xem tổng quan và làm bài kiểm tra
2. Tests - Danh sách tất cả đề thi
3. Results - Xem kết quả các bài đã làm
4. Videos - Xem video học tập
5. Leaderboard - Bảng xếp hạng
6. Profile - Cập nhật thông tin cá nhân
7. Change Password - Đổi mật khẩu

Nhiệm vụ của bạn:
1. Khi người dùng hỏi về tìm kiếm bài kiểm tra, video, hoặc kết quả - hệ thống sẽ tự động tìm kiếm và hiển thị kết quả
2. Khi người dùng hỏi về kiến thức học tập (Toán, Văn, Anh, Lý, Hóa, Sinh, Sử, Địa) - hãy trả lời một cách chi tiết, dễ hiểu, có ví dụ minh họa
3. Khi người dùng hỏi về cách sử dụng hệ thống - hãy hướng dẫn rõ ràng, từng bước
4. Luôn trả lời bằng tiếng Việt, thân thiện, nhiệt tình và hữu ích${nameContext}

Hãy trả lời các câu hỏi một cách thân thiện, hữu ích và rõ ràng bằng tiếng Việt.
Nếu không biết câu trả lời, hãy thành thật nói và đề xuất liên hệ hỗ trợ hoặc tìm kiếm thêm thông tin.`;
};

export interface ChatbotResponse {
  text: string;
  searchResults?: SearchResponse;
  intent?: "search" | "knowledge" | "general";
}

/**
 * Detect user intent from message
 */
function detectIntent(message: string): "search" | "knowledge" | "general" {
  const lowerMessage = message.toLowerCase();
  
  // Search intent keywords
  const searchKeywords = [
    "tìm", "tìm kiếm", "search", "hiển thị", "show", "xem", "danh sách",
    "bài kiểm tra", "đề thi", "test", "exam",
    "video", "clip", "học video",
    "kết quả", "result", "điểm", "score", "kết quả bài làm"
  ];
  
  // Knowledge intent keywords
  const knowledgeKeywords = [
    "là gì", "what is", "giải thích", "explain", "hướng dẫn", "how to",
    "cách", "làm sao", "tại sao", "why", "kiến thức", "knowledge"
  ];
  
  const hasSearchIntent = searchKeywords.some(keyword => lowerMessage.includes(keyword));
  const hasKnowledgeIntent = knowledgeKeywords.some(keyword => lowerMessage.includes(keyword));
  
  if (hasSearchIntent) return "search";
  if (hasKnowledgeIntent) return "knowledge";
  return "general";
}

export async function generateResponse(
  userMessage: string, 
  chatHistory: { role: string; parts: { text: string }[] }[] = [],
  userId?: string,
  userName?: string | null
): Promise<ChatbotResponse> {
  const intent = detectIntent(userMessage);
  
  // If search intent, perform search first
  if (intent === "search") {
    try {
      const searchResults = await searchAll(userMessage, userId);
      const hasResults = 
        (searchResults.tests && searchResults.tests.length > 0) ||
        (searchResults.videos && searchResults.videos.length > 0) ||
        (searchResults.results && searchResults.results.length > 0);
      
      if (hasResults) {
        // Generate a response with search results
        let responseText = "";
        if (searchResults.tests && searchResults.tests.length > 0) {
          responseText += `Tôi tìm thấy ${searchResults.tests.length} bài kiểm tra:\n`;
        }
        if (searchResults.videos && searchResults.videos.length > 0) {
          responseText += `Tìm thấy ${searchResults.videos.length} video học tập:\n`;
        }
        if (searchResults.results && searchResults.results.length > 0) {
          responseText += `Tìm thấy ${searchResults.results.length} kết quả bài làm:\n`;
        }
        responseText += "\nBạn có thể xem chi tiết bên dưới.";
        
        return {
          text: responseText,
          searchResults,
          intent: "search",
        };
      } else {
        // No results found, generate AI response
        const aiResponse = await generateAIResponse(userMessage, chatHistory);
        return {
          text: aiResponse + "\n\nTôi không tìm thấy kết quả phù hợp. Bạn có thể thử tìm kiếm với từ khóa khác.",
          intent: "search",
        };
      }
    } catch (error) {
      console.error("Search error:", error);
      // Fall through to AI response
    }
  }
  
  // Generate AI response for knowledge or general queries
  const aiText = await generateAIResponse(userMessage, chatHistory, userName);
  return {
    text: aiText,
    intent: intent === "knowledge" ? "knowledge" : "general",
  };
}

async function generateAIResponse(
  userMessage: string,
  chatHistory: { role: string; parts: { text: string }[] }[] = [],
  userName?: string | null
): Promise<string> {
  try {
    const systemContext = getSystemContext(userName)
    const initialGreeting = userName
      ? `Xin chào ${userName}! 👋 Rất vui được gặp lại bạn. Tôi là trợ lý ảo của ExamPrep. Tôi hiểu rõ về hệ thống và sẵn sàng hỗ trợ bạn. Tôi có thể giúp bạn tìm kiếm bài kiểm tra, video học tập, xem kết quả, hoặc trả lời các câu hỏi về kiến thức học tập. Bạn cần giúp gì hôm nay?`
      : "Xin chào! Tôi là trợ lý ảo của ExamPrep. Tôi hiểu rõ về hệ thống và sẵn sàng hỗ trợ bạn. Tôi có thể giúp bạn tìm kiếm bài kiểm tra, video học tập, xem kết quả, hoặc trả lời các câu hỏi về kiến thức học tập. Bạn cần giúp gì?"
    
    const chat = model.startChat({
      history: [
        {
          role: "user",
          parts: [{ text: systemContext }],
        },
        {
          role: "model",
          parts: [{ text: initialGreeting }],
        },
        ...chatHistory,
      ],
    });

    const result = await chat.sendMessage(userMessage);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Gemini AI Error:", error);
    
    // Fallback responses if API fails
    const input = userMessage.toLowerCase();
    if (input.includes("đề thi") || input.includes("bài kiểm tra")) {
      return "Bạn có thể tìm các đề thi trong mục Dashboard hoặc Tests. Chúng tôi có nhiều đề thi cho các môn Toán, Văn, Anh, Lý, Hóa...";
    } else if (input.includes("video") || input.includes("học")) {
      return "Bạn có thể xem các video học tập tại mục Videos. Chúng tôi có video cho tất cả các lớp và môn học.";
    } else if (input.includes("kết quả") || input.includes("điểm")) {
      return "Bạn có thể xem kết quả của mình trong mục Results. Ở đó có chi tiết điểm số và phân tích câu trả lời.";
    }
    return "Xin lỗi, tôi gặp sự cố kỹ thuật. Vui lòng thử lại sau hoặc liên hệ hỗ trợ.";
  }
}
