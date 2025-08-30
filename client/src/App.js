// file: src/App.jsx
import React from "react";
import { Routes, Route, Navigate, useLocation, Link } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import PrivateRoute from "./auth/PrivateRoute";

// Lazy pages
const SportsbookMarkets = React.lazy(() => import("./pages/SportsbookMarkets"));
const Home = React.lazy(() => import("./pages/Home"));
const Login = React.lazy(() => import("./pages/Login"));
const Account = React.lazy(() => import("./pages/Account"));

// (Optional) Tab Navigation Bar — keep if you actually want this UI
function TabNav() {
  const { pathname } = useLocation();
  return (
    <nav
      style={{
        display: "flex",
        gap: "2em",
        justifyContent: "center",
        marginTop: "2em",
        marginBottom: "1em",
      }}
    >
      <Link
        to="/sportsbooks"
        className={`tab-btn${pathname === "/sportsbooks" ? " active" : ""}`}
        style={{
          fontWeight: 700,
          background: pathname === "/sportsbooks" ? "var(--accent)" : "#23263a",
          color: pathname === "/sportsbooks" ? "#fff" : "#bbcbff",
          border: "none",
          borderRadius: "8px 8px 0 0",
          fontSize: "1.08em",
          padding: "0.75em 2em",
          textDecoration: "none",
          transition: "background 0.18s",
          boxShadow:
            pathname === "/sportsbooks"
              ? "0 6px 16px color-mix(in srgb, var(--accent) 18%, transparent)"
              : "none",
        }}
      >
        Sportsbooks
      </Link>

      {/* Remove this block if you don't have a /dfs route */}
      <Link
        to="/dfs"
        className={`tab-btn${pathname === "/dfs" ? " active" : ""}`}
        style={{
          fontWeight: 700,
          background: pathname === "/dfs" ? "var(--accent)" : "#23263a",
          color: pathname === "/dfs" ? "#fff" : "#bbcbff",
          border: "none",
          borderRadius: "8px 8px 0 0",
          fontSize: "1.08em",
          padding: "0.75em 2em",
          textDecoration: "none",
          transition: "background 0.18s",
          boxShadow:
            pathname === "/dfs"
              ? "0 6px 16px color-mix(in srgb, var(--accent) 18%, transparent)"
              : "none",
        }}
      >
        DFS Apps
      </Link>
    </nav>
  );
}

function AppRoutes() {
  return (
    <React.Suspense
      fallback={
        <div style={{ padding: "2em 0" }}>
          <div className="odds-table-card">
            <div className="spinner-wrap">
              <div className="spinner" />
              <p>Loading…</p>
            </div>
          </div>
        </div>
      }
    >
      <div className="app-shell">
        <Navbar />
        <div className="app-body">
          {/* If you actually want TabNav visible, render it here */}
          {/* <TabNav /> */}

          <Routes>
            <Route path="/" element={<Home />} />

            {/* PROTECTED: must be signed in */}
            <Route
              path="/sportsbooks"
              element={
                <PrivateRoute>
                  <SportsbookMarkets />
                </PrivateRoute>
              }
            />

            <Route path="/login" element={<Login />} />

            {/* PROTECTED: account */}
            <Route
              path="/account"
              element={
                <PrivateRoute>
                  <Account />
                </PrivateRoute>
              }
            />

            {/* Optional stub for /dfs to avoid dead link */}
            {/* <Route path="/dfs" element={<div style={{padding:24}}>DFS page coming soon…</div>} /> */}

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
        <Footer />
      </div>
    </React.Suspense>
  );
}

export default function App() {
  React.useEffect(() => {
    try {
      const el = document.body;
      Array.from(el.classList)
        .filter((c) => c.startsWith("theme-"))
        .forEach((c) => el.classList.remove(c));
      el.classList.add("theme-emerald");
    } catch {}
  }, []);
  return <AppRoutes />;
}
