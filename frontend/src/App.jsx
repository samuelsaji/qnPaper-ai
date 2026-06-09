import React from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { Sidebar } from "./components/Sidebar";
import AuthPage from "./pages/AuthPage";
import DashboardPage from "./pages/DashboardPage";
import GeneratePage from "./pages/GeneratePage";
import TemplatesPage from "./pages/TemplatesPage";
import SettingsPage from "./pages/SettingsPage";
import PaperPreviewPage from "./pages/PaperPreviewPage";
import { AuthProvider } from "./context/AuthContext";

// Re-export AuthContext from new location for legacy imports
export { AuthContext } from "./context/AuthContext";

class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { hasError: false, error: null }; }
  static getDerivedStateFromError(error) { return { hasError: true, error }; }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 40, color: "red" }}>
          <h2>Page crashed:</h2>
          <pre>{this.state.error?.message}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

function ProtectedRoute({ children }) {
  const token = localStorage.getItem("qp_token");
  return token ? children : <Navigate to="/" replace />;
}

function ProtectedLayout({ children }) {
  const location = useLocation();
  const isFullScreen = location.pathname === "/generate";

  return (
    <div className="min-h-screen bg-[#F0F4F8] text-[#111827]">
      <Sidebar />
      <main
        className={[
          "min-h-screen transition-all duration-200 ml-16 md:ml-[220px]",
          isFullScreen
            ? "h-screen overflow-hidden p-0 ml-0 md:ml-0"
            : "px-5 py-6 md:px-8 lg:p-10",
        ].join(" ")}
      >
        {children}
      </main>
    </div>
  );
}

function AppRoutes() {
  const token = localStorage.getItem("qp_token");
  return (
    <Routes>
      <Route path="/" element={token ? <Navigate to="/dashboard" replace /> : <AuthPage />} />
      <Route path="/dashboard" element={<ProtectedRoute><ProtectedLayout><DashboardPage /></ProtectedLayout></ProtectedRoute>} />
      <Route path="/generate" element={<ProtectedRoute><ProtectedLayout><GeneratePage /></ProtectedLayout></ProtectedRoute>} />
      <Route path="/templates" element={<ProtectedRoute><ProtectedLayout><ErrorBoundary><TemplatesPage /></ErrorBoundary></ProtectedLayout></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><ProtectedLayout><SettingsPage /></ProtectedLayout></ProtectedRoute>} />
      <Route path="/paper-preview" element={<ProtectedRoute><ProtectedLayout><PaperPreviewPage /></ProtectedLayout></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}
