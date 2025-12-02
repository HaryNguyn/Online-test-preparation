## ToDo & Giải thích kiến trúc dự án (trừ Flutter)

File này mô tả cấu trúc các phần chính của hệ thống (backend Node.js + frontend React) và liệt kê các việc cần làm / cải tiến. Phần `frontend-flutter` **không** được mô tả theo yêu cầu.

---

## 1. Backend (`backend0-main`)

### 1.1. Kiến trúc tổng quan

- **`src/server.js`**  
  - Khởi tạo ứng dụng Express, cấu hình middleware cơ bản (JSON, cookie, static files, view engine, CORS nếu có).  
  - Mount các router:
    - `routes/web.js` cho các trang EJS demo.
    - `routes/api.js` cho REST API (auth, exams, submissions, leaderboard, videos...).  
  - Khởi động HTTP server, kết nối tới database thông qua `config/database.js`.

- **`src/config/database.js`**  
  - Cấu hình kết nối MySQL (hoặc tương đương) bằng `mysql2`/`sequelize` hoặc query thuần.  
  - Export instance dùng chung cho các controller / service.

- **`src/config/viewEngine.js`**  
  - Cấu hình view engine EJS, thư mục `views`, static folder `public`.

### 1.2. Database & seed dữ liệu

- **`database/schema.sql`**  
  - Định nghĩa schema các bảng chính:
    - `users` (id, email, password hash, name, role, grade...).  
    - `exams` (id, title, subject, grade_level, duration, total_marks...).  
    - `exam_questions` (question_text, options JSON, correct_answer, marks, type...).  
    - `submissions` (exam_id, student_id, score, total_marks, percentage, time_taken, grading_status, partial_scores...).  
    - `videos` và các bảng phụ trợ khác nếu có.

- **`database/migrate.js`**  
  - Script tạo/migrate bảng từ `schema.sql` hoặc từ code JS.

- **`scripts/seed-mock-data.js`**  
  - Tạo dữ liệu mẫu: user học sinh/giáo viên, đề thi, câu hỏi, bài nộp mẫu để dev/test nhanh.

### 1.3. Controllers & routes

- **`src/routes/api.js`**  
  - Định nghĩa endpoint REST, ví dụ:
    - `POST /auth/login`, `POST /auth/register`, `PUT /auth/change-password`  
    - `GET /exams`, `GET /exams/:id`, `POST /exams`, `PUT /exams/:id`, `DELETE /exams/:id`  
    - `POST /submissions`, `GET /submissions/student/:id`, `GET /submissions/exam/:id`, `PUT /submissions/:id/grade`, `DELETE /submissions/:id`  
    - `GET /leaderboard/exam/:id`, `GET /leaderboard/global`  
    - `GET /videos`, `POST /videos`, ...  
  - Ánh xạ route → controller tương ứng trong `src/controllers`.

- **`src/controllers/authController.js`**  
  - Xử lý đăng ký, đăng nhập, đổi mật khẩu, quên mật khẩu.  
  - Đảm bảo:
    - Hash mật khẩu khi lưu.  
    - Đặt cookie/session hoặc JWT.  
    - Trả về object `user` ở dạng frontend mong đợi (`id`, `email`, `role`, `name`, `grade`, `avatar_url`…).

- **`src/controllers/examController.js`**  
  - CRUD exam:
    - Tạo đề với `total_marks`, `passing_marks`, cờ `shuffle_questions`, `shuffle_options`.  
    - Lấy danh sách exams theo `status`, `subject`, `grade_level`, `created_by`.  
  - Khi trả về exam, phải đảm bảo format đúng với `ExamDTO` trên frontend.

