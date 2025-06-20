import React from "react";
import { Link } from "react-router-dom";
import styles from "./Home.module.css";

export default function Home() {
  return (
    <div className={styles.container}>
      <section className={styles.hero}>
        <h1 className={styles.title}>Welcome to OddsSightSeer</h1>
        <p className={styles.subtitle}>
          Your all-in-one sports betting and fantasy odds platform.
        </p>
        <Link to="/markets" className={styles.heroBtn}>Browse Odds Now</Link>
      </section>
      <div className={styles.cards}>
        <div className={styles.card}>
          <h2>Live Odds</h2>
          <p>Track the latest odds for every major sport, all in one place.</p>
        </div>
        <div className={styles.card}>
          <h2>Markets</h2>
          <p>Quickly switch between betting markets and fantasy props.</p>
        </div>
        <div className={styles.card}>
          <h2>Compare & Win</h2>
          <p>Find the best lines and maximize your edge with real-time data.</p>
        </div>
      </div>
    </div>
  );
}
