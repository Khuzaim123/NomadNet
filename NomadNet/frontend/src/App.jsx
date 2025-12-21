// src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { LocationProvider } from './context/LocationContext';
import Layout from './components/Layout';
import AuthPage from './pages/AuthPage';
import DashboardPage from './pages/DashboardPage';
import ProfilePage from './pages/ProfilePage';
import NotFoundPage from './pages/NotFoundPage';
import ChatPage from './pages/ChatPage';
import { AuthProvider } from './context/AuthContext';
// Marketplace Pages
import MarketplacePage from './pages/MarketplacePage';
import CreateListingPage from './pages/CreateListingPage';
import ListingDetailsPage from './pages/ListingDetailsPage';
import MyListingsPage from './pages/MyListingsPage';
import EditListingPage from './pages/EditListingPage';

// Venue Pages
import VenuesPage from './pages/VenuePage';
import VenueDetails from './components/venues/VenueDetails';


import './App.css';
import './styles/chat.css';

function App() {
  return (
    <div className="App">
      <Router>
        <LocationProvider>
          <Layout>
            <Routes>
              {/* Auth (No Navbar) */}
              <Route path="/" element={<AuthPage />} />

              {/* Dashboard (Main Map View) */}
              <Route path="/dashboard" element={<DashboardPage />} />

              {/* Profile */}
              <Route path="/profile/:username" element={<ProfilePage />} />

              {/* Chat */}
              <Route path="/chat" element={<ChatPage />} />

              {/* Marketplace */}
              <Route path="/marketplace" element={<MarketplacePage />} />
              <Route path="/marketplace/create" element={<CreateListingPage />} />
              <Route path="/marketplace/my-listings" element={<MyListingsPage />} />
              <Route path="/marketplace/:id" element={<ListingDetailsPage />} />
              <Route path="/marketplace/edit/:id" element={<EditListingPage />} />

              {/* Venues */}
              <Route path="/venues" element={<VenuesPage />} />
              <Route path="/venues/:id" element={<VenueDetails />} />

              {/* 404 */}
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </Layout>
        </LocationProvider>
      </Router>
    </div>
  );
}

export default App;