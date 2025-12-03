// src/pages/ProfilePage.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getUserByUsername } from '../services/userService';
import { getCurrentUser, logout as logoutService } from '../services/authService'; // ⬅ import logout
import ProfileHeader from '../components/ProfileHeader';
import ProfileDetails from '../components/ProfileDetails';
import EditProfileModal from '../components/EditProfileModal';
import AvatarUploadModal from '../components/AvatarUploadModal';
import Spinner from '../components/Spinner';
import { FiEdit2, FiCamera, FiSlash, FiAlertTriangle, FiMessageSquare, FiShoppingBag } from 'react-icons/fi';
import { blockUser, reportUser } from '../services/userService';
import { Link } from 'react-router-dom';

import '../styles/profile.css';

const ProfilePage = () => {
  const { username } = useParams();
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isOwner, setIsOwner] = useState(false);

  const [isEditModalOpen, setEditModalOpen] = useState(false);
  const [isAvatarModalOpen, setAvatarModalOpen] = useState(false);

  // Fetch current logged-in user
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const token =
          localStorage.getItem('token') || sessionStorage.getItem('token');
        if (!token) {
          console.warn('⚠️ No token found, redirecting to login');
          navigate('/');
          return;
        }

        const response = await getCurrentUser(token);
        console.log('🔍 Current user response:', response);

        const fetchedCurrentUser =
          response?.data?.user || response?.user || response?.data || response;

        if (!fetchedCurrentUser) {
          console.error('❌ No current user returned:', response);
          navigate('/');
          return;
        }

        const normalizedUser = {
          ...fetchedCurrentUser,
          _id: fetchedCurrentUser._id || fetchedCurrentUser.id,
        };

        if (!normalizedUser._id) {
          console.error('❌ Current user missing _id:', fetchedCurrentUser);
          navigate('/');
          return;
        }

        console.log('✅ Current user loaded:', normalizedUser.username);
        setCurrentUser(normalizedUser);
      } catch (err) {
        console.error('❌ Failed to fetch current user:', err);
        localStorage.clear();
        sessionStorage.clear();
        navigate('/');
      }
    };

    fetchCurrentUser();
  }, [navigate]);

  // Fetch profile user by username
  useEffect(() => {
    const fetchUser = async () => {
      if (!currentUser) {
        return;
      }

      try {
        setLoading(true);
        setError('');

        const response = await getUserByUsername(username);
        console.log('🔍 getUserByUsername raw response:', response);

        const fetchedUserRaw =
          response?.data?.data?.user ||
          response?.data?.user ||
          response?.user ||
          response?.data;

        if (!fetchedUserRaw) {
          setError('User data is invalid.');
          return;
        }

        const fetchedUser = {
          ...fetchedUserRaw,
          _id: fetchedUserRaw._id || fetchedUserRaw.id,
        };

        if (!fetchedUser._id) {
          setError('User data missing ID.');
          return;
        }

        setUser(fetchedUser);
        setIsOwner(fetchedUser._id === currentUser._id);
      } catch (err) {
        console.error('❌ Error fetching user:', err);
        setError(
          err.response?.data?.message ||
            err.message ||
            'Failed to fetch user profile.'
        );
        if (err.response?.status === 404) {
          setTimeout(() => navigate('/not-found'), 1000);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [username, currentUser, navigate]);

  const handleBlock = async () => {
    if (window.confirm(`Are you sure you want to block ${user.displayName}?`)) {
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

  const handleProfileUpdate = (updatedUser) => {
    setUser(updatedUser);
    setEditModalOpen(false);
  };

  const handleEditModalOpen = () => {
    console.log('📝 Opening edit modal');
    setEditModalOpen(true);
  };

  const handleEditModalClose = () => {
    console.log('❌ Closing edit modal');
    setEditModalOpen(false);
  };

  // 🔐 Logout handler
  const handleLogout = async () => {
    try {
      const token =
        localStorage.getItem('token') || sessionStorage.getItem('token');

      if (token) {
        // Call backend logout to mark user offline / update lastActive
        await logoutService(token);
      }

      // Clear client-side auth data regardless of server response
      localStorage.removeItem('token');
      sessionStorage.removeItem('token');
      localStorage.removeItem('user');

      navigate('/');
    } catch (err) {
      console.error('❌ Logout error:', err);
      // Even if server logout fails, ensure client is logged out
      localStorage.removeItem('token');
      sessionStorage.removeItem('token');
      localStorage.removeItem('user');
      navigate('/');
    }
  };

  // Render
  if (loading)
    return (
      <div className="profile-container">
        <Spinner />
      </div>
    );
  if (error)
    return <div className="profile-container error-message">{error}</div>;
  if (!user)
    return (
      <div className="profile-container error-message">User not found</div>
    );

  return (
    <div className="profile-container">
      {/* Header row: ProfileHeader + Logout button */}
      <div className="profile-header-row">
        <div className="profile-header-main">
          <ProfileHeader
            user={user}
            isOwner={isOwner}
            onEditProfile={handleEditModalOpen}
            onChangeAvatar={() => setAvatarModalOpen(true)}
          />
        </div>

        {isOwner && (
          <button className="profile-logout-btn" onClick={handleLogout}>
            <svg
              viewBox="0 0 24 24"
              aria-hidden="true"
              focusable="false"
              className="profile-logout-icon"
            >
              <path
                fill="currentColor"
                d="M16 13v-2H7V8l-4 4 4 4v-3h9zm2-10H8a2 2 0 0 0-2 2v3h2V5h10v14H8v-3H6v3a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2z"
              />
            </svg>
            <span>Logout</span>
          </button>
        )}
      </div>

      <ProfileDetails user={user} />

      {/* Modals */}
      {isEditModalOpen && (
        <EditProfileModal
          user={user}
          onClose={() => setEditModalOpen(false)}
          onProfileUpdate={handleProfileUpdate}
        />
      )}

      {isAvatarModalOpen && (
        <AvatarUploadModal
          user={user}
          onClose={() => setAvatarModalOpen(false)}
          onAvatarUpdate={handleProfileUpdate}
        />
      )}
    </div>
  );
};

export default ProfilePage;