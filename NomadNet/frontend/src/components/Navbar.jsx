// src/components/Navbar.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  FiShoppingBag,
  FiList,
  FiUser,
  FiMenu,
  FiX,
  FiLogOut,
  FiMap
} from 'react-icons/fi';
import '../styles/Navbar.css';

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const profileRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    const userData = localStorage.getItem('user') || sessionStorage.getItem('user');
    
    console.log('🔍 Navbar - Checking auth:', {
      hasToken: !!token,
      hasUserData: !!userData,
      currentPath: location.pathname
    });

    if (token && userData) {
      try {
        const parsedUser = JSON.parse(userData);
        console.log('✅ Navbar - User loaded:', parsedUser.username);
        setUser(parsedUser);
      } catch (error) {
        console.error('❌ Navbar - Error parsing user data:', error);
        localStorage.clear();
        sessionStorage.clear();
        if (location.pathname !== '/') {
          navigate('/', { replace: true });
        }
      }
    } else {
      console.warn('⚠️ Navbar - No auth found');
      if (location.pathname !== '/') {
        navigate('/', { replace: true });
      }
    }
    
    setLoading(false);
  }, [location.pathname, navigate]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    };

    if (isProfileOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isProfileOpen]);

  const isActive = (path) => {
    if (path === '/dashboard') {
      return location.pathname === '/dashboard';
    }
    if (path === '/marketplace') {
      return location.pathname.startsWith('/marketplace') && 
             !location.pathname.includes('/my-listings');
    }
    return location.pathname === path;
  };

  const handleLogout = () => {
    console.log('👋 Logging out...');
    localStorage.clear();
    sessionStorage.clear();
    navigate('/', { replace: true });
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  if (loading) {
    return (
      <nav className="global-navbar">
        <div className="navbar-container">
          <div className="navbar-loading">Loading...</div>
        </div>
      </nav>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <nav className="global-navbar">
      <div className="navbar-container">
        {/* Logo/Brand */}
        <Link to="/dashboard" className="navbar-brand" onClick={closeMenu}>
          <FiMap className="brand-icon" />
          <span className="brand-text">NomadNet</span>
        </Link>

        {/* Mobile Menu Toggle */}
        <button 
          className="mobile-menu-toggle" 
          onClick={toggleMenu}
          aria-label="Toggle menu"
        >
          {isMenuOpen ? <FiX /> : <FiMenu />}
        </button>

        {/* Navigation Links */}
        <div className={`navbar-links ${isMenuOpen ? 'active' : ''}`}>
          <Link 
            to="/dashboard" 
            className={`nav-link ${isActive('/dashboard') ? 'active' : ''}`}
            onClick={closeMenu}
          >
            <FiMap />
            <span>Dashboard</span>
          </Link>

          <Link 
            to="/marketplace" 
            className={`nav-link ${isActive('/marketplace') ? 'active' : ''}`}
            onClick={closeMenu}
          >
            <FiShoppingBag />
            <span>Marketplace</span>
          </Link>

          <Link 
            to="/marketplace/my-listings" 
            className={`nav-link ${isActive('/marketplace/my-listings') ? 'active' : ''}`}
            onClick={closeMenu}
          >
            <FiList />
            <span>My Listings</span>
          </Link>
        </div>

        {/* User Profile Dropdown */}
        <div className="navbar-profile" ref={profileRef}>
          <button 
            className="profile-trigger"
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            aria-label="User menu"
          >
            <img 
              src={user.avatar} 
              alt={user.displayName} 
              className="profile-avatar-small"
            />
            <span className="profile-name">{user.displayName}</span>
          </button>

          {isProfileOpen && (
            <div className="profile-dropdown">
              <Link 
                to={`/profile/${user.username}`} 
                className="dropdown-item"
                onClick={() => {
                  setIsProfileOpen(false);
                  closeMenu();
                }}
              >
                <FiUser />
                <span>My Profile</span>
              </Link>

              <hr className="dropdown-divider" />

              <button 
                className="dropdown-item logout"
                onClick={handleLogout}
              >
                <FiLogOut />
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;