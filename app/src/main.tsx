import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router'
import { lazy, Suspense } from 'react'
import './index.css'
import App from './App.tsx'
import ProtectedRoute from './components/ProtectedRoute.tsx'
import { AuthProvider } from './contexts/AuthContext.tsx'

// Lazy-loaded routes for optimal initial page load performance
const ConversationsPage = lazy(() => import('./pages/ConversationsPage.tsx'))
const AiIsaPage = lazy(() => import('./pages/AiIsaPage.tsx'))
const MultilingualVoicePage = lazy(() => import('./pages/MultilingualVoicePage.tsx'))
const WakilzVsIsaPage = lazy(() => import('./pages/WakilzVsIsaPage.tsx'))
const LuxuryRealEstatePage = lazy(() => import('./pages/LuxuryRealEstatePage.tsx'))
const SignInPage = lazy(() => import('./pages/SignInPage.tsx'))
const PortalRedirect = lazy(() => import('./pages/PortalRedirect.tsx'))
const AdminDashboard = lazy(() => import('./pages/AdminDashboard.tsx'))
const ClientDashboard = lazy(() => import('./pages/ClientDashboard.tsx'))
const ClientPreviewPage = lazy(() => import('./pages/ClientPreviewPage.tsx'))

function PageFallback() {
  return (
    <div style={{ background: '#0A0F1D', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: '40px', height: '40px', border: '3px solid rgba(255,255,255,0.1)', borderTopColor: '#3b82f6', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

createRoot(document.getElementById('root')!).render(
  <AuthProvider>
    <BrowserRouter>
      <Suspense fallback={<PageFallback />}>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<App />} />
          <Route path="/client" element={<ClientPreviewPage />} />
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
            path="/admin-dashboard"
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
      </Suspense>
    </BrowserRouter>
  </AuthProvider>
)
