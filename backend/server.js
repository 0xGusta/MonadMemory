require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const ethers = require('ethers');

const app = express();
const port = process.env.PORT || 3001;

const contractAddress = '0xceCBFF203C8B6044F52CE23D914A1bfD997541A4';
const contractABI = [{"inputs":[],"stateMutability":"nonpayable","type":"constructor"},{"inputs":[],"name":"AccessControlBadConfirmation","type":"error"},{"inputs":[{"internalType":"address","name":"account","type":"address"},{"internalType":"bytes32","name":"neededRole","type":"bytes32"}],"name":"AccessControlUnauthorizedAccount","type":"error"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"game","type":"address"},{"indexed":false,"internalType":"string","name":"name","type":"string"},{"indexed":false,"internalType":"string","name":"image","type":"string"},{"indexed":false,"internalType":"string","name":"url","type":"string"}],"name":"GameRegistered","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"game","type":"address"}],"name":"GameUnregistered","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"game","type":"address"},{"indexed":true,"internalType":"address","name":"player","type":"address"},{"indexed":true,"internalType":"uint256","name":"scoreAmount","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"transactionAmount","type":"uint256"}],"name":"PlayerDataUpdated","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"bytes32","name":"role","type":"bytes32"},{"indexed":true,"internalType":"bytes32","name":"previousAdminRole","type":"bytes32"},{"indexed":true,"internalType":"bytes32","name":"newAdminRole","type":"bytes32"}],"name":"RoleAdminChanged","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"bytes32","name":"role","type":"bytes32"},{"indexed":true,"internalType":"address","name":"account","type":"address"},{"indexed":true,"internalType":"address","name":"sender","type":"address"}],"name":"RoleGranted","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"bytes32","name":"role","type":"bytes32"},{"indexed":true,"internalType":"address","name":"account","type":"address"},{"indexed":true,"internalType":"address","name":"sender","type":"address"}],"name":"RoleRevoked","type":"event"},{"inputs":[],"name":"DEFAULT_ADMIN_ROLE","outputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"GAME_ROLE","outputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"","type":"address"}],"name":"games","outputs":[{"internalType":"address","name":"game","type":"address"},{"internalType":"string","name":"image","type":"string"},{"internalType":"string","name":"name","type":"string"},{"internalType":"string","name":"url","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"bytes32","name":"role","type":"bytes32"}],"name":"getRoleAdmin","outputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"bytes32","name":"role","type":"bytes32"},{"internalType":"address","name":"account","type":"address"}],"name":"grantRole","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes32","name":"role","type":"bytes32"},{"internalType":"address","name":"account","type":"address"}],"name":"hasRole","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"","type":"address"},{"internalType":"address","name":"","type":"address"}],"name":"playerDataPerGame","outputs":[{"internalType":"uint256","name":"score","type":"uint256"},{"internalType":"uint256","name":"transactions","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"_game","type":"address"},{"internalType":"string","name":"_name","type":"string"},{"internalType":"string","name":"_image","type":"string"},{"internalType":"string","name":"_url","type":"string"}],"name":"registerGame","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes32","name":"role","type":"bytes32"},{"internalType":"address","name":"callerConfirmation","type":"address"}],"name":"renounceRole","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes32","name":"role","type":"bytes32"},{"internalType":"address","name":"account","type":"address"}],"name":"revokeRole","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes4","name":"interfaceId","type":"bytes4"}],"name":"supportsInterface","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"","type":"address"}],"name":"totalScoreOfPlayer","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"","type":"address"}],"name":"totalTransactionsOfPlayer","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"game","type":"address"}],"name":"unregisterGame","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"player","type":"address"},{"internalType":"uint256","name":"scoreAmount","type":"uint256"},{"internalType":"uint256","name":"transactionAmount","type":"uint256"}],"name":"updatePlayerData","outputs":[],"stateMutability":"nonpayable","type":"function"}];
const provider = new ethers.JsonRpcProvider(process.env.MONAD_RPC_URL);
const gameWallet = new ethers.Wallet(process.env.GAME_PRIVATE_KEY, provider);
const gameContract = new ethers.Contract(contractAddress, contractABI, gameWallet);

app.use(cors());
app.use(express.json());
app.use('/images', express.static(path.join(__dirname, 'public/images')));

const initialImages = [
    '/images/1.jpg', '/images/2.jpg', '/images/3.jpg', '/images/4.jpg',
    '/images/5.png', '/images/6.jpg', '/images/7.jpeg', '/images/8.jpeg',
    '/images/9.avif', '/images/10.jpg', '/images/11.jpeg', '/images/12.jpeg',
    '/images/13.jpg', '/images/14.jpg'
];
let gameState = {};
const MAX_TIME = 180000;
const MAX_SCORE = 180000;
let isProcessing = false;

