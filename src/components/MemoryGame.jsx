import React, { useState, useEffect, useCallback } from 'react';
import '../styles/globals.css';
import { usePrivy } from "@privy-io/react-auth";

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

const GameCard = ({ card }) => {
  const isFlipped = card.image !== null || card.matched;
  return (
    <div className={`game-card ${isFlipped ? 'flipped' : ''}`}>
      <div className="card-inner">
        <div className="card-front"><div className="card-content">?</div></div>
        <div className="card-back">{card.image && <img src={`${API_URL}${card.image}`} alt="Memory card" loading="lazy" />}</div>
      </div>
    </div>
  );
};

const Timer = ({ time }) => {
  const formatTime = (ms) => {
    if (ms < 0) ms = 0;
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    const centiseconds = Math.floor((ms % 1000) / 10);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${centiseconds.toString().padStart(2, '0')}`;
  };
  return (
    <div className="timer-container"><div className="timer-display"><span className="timer-icon">⏱️</span><span className="timer-text">{formatTime(time)}</span></div></div>
  );
};

const ThemeToggle = ({ isDark, onToggle }) => (<button className="theme-toggle" onClick={onToggle}>{isDark ? '☀️' : '🌙'}</button>);
const LoadingScreen = () => (<div className="loading-overlay"><div className="spinner"></div><p>Loading game...</p></div>);

const MemoryGame = ({ onGameEnd, onGoHome }) => {
  const [cards, setCards] = useState([]);
  const [gameState, setGameState] = useState('loading');
  const [finalScore, setFinalScore] = useState(0);
  const [visualTime, setVisualTime] = useState(180000);
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');
  const [isProcessing, setIsProcessing] = useState(false);

  const { user, ready, authenticated, logout } = usePrivy();
  const [accountAddress, setAccountAddress] = useState(null);

  useEffect(() => {
    if (!ready || !authenticated || !user) {
      setAccountAddress(null);
      return;
    }
    const crossAppAccount = user.linkedAccounts.find(
      (account) =>
        account.type === 'cross_app' &&
        account.providerApp.id === 'cmd8euall0037le0my79qpz42'
    );

    if (crossAppAccount && crossAppAccount.embeddedWallets?.length > 0) {
      const monadAddress = crossAppAccount.embeddedWallets[0].address;
      setAccountAddress(monadAddress);
    } else {
      console.warn("WARNING: User is authenticated but Monad Games ID wallet was not found. Logging out.");
      logout();
    }
  }, [ready, authenticated, user, logout]);

  useEffect(() => { localStorage.setItem('theme', isDarkMode ? 'dark' : 'light'); }, [isDarkMode]);

  const preloadImages = useCallback(async (urls) => {
    if (!Array.isArray(urls)) return;
    await Promise.all(urls.map(url => new Promise((resolve) => {
      const img = new Image();
      img.src = `${API_URL}${url}`;
      img.onload = img.onerror = resolve;
    })));
  }, []);

  const startNewGame = useCallback(async () => {
    setGameState('loading');
    setIsProcessing(false);
    try {
      const response = await fetch(`${API_URL}/api/game/new`, {
        method: 'POST',
        credentials: 'include'
      });
      const data = await response.json();
      if (data && data.gameState && data.gameState.board) {
        await preloadImages(data.imageUrls);
        setGameState(data.gameState.gameStatus);
        setCards(data.gameState.board);
        setVisualTime(data.gameState.timeRemaining);
        setFinalScore(0);
      } else {
        setGameState('error');
      }
    } catch (error) {
      console.error("Failed to start new game:", error);
      setGameState('error');
    }
  }, [preloadImages]);

  useEffect(() => { startNewGame(); }, [startNewGame]);

  useEffect(() => {
    if (gameState !== 'playing') return;
    const visualTimerInterval = setInterval(() => setVisualTime(t => t > 0 ? t - 101 : 0), 101);
    const syncTimerInterval = setInterval(async () => {
      if (document.hidden) return;
      try {
        const response = await fetch(`${API_URL}/api/game/state`, { credentials: 'include' });
        const data = await response.json();
        if (data && data.gameState) {
            setVisualTime(data.gameState.timeRemaining);
            if (data.gameState.gameStatus !== 'playing') {
              setGameState(data.gameState.gameStatus);
            }
        }
      } catch (error) {
        console.error("Error syncing game state:", error);
      }
    }, 10000);

    return () => {
      clearInterval(visualTimerInterval);
      clearInterval(syncTimerInterval);
    };
  }, [gameState]);

  const handleCardClick = async (card) => {

    if (isProcessing || (gameState !== 'playing' && gameState !== 'ready') || card.matched || card.image) return;
    
    setIsProcessing(true);

    try {
      const response = await fetch(`${API_URL}/api/game/flip`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cardId: card.id, walletAddress: accountAddress }),
        credentials: 'include',
      });

      if (!response.ok) {
        if (response.status === 429) {
          console.warn('Fast requisition, too many requests');
        } else {
          console.error(`Error from server: ${response.status}`);
        }
        setIsProcessing(false);
        return;
      }

      const responseData = await response.json();
      
      if (responseData && responseData.gameState && responseData.gameState.board) {
        setCards(responseData.gameState.board);
        setGameState(responseData.gameState.gameStatus);
        setVisualTime(responseData.gameState.timeRemaining);

        if (responseData.gameState.gameStatus === 'won') {
          setFinalScore(responseData.gameState.score);
          onGameEnd(responseData.gameState.score);
        }

        const flippedNonMatched = responseData.gameState.board.filter(c => c.image && !c.matched);
        
        if (flippedNonMatched.length === 2) {

          setTimeout(async () => {
            try {
              const syncResponse = await fetch(`${API_URL}/api/game/state`, { credentials: 'include' });
              const syncData = await syncResponse.json();
              if (syncData && syncData.gameState && syncData.gameState.board) {
                setCards(syncData.gameState.board);
              }
            } catch (e) {
              console.error("Failed to re-sync after error:", e);
            } finally {
                setIsProcessing(false);
            }
          }, 1200);
        } else {
            setIsProcessing(false);
        }
      } else {
        setIsProcessing(false);
      }
    } catch (error) {
      console.error("Erro ao virar carta:", error);
      setIsProcessing(false);
    }
  };

  if (gameState === 'loading') return <LoadingScreen />;

  return (
    <div className={`memory-game-container ${isDarkMode ? 'dark' : 'light'}`}>
      <div className="top-controls-container">
        <button className="control-btn home-btn" onClick={onGoHome}>
          ←
        </button>
        <ThemeToggle isDark={isDarkMode} onToggle={() => setIsDarkMode(!isDarkMode)} />
        <Timer time={visualTime} />
        <button className="control-btn restart-btn" onClick={startNewGame}>
          ↻
        </button>
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

      <div className={`game-grid ${isProcessing ? 'processing' : ''}`}>
        {Array.isArray(cards) &&
          cards.map((card) => (
            <div key={card.id} onClick={() => handleCardClick(card)}>
              <GameCard card={card} />
            </div>
          ))}
      </div>

      {gameState === 'won' && (
        <div className="win-modal">
          <div className="win-content">
            <h2>🎉 Congratulations!</h2>
            <p>Your score: {finalScore}</p>
            <button className="play-again-btn" onClick={onGoHome}>
              Back
            </button>
          </div>
        </div>
      )}

      {gameState === 'lost' && (
        <div className="win-modal">
          <div className="win-content">
            <h2>😔 Time's Up!</h2>
            <p>Try again to improve.</p>
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