- **`src/controllers/submissionController.js`**  
  - `createSubmission`: lưu bài làm
    - Nhận `exam_id`, `student_id`, `answers`, `score`, `total_marks`, `percentage`, `time_taken`.  
    - Lưu `grading_status` (auto_graded / pending_manual / completed).  
  - `getStudentSubmissions`: trả danh sách submissions của một học sinh (dùng cho Dashboard, Results).  
  - `getExamSubmissions`: trả submissions của một đề (dùng cho Teacher statistics).  
  - `gradeSubmission`: cập nhật điểm bài tự luận:
    - Lưu `partial_scores`, tính lại `score`, `percentage`, đổi `grading_status` thành `completed`.

- **`src/controllers/leaderboardController.js`**  
  - Trả về bảng xếp hạng:
    - Theo đề (`/leaderboard/exam/:id`) hoặc toàn hệ thống (`/leaderboard/global`).  
  - Tính `percentage` backend hoặc dùng trường đã lưu trong `submissions`.

- **`src/controllers/uploadController.js`**  
  - Xử lý upload file (ảnh/avatar) vào `public/uploads`, trả về URL cho frontend.

- **`src/controllers/videoController.js`**  
  - CRUD video học tập, dùng cho trang giáo viên quản lý video.

### 1.4. ToDo backend

- [ ] Thêm middleware auth/role để bảo vệ route teacher/admin.  
- [ ] Chuẩn hóa chặt kiểu dữ liệu trả về (đặc biệt `percentage`, `total_marks`, `score`) để khớp hoàn toàn với frontend React.  
- [ ] Log và handle lỗi đẹp (mã lỗi, message rõ ràng cho UI).  
- [ ] Thêm test tự động cho tính điểm và leaderboard.

---

## 2. Frontend React (`frontend-react`)

### 2.1. Khởi tạo & cấu trúc chung

- **`src/main.tsx`**  
  - Mount `App` vào DOM, wrap với:
    - `AuthProvider` (`contexts/auth-context.tsx`)  
    - `ThemeProvider` (`components/theme-provider.tsx`)  
    - `BrowserRouter` để điều hướng giữa các trang.  

- **`src/App.tsx`**  
  - Định nghĩa router chính:
    - `/` → `HomePage`  
    - `/login`, `/register`, `/forgot-password`, `/reset-password`  
    - `/dashboard`, `/tests`, `/test/:id`, `/result/:id`, `/results`, `/leaderboard`  
    - `/teacher`, `/teacher/grading`, `/teacher/create-test`, `/teacher/videos`  
    - `/admin` nếu có.  
  - Áp dụng layout chung, bảo vệ route bằng context `user.role`.

- **`src/contexts/auth-context.tsx`**  
  - Lưu `user`, `isLoading`, các hàm `login`, `logout`, `refreshMe`.  
  - Gọi `api.me(userId)` để sync thông tin user từ backend.  

- **`src/contexts/theme-context.tsx`**  
  - Quản lý `theme` (light/dark/system), lưu vào `localStorage`, expose cho toàn app.

### 2.2. Thư viện dùng chung

- **`src/lib/api.ts`**  
  - Wrapper `fetch`:
    - Base URL từ `VITE_API_BASE_URL`.  
    - Hàm `request<T>` xử lý JSON, lỗi HTTP.  
  - Export các API function:
    - Auth (`login`, `register`, `me`, `changePassword`, `forgotPassword`, `confirmResetPassword`).  
    - Exams (`getExams`, `getExam`, `createExam`, `updateExam`, `deleteExam`).  
    - Submissions (`createSubmission`, `getStudentSubmissions`, `getExamSubmissions`, `getSubmission`, `getPendingSubmissions`, `gradeSubmission`, `deleteSubmission`).  
    - Leaderboard (`getExamLeaderboard`, `getGlobalLeaderboard`).  
    - Videos (`getVideos`, `createVideo`, `updateVideo`, `deleteVideo`).  

- **`src/lib/types.ts`**  
  - Khai báo các kiểu:
    - `User`, `UserRole`  
    - `ExamDTO`, `ExamQuestionDTO`, `SubmissionDTO`, `VideoDTO`  
    - `Test`, `Question`, `TestResult`, `LeaderboardEntry` dùng nội bộ frontend.  

