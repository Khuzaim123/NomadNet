// src/components/Layout.jsx
import React from 'react';
import Navbar from './Navbar';
import { useLocation } from 'react-router-dom';

const Layout = ({ children }) => {
  const location = useLocation();
  
  // Don't show navbar on auth page
  const isAuthPage = location.pathname === '/';
  
  if (isAuthPage) {
    return <>{children}</>;
  }

  return (
    <div className="layout">
      <Navbar />
      <main className="main-content">
        {children}
      </main>
    </div>
  );
};

export default Layout;