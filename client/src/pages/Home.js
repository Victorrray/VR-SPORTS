import React from "react";
import { Link } from "react-router-dom";
import styles from "./Home.module.css";

export default function Home() {
  return (
    <main className={styles.container} role="main">
      <section className={styles.hero}>
        <h1 className={styles.title}>Welcome to <span className={styles.accentText}>OddsSightSeer</span></h1>
        <p className={styles.subtitle}>
          Compare lines across books, spot edges fast, and lock value.
        </p>

        <div className={styles.chipsRow} aria-label="Featured sports">
          {['NFL','NCAAF','NBA','MLB','NHL'].map((label) => (
            <span key={label} className={styles.chip}>{label}</span>
          ))}
        </div>

        <div className={styles.ctaRow}>
          <Link to="/sportsbooks" className={`${styles.heroBtn} ${styles.ctaPrimary}`}>Browse Sportsbooks Odds</Link>
        </div>
      </section>
      {/* Removed original two cards for a cleaner hero-forward layout */}

      <h2 className={styles.sectionTitle}>Quick Stats</h2>
      <section className={styles.stats} aria-label="Quick stats">
        <div className={styles.statCard}>
          <div className={styles.statVal}>10+</div>
          <div className={styles.statLabel}>Sports</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statVal}>20+</div>
          <div className={styles.statLabel}>Books</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statVal}>50+</div>
          <div className={styles.statLabel}>Markets</div>
        </div>
      </section>

      <h2 className={styles.sectionTitle}>Highlights</h2>
      <section id="highlights" className={styles.highlights} aria-label="Highlights">
        <div className={styles.highlightItem}>
          <div className={styles.hlIcon}>⚡</div>
          <div>
            <h3>Fast Updates</h3>
            <p>Live line changes and quick table scanning for best prices.</p>
          </div>
        </div>
        <div className={styles.highlightItem}>
          <div className={styles.hlIcon}>📈</div>
          <div>
            <h3>EV Insights</h3>
            <p>Consensus + de‑vig fair lines with clean EV calculations.</p>
          </div>
        </div>
        <div className={styles.highlightItem}>
          <div className={styles.hlIcon}>🧭</div>
          <div>
            <h3>Simple Filters</h3>
            <p>Market chips, +EV toggle, and date filter to hone in faster.</p>
          </div>
        </div>
      </section>

      {/* Quick stats moved above highlights */}

      {/* How it works */}
      <h2 className={styles.sectionTitle}>How It Works</h2>
      <section className={styles.how} aria-label="How it works">
        <div className={styles.howStep}>
          <div className={styles.howNum}>1</div>
          <h3>Pick your sports</h3>
          <p>Choose NFL, NCAAF and more — tailor the slate.</p>
        </div>
        <div className={styles.howStep}>
          <div className={styles.howNum}>2</div>
          <h3>Filter smart</h3>
          <p>Toggle markets, set a minimum EV, and select books.</p>
        </div>
        <div className={styles.howStep}>
          <div className={styles.howNum}>3</div>
          <h3>Act on value</h3>
          <p>Expand rows to compare lines across books instantly.</p>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className={styles.ctaBanner} aria-label="Get started">
        <div>
          <h3>Ready to find value?</h3>
          <p>Open the Sportsbooks view and start comparing odds.</p>
        </div>
        <Link to="/sportsbooks" className={`${styles.heroBtn} ${styles.ctaPrimary}`}>Open Sportsbooks</Link>
      </section>
    </main>
  );
}