- **`src/lib/mappers.ts`**  
  - Hàm `mapExamToTest(exam: ExamDTO): Test`:
    - Chuyển cấu trúc từ API sang cấu trúc dùng trong thi trắc nghiệm (questions, marks, shuffle…).  

- **`src/lib/utils.ts`**  
  - Các hàm hỗ trợ (format thời gian, chuẩn hóa answers cho teacher grading, v.v.).

- **`src/lib/storage.ts`**  
  - Lưu trữ tạm (`localStorage`) cho test/result trong trường hợp offline (fallback).

### 2.3. UI & components

- **`src/components/ui/*`**  
  - Bộ component UI (Card, Button, Input, Table, Tabs, Dialog, Toast, Progress, Badge, v.v.) – phong cách Shadcn/Tailwind.

- **`src/components/dashboard-header.tsx`**  
  - Header cho các trang sau đăng nhập:
    - Logo, tên hệ thống.  
    - Nút điều hướng Dashboard / Tests / Results / Teacher / Admin.  
    - Dropdown user (profile, logout).  

- **`src/components/exam-menu.tsx`**  
  - Menu nổi ở trang Home (chuyển đến login, dashboard, v.v.).

- **`src/components/chatbot.tsx` + `lib/gemini.ts` + `lib/chatbot-search.ts`**  
  - Giao diện chatbot hỗ trợ học sinh (FAQ, gợi ý ôn tập, tìm đề…).  
  - Có thể dùng API Gemini hoặc logic mock phía frontend.

### 2.4. Các trang chính cho HỌC SINH

- **`src/pages/home.tsx` (`HomePage`)**  
  - Landing page:
    - Hero section, hiệu ứng parallax, video demo.  
    - Tự động redirect:
      - Học sinh / phụ huynh → `/dashboard`  
      - Giáo viên → `/teacher`  
      - Admin → `/admin`  

- **`src/pages/login.tsx`, `register.tsx`, `forgot-password.tsx`, `reset-password.tsx`**  
  - Form auth, gọi API tương ứng.  
  - Hiển thị lỗi, loading, chuyển hướng sau khi login thành công.

- **`src/pages/dashboard.tsx` (`DashboardPage`)**  
  - Trang chính của học sinh:
    - Card thống kê:
      - Số bài kiểm tra đã làm.  
      - **Điểm trung bình** (tính lại bằng `getResultPercentage` để luôn 0–100%).  
      - **Điểm cao nhất**.  
    - Danh sách bài kiểm tra hiện có:
      - Lọc theo từ khóa, môn, khối.  
      - Nếu đã làm, hiển thị “Điểm của bạn: X%” dùng `%` chuẩn từ backend/logic.  
  - Dữ liệu lấy từ:
    - `api.getExams({ status: "published" })`  
    - `api.getStudentSubmissions(user.id)` → map sang `DashboardResult`.

- **`src/pages/tests.tsx`**  
  - Danh sách tất cả đề thi cho học sinh, filter, search, nút “Làm bài”.

- **`src/pages/test-detail.tsx` (`TestDetailPage`)**  
  - Logic thi:
    - Load đề từ `api.getExam`, map sang `Test` (`mapExamToTest`), áp dụng shuffle câu/options nếu bật.  
    - Hỗ trợ 3 loại câu hỏi: trắc nghiệm 1 đáp án, nhiều đáp án, essay.  
    - Đếm ngược thời gian (`timeRemaining`), auto-submit khi hết giờ.  
    - **Phát hiện chuyển tab**:
      - Dùng `visibilitychange`:
        - Lần đầu rời tab → cảnh báo.  
        - Sau N lần (hiện đặt 3) → auto nộp bài với `handleSubmit(timeRemaining)`.  
    - Khi submit:
      - Tự chấm câu khách quan, tính `calculatedScore`, `totalMarks`, `percentage`.  
      - Gọi `api.createSubmission` và điều hướng đến `/result/:id`.

