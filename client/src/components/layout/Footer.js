import React from "react";
import { Link } from "react-router-dom";
import { Twitter, Instagram, Mail, TrendingUp } from "lucide-react";
import styles from "./Footer.module.css";

export default function Footer({ className }) {
  const year = new Date().getFullYear();
  const linkGroups = [
    {
      title: 'Product',
      links: [
        { to: '/', label: 'Home' },
        { to: '/sportsbooks', label: 'Live Odds' },
        { to: '/subscribe', label: 'Pricing' },
      ],
    },
    {
      title: 'Account',
      links: [
        { to: '/login', label: 'Login' },
        { to: '/account', label: 'Profile' },
        { to: '/subscribe', label: 'Subscribe' },
      ],
    },
    {
      title: 'Legal',
      links: [
        { to: '/terms', label: 'Terms' },
        { to: '/privacy', label: 'Privacy' },
      ],
    },
  ];

  const socialLinks = [
    { href: 'https://x.com/OddSightSeer', icon: Twitter, label: 'Twitter' },
    { href: 'https://www.instagram.com/oddsightseer/', icon: Instagram, label: 'Instagram' },
  ];

  return (
    <footer className={`${styles.footer} ${className || ''}`}>
      <div className={styles.inner}>
        {/* Top Section */}
        <div className={styles.topSection}>
          <div className={styles.brandSection}>
            <Link to="/" className={styles.brand}>
              <TrendingUp size={24} className={styles.brandIcon} />
              <div className={styles.brandText}>
                <span className={styles.brandLogo}>Odd</span>
                <span className={styles.brandLogoAccent}>Sight</span>
                <span className={styles.brandLogo}>Seer</span>
              </div>
            </Link>
            <p className={styles.brandTagline}>
              Smart odds comparison for winning bettors
            </p>
          </div>

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
        </div>

        {/* Divider */}
        <div className={styles.divider}></div>

        {/* Bottom Section */}
        <div className={styles.bottomSection}>
          <div className={styles.meta}>
            © {year} OddSightSeer. All rights reserved.
          </div>
          
          <div className={styles.socialLinks}>
            {socialLinks.map((social) => {
              const IconComponent = social.icon;
              return (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.socialLink}
                  aria-label={social.label}
                >
                  <IconComponent size={18} />
                </a>
              );
            })}
          </div>
        </div>
      </div>
    </footer>
  );
}
