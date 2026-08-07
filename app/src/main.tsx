import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router'
import './index.css'
import App from './App.tsx'
import ConversationsPage from './pages/ConversationsPage.tsx'

createRoot(document.getElementById('root')!).render(
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<App />} />
      <Route path="/conversations" element={<ConversationsPage />} />
      <Route path="/conversations/:sessionId" element={<ConversationsPage />} />
    </Routes>
  </BrowserRouter>
)
