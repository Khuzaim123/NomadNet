// App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import AuthPage from './pages/AuthPage';
import ProfilePage from './pages/ProfilePage';
import NotFoundPage from './pages/NotFoundPage'; // 404 page
import './App.css';

function App() {
  return (
    <div className="App">
      <Router>
        <Routes>
          {/* Login / Auth Page */}
          <Route path="/" element={<AuthPage />} />

          {/* Profile Page */}
          <Route path="/profile/:username" element={<ProfilePage />} />

          {/* 404 Page */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Router>
    </div>
  );
}

export default App;
