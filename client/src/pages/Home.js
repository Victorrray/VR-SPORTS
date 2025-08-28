import React from "react";
import { Link } from "react-router-dom";
import styles from "./Home.module.css";

export default function Home() {
  const [loading, setLoading] = React.useState(true);
  React.useEffect(() => {
    const t = setTimeout(() => setLoading(false), 600);
    return () => clearTimeout(t);
  }, []);
  return (
    <div className={styles.container}>
      <section className={styles.hero}>
        <h1 className={styles.title}>Welcome to OddsSightSeer</h1>
        <p className={styles.subtitle}>
          Your all-in-one sports betting and fantasy odds platform.
        </p>
        <Link to="/sportsbooks" className={styles.heroBtn}>Browse Sportsbooks Odds</Link>
      </section>
      <div className={styles.cards}>
        {loading ? (
          <>
            <div className={styles.card}>
              <div className={styles.skelTitle} />
              <div className={styles.skelLine} />
              <div className={styles.skelLine} style={{ width: '70%' }} />
            </div>
            <div className={styles.card}>
              <div className={styles.skelTitle} />
              <div className={styles.skelLine} />
              <div className={styles.skelLine} style={{ width: '60%' }} />
            </div>
          </>
        ) : (
          <>
            <Link to="/sportsbooks" className={styles.card} style={{ textDecoration: "none" }}>
              <h2>Sportsbooks</h2>
              <p>Track moneylines, spreads, and totals across major books.</p>
            </Link>
            <div className={styles.card}>
              <h2>Compare & Win</h2>
              <p>Find the best lines and maximize your edge with real-time data.</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