async function submitScoreToBlockchain(walletAddress, newScore) {
    if (!walletAddress || newScore === undefined) {
        console.error("Endereço da carteira ou pontuação ausentes na submissão.");
        return;
    }

    try {
        const currentPlayerData = await gameContract.playerDataPerGame(gameWallet.address, walletAddress);
        const currentScore = currentPlayerData.score;
        console.log(`Pontuação on-chain para ${walletAddress}: ${currentScore}`);

        if (newScore > currentScore) {
            const scoreAmountToAdd = newScore - Number(currentScore);
            console.log(`Nova pontuação é maior. Adicionando ${scoreAmountToAdd} ao score e 1 transação.`);
            
            const tx = await gameContract.updatePlayerData(walletAddress, scoreAmountToAdd, 1);
            await tx.wait();

            console.log(`Transação enviada com sucesso! Hash: ${tx.hash}`);
        } else {
            console.log(`Nova pontuação (${newScore}) não é maior que a atual (${currentScore}). Nenhuma transação enviada.`);
        }
    } catch (error) {
        console.error('Falha ao enviar a pontuação para a blockchain:', error);
    }
}

function clearGameTimer() { if (gameState.timerId) clearInterval(gameState.timerId); }
function createNewGame() {
    clearGameTimer();
    return {
        board: initialImages.flatMap((img, i) => [{ id: i * 2, image: img, key: i }, { id: i * 2 + 1, image: img, key: i }]).sort(() => Math.random() - 0.5),
        flippedIndices: [], matchedIds: [], startTime: null, timeRemaining: MAX_TIME, gameStatus: 'ready', timerId: null,
    };
}
function startGameTimer() {
    if (gameState.gameStatus !== 'playing') return;
    gameState.startTime = Date.now();
    gameState.timerId = setInterval(() => {
        if (gameState.gameStatus === 'playing') {
            gameState.timeRemaining = MAX_TIME - (Date.now() - gameState.startTime);
            if (gameState.timeRemaining <= 0) {
                gameState.gameStatus = 'lost';
                clearGameTimer();
            }
        }
    }, 100);
}

app.get('/api/game/new', (req, res) => {
    gameState = createNewGame();
    res.json({ board: gameState.board.map(c => ({ id: c.id, matched: false })), imageUrls: initialImages, timeRemaining: gameState.timeRemaining });
});

app.get('/api/game/state', (req, res) => {
    if (!gameState.board) return res.status(404).json({ error: "Game not found" });
    res.json({ timeRemaining: gameState.timeRemaining, gameStatus: gameState.gameStatus });
});

app.post('/api/game/flip', async (req, res) => {
    if (isProcessing || gameState.gameStatus === 'won' || gameState.gameStatus === 'lost') {
        return res.status(400).json({ error: "Ação inválida." });
    }
    isProcessing = true;

    try {
        if (gameState.gameStatus === 'ready') {
            gameState.gameStatus = 'playing';
            startGameTimer();
        }

        const { cardId, walletAddress } = req.body;
        const { board, flippedIndices, matchedIds } = gameState;
        const cardIndex = board.findIndex(c => c.id === cardId);

        if (cardIndex === -1 || matchedIds.includes(cardId) || flippedIndices.includes(cardIndex)) {
            return res.status(400).json({ error: 'Movimento inválido' });
        }
        
        const selectedCard = board[cardIndex];
        let responseData = { match: null, gameWon: false, cards: [{ id: selectedCard.id, image: selectedCard.image }] };
        
        if (flippedIndices.length === 0) {
            gameState.flippedIndices.push(cardIndex);
        } else {
            const firstCardIndex = flippedIndices[0];
            const firstCard = board[firstCardIndex];
            responseData.cards.push({ id: firstCard.id, image: firstCard.image });

            if (firstCard.key === selectedCard.key) {
                gameState.matchedIds.push(firstCard.id, selectedCard.id);
                responseData.match = true;

                if (gameState.matchedIds.length === gameState.board.length) {
                    clearGameTimer();
                    gameState.gameStatus = 'won';
                    const timeTaken = MAX_TIME - gameState.timeRemaining;
                    const score = Math.max(0, MAX_SCORE - timeTaken);
                    
                    responseData.gameWon = true;
                    responseData.score = score;

                    submitScoreToBlockchain(walletAddress, score).catch(err => console.error("Erro em background na submissão:", err));
                }
            } else {
                responseData.match = false;
            }
            gameState.flippedIndices = [];
        }
        res.json(responseData);
    } finally {
        isProcessing = false;
    }
});

app.listen(port, () => console.log(`Servidor rodando na porta ${port}`));