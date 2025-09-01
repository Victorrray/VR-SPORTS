// src/pages/Privacy.js
import React from "react";
import { Link } from "react-router-dom";
import "./Legal.css";

export default function Privacy() {
  return (
    <main className="legal-container">
      <div className="legal-content">
        <div className="legal-header">
          <h1>Privacy Policy</h1>
          <p className="legal-subtitle">Last updated: January 1, 2025</p>
        </div>

        <div className="legal-section">
          <h2>1. Information We Collect</h2>
          <h3>Personal Information</h3>
          <ul>
            <li>Email address and account credentials</li>
            <li>Profile information you choose to provide</li>
            <li>Communication preferences</li>
          </ul>
          <h3>Usage Information</h3>
          <ul>
            <li>Betting analytics and preferences</li>
            <li>Platform usage patterns</li>
            <li>Device and browser information</li>
            <li>IP address and location data</li>
          </ul>
        </div>

        <div className="legal-section">
          <h2>2. How We Use Your Information</h2>
          <ul>
            <li>Provide and improve our sports betting analytics services</li>
            <li>Personalize your experience and recommendations</li>
            <li>Send important updates and notifications</li>
            <li>Ensure platform security and prevent fraud</li>
            <li>Analyze usage patterns to enhance our services</li>
          </ul>
        </div>

        <div className="legal-section">
          <h2>3. Information Sharing</h2>
          <p>
            We do not sell, trade, or rent your personal information to third parties. 
            We may share information only in the following circumstances:
          </p>
          <ul>
            <li>With your explicit consent</li>
            <li>To comply with legal obligations</li>
            <li>To protect our rights and prevent fraud</li>
            <li>With trusted service providers who assist in our operations</li>
          </ul>
        </div>

        <div className="legal-section">
          <h2>4. Data Security</h2>
          <p>
            We implement industry-standard security measures to protect your personal information, including:
          </p>
          <ul>
            <li>Encryption of data in transit and at rest</li>
            <li>Regular security audits and monitoring</li>
            <li>Access controls and authentication</li>
            <li>Secure data storage practices</li>
          </ul>
        </div>

        <div className="legal-section">
          <h2>5. Cookies and Tracking</h2>
          <p>
            We use cookies and similar technologies to enhance your experience, analyze usage, 
            and provide personalized content. You can control cookie preferences through your browser settings.
          </p>
        </div>

        <div className="legal-section">
          <h2>6. Your Rights</h2>
          <p>You have the right to:</p>
          <ul>
            <li>Access and review your personal information</li>
            <li>Request corrections to inaccurate data</li>
            <li>Delete your account and associated data</li>
            <li>Opt-out of marketing communications</li>
            <li>Export your data in a portable format</li>
          </ul>
        </div>

        <div className="legal-section">
          <h2>7. Data Retention</h2>
          <p>
            We retain your information only as long as necessary to provide our services 
            and comply with legal obligations. Account data is typically deleted within 30 days of account closure.
          </p>
        </div>

        <div className="legal-section">
          <h2>8. Children's Privacy</h2>
          <p>
            Our service is not intended for users under 18 years of age. 
            We do not knowingly collect personal information from children under 18.
          </p>
        </div>

        <div className="legal-section">
          <h2>9. Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. 
            We will notify you of any material changes via email or platform notification.
          </p>
        </div>

        <div className="legal-section">
          <h2>10. Contact Us</h2>
          <p>
            If you have questions about this Privacy Policy or wish to exercise your rights, 
            please contact us at privacy@vr-odds.com.
          </p>
        </div>

        <div className="legal-footer">
          <Link to="/login" className="back-link">← Back to Login</Link>
        </div>
      </div>
    </main>
  );
}
