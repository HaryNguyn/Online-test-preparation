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
  const lowerMessage = message.toLowerCase().trim();
  
  // Direct command patterns - HIGH PRIORITY
  const directCommandPatterns = [
    // Video patterns
    /\b(tôi|mình|em|con|cho|giúp|muốn|cần|có thể).*(xem|tìm|học|coi|mở).*(video|clip)/,
    /\b(video|clip).*(môn|lớp|khối|về)/,
    /\b(xem|tìm|học|coi|mở).*(video|clip)/,
    // Test/Exam patterns
    /\b(tôi|mình|em|con|cho|giúp|muốn|cần|có thể).*(làm|xem|tìm|thi).*(bài kiểm tra|đề thi|bài thi|kiểm tra|thi|test|exam)/,
    /\b(bài kiểm tra|đề thi|bài thi|test|exam).*(môn|lớp|khối|về)/,
    /\b(làm|xem|tìm|thi).*(bài kiểm tra|đề thi|bài thi|kiểm tra|test|exam)/,
    // Results patterns
    /\b(xem|tìm|kiểm tra).*(kết quả|điểm|bài làm|result)/,
    /\b(kết quả|điểm).*(của tôi|của mình|của em)/,
    // Leaderboard patterns
    /\b(xem|tìm|cho|hiển thị).*(bảng xếp hạng|xếp hạng|leaderboard|ranking|hạng|rank)/,
    /\b(bảng xếp hạng|xếp hạng|leaderboard|ranking).*(môn|lớp|khối|của tôi|của mình)/,
    /\b(tôi|mình|em).*(xếp|hạng|vị trí).*(thứ mấy|bao nhiêu|nào)/,
    /\b(vị trí|thứ hạng|hạng).*(của tôi|của mình|của em)/,
  ];
  
  // Subject keywords (môn học)
  const subjects = ["toán", "văn", "anh", "lý", "hóa", "sinh", "sử", "địa"];
  const hasSubject = subjects.some(subject => lowerMessage.includes(subject));
  
  // Check for direct commands
  const isDirectCommand = directCommandPatterns.some(pattern => pattern.test(lowerMessage));
  
  // If it mentions subjects with action verbs, it's likely a search
  if (hasSubject && /\b(xem|tìm|học|làm|thi|coi|mở|show|hiển thị)/.test(lowerMessage)) {
    return "search";
  }
  
  // If it's a direct command, it's a search
  if (isDirectCommand) {
    return "search";
  }
  
  // Search intent keywords
  const searchKeywords = [
    "tìm", "tìm kiếm", "search", "hiển thị", "show", "xem", "danh sách",
    "bài kiểm tra", "đề thi", "test", "exam",
    "video", "clip", "học video",
    "kết quả", "result", "điểm", "score", "kết quả bài làm",
    "bảng xếp hạng", "xếp hạng", "leaderboard", "ranking", "hạng", "rank", "top", "vị trí", "thứ hạng",
    "muốn", "cần", "cho", "giúp"
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
  
  console.log("🎯 User message:", userMessage);
  console.log("🔍 Detected intent:", intent);
  
  // If search intent, perform search first
  if (intent === "search") {
    try {
      const searchResults = await searchAll(userMessage, userId);
      console.log("📊 Search results:", searchResults);
      
      const hasResults = 
        (searchResults.tests && searchResults.tests.length > 0) ||
        (searchResults.videos && searchResults.videos.length > 0) ||
        (searchResults.results && searchResults.results.length > 0) ||
        (searchResults.leaderboard && searchResults.leaderboard.length > 0);
      
      console.log("✅ Has results?", hasResults);
      
      if (hasResults) {
        // Generate a smart, contextual response
        let responseText = generateSmartResponse(userMessage, searchResults, userName);
        
        return {
          text: responseText,
          searchResults,
          intent: "search",
        };
      } else {
        // No results found - provide helpful suggestions
        const noResultText = generateNoResultResponse(userMessage, userName);
        return {
          text: noResultText,
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

/**
 * Generate smart, contextual response based on search results
 */
function generateSmartResponse(
  userMessage: string,
  searchResults: SearchResponse,
  userName?: string | null
): string {
  const lowerMessage = userMessage.toLowerCase();
  const greeting = userName ? `${userName}` : "bạn";
  
  const testsCount = searchResults.tests?.length || 0;
  const videosCount = searchResults.videos?.length || 0;
  const resultsCount = searchResults.results?.length || 0;
  const leaderboardCount = searchResults.leaderboard?.length || 0;
  const userRank = searchResults.userRank;
  
  // Detect what user is looking for
  const wantsVideo = /video|clip|học|xem video|coi video/.test(lowerMessage);
  const wantsTest = /bài kiểm tra|đề thi|kiểm tra|test|exam|làm bài|thi/.test(lowerMessage);
  const wantsResults = /kết quả|điểm|bài làm|result/.test(lowerMessage);
  const wantsLeaderboard = /bảng xếp hạng|xếp hạng|leaderboard|ranking|hạng|rank|top|vị trí/.test(lowerMessage);
  
  let response = "";
  
  // Prioritize based on what user wants
  if (wantsLeaderboard && leaderboardCount > 0) {
    response = `📊 Đây là bảng xếp hạng cho ${greeting}!\n\n`;
    if (userRank) {
      response += `🎯 **Vị trí của ${greeting}: Hạng ${userRank}**\n\n`;
      if (userRank <= 3) {
        response += "🏆 Xuất sắc! Bạn đang ở top 3! Hãy tiếp tục phát huy nhé!\n\n";
      } else if (userRank <= 10) {
        response += "⭐ Tuyệt vời! Bạn đang ở top 10! Cố gắng thêm một chút nữa!\n\n";
      } else {
        response += "💪 Đừng nản lòng! Cố gắng luyện tập thêm để lên hạng cao hơn nhé!\n\n";
      }
    } else {
      response += `Hiện tại ${greeting} chưa có trong bảng xếp hạng này. Hãy làm thêm bài thi để xuất hiện trên bảng nhé!\n\n`;
    }
    response += `Top ${leaderboardCount} được hiển thị bên dưới. Hãy xem và học hỏi từ các bạn giỏi nhé! 🌟`;
  } else if (wantsVideo && videosCount > 0) {
    response = `Dạ vâng! Tôi tìm thấy ${videosCount} video học tập cho ${greeting}:\n\n`;
    response += "📹 Bạn có thể chọn video phù hợp bên dưới để bắt đầu học nhé!";
  } else if (wantsTest && testsCount > 0) {
    response = `Có ngay! Tôi tìm thấy ${testsCount} bài kiểm tra cho ${greeting}:\n\n`;
    response += "📝 Chọn bài kiểm tra bên dưới để bắt đầu làm bài nhé!";
  } else if (wantsResults && resultsCount > 0) {
    response = `Đây là kết quả của ${greeting}! Tìm thấy ${resultsCount} bài đã làm:\n\n`;
    response += "📊 Xem chi tiết điểm số và phân tích bên dưới nhé!";
  } else {
    // General response when multiple types found
    const parts: string[] = [];
    
    if (leaderboardCount > 0) {
      parts.push(`bảng xếp hạng (hạng ${userRank || "chưa xác định"})`);
    }
    if (videosCount > 0) {
      parts.push(`${videosCount} video học tập`);
    }
    if (testsCount > 0) {
      parts.push(`${testsCount} bài kiểm tra`);
    }
    if (resultsCount > 0) {
      parts.push(`${resultsCount} kết quả bài làm`);
    }
    
    response = `Tuyệt! Tôi tìm thấy ${parts.join(", ")} cho ${greeting}:\n\n`;
    response += "Bạn có thể xem chi tiết bên dưới. Chúc bạn học tập tốt! 🎯";
  }
  
  return response;
}

/**
 * Generate helpful response when no results found
 */
function generateNoResultResponse(userMessage: string, userName?: string | null): string {
  const lowerMessage = userMessage.toLowerCase();
  const greeting = userName ? userName : "bạn";
  
  const wantsVideo = /video|clip|học|xem video|coi video/.test(lowerMessage);
  const wantsTest = /bài kiểm tra|đề thi|kiểm tra|test|exam|làm bài|thi/.test(lowerMessage);
  const wantsLeaderboard = /bảng xếp hạng|xếp hạng|leaderboard|ranking|hạng|rank/.test(lowerMessage);
  
  let response = `Xin lỗi ${greeting}, tôi không tìm thấy kết quả phù hợp. `;
  
  if (wantsLeaderboard) {
    response += `\n\n💡 Gợi ý:\n`;
    response += `- Thử hỏi: "Xem bảng xếp hạng"\n`;
    response += `- Hoặc: "Bảng xếp hạng môn Toán"\n`;
    response += `- Hoặc: "Tôi xếp hạng thứ mấy?"\n`;
    response += `- Hoặc vào mục Leaderboard để xem bảng xếp hạng`;
  } else if (wantsVideo) {
    response += `\n\n💡 Gợi ý:\n`;
    response += `- Thử tìm với tên môn học cụ thể (ví dụ: "video môn Toán")\n`;
    response += `- Hoặc tìm theo lớp (ví dụ: "video lớp 10")\n`;
    response += `- Hoặc vào mục Videos để xem tất cả video có sẵn`;
  } else if (wantsTest) {
    response += `\n\n💡 Gợi ý:\n`;
    response += `- Thử tìm với tên môn học cụ thể (ví dụ: "bài kiểm tra Toán")\n`;
    response += `- Hoặc tìm theo lớp (ví dụ: "đề thi lớp 9")\n`;
    response += `- Hoặc vào mục Tests để xem tất cả đề thi có sẵn`;
  } else {
    response += `\n\n💡 Gợi ý:\n`;
    response += `- Thử tìm với từ khóa cụ thể hơn\n`;
    response += `- Hoặc hỏi tôi: "Video môn Toán" hoặc "Bài kiểm tra Lý"`;
  }
  
  return response;
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
    const input = userMessage.toLowerCase().trim();
    const greeting = userName ? userName : "bạn";
    
    // Greeting responses
    if (/^(xin chào|chào|hello|hi|hey|chào bạn|chào bot)/i.test(input)) {
      return `Xin chào ${greeting}! 👋 Tôi là trợ lý ảo của ExamPrep. Tôi có thể giúp bạn:\n\n📹 Tìm video học tập\n📝 Tìm bài kiểm tra\n📊 Xem kết quả\n💡 Trả lời câu hỏi kiến thức\n\nBạn cần giúp gì?`;
    }
    
    // Thank you responses
    if (/(cảm ơn|cám ơn|thanks|thank you|thanks you)/i.test(input)) {
      return `Không có gì ${greeting}! 😊 Nếu cần thêm trợ giúp, đừng ngại hỏi tôi nhé!`;
    }
    
    // Name introduction
    if (/(tên tôi là|tôi tên là|mình là|mình tên là|em tên là|tôi là)/i.test(input)) {
      const nameMatch = input.match(/(?:tên tôi là|tôi tên là|mình là|mình tên là|em tên là|tôi là)\s+(\w+)/i);
      if (nameMatch && nameMatch[1]) {
        return `Rất vui được làm quen với ${nameMatch[1]}! 😊 Tôi sẽ nhớ tên bạn. Hãy cho tôi biết nếu bạn cần giúp đỡ gì nhé!`;
      }
    }
    
    // Search related
    if (input.includes("đề thi") || input.includes("bài kiểm tra")) {
      return `Bạn có thể tìm các đề thi trong mục Dashboard hoặc Tests. Chúng tôi có nhiều đề thi cho các môn Toán, Văn, Anh, Lý, Hóa...\n\nHoặc thử hỏi tôi: "Tôi cần bài kiểm tra môn Toán"`;
    } else if (input.includes("video") || input.includes("học")) {
      return `Bạn có thể xem các video học tập tại mục Videos. Chúng tôi có video cho tất cả các lớp và môn học.\n\nHoặc thử hỏi tôi: "Tôi cần xem video môn Lý"`;
    } else if (input.includes("kết quả") || input.includes("điểm")) {
      return `Bạn có thể xem kết quả của mình trong mục Results. Ở đó có chi tiết điểm số và phân tích câu trả lời.\n\nHoặc thử hỏi tôi: "Xem kết quả của tôi"`;
    }
    
    // Knowledge questions - provide basic fallback
    if (/(là gì|what is|giải thích|explain)/i.test(input)) {
      return `Xin lỗi ${greeting}, tôi đang gặp sự cố kỹ thuật với AI. Tuy nhiên, bạn có thể:\n\n📚 Tìm kiếm trong video học tập\n📝 Xem trong các bài kiểm tra\n🔍 Hoặc thử lại sau vài phút\n\nTôi sẽ sớm trở lại bình thường!`;
    }
    
    // System help
    if (/(làm thế nào|cách|hướng dẫn|how to)/i.test(input)) {
      return `Tôi có thể hướng dẫn ${greeting}:\n\n📝 Làm bài thi: Vào mục Tests → Chọn đề → Bắt đầu\n📹 Xem video: Vào mục Videos → Chọn môn/lớp → Xem\n📊 Xem điểm: Vào mục Results\n\nBạn cần hướng dẫn chi tiết về điều gì?`;
    }
    
    return `Xin lỗi ${greeting}, tôi gặp sự cố kỹ thuật với AI. Vui lòng thử lại sau hoặc hỏi tôi về:\n\n📹 Video học tập\n📝 Bài kiểm tra\n📊 Kết quả\n🛠️ Cách sử dụng hệ thống`;
  }
}
