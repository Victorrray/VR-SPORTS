// file: src/App.jsx
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import PrivateRoute from "./auth/PrivateRoute";

// Lazy pages with fallback to named exports
const SportsbookMarkets = React.lazy(() =>
  import("./pages/SportsbookMarkets").then(m => ({ default: m.default || m.SportsbookMarkets }))
);
const Home = React.lazy(() =>
  import("./pages/Home").then(m => ({ default: m.default || m.Home }))
);
const Login = React.lazy(() =>
  import("./pages/Login").then(m => ({ default: m.default || m.Login }))
);
const Account = React.lazy(() =>
  import("./pages/Account").then(m => ({ default: m.default || m.Account }))
);
const MyPicks = React.lazy(() =>
  import("./pages/MyPicks").then(m => ({ default: m.default || m.MyPicks }))
);
const Scores = React.lazy(() =>
  import("./pages/Scores").then(m => ({ default: m.default || m.Scores }))
);

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
          <Routes>
            <Route path="/" element={<Home />} />

            {/* Require sign-in to view odds */}
            <Route
              path="/sportsbooks"
              element={
                <PrivateRoute>
                  <SportsbookMarkets />
                </PrivateRoute>
              }
            />

            {/* Scores: public */}
            <Route path="/scores" element={<Scores />} />

            {/* Picks: require sign-in */}
            <Route
              path="/picks"
              element={
                <PrivateRoute>
                  <MyPicks />
                </PrivateRoute>
              }
            />

            <Route path="/login" element={<Login />} />
            <Route
              path="/account"
              element={
                <PrivateRoute>
                  <Account />
                </PrivateRoute>
              }
            />

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
        .filter(c => c.startsWith("theme-"))
        .forEach(c => el.classList.remove(c));
      el.classList.add("theme-emerald");
    } catch {}
  }, []);
  return <AppRoutes />;
}
