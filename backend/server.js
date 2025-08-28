require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const ethers = require('ethers');
const session = require('express-session');

const app = express();
const port = process.env.PORT || 3001;

const contractAddress = '0xceCBFF203C8B6044F52CE23D914A1bfD997541A4';
const contractABI = [{"inputs":[],"stateMutability":"nonpayable","type":"constructor"},{"inputs":[],"name":"AccessControlBadConfirmation","type":"error"},{"inputs":[{"internalType":"address","name":"account","type":"address"},{"internalType":"bytes32","name":"neededRole","type":"bytes32"}],"name":"AccessControlUnauthorizedAccount","type":"error"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"game","type":"address"},{"indexed":false,"internalType":"string","name":"name","type":"string"},{"indexed":false,"internalType":"string","name":"image","type":"string"},{"indexed":false,"internalType":"string","name":"url","type":"string"}],"name":"GameRegistered","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"game","type":"address"}],"name":"GameUnregistered","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"game","type":"address"},{"indexed":true,"internalType":"address","name":"player","type":"address"},{"indexed":true,"internalType":"uint256","name":"scoreAmount","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"transactionAmount","type":"uint256"}],"name":"PlayerDataUpdated","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"bytes32","name":"role","type":"bytes32"},{"indexed":true,"internalType":"bytes32","name":"previousAdminRole","type":"bytes32"},{"indexed":true,"internalType":"bytes32","name":"newAdminRole","type":"bytes32"}],"name":"RoleAdminChanged","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"bytes32","name":"role","type":"bytes32"},{"indexed":true,"internalType":"address","name":"account","type":"address"},{"indexed":true,"internalType":"address","name":"sender","type":"address"}],"name":"RoleGranted","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"bytes32","name":"role","type":"bytes32"},{"indexed":true,"internalType":"address","name":"account","type":"address"},{"indexed":true,"internalType":"address","name":"sender","type":"address"}],"name":"RoleRevoked","type":"event"},{"inputs":[],"name":"DEFAULT_ADMIN_ROLE","outputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"GAME_ROLE","outputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"","type":"address"}],"name":"games","outputs":[{"internalType":"address","name":"game","type":"address"},{"internalType":"string","name":"image","type":"string"},{"internalType":"string","name":"name","type":"string"},{"internalType":"string","name":"url","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"bytes32","name":"role","type":"bytes32"}],"name":"getRoleAdmin","outputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"bytes32","name":"role","type":"bytes32"},{"internalType":"address","name":"account","type":"address"}],"name":"grantRole","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes32","name":"role","type":"bytes32"},{"internalType":"address","name":"account","type":"address"}],"name":"hasRole","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"","type":"address"},{"internalType":"address","name":"","type":"address"}],"name":"playerDataPerGame","outputs":[{"internalType":"uint256","name":"score","type":"uint256"},{"internalType":"uint256","name":"transactions","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"_game","type":"address"},{"internalType":"string","name":"_name","type":"string"},{"internalType":"string","name":"_image","type":"string"},{"internalType":"string","name":"_url","type":"string"}],"name":"registerGame","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes32","name":"role","type":"bytes32"},{"internalType":"address","name":"callerConfirmation","type":"address"}],"name":"renounceRole","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes32","name":"role","type":"bytes32"},{"internalType":"address","name":"account","type":"address"}],"name":"revokeRole","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes4","name":"interfaceId","type":"bytes4"}],"name":"supportsInterface","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"","type":"address"}],"name":"totalScoreOfPlayer","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"","type":"address"}],"name":"totalTransactionsOfPlayer","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"game","type":"address"}],"name":"unregisterGame","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"player","type":"address"},{"internalType":"uint256","name":"scoreAmount","type":"uint256"},{"internalType":"uint256","name":"transactionAmount","type":"uint256"}],"name":"updatePlayerData","outputs":[],"stateMutability":"nonpayable","type":"function"}];
const provider = new ethers.JsonRpcProvider(process.env.MONAD_RPC_URL);
const gameWallet = new ethers.Wallet(process.env.GAME_PRIVATE_KEY, provider);
const gameContract = new ethers.Contract(contractAddress, contractABI, gameWallet);

app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 3600000 }
}));

app.use(cors({
    origin: 'https://monadmemory.vercel.app/',
    credentials: true
}));

app.use(express.json());
app.use('/images', express.static(path.join(__dirname, 'public/images')));

const initialImages = [
    '/images/1.jpg', '/images/2.jpg', '/images/3.jpg', '/images/4.jpg',
    '/images/5.png', '/images/6.jpg', '/images/7.jpeg', '/images/8.jpeg',
    '/images/9.avif', '/images/10.jpg', '/images/11.jpeg', '/images/12.jpeg',
    '/images/13.jpg', '/images/14.jpg'
];

const MAX_TIME = 180000;
const MAX_SCORE = 180000;

function createNewGame() {
    const board = initialImages
        .flatMap((img, i) => [
            { id: i * 2, image: img, key: i, matched: false },
            { id: i * 2 + 1, image: img, key: i, matched: false },
        ])
        .sort(() => Math.random() - 0.5);

    return {
        board,
        flippedIndices: [],
        startTime: null,
        timeRemaining: MAX_TIME,
        gameStatus: 'ready',
        score: 0,
        flipLock: false,
    };
}

