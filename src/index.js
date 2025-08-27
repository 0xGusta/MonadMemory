import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import {PrivyProvider} from '@privy-io/react-auth';
import { monadTestnet } from './monadChain.js';

const monadGamesId = 'cmd8euall0037le0my79qpz42';


const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <PrivyProvider
      appId="cmeu10ic10231jr0cayzi8w0f"
      config={{
        defaultChain: monadTestnet,
        supportedChains: [monadTestnet],
        loginMethodsAndOrder: {
          primary: [`privy:${monadGamesId}`],
        },
        embeddedWallets: {
          createOnLogin: 'users-without-wallets',
          requireUserPasswordOnCreate: false,
        },
        appearance: {
          logo: "favicon.ico",
        },
      }}
    >
      <App />
    </PrivyProvider>
  </React.StrictMode>
);