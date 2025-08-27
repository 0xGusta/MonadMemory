import React, { useState, useEffect, useCallback, useRef } from 'react';
import '../styles/globals.css';
import { usePrivy } from "@privy-io/react-auth";

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

const GameCard = ({ card, isFlipped, onClick, disabled }) => {
  return (
    <div
      className={`game-card ${isFlipped ? 'flipped' : ''} ${disabled ? 'disabled' : ''}`}
      onClick={onClick}
      style={{
        transform: `scale(${isFlipped ? '1.05' : '1'})`,
        transition: 'all 0.3s ease',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        msUserSelect: 'none',
      }}
    >
      <div className="card-inner">
        <div className="card-front"><div className="card-content">?</div></div>
        <div className="card-back">{card.image && <img src={card.image} alt="Memory card" loading="lazy" />}</div>
      </div>
    </div>
  );
};

const Timer = ({ time }) => {
  const formatTime = (ms) => {
    if (ms < 0) ms = 0;
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const centiseconds = Math.floor((ms % 1000) / 10);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${centiseconds.toString().padStart(2, '0')}`;
  };
  return (
    <div className="timer-container"><div className="timer-display"><span className="timer-icon">⏱️</span><span className="timer-text">{formatTime(time)}</span></div></div>
  );
};

const ThemeToggle = ({ isDark, onToggle }) => (
  <button className="theme-toggle" onClick={onToggle}>{isDark ? '☀️' : '🌙'}</button>
);

const LoadingScreen = () => (
  <div className="loading-overlay">
    <div className="spinner"></div>
    <p>Loading game...</p>
  </div>
);


const MemoryGame = ({ onGameEnd, onGoHome }) => {
  const [cards, setCards] = useState([]);
  const [flippedIds, setFlippedIds] = useState([]);
  const [gameState, setGameState] = useState('playing');
  const [finalScore, setFinalScore] = useState(0);
  const [disabled, setDisabled] = useState(false);
  const [time, setTime] = useState(180000);
  const [isLoading, setIsLoading] = useState(true);
  const [gameStarted, setGameStarted] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');
  const flipTimeout = useRef(null);
  
  const { user } = usePrivy();
  const [accountAddress, setAccountAddress] = useState(null);

  useEffect(() => {
    if (user && user.linkedAccounts && user.linkedAccounts.length > 0) {
      const monadGamesAccount = user.linkedAccounts.find(
        (account) =>
          account.type === 'cross_app' &&
          account.providerApp.id === 'cmd8euall0037le0my79qpz42'
      );

      if (monadGamesAccount && monadGamesAccount.embeddedWallets && monadGamesAccount.embeddedWallets.length > 0) {
        const address = monadGamesAccount.embeddedWallets[0].address;
        setAccountAddress(address);
        console.log("Monad Games ID wallet address found:", address);
      } else {
        console.warn("Monad Games ID account found, but no embedded wallet.");
      }
    }
  }, [user]);

  useEffect(() => { localStorage.setItem('theme', isDarkMode ? 'dark' : 'light'); }, [isDarkMode]);

  const preloadImages = (urls) => {
    const promises = urls.map(url => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.src = `${API_URL}${url}`;
        img.onload = resolve;
        img.onerror = reject;
      });
    });
    return Promise.all(promises);
  };

  const startNewGame = useCallback(async () => {
    setIsLoading(true);
    setGameStarted(false);
    clearTimeout(flipTimeout.current);
    try {
      const response = await fetch(`${API_URL}/api/game/new`);
      const data = await response.json();
      await preloadImages(data.imageUrls);
      setCards(data.board.map(card => ({ ...card, image: null })));
      setFlippedIds([]);
      setGameState('playing');
      setFinalScore(0);
      setTime(data.timeRemaining);
    } catch (error) {
      console.error("Failed to start new game:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    startNewGame();
  }, [startNewGame]);

  useEffect(() => {
    if (!gameStarted || gameState !== 'playing' || isLoading) return;
    
    const timer = setInterval(async () => {
      try {
        const response = await fetch(`${API_URL}/api/game/state`);
        const data = await response.json();
        setTime(data.timeRemaining);
        if (data.gameStatus !== 'playing') {
          setGameState(data.gameStatus);
          setGameStarted(false);
        }
      } catch (error) {
        console.error("Error fetching game state:", error);
      }
    }, 100);
    return () => clearInterval(timer);
  }, [gameStarted, gameState, isLoading]);

  const handleCardClick = async (clickedCard) => {
    if (disabled || clickedCard.matched || flippedIds.includes(clickedCard.id) || !accountAddress) {
      if (!accountAddress) console.warn("Waiting for wallet address to play.");
      return;
    }

    if (!gameStarted) {
      setGameStarted(true);
    }

    const newFlippedIds = [...flippedIds, clickedCard.id];
    setFlippedIds(newFlippedIds);

    try {
      const response = await fetch(`${API_URL}/api/game/flip`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          cardId: clickedCard.id,
          walletAddress: accountAddress
        }),
      });

      if (!response.ok) {
        setFlippedIds(flippedIds);
        throw new Error(`Server responded with ${response.status}`);
      }
      
      const data = await response.json();

      setCards(prevCards => prevCards.map(c => {
        const revealedCard = data.cards.find(rc => rc.id === c.id);
        return revealedCard ? { ...c, image: `${API_URL}${revealedCard.image}` } : c;
      }));

      if (data.gameWon) {
        setGameState('won');
        setFinalScore(data.score);
        onGameEnd(data.score);
        return;
      }

      if (newFlippedIds.length === 2) {
        setDisabled(true);
        if (data.match) {
          setTimeout(() => {
            setCards(prevCards => prevCards.map(c => newFlippedIds.includes(c.id) ? { ...c, matched: true } : c));
            setFlippedIds([]);
            setDisabled(false);
          }, 500);
        } else {
          flipTimeout.current = setTimeout(() => {
            setFlippedIds([]);
            setDisabled(false);
          }, 1000);
        }
      }
    } catch (error) {
      console.error("Error flipping card:", error);
      setDisabled(false);
    }
  };

  const isCardFlipped = (card) => flippedIds.includes(card.id) || card.matched;

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <div className={`memory-game-container ${isDarkMode ? 'dark' : 'light'}`}>
      <div className="top-controls-container">
        <button className="control-btn home-btn" onClick={onGoHome}>←</button>
        <ThemeToggle isDark={isDarkMode} onToggle={() => setIsDarkMode(!isDarkMode)} />
        <Timer time={time} />
        <button className="control-btn restart-btn" onClick={startNewGame}>↻</button>
      </div>

      <div className="background-image" style={{ backgroundImage: 'url(https://i.ibb.co/67VCzM6Y/file-00000000e89061fdb3c4740bdaed57b2-1.png)', backgroundSize: 'contain', backgroundRepeat: 'no-repeat', backgroundPosition: 'center', opacity: isDarkMode ? 0.3 : 0.5 }} />
      
      <div className="game-grid">
        {cards.map((card) => (
          <GameCard key={card.id} card={card} isFlipped={isCardFlipped(card)} onClick={() => handleCardClick(card)} disabled={disabled} />
        ))}
      </div>

      {gameState === 'won' && (
        <div className="win-modal"><div className="win-content"><h2>🎉 Congratulations!</h2><p>Your score: {finalScore}</p><button className="play-again-btn" onClick={onGoHome}>Back to Home</button></div></div>
      )}
      {gameState === 'lost' && (
        <div className="win-modal"><div className="win-content"><h2>😔 Time's Up!</h2><p>Try again to improve your score.</p><button className="play-again-btn" onClick={startNewGame}>Play Again</button></div></div>
      )}
    </div>
  );
};

export default MemoryGame;