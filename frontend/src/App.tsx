import { Navigate, Route, Routes } from "react-router-dom";
import Main from "./pages/Main/Main";
import PromptExtension from "./pages/Prompt/PromptExtension";
import Splash from "./pages/Splash/Splash";

const App = () => {
  return (
    <Routes>
      <Route path="/" element={<PromptExtension />} />
  <Route path="/main" element={<Main />} />
      <Route path="/splash" element={<Splash />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;
