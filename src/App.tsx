import Layout from "./components/Layout";
import GameUI from "./pages/GameUI";
import GameDetail from "./pages/GameDetail";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import History from "./pages/History";
import Settings from "./pages/Settings";

function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<GameUI />} />
          <Route path="/game/:id" element={<GameDetail />} />
          <Route path="/history" element={<History />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;
