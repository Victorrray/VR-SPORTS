import React from "react";
import { Link } from "react-router-dom";
import styles from "./Footer.module.css";

export default function Footer({ className }) {
  const year = new Date().getFullYear();
  const linkGroups = [
    {
      title: 'Explore',
      links: [
        { to: '/', label: 'Home' },
        { to: '/sportsbooks', label: 'Sportsbooks' },
        { to: '/scores', label: 'Scores' },
        { to: '/picks', label: 'My Picks' },
      ],
    },
    {
      title: 'Account',
      links: [
        { to: '/login', label: 'Login' },
        { to: '/account', label: 'Account' },
        { to: '/usage-plan', label: 'Usage Plan' },
        { to: '/my-sportsbooks', label: 'My Sportsbooks' },
      ],
    },
    {
      title: 'Legal',
      links: [
        { to: '/terms', label: 'Terms of Use' },
        { to: '/privacy', label: 'Privacy Policy' },
      ],
    },
  ];

  return (
    <footer className={`${styles.footer} ${className || ''}`}>
      <div className={styles.inner}>
        <Link to="/" className={styles.brand}>
          <span className={styles.brandTitle}>OddSightSeer</span>
        </Link>

        <nav className={styles.links} aria-label="Footer navigation">
          {linkGroups.map((group) => {
            const groupId = `footer-${group.title.toLowerCase().replace(/\s+/g, '-')}`;
            return (
              <div className={styles.linkGroup} key={group.title}>
                <p className={styles.groupTitle} id={groupId}>
                  {group.title}
                </p>
                <ul className={styles.groupList} aria-labelledby={groupId}>
                  {group.links.map((item) => (
                    <li key={item.to}>
                      <Link to={item.to} className={styles.link}>
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </nav>

        <div className={styles.meta}>
          © {year} OddSightSeer. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