- **`src/pages/result-detail.tsx`, `results.tsx`**  
  - `ResultsPage`:
    - Thống kê tổng số bài đã làm, điểm trung bình, điểm cao nhất, tổng thời gian học.  
    - List các kết quả, hiển thị `%` dựa trên:
      - `percentage` từ backend nếu có,  
      - hoặc `score / totalMarks * 100`,  
      - hoặc fallback 10 điểm/câu.  
  - `ResultDetailPage`:
    - Hiển thị chi tiết câu hỏi, đáp án đúng/sai, điểm từng phần.

- **`src/pages/leaderboard.tsx`**  
  - Bảng xếp hạng điểm cao:
    - Gọi `api.getGlobalLeaderboard` hoặc `getExamLeaderboard`.  
    - Hiển thị tên học sinh, % điểm, thời gian làm.

- **`src/pages/profile.tsx`**  
  - Trang hồ sơ:
    - Xem/sửa tên, lớp, avatar.  
    - Gọi `api.updateProfile`.

### 2.5. Các trang cho GIÁO VIÊN

- **`src/pages/teacher.tsx` (`TeacherPage`)**  
  - Chỉ cho `role === "teacher"`.  
  - Gồm 3 tab:
    - **Bài kiểm tra của tôi**:
      - Liệt kê exams do giáo viên tạo.  
      - Cho phép sửa, xóa (gọi `updateExam`, `deleteExam`).  
    - **Chấm điểm đang chờ**:
      - Dùng `api.getPendingSubmissions()`:
        - Hiển thị bài có câu tự luận `grading_status = pending_manual`.  
        - Nút “Chấm điểm ngay” → `/teacher/grading?id=...`.  
    - **Thống kê**:
      - Sau khi sửa, logic:
        - Tải danh sách exam của giáo viên → `exams`.  
        - Dựa vào `exams`, gọi `getExamSubmissions(exam.id)` cho từng đề → gộp thành `allSubmissions`.  
      - Cho phép lọc theo đề:
        - Tính:
          - **Tổng số học sinh** (distinct `student_id`).  
          - **Tổng số bài nộp**.  
          - **Điểm trung bình %** (từ `percentage`).  
          - **Tỷ lệ đạt >= 60%**.  
        - Bảng “Bài nộp gần đây”: tên học sinh, đề, %, trạng thái chấm, ngày nộp.

- **`src/pages/teacher-grading.tsx` (`TeacherGrading`)**  
  - Trang chấm bài tự luận:
    - Load submission theo `id` trên query string.  
    - Load exam tương ứng, normalize `answers` bằng `normalizeAnswers`.  
    - Tìm câu essay, hiển thị câu hỏi + câu trả lời học sinh.  
    - Giáo viên nhập điểm cho từng câu (giới hạn trong `0..marks`).  
    - Gọi `api.gradeSubmission` với `essay_scores`, backend tính lại tổng điểm & percentage.

- **`src/pages/create-test.tsx`, `teacher-videos.tsx`, `videos.tsx`**  
  - Tạo đề thi mới, quản lý video dạy học, trang xem video cho học sinh.

### 2.6. ToDo frontend React

- [ ] Rà soát toàn bộ chỗ tính % điểm để luôn dùng chung một hàm helper (giống `getResultPercentage` trong `results.tsx`).  
- [ ] Bổ sung validate/gợi ý UI ở trang tạo đề (tổng `marks` khớp `total_marks`, cảnh báo khi thiếu câu hỏi…).  
- [ ] Cải thiện UX khi auto nộp bài do hết giờ / rời tab quá nhiều (dùng dialog thay cho `alert`).  
- [ ] Thêm loading/skeleton rõ ràng hơn cho các màn lớn (dashboard, teacher statistics).  
- [ ] Thêm i18n nếu cần đa ngôn ngữ.

---

## 3. Gợi ý phát triển tiếp

- **Bảo mật**:  
  - Thêm rate limiting, xác thực JWT/cookie an toàn, CORS chặt chẽ.  
  - Ẩn thông tin nhạy cảm khi trả lỗi.

