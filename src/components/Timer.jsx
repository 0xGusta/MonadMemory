import React from 'react';

const Timer = ({ time, isRunning }) => {
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
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

export default Timer;