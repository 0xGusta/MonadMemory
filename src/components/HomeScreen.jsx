import React, { useState, useEffect, useCallback } from 'react';
import { usePrivy } from "@privy-io/react-auth";
import { ethers } from 'ethers';
import UsernameModal from './UsernameModal';
import NoUsernameModal from './NoUsernameModal';

const contractAddress = '0xceCBFF203C8B6044F52CE23D914A1bfD997541A4';
const contractABI = [{"inputs":[],"stateMutability":"nonpayable","type":"constructor"},{"inputs":[],"name":"AccessControlBadConfirmation","type":"error"},{"inputs":[{"internalType":"address","name":"account","type":"address"},{"internalType":"bytes32","name":"neededRole","type":"bytes32"}],"name":"AccessControlUnauthorizedAccount","type":"error"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"game","type":"address"},{"indexed":false,"internalType":"string","name":"name","type":"string"},{"indexed":false,"internalType":"string","name":"image","type":"string"},{"indexed":false,"internalType":"string","name":"url","type":"string"}],"name":"GameRegistered","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"game","type":"address"}],"name":"GameUnregistered","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"game","type":"address"},{"indexed":true,"internalType":"address","name":"player","type":"address"},{"indexed":true,"internalType":"uint256","name":"scoreAmount","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"transactionAmount","type":"uint256"}],"name":"PlayerDataUpdated","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"bytes32","name":"role","type":"bytes32"},{"indexed":true,"internalType":"bytes32","name":"previousAdminRole","type":"bytes32"},{"indexed":true,"internalType":"bytes32","name":"newAdminRole","type":"bytes32"}],"name":"RoleAdminChanged","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"bytes32","name":"role","type":"bytes32"},{"indexed":true,"internalType":"address","name":"account","type":"address"},{"indexed":true,"internalType":"address","name":"sender","type":"address"}],"name":"RoleGranted","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"bytes32","name":"role","type":"bytes32"},{"indexed":true,"internalType":"address","name":"account","type":"address"},{"indexed":true,"internalType":"address","name":"sender","type":"address"}],"name":"RoleRevoked","type":"event"},{"inputs":[],"name":"DEFAULT_ADMIN_ROLE","outputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"GAME_ROLE","outputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"","type":"address"}],"name":"games","outputs":[{"internalType":"address","name":"game","type":"address"},{"internalType":"string","name":"image","type":"string"},{"internalType":"string","name":"name","type":"string"},{"internalType":"string","name":"url","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"bytes32","name":"role","type":"bytes32"}],"name":"getRoleAdmin","outputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"bytes32","name":"role","type":"bytes32"},{"internalType":"address","name":"account","type":"address"}],"name":"grantRole","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes32","name":"role","type":"bytes32"},{"internalType":"address","name":"account","type":"address"}],"name":"hasRole","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"","type":"address"},{"internalType":"address","name":"","type":"address"}],"name":"playerDataPerGame","outputs":[{"internalType":"uint256","name":"score","type":"uint256"},{"internalType":"uint256","name":"transactions","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"_game","type":"address"},{"internalType":"string","name":"_name","type":"string"},{"internalType":"string","name":"_image","type":"string"},{"internalType":"string","name":"_url","type":"string"}],"name":"registerGame","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes32","name":"role","type":"bytes32"},{"internalType":"address","name":"callerConfirmation","type":"address"}],"name":"renounceRole","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes32","name":"role","type":"bytes32"},{"internalType":"address","name":"account","type":"address"}],"name":"revokeRole","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes4","name":"interfaceId","type":"bytes4"}],"name":"supportsInterface","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"","type":"address"}],"name":"totalScoreOfPlayer","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"","type":"address"}],"name":"totalTransactionsOfPlayer","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"game","type":"address"}],"name":"unregisterGame","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"player","type":"address"},{"internalType":"uint256","name":"scoreAmount","type":"uint256"},{"internalType":"uint256","name":"transactionAmount","type":"uint256"}],"name":"updatePlayerData","outputs":[],"stateMutability":"nonpayable","type":"function"}];
const gameAddress = "0x1cd075b4dd6ecaef6cabe8aecd2422bfbda2f0a3";