- **Chấm bài nâng cao**:  
  - Gợi ý chấm tự luận bằng AI (hiển thị cho giáo viên tham khảo chứ không auto chấm).  

- **Phân tích học tập**:  
  - Thêm biểu đồ tiến bộ theo thời gian, theo môn, theo dạng câu hỏi.  

---

## 4. Modules & thuật toán chính

### 4.1. Modules backend nổi bật

- **Express**: framework web chính, dùng để:
  - Định nghĩa route API (`routes/api.js`) và route view (`routes/web.js`).  
  - Gắn middleware parse JSON, cookie, static files, error handler.
- **Driver DB (MySQL / tương đương)**:
  - Tạo kết nối dùng chung trong `config/database.js`.  
  - Thực thi query CRUD cho bảng `users`, `exams`, `exam_questions`, `submissions`, `videos`.  
- **Multer (hoặc tương đương) cho upload**:
  - Dùng trong `uploadController.js` để nhận file (ảnh/avatar) và lưu vào `public/uploads`.  
- **bcrypt / crypto**:
  - Hash mật khẩu trước khi lưu.  
  - So sánh mật khẩu khi đăng nhập.  
- **jsonwebtoken (nếu dùng JWT)**:
  - Ký và verify token cho người dùng, đính kèm vào header/cookie để xác thực request.

> Lưu ý: tên lib cụ thể phụ thuộc đúng `package.json` của backend, nhưng ý tưởng chung là nhóm module trên đảm nhiệm bảo mật, kết nối CSDL và routing API.

### 4.2. Modules frontend nổi bật

- **React + React Router**:
  - Xây SPA với các trang: `HomePage`, `DashboardPage`, `TestDetailPage`, `ResultsPage`, `TeacherPage`, `TeacherGrading`, v.v.  
  - Dùng `BrowserRouter`, `Route`, `Link`, `useNavigate`, `useParams`, `useSearchParams` để điều hướng.
- **Context API**:
  - `AuthContext`: lưu `user`, `isLoading`, các hàm đăng nhập/đăng xuất.  
  - `ThemeContext`: lưu theme hiện tại, điều khiển dark/light/system.
- **Tailwind CSS + clsx + tailwind-merge**:
  - Tailwind: utility class cho layout, màu sắc, spacing.  
  - `clsx` & `twMerge` (hàm `cn` trong `lib/utils.ts`) để gộp className linh hoạt:
    - Tránh trùng/đè class.  
    - Dễ conditionally apply class.
- **Bộ UI (Shadcn-style components)**:
  - Các component trong `components/ui/*` (Card, Button, Table, Tabs, Dialog, Toast, Progress, v.v.) tạo nên layout và trải nghiệm hiện đại, tái sử dụng.
- **Lucide Icons**:
  - Các icon như `BookOpen`, `Trophy`, `TrendingUp`, `BarChart3`, `Clock`, `Users`… dùng để minh họa trong dashboard, thống kê, nút bấm.

### 4.3. Thuật toán & xử lý quan trọng

#### 4.3.1. Shuffle câu hỏi & đáp án

- Vị trí: `TestDetailPage` (`src/pages/test-detail.tsx`), hàm `shuffleArray` + `applyShuffling`.  
- Thuật toán:
  - Dùng **Fisher–Yates shuffle**:
    - Duyệt từ phần tử cuối mảng đến đầu.  
    - Mỗi bước chọn ngẫu nhiên `j` từ `0..i`, rồi swap `array[i]` với `array[j]`.  
  - Khi shuffle đáp án:
    - Lưu lại text đáp án đúng trước khi xáo.  
    - Sau khi xáo, tìm lại vị trí mới của text đó để cập nhật `correctAnswer` (cho cả single/multiple choice).  
- Mục tiêu: mỗi lần làm bài học sinh thấy thứ tự câu hỏi/đáp án khác nhau nhưng **đáp án đúng vẫn chính xác**.

#### 4.3.2. Tính điểm & phần trăm (%)

