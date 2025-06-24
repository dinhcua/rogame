import "./App.css";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import GameUI from "./pages/GameUI";
import GameDetail from "./pages/GameDetail";
import Settings from "./pages/Settings";
import History from "./pages/History";
import Layout from "./components/Layout";
import "./i18n/config";

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<GameUI />} />
          <Route path="/game/:id" element={<GameDetail />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/history" element={<History />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
