// src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import AuthPage from './pages/AuthPage';
import ProfilePage from './pages/ProfilePage';
import NotFoundPage from './pages/NotFoundPage';

// Marketplace Pages
import MarketplacePage from './pages/MarketplacePage';
import CreateListingPage from './pages/CreateListingPage';
import ListingDetailsPage from './pages/ListingDetailsPage';
import MyListingsPage from './pages/MyListingsPage';

import './App.css';

function App() {
  return (
    <div className="App">
      <Router>
        <Routes>
          {/* Auth */}
          <Route path="/" element={<AuthPage />} />

          {/* Profile */}
          <Route path="/profile/:username" element={<ProfilePage />} />

          {/* Marketplace */}
          <Route path="/marketplace" element={<MarketplacePage />} />
          <Route path="/marketplace/create" element={<CreateListingPage />} />
          <Route path="/marketplace/my-listings" element={<MyListingsPage />} />
          <Route path="/marketplace/:id" element={<ListingDetailsPage />} />

          {/* 404 */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Router>
    </div>
  );
}

export default App;