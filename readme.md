# Monad Memory Game

This is a memory game built on the Monad, featuring a React frontend and a Node.js (Express) backend. It leverages Privy for user authentication and smart contracts for on-chain scorekeeping.

## Features

* **Classic Memory Gameplay:** A timed card-matching game to test your memory.
* **Blockchain Integration:** Player scores are recorded on the Monad blockchain via Monad Games ID.
* **Leaderboard:** A real-time leaderboard fetches scores to rank players.
* **Web3 Authentication:** Utilizes Privy for seamless user login with Monad Games ID.
* **Dynamic UI:** Includes dark/light theme toggling and responsive design for different screen sizes.

## Tech Stack

### Frontend

* **Framework:** React
* **Authentication:** Privy (`@privy-io/react-auth`)
* **Blockchain Interaction:** Ethers.js
* **Styling:** CSS with support for dark/light themes.

### Backend

* **Framework:** Node.js with Express
* **Session Management:** `express-session`
* **Blockchain Interaction:** Ethers.js for communication with the Monad.
* **Environment Variables:** `dotenv` for configuration.

## Getting Started

Follow these instructions to get a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

* Node.js (v14 or higher recommended)
* npm or pnpm

### Installation & Setup

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/0xGusta/MonadMemory
    cd monadmemory
    ```

2.  **Set up the Backend:**
    * Navigate to the backend directory: `cd backend`
    * Install dependencies: `npm install` (or `pnpm install`)
    * Create a `.env` file and populate it with the necessary variables based on the `server.js` file:
        ```env
        PORT=3001
        MONAD_RPC_URL=https://testnet-rpc.monad.xyz
        GAME_PRIVATE_KEY=YOUR_GAME_WALLET_PRIVATE_KEY
        SESSION_SECRET=YOUR_SESSION_SECRET
        ```
    * Start the backend server: `npm start`

3.  **Set up the Frontend:**
    * Navigate to the root directory and then into the frontend: `cd ..`
    * Install dependencies: `npm install` (or `pnpm install`)
    * You may need a `.env` file in the root directory for `REACT_APP_API_URL` if your backend is not running on `http://localhost:3001`.
    * Start the frontend application: `npm start`

The application should now be running on `http://localhost:3000`.

## Scripts

### Frontend

* `npm start`: Runs the app in development mode.

### Backend

* `npm start`: Starts the Node.js server.

## Devs

[7n](https://x.com/7nds_) and [0xGus](https://x.com/0xGustavo)
