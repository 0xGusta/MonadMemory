import React from 'react';

const UsernameModal = ({ onClose, onLogin }) => {
  return (
    <div className="win-modal">
      <div className="win-content">
        <h2>Attention</h2>
        <p>You need a Monad Games ID username to play.</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <a
            href="https://monad-games-id-site.vercel.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="play-again-btn"
          >
            Create Username
          </a>
          <button className="play-again-btn" onClick={() => { onLogin(); onClose(); }}>
            I already have a username
          </button>
          <button className="logout-btn" onClick={onClose} style={{marginTop: '10px'}}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default UsernameModal;