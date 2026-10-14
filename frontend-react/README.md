# ExamPrep Frontend - React + TypeScript + Vite

ExamPrep is an online learning and exam preparation platform with an intelligent chatbot assistant.

## 🤖 New Chatbot Features

### Intelligent Natural Language Understanding
The chatbot now understands natural Vietnamese and English commands and can:
- **Find Videos**: "Tôi cần xem video môn Toán" or "Show me math videos"
- **Find Tests**: "Cho tôi bài kiểm tra Lý" or "Test for Physics"
- **View Results**: "Xem kết quả của tôi" or "Show my results"
- **Answer Questions**: "Định luật Newton là gì?" or "What is Newton's law?"
- **System Guidance**: "Làm thế nào để làm bài thi?" or "How to take a test?"

### Key Improvements
- ✅ **Smart Intent Detection**: Understands various ways users express their needs
- ✅ **Enhanced Subject Mapping**: Supports synonyms (toán, toan, math → Toán)
- ✅ **Contextual Responses**: Provides relevant, personalized responses
- ✅ **Real-time Search**: Instant search results with visual display
- ✅ **Helpful Suggestions**: Offers alternatives when no results found

### Documentation
- 📚 **[Chatbot Guide](../CHATBOT_GUIDE.md)**: Complete guide to using the chatbot
- 🎯 **[Example Commands](../CHATBOT_EXAMPLES.md)**: 100+ example commands with expected behaviors
- 🧪 **Demo Component**: Use `chatbot-demo.tsx` to test chatbot features

### Testing the Chatbot
1. Start the development server
2. Click the chatbot icon (bottom-right corner)
3. Try example commands:
   - "Tôi cần xem video môn Toán lớp 10"
   - "Cho tôi bài kiểm tra Hóa"
   - "Xem kết quả của tôi"

---

## React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
## MK Dang nhapnhap
## student@example.com pass Hai12345@
## teacher@example.com pass Haha12345@
## stu725105059@hnue.edu.vn pass Haibeo2004@
## admin@example.com pass password123
## parent@example.com / password123
## science.teacher@example.com / Haij12345@
## math.teacher@example.com/Robe12345@1
