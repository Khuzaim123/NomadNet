// App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import AuthPage from './pages/authPage';
import ProfilePage from './pages/profilePage';
import NotFoundPage from './pages/notFoundPage'; // 404 page
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
