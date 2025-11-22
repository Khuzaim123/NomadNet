// src/components/ProfileHeader.jsx - Compact Version
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  FiEdit2, 
  FiCamera, 
  FiSlash, 
  FiAlertTriangle, 
  FiMessageSquare,
  FiShoppingBag,
  FiList,
  FiUser
} from 'react-icons/fi';
import { blockUser, reportUser } from '../services/userService';

const ProfileHeader = ({ user, isOwner, onEditProfile, onChangeAvatar }) => {
  const location = useLocation();
  
  const handleBlock = async () => {
    if (window.confirm(`Are you sure you want to block ${user.displayName}? You will not be able to see their profile or interact with them.`)) {
      try {
        await blockUser(user._id);
        alert('User blocked successfully.');
      } catch (error) {
        alert(error.response?.data?.message || 'Failed to block user.');
      }
    }
  };

  const handleReport = async () => {
    const reason = prompt(`Please provide a reason for reporting ${user.displayName}:`);
    if (reason) {
      try {
        await reportUser(user._id, reason);
        alert('User reported successfully. Our team will review your report.');
      } catch (error) {
        alert(error.response?.data?.message || 'Failed to report user.');
      }
    }
  };

  const isActive = (path) => location.pathname === path;
  
  return (
    <>
      {/* Quick Navigation */}
      <nav className="quick-nav">
        <div className="quick-nav-container">
          <Link 
            to={`/profile/${user.username}`} 
            className={`quick-nav-item ${isActive(`/profile/${user.username}`) ? 'active' : ''}`}
            title="Profile"
          >
            <FiUser />
            <span className="nav-label">Profile</span>
          </Link>
          <Link 
            to="/marketplace" 
            className={`quick-nav-item ${isActive('/marketplace') ? 'active' : ''}`}
            title="Marketplace"
          >
            <FiShoppingBag />
            <span className="nav-label">Marketplace</span>
          </Link>
          {isOwner && (
            <Link 
              to="/marketplace/my-listings" 
              className={`quick-nav-item ${isActive('/marketplace/my-listings') ? 'active' : ''}`}
              title="My Listings"
            >
              <FiList />
              <span className="nav-label">My Listings</span>
            </Link>
          )}
        </div>
      </nav>

      {/* Profile Header */}
      <header className="profile-header">
        <div className="avatar-container">
          <img src={user.avatar} alt={user.displayName} className="profile-avatar" />
          {isOwner && (
            <button className="avatar-change-btn" onClick={onChangeAvatar} title="Change Avatar">
              <FiCamera />
            </button>
          )}
        </div>
        <div className="profile-info">
          <h1 className="display-name">{user.displayName}</h1>
          <p className="username">@{user.username}</p>
          <p className="profession">{user.profession}</p>
          
          {/* Marketplace Badge */}
          {!isOwner && (
            <Link to={`/marketplace?user=${user._id}`} className="marketplace-badge">
              <FiShoppingBag /> View Marketplace Listings
            </Link>
          )}
        </div>
        <div className="profile-actions">
          {isOwner ? (
            <button className="action-btn primary" onClick={onEditProfile}>
              <FiEdit2 /> Edit Profile
            </button>
          ) : (
            <>
              <button className="action-btn">
                <FiMessageSquare /> Message
              </button>
              <button className="action-btn danger" onClick={handleBlock}>
                <FiSlash /> Block
              </button>
              <button className="action-btn secondary" onClick={handleReport}>
                <FiAlertTriangle /> Report
              </button>
            </>
          )}
        </div>
      </header>
    </>
  );
};

export default ProfileHeader;