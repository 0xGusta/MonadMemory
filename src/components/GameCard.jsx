import React from 'react';

const GameCard = ({ card, isFlipped, onClick, disabled }) => {
  return (
    <div
      className={`game-card ${isFlipped ? 'flipped' : ''} ${disabled ? 'disabled' : ''}`}
      onClick={onClick}
      style={{
        transform: `scale(${isFlipped ? '1.05' : '1'})`,
        transition: 'all 0.3s ease',
      }}
    >
      <div className="card-inner">
        <div className="card-front">
          <div className="card-content">?</div>
        </div>
        <div className="card-back">
          <img src={card.image} alt="Memory card" loading="lazy" />
        </div>
      </div>
    </div>
  );
};

export default GameCard;