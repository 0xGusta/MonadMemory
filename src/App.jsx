import React, { useState, useEffect } from 'react';
import MemoryGame from './components/MemoryGame.jsx';
import HomeScreen from './components/HomeScreen.jsx';
import './App.css';

function App() {
  const [isGameStarted, setIsGameStarted] = useState(false);
  const [bestScore, setBestScore] = useState(() => {
    const savedScore = localStorage.getItem('bestScore');
    return savedScore ? parseInt(savedScore, 10) : 0;
  });

  const handleGameEnd = (finalScore) => {
    if (finalScore > bestScore) {
      setBestScore(finalScore);
      localStorage.setItem('bestScore', finalScore);
    }
  };

  if (!isGameStarted) {
    return (
      <HomeScreen 
        onPlay={() => setIsGameStarted(true)} 
        bestScore={bestScore}
      />
    );
  }

  return (
    <MemoryGame 
      onGameEnd={handleGameEnd} 
      onGoHome={() => setIsGameStarted(false)} 
    />
  );
}

export default App;