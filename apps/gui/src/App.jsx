import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { useLayoutEffect } from "react";
import Editor from "./pages/Editor";
import Templates from "./pages/Templates";
import Docs from "./pages/Docs";
import About from "./pages/About";
import SettingsContextProvider from "./context/SettingsContextProvider";
import NotFound from "./pages/NotFound";

export default function App() {
  return (
    <SettingsContextProvider>
      <BrowserRouter>
        <RestoreScroll />
        <Routes>
          <Route path="/" element={<Editor />} />
          <Route path="/templates" element={<Templates />} />
          <Route path="/docs" element={<Docs />} />
          <Route path="/about" element={<About />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </SettingsContextProvider>
  );
}

function RestoreScroll() {
  const location = useLocation();
  useLayoutEffect(() => {
    window.scroll(0, 0);
  }, [location.pathname]);
  return null;
}