function updateTimeRemaining(userGameState) {
    if (userGameState.gameStatus === 'playing' && userGameState.startTime) {
        const elapsedTime = Date.now() - userGameState.startTime;
        userGameState.timeRemaining = Math.max(0, MAX_TIME - elapsedTime);
        if (userGameState.timeRemaining === 0) {
            userGameState.gameStatus = 'lost';
        }
    }
}

async function submitScoreToBlockchain(walletAddress, newScore) {
    if (!walletAddress || newScore === undefined) {
        return console.error("Endereço da carteira ou pontuação ausentes.");
    }
    try {
        const currentPlayerData = await gameContract.playerDataPerGame(gameWallet.address, walletAddress);
        const currentScore = currentPlayerData.score;
        if (newScore > currentScore) {
            const scoreAmountToAdd = newScore - Number(currentScore);
            const tx = await gameContract.updatePlayerData(walletAddress, scoreAmountToAdd, 1);
            await tx.wait();
            console.log(`Transação enviada! Hash: ${tx.hash}`);
        } else {
            console.log(`Pontuação não enviada. Pontuação atual (${currentScore}) é maior ou igual à nova (${newScore}).`);
        }
    } catch (error) {
        console.error('Falha ao enviar pontuação:', error);
    }
}

function getSanitizedGameState(state = {}) {
    if (!state || !state.board) return {};
    const flippedIds = state.flippedIndices.map(index => state.board[index].id);
    return {
        board: state.board.map(card => ({
            id: card.id,
            image: card.matched || flippedIds.includes(card.id) ? card.image : null,
            matched: card.matched,
        })),
        gameStatus: state.gameStatus,
        timeRemaining: state.timeRemaining,
        score: state.score,
    };
}

app.post('/api/game/new', (req, res) => {
    res.setHeader('Cache-Control', 'no-store');

    req.session.gameState = createNewGame();
    res.json({
        gameState: getSanitizedGameState(req.session.gameState),
        imageUrls: initialImages
    });
});

app.get('/api/game/state', (req, res) => {
    const userGameState = req.session.gameState;
    if (!userGameState || !userGameState.board) {
        return res.status(404).json({ error: "Game not found for this session" });
    }
    updateTimeRemaining(userGameState);
    res.json({ gameState: getSanitizedGameState(userGameState) });
});

app.post('/api/game/flip', async (req, res) => {
    const userGameState = req.session.gameState;
    if (!userGameState || !userGameState.board) {
        return res.status(400).json({ error: "Jogo não iniciado." });
    }

    updateTimeRemaining(userGameState);

    if (userGameState.flipLock) {
        return res.status(429).json({ error: "Aguarde a jogada anterior." });
    }
    if (userGameState.gameStatus !== 'playing' && userGameState.gameStatus !== 'ready') {
        return res.status(400).json({ error: "Jogo não está ativo.", gameState: getSanitizedGameState(userGameState) });
    }

    userGameState.flipLock = true;

    try {
        if (userGameState.gameStatus === 'ready') {
            userGameState.gameStatus = 'playing';
            userGameState.startTime = Date.now();
        }

        const { cardId, walletAddress } = req.body;
        const cardIndex = userGameState.board.findIndex(c => c.id === cardId);
        if (cardIndex === -1 || userGameState.board[cardIndex].matched || userGameState.flippedIndices.includes(cardIndex)) {
            userGameState.flipLock = false;
            return res.status(400).json({ error: 'Movimento inválido', gameState: getSanitizedGameState(userGameState) });
        }

        userGameState.flippedIndices.push(cardIndex);
        
        if (userGameState.flippedIndices.length < 2) {
            userGameState.flipLock = false;
            return res.json({ gameState: getSanitizedGameState(userGameState) });
        }

        const [firstIndex, secondIndex] = userGameState.flippedIndices;
        const firstCard = userGameState.board[firstIndex];
        const secondCard = userGameState.board[secondIndex];

        if (firstCard.key === secondCard.key) {
            firstCard.matched = true;
            secondCard.matched = true;
            userGameState.flippedIndices = [];
            if (userGameState.board.every(c => c.matched)) {
                userGameState.gameStatus = 'won';
                updateTimeRemaining(userGameState); 
                const timeTaken = MAX_TIME - userGameState.timeRemaining;
                userGameState.score = Math.max(0, MAX_SCORE - timeTaken);
                submitScoreToBlockchain(walletAddress, userGameState.score).catch(console.error);
            }
            userGameState.flipLock = false;
            res.json({ gameState: getSanitizedGameState(userGameState) });
        } else {

            res.json({ gameState: getSanitizedGameState(userGameState) });

            setTimeout(() => {
                if (req.session && req.session.gameState) {
                    req.session.gameState.flippedIndices = [];
                    req.session.gameState.flipLock = false;
                    req.session.save(); 
                }
            }, 1000);
        }
    } catch(error) {
        console.error("Erro no endpoint /flip:", error);
        if (userGameState) userGameState.flipLock = false;
        res.status(500).json({ error: "Erro interno no servidor." });
    }
});

app.listen(port, () => console.log(`Servidor rodando na porta ${port}`));
