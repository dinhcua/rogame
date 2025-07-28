import "./App.css";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import GameUI from "./pages/GameUI";
import GameDetail from "./pages/GameDetail";
import Settings from "./pages/Settings";
import History from "./pages/History";
import Layout from "./components/Layout";
import { ToastProvider } from "./contexts/ToastContext";
import ToastContainer from "./components/ToastContainer";
import { useToastContext } from "./contexts/ToastContext";
import { useDeepLink } from "./hooks/useDeepLink";
import "./i18n/config";

function AppRoutes() {
  // Initialize deep link handler
  useDeepLink();
  
  return (
    <Routes>
      <Route path="/" element={<GameUI />} />
      <Route path="/game/:id" element={<GameDetail />} />
      <Route path="/settings" element={<Settings />} />
      <Route path="/history" element={<History />} />
    </Routes>
  );
}

function AppContent() {
  const { toasts, removeToast } = useToastContext();
  
  return (
    <>
      <Router>
        <Layout>
          <AppRoutes />
        </Layout>
      </Router>
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </>
  );
}

function App() {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  );
}

export default App;
