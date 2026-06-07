import React from "react";
import "../index.css";

export default function Home() {
  return (
    <div className="hero">
      <div className="bg"></div>
      <div className="grid-overlay"></div>
      <div className="overlay"></div>
      <div className="scanline"></div>

      <div className="corner corner--tl"></div>
      <div className="corner corner--tr"></div>
      <div className="corner corner--bl"></div>
      <div className="corner corner--br"></div>

      <div className="content">
        <div className="badge">Waitlist Open</div>

        <h1 className="title">
          FREEXY <span className="title-ai">AI</span>
        </h1>

        <p className="subtitle">Intelligence · Reimagined</p>

        <div className="waitlist-card">
          <div className="card-label">Early Access Protocol</div>
          <h2>Join the Waitlist</h2>
          <p>Be among the first to access the next generation of intelligence.</p>

          <div className="email-box" style={{ justifyContent: "center" }}>
            <button
              className="join-btn"
              onClick={() => window.location.href = "https://www.instagram.com/pov.freexy/"}
            >
              Initiate →
            </button>
          </div>

          <div className="stats">
            <div className="stat">
              <span className="stat-num">12.4K</span>
              <span className="stat-label">On Waitlist</span>
            </div>
            <div className="stat">
              <span className="stat-num">Q3 2025</span>
              <span className="stat-label">Launch</span>
            </div>
            <div className="stat">
              <span className="stat-num">∞</span>
              <span className="stat-label">Potential</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}