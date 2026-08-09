import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router'
import './index.css'
import App from './App.tsx'
import ConversationsPage from './pages/ConversationsPage.tsx'
import AiIsaPage from './pages/AiIsaPage.tsx'
import MultilingualVoicePage from './pages/MultilingualVoicePage.tsx'
import WakilzVsIsaPage from './pages/WakilzVsIsaPage.tsx'
import LuxuryRealEstatePage from './pages/LuxuryRealEstatePage.tsx'

createRoot(document.getElementById('root')!).render(
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<App />} />
      <Route path="/conversations" element={<ConversationsPage />} />
      <Route path="/conversations/:sessionId" element={<ConversationsPage />} />
      <Route path="/ai-isa-real-estate" element={<AiIsaPage />} />
      <Route path="/multilingual-voice-agent" element={<MultilingualVoicePage />} />
      <Route path="/wakilz-vs-human-isa" element={<WakilzVsIsaPage />} />
      <Route path="/ai-voice-agent-luxury-real-estate" element={<LuxuryRealEstatePage />} />
    </Routes>
  </BrowserRouter>
)
