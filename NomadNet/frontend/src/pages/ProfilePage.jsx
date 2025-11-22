import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getUserByUsername } from '../services/userService';
import { getCurrentUser } from '../services/authService';
import ProfileHeader from '../components/ProfileHeader';
import ProfileDetails from '../components/ProfileDetails';
import EditProfileModal from '../components/EditProfileModal';
import AvatarUploadModal from '../components/AvatarUploadModal';
import Spinner from '../components/Spinner';

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
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        if (!token) {
          console.warn('⚠️ No token found, redirecting to login');
          navigate('/');
          return;
        }
        
        const response = await getCurrentUser(token);
        console.log('🔍 Current user response:', response);
        
        // Handle multiple possible response structures
        const user = response?.data?.user || response?.user || response?.data || response;
        
        if (!user || !user._id) {
          console.error('❌ Invalid user data:', response);
          navigate('/');
          return;
        }
        
        console.log('✅ Current user loaded:', user.username);
        setCurrentUser(user);
      } catch (err) {
        console.error('❌ Failed to fetch current user:', err);
        localStorage.clear();
        sessionStorage.clear();
        navigate('/');
      }
    };
    fetchCurrentUser();
  }, [navigate]);

  useEffect(() => {
    const fetchUser = async () => {
      if (!currentUser) {
        console.log('⏳ Waiting for current user...');
        return;
      }
      
      try {
        setLoading(true);
        setError('');
        
        console.log('🔍 Fetching profile for:', username);
        const response = await getUserByUsername(username);
        console.log('🔍 getUserByUsername response:', response);
        
        // Handle multiple possible response structures
        const fetchedUser = response?.data?.data?.user || response?.data?.user || response?.user || response?.data;
        
        if (!fetchedUser || !fetchedUser._id) {
          throw new Error('Invalid user data received');
        }
        
        // Debug logs to check what data we're receiving
        console.log('✅ Fetched user data:', fetchedUser);
        console.log('   - Profession:', fetchedUser.profession);
        console.log('   - Languages:', fetchedUser.languages);
        console.log('   - Links:', fetchedUser.links);
        
        setUser(fetchedUser);
        setIsOwner(fetchedUser._id === currentUser._id);
        
        console.log('✅ Profile loaded successfully');
      } catch (err) {
        console.error('❌ Error fetching user:', err);
        setError(err.response?.data?.message || err.message || 'Failed to fetch user profile.');
        if (err.response?.status === 404) {
          setTimeout(() => navigate('/not-found'), 1000);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [username, currentUser, navigate]);

  const handleProfileUpdate = (updatedUser) => {
    console.log('✅ Profile updated with:', updatedUser);
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
  
  if (loading) return <div className="profile-container"><Spinner /></div>;
  if (error) return <div className="profile-container error-message">{error}</div>;
  if (!user) return <div className="profile-container error-message">User not found</div>;

  return (
    <div className="profile-container">
      <ProfileHeader 
        user={user} 
        isOwner={isOwner}
        onEditProfile={handleEditModalOpen}
        onChangeAvatar={() => setAvatarModalOpen(true)}
      />
      <ProfileDetails user={user} />

      {isEditModalOpen && (
        <EditProfileModal
          user={user}
          onClose={handleEditModalClose}
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