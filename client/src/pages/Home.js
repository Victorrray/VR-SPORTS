// file: src/pages/Home.jsx
import React, { useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import styles from "./Home.module.css";
import { useAuth } from '../auth/AuthProvider';

// If you have these from config, pass them as props instead
const DEFAULT_SPORTS = ["NFL", "NCAAF", "NBA", "MLB", "NHL", "Soccer", "Tennis"];

const TOOLS = [
  { slug: "positive-ev", title: "Positive EV", blurb: "Real-time, math-driven edges surfaced from market prices." },
  { slug: "arbitrage", title: "Arbitrage", blurb: "Pairs that return regardless of the outcome." },
  { slug: "middles", title: "Middles", blurb: "Price gaps you can land in between." },
  { slug: "low-hold", title: "Low Hold", blurb: "Promos/markets with minimal implied vig." },
  { slug: "parlay-builder", title: "Parlay Builder", blurb: "Assemble legs with expected value guardrails." },
  { slug: "bet-tracker", title: "Bet Tracker", blurb: "Free tracker to monitor CLV and results." },
];

// Tiny mocked preview; wire to your API when ready
const PREVIEW_ROWS = [
  { id: "gm1", league: "NFL", when: "Sun 1:25 PM", away: "49ers", home: "Seahawks", bestAway: "+120 DK", bestHome: "-135 FD" },
  { id: "gm2", league: "MLB", when: "Tonight 7:10", away: "Dodgers", home: "Giants", bestAway: "-110 CZ", bestHome: "+104 b365" },
  { id: "gm3", league: "NCAAF", when: "Sat 5:00", away: "USC", home: "Oregon", bestAway: "+145 DK", bestHome: "-150 CZ" },
];

export default function Home({
  featuredSports = DEFAULT_SPORTS,
  stats = { sports: 12, books: 25, markets: 90 },
}) {
  const navigate = useNavigate();

  const chips = useMemo(
    () =>
      featuredSports
        .filter(Boolean)
        .map((s) => String(s).trim())
        .filter((s, i, arr) => s && arr.indexOf(s) === i),
    [featuredSports]
  );

  const goToSport = (sport) => navigate(`/sportsbooks?sport=${encodeURIComponent(sport)}`);
  const goToTool = (slug) => navigate(`/tools/${slug}`);

  return (
    <main className={styles.container} role="main">
      {/* ===== Hero ===== */}
      <section className={styles.hero} aria-labelledby="hero-heading">
        <h1 id="hero-heading" className={styles.title}>
          See odds clearly.
          <span className={styles.accentText}> Bet smarter.</span>
        </h1>
        <p className={styles.subtitle}>
          Line shop across top books, filter by +EV, and act the moment value appears.
        </p>

        <div className={styles.chipsRow} aria-label="Quick sports">
          {chips.map((label) => (
            <button
              key={label}
              type="button"
              className={styles.chip}
              onClick={() => goToSport(label)}
              aria-label={`Browse ${label} odds`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className={styles.ctaRow}>
          <Link to="/sportsbooks" className={`${styles.heroBtn} ${styles.ctaPrimary}`}>
            Browse Live Odds
          </Link>
          <Link to="/signup" className={`${styles.heroBtn} ${styles.ctaGhost}`}>
            Start Free Alerts
          </Link>
        </div>
      </section>

      {/* ===== Social proof stats ===== */}
      <h2 className={styles.sectionTitle} id="stats-heading">By the numbers</h2>
      <section className={styles.stats} aria-labelledby="stats-heading" role="region">
        <div className={styles.statCard}>
          <div className={styles.statVal}>{stats.sports}+</div>
          <div className={styles.statLabel}>Sports</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statVal}>{stats.books}+</div>
          <div className={styles.statLabel}>Books</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statVal}>{stats.markets}+</div>
          <div className={styles.statLabel}>Markets</div>
        </div>
      </section>

      {/* ===== Tools grid (inspired by popular odds comparison suites) ===== */}
      <h2 className={styles.sectionTitle} id="tools-heading">Tools that create an edge</h2>
      <section className={styles.tools} aria-labelledby="tools-heading" role="list">
        {TOOLS.map((t) => (
          <article
            key={t.slug}
            className={styles.toolCard}
            role="listitem"
            onClick={() => goToTool(t.slug)}
            tabIndex={0}
            onKeyDown={(e) => (e.key === "Enter" || e.key === " " ? goToTool(t.slug) : null)}
            aria-label={`${t.title} tool`}
          >
            <div className={styles.toolBadge}>{t.title}</div>
            <p className={styles.toolBlurb}>{t.blurb}</p>
            <span className={styles.toolCta}>Open</span>
          </article>
        ))}
      </section>

      {/* ===== Live odds preview table ===== */}
      <h2 className={styles.sectionTitle} id="preview-heading">Live odds preview</h2>
      <section className={styles.preview} aria-labelledby="preview-heading">
        <div className={styles.tableWrap} role="table" aria-label="Live odds preview table">
          <div className={`${styles.tr} ${styles.th}`} role="row">
            <div className={styles.td} role="columnheader">League</div>
            <div className={styles.td} role="columnheader">Game</div>
            <div className={styles.td} role="columnheader">When</div>
            <div className={styles.td} role="columnheader">Best Away</div>
            <div className={styles.td} role="columnheader">Best Home</div>
            <div className={styles.td} role="columnheader"></div>
          </div>

          {PREVIEW_ROWS.map((r) => (
            <div key={r.id} className={styles.tr} role="row">
              <div className={styles.td} role="cell">{r.league}</div>
              <div className={styles.td} role="cell">{r.away} @ {r.home}</div>
              <div className={styles.td} role="cell">{r.when}</div>
              <div className={styles.td} role="cell">{r.bestAway}</div>
              <div className={styles.td} role="cell">{r.bestHome}</div>
              <div className={styles.td} role="cell">
                <Link className={styles.rowLink} to={`/matchup/${r.id}`}>View</Link>
              </div>
            </div>
          ))}
        </div>
        <div className={styles.previewCtas}>
          <Link to="/sportsbooks" className={styles.secondaryBtn}>See full odds screen</Link>
          <Link to="/signup" className={styles.secondaryBtn}>Set EV alerts</Link>
        </div>
      </section>

      {/* ===== Education/blog teasers ===== */}
      <h2 className={styles.sectionTitle} id="learn-heading">Learn line shopping & +EV basics</h2>
      <section className={styles.learn} aria-labelledby="learn-heading" role="list">
        <a className={styles.learnCard} role="listitem" href="/blog/line-shopping-guide">
          <h3>Line Shopping 101</h3>
          <p>Why the best number matters and how to find it quickly.</p>
          <span className={styles.toolCta}>Read</span>
        </a>
        <a className={styles.learnCard} role="listitem" href="/blog/expected-value-explained">
          <h3>Expected Value, Explained</h3>
          <p>How we estimate fair lines and surface edges.</p>
          <span className={styles.toolCta}>Read</span>
        </a>
        <a className={styles.learnCard} role="listitem" href="/blog/bet-tracking-and-clv">
          <h3>Track Bets & CLV</h3>
          <p>Monitor performance and closing line value over time.</p>
          <span className={styles.toolCta}>Read</span>
        </a>
      </section>

      {/* ===== Bottom banner ===== */}
      <section className={styles.ctaBanner} aria-label="Get started">
        <div>
          <h3>Ready to find +EV?</h3>
          <p>Create a free account and get alerts when your edge appears.</p>
        </div>
        <div className={styles.bannerRow}>
          <Link to="/signup" className={`${styles.heroBtn} ${styles.ctaPrimary}`}>Start Free</Link>
          <Link to="/sportsbooks" className={`${styles.heroBtn} ${styles.ctaGhost}`}>Browse Odds</Link>
        </div>
      </section>
    </main>
  );
}
