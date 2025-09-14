// src/pages/Terms.js
import React from "react";
import { Link } from "react-router-dom";
import "./Legal.css";

export default function Terms() {
  return (
    <main className="legal-container">
      <div className="legal-content">
        <div className="legal-header">
          <h1>Terms of Service</h1>
          <p className="legal-subtitle">Last updated: January 1, 2025</p>
        </div>

        <div className="legal-section">
          <h2>1. Acceptance of Terms</h2>
          <p>
            By accessing and using OddSightSeer ("the Service"), you accept and agree to be bound by the terms and provision of this agreement. 
            If you do not agree to abide by the above, please do not use this service.
          </p>
        </div>

        <div className="legal-section">
          <h2>2. Description of Service</h2>
          <p>
            OddSightSeer provides sports betting analytics, odds comparison, and expected value calculations. 
            The Service is designed to help users make informed betting decisions through data analysis and market insights.
          </p>
        </div>

        <div className="legal-section">
          <h2>3. User Responsibilities</h2>
          <ul>
            <li>You must be at least 18 years old to use this Service</li>
            <li>You are responsible for ensuring sports betting is legal in your jurisdiction</li>
            <li>You acknowledge that betting involves risk and you may lose money</li>
            <li>You will not use the Service for any illegal or unauthorized purpose</li>
            <li>You will not attempt to gain unauthorized access to any part of the Service</li>
          </ul>
        </div>

        <div className="legal-section">
          <h2>4. Disclaimer of Warranties</h2>
          <p>
            The information provided by OddSightSeer is for educational and informational purposes only. 
            We do not guarantee the accuracy, completeness, or timeliness of any information. 
            Past performance does not guarantee future results.
          </p>
        </div>

        <div className="legal-section">
          <h2>5. Limitation of Liability</h2>
          <p>
            OddSightSeer shall not be liable for any direct, indirect, incidental, special, or consequential damages 
            resulting from the use or inability to use the Service, including but not limited to betting losses.
          </p>
        </div>

        <div className="legal-section">
          <h2>6. Privacy</h2>
          <p>
            Your privacy is important to us. Please review our <Link to="/privacy" className="legal-link">Privacy Policy</Link>, 
            which also governs your use of the Service.
          </p>
        </div>

        <div className="legal-section">
          <h2>7. Modifications</h2>
          <p>
            OddSightSeer reserves the right to modify these terms at any time. 
            Continued use of the Service after changes constitutes acceptance of the new terms.
          </p>
        </div>

        <div className="legal-section">
          <h2>8. Contact Information</h2>
          <p>
            If you have any questions about these Terms of Service, please contact us at support@oddssightseer.com.
          </p>
        </div>

        <div className="legal-footer">
          <Link to="/login" className="back-link">← Back to Login</Link>
        </div>
      </div>
    </main>
  );
}
