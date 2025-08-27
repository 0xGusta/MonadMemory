import React from 'react';

const NoUsernameModal = ({ onClose }) => {
  return (
    <div className="win-modal">
      <div className="win-content">
        <h2>Username Required</h2>
        <p>You have been logged out because you do not have a Monad Games ID username. Please create one to play.</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <a
            href="https://monad-games-id-site.vercel.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="play-again-btn"
          >
            Create Username
          </a>
          <button className="logout-btn" onClick={onClose} style={{marginTop: '10px'}}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default NoUsernameModal;