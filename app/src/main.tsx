import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router'
import './index.css'
import App from './App.tsx'
import ConversationsPage from './pages/ConversationsPage.tsx'
import AiIsaPage from './pages/AiIsaPage.tsx'
import MultilingualVoicePage from './pages/MultilingualVoicePage.tsx'
import WakilzVsIsaPage from './pages/WakilzVsIsaPage.tsx'
import LuxuryRealEstatePage from './pages/LuxuryRealEstatePage.tsx'
import SignInPage from './pages/SignInPage.tsx'
import PortalRedirect from './pages/PortalRedirect.tsx'
import AdminDashboard from './pages/AdminDashboard.tsx'
import ClientDashboard from './pages/ClientDashboard.tsx'
import ProtectedRoute from './components/ProtectedRoute.tsx'
import { AuthProvider } from './contexts/AuthContext.tsx'

createRoot(document.getElementById('root')!).render(
  <AuthProvider>
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<App />} />
        <Route path="/conversations" element={<ConversationsPage />} />
        <Route path="/conversations/:sessionId" element={<ConversationsPage />} />
        <Route path="/ai-isa-real-estate" element={<AiIsaPage />} />
        <Route path="/multilingual-voice-agent" element={<MultilingualVoicePage />} />
        <Route path="/wakilz-vs-human-isa" element={<WakilzVsIsaPage />} />
        <Route path="/ai-voice-agent-luxury-real-estate" element={<LuxuryRealEstatePage />} />
        <Route path="/signin" element={<SignInPage />} />

        {/* Portal redirect — role-based after sign in */}
        <Route path="/portal" element={<PortalRedirect />} />

        {/* Protected routes */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute requiredRole="client">
              <ClientDashboard />
            </ProtectedRoute>
          }
        />

        {/* 404 fallback — redirect to home */}
        <Route path="*" element={<App />} />
      </Routes>
    </BrowserRouter>
  </AuthProvider>
)