- **Auto-chấm trong `TestDetailPage`**:
  - Duyệt từng câu:
    - Nếu **multiple_choice_single**: so sánh index đáp án học sinh với `correctAnswer`. Đúng thì cộng `marks` (mặc định 10 nếu thiếu).  
    - Nếu **multiple_choice_multiple**: sort cả 2 mảng (đáp án HS & đáp án đúng) rồi so sánh; trùng khớp hoàn toàn mới cộng `marks`.  
    - Nếu **essay**: bỏ qua (đợi chấm tay).  
  - Tổng lại thành `calculatedScore`.  
  - `totalMarks` = `test.totalMarks` hoặc fallback `số câu * 10`.  
  - `percentage` = `calculatedScore / totalMarks * 100`, làm tròn.

- **Chuẩn hóa % để không vượt 100%**:
  - Trong `ResultsPage` & `DashboardPage`, có hàm dạng `getResultPercentage`:
    - Nếu backend đã lưu `percentage` → dùng trực tiếp nhưng **clamp** về `0..100`.  
    - Nếu có `totalMarks` → tính `score / totalMarks * 100`, rồi clamp `0..100`.  
    - Nếu không có → giả sử 10 điểm/câu, tính tương tự.  
  - Mục đích: tránh logic sai khiến hiển thị `> 100%`, đặc biệt khi backend lưu `score` là tổng điểm chứ không phải số câu đúng.

#### 4.3.3. Chuẩn hóa answers cho chấm tự luận

- Vị trí: `lib/utils.ts`, hàm `normalizeAnswers`.  
- Ý tưởng:
  - Input `rawAnswers` có thể là:
    - Mảng (array),  
    - Object `{questionId: answer}`,  
    - Hoặc string JSON cần parse.  
  - Hàm:

```36:80:frontend-react/src/lib/utils.ts
export function normalizeAnswers(
  rawAnswers: unknown,
  questions?: QuestionIdentifier[]
): NormalizedAnswer[] {
  const parsed = parseRawAnswers(rawAnswers)

  if (Array.isArray(parsed)) {
    return parsed as NormalizedAnswer[]
  }

  if (parsed && typeof parsed === "object") {
    const answerObj = parsed as Record<string | number, NormalizedAnswer>

    if (questions && questions.length > 0) {
      return questions.map((question, index) => {
        const candidates: Array<string | number> = []

        if (question.id !== undefined && question.id !== null) {
          candidates.push(question.id)
          candidates.push(String(question.id))
        }

        if (question.order_number !== undefined && question.order_number !== null) {
          candidates.push(question.order_number)
          candidates.push(String(question.order_number))
        }

        candidates.push(index, String(index))

        for (const key of candidates) {
          if (key in answerObj) {
            return answerObj[key]
          }
        }

        return null
      })
    }

    return Object.keys(answerObj)
      .sort(sortObjectKeys)
      .map((key) => answerObj[key] ?? null) as NormalizedAnswer[]
  }

  return []
}
```

- Kết quả: giáo viên luôn nhận được mảng answers đã được **align đúng thứ tự câu hỏi**, bất kể backend lưu theo id, order_number hay index.

#### 4.3.4. Phát hiện chuyển tab khi làm bài

- Vị trí: `TestDetailPage` (`src/pages/test-detail.tsx`).  
- Thuật toán:
  - Dùng `document.addEventListener("visibilitychange", ...)`.  
  - Khi `document.hidden === true`:
    - Tăng `tabLeaveCount`.  
    - Nếu là lần 1 → cảnh báo tập trung.  
    - Nếu vượt ngưỡng (ví dụ 3 lần) → gọi `handleSubmit(timeRemaining)` để **tự động nộp bài**.  
  - Bỏ đăng ký sự kiện khi component unmount hoặc khi chưa bắt đầu bài.

#### 4.3.5. Thống kê giáo viên (statistics)

