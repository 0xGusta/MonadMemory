import React, { useState, useEffect } from 'react';
import MemoryGame from './components/MemoryGame.jsx';
import HomeScreen from './components/HomeScreen.jsx';
import './App.css';
import { usePrivy } from "@privy-io/react-auth";

function App() {
  const [isGameStarted, setIsGameStarted] = useState(false);
  const [bestScore, setBestScore] = useState(0);
  const { authenticated, user, ready, login } = usePrivy();

  const handleGameEnd = (finalScore) => {
    if (finalScore > bestScore) {
      setBestScore(finalScore);
    }
  };

  if (!isGameStarted) {
    return (
      <HomeScreen
        onPlay={() => {
          if (authenticated) {
            setIsGameStarted(true)
          } else {
            login();
          }
        }}
        bestScore={bestScore}
        isAuthenticated={authenticated}
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