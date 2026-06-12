import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { WalletProvider, useWallet } from './context/WalletContext';
import Navbar from './components/Navbar/Navbar';
import ConnectPage from './pages/ConnectPage';
import SwapPage from './pages/SwapPage';
import WalletPage from './pages/WalletPage';
import LeaderboardPage from './pages/LeaderboardPage';
import LiquidityPage from './pages/LiquidityPage';
import CreateCoinPage from './pages/CreateCoinPage';
import PendingTxModal from './components/PendingTxModal';

function AppRoutes() {
  const { wallet } = useWallet();

  if (!wallet) {
    return (
      <>
        <ConnectPage />
        <Toaster position="top-right" />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Navigate to="/swap" />} />
        <Route path="/swap" element={<SwapPage />} />
        <Route path="/wallet" element={<WalletPage />} />
        <Route path="/leaderboard" element={<LeaderboardPage />} />
        <Route path="/liquidity" element={<LiquidityPage />} />
        <Route path="/create" element={<CreateCoinPage />} />
        <Route path="*" element={<Navigate to="/swap" />} />
      </Routes>
      <PendingTxModal />
      <Toaster position="top-right" toastOptions={{
        style: { background: '#fff', color: '#1A0A00', border: '1px solid #FFE0C4', borderRadius: '14px' },
        success: { iconTheme: { primary: '#FF6B00', secondary: '#fff' } }
      }} />
    </>
  );
}

export default function App() {
  return (
    <WalletProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </WalletProvider>
  );
}