const HomeScreen = ({ onPlay }) => {
  const { ready, authenticated, user, login, logout } = usePrivy();
  const [leaderboard, setLeaderboard] = useState([]);
  const [error, setError] = useState(null);
  const [username, setUsername] = useState('');
  const [bestScore, setBestScore] = useState(0);
  const [accountAddress, setAccountAddress] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 10;
  const [isUsernameModalOpen, setIsUsernameModalOpen] = useState(false);
  const [showNoUsernameWarning, setShowNoUsernameWarning] = useState(false);

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
      console.log("SUCCESS: Found Monad Games ID wallet address:", monadAddress);
      setAccountAddress(monadAddress);
    } else {
      console.warn("WARNING: User is authenticated but Monad Games ID wallet was not found. Logging out.");
      logout();
      setShowNoUsernameWarning(true);
    }
  }, [ready, authenticated, user, logout]);
  
  useEffect(() => {
    const fetchUsername = async (walletAddress) => {
      if (!walletAddress) return;
  
      try {
        console.log("Checking username for wallet:", walletAddress);
        const response = await fetch(`https://monad-games-id-site.vercel.app/api/check-wallet?wallet=${walletAddress}`);
        if (!response.ok) throw new Error("API call failed");
        
        const data = await response.json();
        if (data.hasUsername) {
          console.log("Username found:", data.user.username);
          setUsername(data.user.username);
        } else {
          console.log("No username found for this Monad Games ID wallet. Logging out.");
          logout();
          setShowNoUsernameWarning(true);
        }
      } catch (err) {
        console.error("Error fetching username:", err);
        logout();
        setShowNoUsernameWarning(true);
      }
    };
  
    if (authenticated && accountAddress) {
      fetchUsername(accountAddress);
    } else if (!authenticated) {
        setUsername('');
    }
  }, [authenticated, accountAddress, logout]);


  // const fetchLeaderboard = useCallback(async (page) => {
  //   const url = `/api/leaderboard?page=${page}&limit=${itemsPerPage}&gameId=107&sortBy=scores` || https://api.allorigins.win/raw?url=https://monad-games-id-site.vercel.app/api/leaderboard?page=${page}&limit=${itemsPerPage}&gameId=107&sortBy=scores;
  //   try {
  //     const response = await fetch(url);
  //     if (!response.ok) {
  //       throw new Error('Failed to fetch leaderboard from Vercel proxy.');
  //     }
  //     const data = await response.json();
  //     setLeaderboard(data.data || []);
  //     setTotalPages(data.pagination.totalPages || 1);
  //   } catch (err) {
  //     console.error("Failed to fetch leaderboard:", err);
  //     setError("Could not load leaderboard.");
  //   }
  // }, [itemsPerPage]);

  const fetchLeaderboard = useCallback(async (page) => {
  const primaryUrl = `/api/leaderboard?page=${page}&limit=${itemsPerPage}&gameId=218&sortBy=scores`;
  const fallbackUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(
    `https://monad-games-id-site.vercel.app/api/leaderboard?page=${page}&limit=${itemsPerPage}&gameId=107&sortBy=scores`
  )}`;

  try {
    const response = await fetch(primaryUrl);
    if (!response.ok) throw new Error("Primary URL failed");
    const data = await response.json();
    setLeaderboard(data.data || []);
    setTotalPages(data.pagination?.totalPages || 1);
  } catch (err) {
    console.warn("Primary URL failed, trying fallback...", err);
    try {
      const response = await fetch(fallbackUrl);
      if (!response.ok) throw new Error("Fallback URL failed");
      const data = await response.json();
      setLeaderboard(data.data || []);
      setTotalPages(data.pagination?.totalPages || 1);
    } catch (fallbackErr) {
      console.error("Both URLs failed:", fallbackErr);
      setError("Could not load leaderboard.");
    }
  }
}, [itemsPerPage]);


  useEffect(() => {
    fetchLeaderboard(currentPage);
  }, [currentPage, fetchLeaderboard]);

  useEffect(() => {
    const fetchBestScore = async () => {
      if (authenticated && accountAddress) {
        try {
          const provider = new ethers.JsonRpcProvider('https://testnet-rpc.monad.xyz');
          const contract = new ethers.Contract(contractAddress, contractABI, provider);
          const playerData = await contract.playerDataPerGame(gameAddress, accountAddress);
          setBestScore(playerData.score.toString());
        } catch (error) {
          console.error("Failed to fetch best score from blockchain:", error);
        }
      }
    };
    fetchBestScore();
  }, [authenticated, accountAddress]);

  const handleNextPage = () => {
    setCurrentPage(prev => prev + 1);
  };

  const handlePrevPage = () => {
    setCurrentPage(prev => Math.max(1, prev - 1));
  };

  const formatTime = (score) => {
    const MAX_SCORE = 180000;
    const timeTaken = MAX_SCORE - score;
    const minutes = Math.floor(timeTaken / 60000);
    const seconds = Math.floor((timeTaken % 60000) / 1000);
    const milliseconds = timeTaken % 1000;
    return `${minutes}:${seconds.toString().padStart(2, '0')}.${milliseconds}`;
  };

  return (
    <div className="home-container">
      {isUsernameModalOpen && <UsernameModal onClose={() => setIsUsernameModalOpen(false)} onLogin={login} />}
      {showNoUsernameWarning && <NoUsernameModal onClose={() => setShowNoUsernameWarning(false)} />}
      <div className="home-content">
        {authenticated && (
          <div className="user-info-container">
            <span className="username-display">{username || 'Loading...'}</span>
            <button className="logout-btn" onClick={logout}>Logout</button>
          </div>
        )}

        <h1 className="home-title">Monad Memory</h1>

        {authenticated && bestScore > 0 && (
          <div className="best-time-container">
            <span className="best-time-icon">🏆</span>
            <span className="best-time-label">Best Score:</span>
            <span className="best-time-value">{bestScore}</span>
          </div>
        )}

        {ready && (!authenticated ? (
          <button className="play-btn" onClick={() => setIsUsernameModalOpen(true)}>
            Sign in with Monad Games ID
          </button>
        ) : (
          <button className="play-btn" onClick={onPlay}>
            Play
          </button>
        ))}
      </div>
        <div className="ranking-container">
          <h2 className="ranking-title">Leaderboard</h2>
          {error ? (
            <p style={{ color: 'red' }}>{error}</p>
          ) : (
            <>
              <ul className="ranking-list">
                {leaderboard.slice(0, 10).map((player, index) => (
                  <li key={player.userId || index}>
                    {(currentPage - 1) * itemsPerPage + index + 1}. {player.username} {player.score}pts ({formatTime(player.score)})
                  </li>
                ))}
              </ul>
              <div className="pagination-controls">
                <button onClick={handlePrevPage} disabled={currentPage === 1}>Previous</button>
                <span>Page {currentPage} of {totalPages}</span>
                <button onClick={handleNextPage} disabled={currentPage >= totalPages}>Next</button>
              </div>
            </>
          )}
        </div>
    </div>
  );
};

export default HomeScreen;
