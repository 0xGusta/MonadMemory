import React, { useState, useEffect, useCallback, useRef } from 'react';
import '../styles/globals.css';

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
        <div className="card-front">
          <div className="card-content">?</div>
        </div>
        <div className="card-back">
          {card.image && <img src={card.image} alt="Memory card" loading="lazy" />}
        </div>
      </div>
    </div>
  );
};

const Timer = ({ time, isRunning }) => {
  const formatTime = (ms) => {
    if (ms < 0) ms = 0;
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const centiseconds = Math.floor((ms % 1000) / 10);

    return `${minutes.toString().padStart(2, '0')}:${seconds
      .toString()
      .padStart(2, '0')}.${centiseconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="timer-container">
      <div className="timer-display">
        <span className="timer-icon">⏱️</span>
        <span className="timer-text">{formatTime(time)}</span>
      </div>
    </div>
  );
};

const ThemeToggle = ({ isDark, onToggle }) => {
  return (
    <button className="theme-toggle" onClick={onToggle}>
      {isDark ? '☀️' : '🌙'}
    </button>
  );
};

const MemoryGame = ({ onGameEnd, onGoHome }) => {
  const [cards, setCards] = useState([]);
  const [flippedIds, setFlippedIds] = useState([]);
  const [gameState, setGameState] = useState('playing');
  const [finalScore, setFinalScore] = useState(0);
  const [disabled, setDisabled] = useState(false);
  
  const [time, setTime] = useState(180000);
  const [isRunning, setIsRunning] = useState(false);
  
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    return savedTheme === 'dark';
  });

  const flipTimeout = useRef(null);

  useEffect(() => {
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  const startNewGame = useCallback(async () => {
    setDisabled(true);
    try {

      const response = await fetch(`${API_URL}/api/game/new`);
      const { board, imageUrls } = await response.json(); 

      if (imageUrls && Array.isArray(imageUrls)) {
        imageUrls.forEach((url) => {
          const img = new Image();
          img.src = `${API_URL}${url}`;
        });
      }

      setCards(board.map(card => ({ ...card, image: null })));
      setFlippedIds([]);
      setGameState('playing');
      setFinalScore(0);
      setTime(180000);
      setIsRunning(false);
    } catch (error) {
      console.error("Failed to start a new game", error);
    } finally {
      setDisabled(false);
    }
  }, []);

  useEffect(() => {
    startNewGame();
  }, [startNewGame]);

  useEffect(() => {
    let interval;
    if (isRunning && gameState === 'playing') {
      interval = setInterval(() => {
        setTime(prevTime => {
          if (prevTime <= 10) {
            setGameState('lost');
            setIsRunning(false);
            return 0;
          }
          return prevTime - 10;
        });
      }, 10);
    }
    return () => clearInterval(interval);
  }, [isRunning, gameState]);
  
  const handleCardClick = async (clickedCard) => {
    if (disabled || clickedCard.matched || flippedIds.includes(clickedCard.id)) {
      return;
    }
  
    if (flippedIds.length === 2) {
      clearTimeout(flipTimeout.current);
    }
  
    if (!isRunning) {
      setIsRunning(true);
    }
  
    const newFlippedIds = flippedIds.length === 2 ? [clickedCard.id] : [...flippedIds, clickedCard.id];
    setFlippedIds(newFlippedIds);
    setDisabled(false);
  
    try {
      const response = await fetch(`${API_URL}/api/game/flip`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cardId: clickedCard.id }),
      });
      if (!response.ok) throw new Error(`Server responded with ${response.status}`);
      const data = await response.json();
  
      setCards(prevCards => prevCards.map(c => {
        const revealedCard = data.cards.find(rc => rc.id === c.id);
        return revealedCard ? { ...c, image: `${API_URL}${revealedCard.image}` } : c;
      }));
  
      if (data.gameWon) {
        setIsRunning(false);
        setGameState('won');
        setFinalScore(data.score);
        onGameEnd(data.score);
        return;
      }
  
      if (newFlippedIds.length === 2) {
        setDisabled(true);
        if (data.match) {
          setTimeout(() => {
            setCards(prevCards => prevCards.map(c => 
              newFlippedIds.includes(c.id) ? { ...c, matched: true } : c
            ));
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
      setFlippedIds([]);
      setDisabled(false);
    }
  };

  const isCardFlipped = (card) => {
    return flippedIds.includes(card.id) || card.matched;
  };

  return (
    <div className={`memory-game-container ${isDarkMode ? 'dark' : 'light'}`}>
      <div className="top-controls-container">
        <button className="control-btn home-btn" onClick={onGoHome}>←</button>
        <ThemeToggle isDark={isDarkMode} onToggle={() => setIsDarkMode(!isDarkMode)} />
        <Timer time={time} isRunning={isRunning} />
        <button className="control-btn restart-btn" onClick={startNewGame}>↻</button>
      </div>

      <div 
        className="background-image"
        style={{
          backgroundImage: 'url(https://i.ibb.co/67VCzM6Y/file-00000000e89061fdb3c4740bdaed57b2-1.png)',
          backgroundSize: 'contain',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center',
          opacity: isDarkMode ? 0.3 : 0.5,
        }}
      />
      
      <div className="game-grid">
        {cards.map((card) => (
          <GameCard
            key={card.id}
            card={card}
            isFlipped={isCardFlipped(card)}
            onClick={() => handleCardClick(card)}
            disabled={disabled}
          />
        ))}
      </div>

      {gameState === 'won' && (
        <div className="win-modal">
          <div className="win-content">
            <h2>🎉 Congratulations!</h2>
            <p>Your score: {finalScore}</p>
            <button className="play-again-btn" onClick={onGoHome}>
              Back to Home
            </button>
          </div>
        </div>
      )}

      {gameState === 'lost' && (
        <div className="win-modal">
          <div className="win-content">
            <h2>😔 Time Out!</h2>
            <p>How did you do it?</p>
            <button className="play-again-btn" onClick={startNewGame}>
              Play Again
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MemoryGame;