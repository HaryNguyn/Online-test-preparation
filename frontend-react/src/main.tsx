import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { BrowserRouter } from "react-router-dom"
import App from "./App.jsx"
import { AuthProvider } from "@/contexts/auth-context"
import './index.css'

const rootElement = document.getElementById("root")

if (!rootElement) {
  throw new Error("Root element not found")
}

document.documentElement.classList.add("dark")

createRoot(rootElement).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
