import React from 'react';

const HomeScreen = ({ onPlay, bestScore }) => {
  return (
    <div className="home-container">
      <div className="home-content">
        <h1 className="home-title">Monad Memory</h1>
        
        <div className="best-time-container">
          <span className="best-time-icon">🏆</span>
          <span className="best-time-label">Best Score:</span>
          <span className="best-time-value">{bestScore}</span>
        </div>

        <button className="play-btn" onClick={onPlay}>
          Play
        </button>

        <div className="ranking-container">
          <h2 className="ranking-title">Ranking</h2>
          <ul className="ranking-list">
            <li>1. Player exemplo A - 175420</li>
            <li>2. Player exemplo B - 168910</li>
            <li>3. Player exemplo C - 153200</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default HomeScreen;