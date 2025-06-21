import React from "react";
import { Routes, Route, Navigate, useLocation, Link } from "react-router-dom";
import SportsbookMarkets from "./pages/SportsbookMarkets";
import DFSMarkets from "./pages/DFSMarkets";

// Tab Navigation Bar
function TabNav() {
  const { pathname } = useLocation();
  return (
    <nav style={{
      display: "flex",
      gap: "2em",
      justifyContent: "center",
      marginTop: "2em",
      marginBottom: "1em",
    }}>
      <Link
        to="/sportsbooks"
        className={`tab-btn${pathname === "/sportsbooks" ? " active" : ""}`}
        style={{
          fontWeight: 700,
          background: pathname === "/sportsbooks" ? "#3355ff" : "#23263a",
          color: pathname === "/sportsbooks" ? "#fff" : "#bbcbff",
          border: "none",
          borderRadius: "8px 8px 0 0",
          fontSize: "1.08em",
          padding: "0.75em 2em",
          textDecoration: "none",
          transition: "background 0.18s",
          boxShadow: pathname === "/sportsbooks" ? "0 6px 16px #3355ff18" : "none",
        }}
      >
        Sportsbooks
      </Link>
      <Link
        to="/dfs"
        className={`tab-btn${pathname === "/dfs" ? " active" : ""}`}
        style={{
          fontWeight: 700,
          background: pathname === "/dfs" ? "#3355ff" : "#23263a",
          color: pathname === "/dfs" ? "#fff" : "#bbcbff",
          border: "none",
          borderRadius: "8px 8px 0 0",
          fontSize: "1.08em",
          padding: "0.75em 2em",
          textDecoration: "none",
          transition: "background 0.18s",
          boxShadow: pathname === "/dfs" ? "0 6px 16px #3355ff18" : "none",
        }}
      >
        DFS Apps
      </Link>
    </nav>
  );
}

function AppRoutes() {
  return (
    <>
      <TabNav />
      <Routes>
        <Route path="/" element={<Navigate to="/sportsbooks" replace />} />
        <Route path="/sportsbooks" element={<SportsbookMarkets />} />
        <Route path="/dfs" element={<DFSMarkets />} />
        <Route path="*" element={<Navigate to="/sportsbooks" replace />} />
      </Routes>
    </>
  );
}

export default function App() {
  return <AppRoutes />;
}