- Vị trí: `TeacherPage` tab "Thống kê".  
- Bước:
  1. Load tất cả đề thi giáo viên tạo (`getExams({ created_by: user.id })`).  
  2. Với mỗi đề, gọi `getExamSubmissions(exam.id)` → gộp lại `allSubmissions`.  
  3. Tùy `selectedExamForStats`:
     - Lọc submissions theo 1 đề cụ thể hoặc tất cả.  
  4. Tính:
     - `totalStudents` = số `student_id` unique (dùng `Set`).  
     - `totalSubmissions` = độ dài mảng filter.  
     - `averageScore` = trung bình `percentage`.  
     - `passRate` = tỉ lệ bài có `percentage >= 60`.  
  5. Sắp xếp theo `submitted_at` giảm dần, lấy top 10 hiển thị trong bảng.

---

## 5. Luồng hoạt động API (end-to-end)

### 5.1. Học sinh làm bài kiểm tra

1. Học sinh vào `/tests` hoặc `/dashboard` → chọn đề.  
2. Frontend gọi **`GET /exams/:id`** (`api.getExam`) → backend trả `ExamDTO` + danh sách câu hỏi.  
3. `TestDetailPage` map dữ liệu sang `Test`, shuffle nếu được bật, khởi động timer.  
4. Khi bấm “Submit” hoặc hết giờ:
   - Frontend tự chấm câu trắc nghiệm, tính `score`, `totalMarks`, `percentage`, `timeTaken`.  
   - Gửi **`POST /submissions`** (`api.createSubmission`) với payload trên + `answers`.  
5. Backend:
   - Lưu bản ghi `submissions` với `grading_status` phù hợp (auto_graded/pending_manual).  
   - Trả lại `submission` cho frontend.  
6. Frontend điều hướng sang `/result/:id` để xem chi tiết.

### 5.2. Dashboard & lịch sử kết quả học sinh

1. `DashboardPage` và `ResultsPage` gọi **`GET /submissions/student/:studentId`**.  
2. Backend trả danh sách `SubmissionDTO` (kèm `exam_title`, `subject`, `grade_level`, `percentage`, `total_marks`, v.v. nếu có).  
3. Frontend:
   - Map sang `TestResult`/`DashboardResult`.  
   - Dùng thuật toán tính phần trăm chuẩn hóa.  
   - Tính thống kê tổng quan (số bài, điểm TB, điểm cao nhất, tổng thời gian).

### 5.3. Thống kê & chấm bài cho giáo viên

1. `TeacherPage`:
   - Gọi **`GET /exams?created_by=:teacherId`** để lấy đề của giáo viên.  
   - Gọi **`GET /submissions/pending`** để lấy các bài đang chờ chấm (có essay).  
   - Cho tab Thống kê: với mỗi exam, gọi **`GET /submissions/exam/:examId`**.  
2. `TeacherGrading`:
   - Khi giáo viên mở chấm 1 bài:
     - Gọi **`GET /submissions/:id`** để lấy submission.  
     - Gọi **`GET /exams/:examId`** để lấy nội dung đề và câu hỏi.  
   - Sau khi nhập điểm essay:
     - Gửi **`PUT /submissions/:id/grade`** với `essay_scores`, `graded_by`.  
   - Backend tính lại tổng `score`, `percentage`, cập nhật `grading_status = completed` và lưu `partial_scores`.

### 5.4. Bảng xếp hạng (Leaderboard)

1. Trang `leaderboard.tsx` gọi:
   - **`GET /leaderboard/global`** hoặc  
   - **`GET /leaderboard/exam/:examId`**.  
2. Backend:
   - Tổng hợp từ bảng `submissions` theo tiêu chí:
     - Lọc theo `exam_id` (nếu là exam leaderboard).  
     - Lọc theo môn/lớp nếu cần.  
   - Sắp xếp theo `percentage` giảm dần, tie-break bằng `time_taken` hoặc `completed_at`.  
   - Trả `LeaderboardEntry[]`.  
3. Frontend render danh sách top N với tên học sinh, điểm %, thời gian làm.



