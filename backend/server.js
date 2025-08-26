const express = require('express');
const cors = require('cors');
const path = require('path');
const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const cacheOptions = {
  maxAge: '1y'
};
app.use('/images', express.static(path.join(__dirname, 'public/images'), cacheOptions));

const initialImages = [
  '/images/1.jpg',
  '/images/2.jpg',
  '/images/3.jpg',
  '/images/4.jpg',
  '/images/5.png',
  '/images/6.jpg',
  '/images/7.jpeg',
  '/images/8.png',
  '/images/9.avif',
  '/images/10.jpg',
  '/images/11.jpeg',
  '/images/12.jpg',
  '/images/13.jpg',
  '/images/14.png'
];

let gameState = {};
const MAX_TIME = 180000;
const MAX_SCORE = 180000;

function createNewGame() {
  const cards = [];
  initialImages.forEach((imagePath, index) => {
    cards.push({ id: index * 2, image: imagePath, key: index });
    cards.push({ id: index * 2 + 1, image: imagePath, key: index });
  });
  
  return {
    board: cards.sort(() => Math.random() - 0.5),
    flippedIndices: [],
    matchedIds: [],
    moves: 0,
    startTime: Date.now()
  };
}

app.get('/api/game/new', (req, res) => {
  gameState = createNewGame();
  
  const clientBoard = gameState.board.map(card => ({ id: card.id, matched: false }));
  
  res.json({ 
    board: clientBoard,
    imageUrls: initialImages 
  });
});

app.post('/api/game/flip', (req, res) => {
  if (!gameState.board) {
    return res.status(400).json({ error: "Game not started. Please request a new game." });
  }

  const { cardId } = req.body;
  const { board, flippedIndices, matchedIds } = gameState;

  const cardIndex = board.findIndex(c => c.id === cardId);

  if (cardIndex === -1 || flippedIndices.includes(cardIndex) || matchedIds.includes(cardId)) {
    return res.status(400).json({ error: 'Invalid move' });
  }

  const selectedCard = board[cardIndex];
  
  if (flippedIndices.length === 2) {
    gameState.flippedIndices = [];
  }

  gameState.flippedIndices.push(cardIndex);

  if (gameState.flippedIndices.length === 2) {
    const firstCardIndex = gameState.flippedIndices[0];
    const firstCard = board[firstCardIndex];
    
    if (firstCard.key === selectedCard.key) {
      gameState.matchedIds.push(firstCard.id, selectedCard.id);

      if (gameState.matchedIds.length === gameState.board.length) {
        const timeTaken = Date.now() - gameState.startTime;
        const score = Math.max(0, MAX_SCORE - timeTaken);
        
        return res.json({
          match: true,
          gameWon: true,
          score: score,
          timeTaken: timeTaken,
          cards: [
            { id: firstCard.id, image: firstCard.image },
            { id: selectedCard.id, image: selectedCard.image }
          ]
        });
      }
      
      return res.json({
        match: true,
        gameWon: false,
        cards: [
          { id: firstCard.id, image: firstCard.image },
          { id: selectedCard.id, image: selectedCard.image }
        ]
      });
    } else {
      return res.json({
        match: false,
        gameWon: false,
        cards: [
          { id: firstCard.id, image: firstCard.image },
          { id: selectedCard.id, image: selectedCard.image }
        ]
      });
    }
  }

  return res.json({
    match: null,
    gameWon: false,
    cards: [{ id: selectedCard.id, image: selectedCard.image }]
  });
});


app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});