import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import GameLibrary from "./pages/GameLibrary";
import GameDetail from "./pages/GameDetail";
import Settings from "./pages/Settings";
import History from "./pages/History";
import Layout from "./components/Layout";
import { ThemeProvider } from "./contexts/ThemeContext";
import "./i18n/config";

function App() {
  return (
    <ThemeProvider>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<GameLibrary />} />
            <Route path="/game/:id" element={<GameDetail />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/history" element={<History />} />
          </Routes>
        </Layout>
      </Router>
    </ThemeProvider>
  );
}

export default App;
