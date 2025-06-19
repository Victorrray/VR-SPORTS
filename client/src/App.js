import React, { useState } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import Home from "./pages/Home";
import MainMarkets from "./pages/MainMarkets";
import Navbar from "./components/Navbar";
import "./index.css";

function App() {
  const location = useLocation();
  const isMarkets = location.pathname === "/markets";
  const [mode, setMode] = useState("game"); // "game" or "props"

  return (
    <>
      <Navbar
        showTabs={isMarkets}
        mode={mode}
        onModeChange={isMarkets ? setMode : undefined}
      />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route
          path="/markets"
          element={<MainMarkets mode={mode} setMode={setMode} />}
        />
        {/* Add more routes as needed */}
      </Routes>
    </>
  );
}

export default App;
