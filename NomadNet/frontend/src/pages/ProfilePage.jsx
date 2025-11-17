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
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }
        
        const data = await getCurrentUser(token);
        console.log('Current user data:', data); // Debug log
        setCurrentUser(data.data.user);
      } catch (err) {
        console.error('Failed to fetch current user:', err);
        navigate('/login');
      }
    };
    fetchCurrentUser();
  }, [navigate]);

  useEffect(() => {
    const fetchUser = async () => {
      if (!currentUser) return;
      
      try {
        setLoading(true);
        setError('');
        const response = await getUserByUsername(username);
        const fetchedUser = response.data.data.user;
        
        // Debug logs to check what data we're receiving
        console.log('Fetched user data:', fetchedUser);
        console.log('Profession:', fetchedUser.profession);
        console.log('Languages:', fetchedUser.languages);
        console.log('Links:', fetchedUser.links);
        
        setUser(fetchedUser);
        setIsOwner(fetchedUser._id === currentUser._id);
      } catch (err) {
        console.error('Error fetching user:', err);
        setError(err.response?.data?.message || 'Failed to fetch user profile.');
        if (err.response?.status === 404) {
          navigate('/not-found');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [username, currentUser, navigate]);

  const handleProfileUpdate = (updatedUser) => {
    console.log('Profile updated with:', updatedUser); // Debug log
    setUser(updatedUser);
    setEditModalOpen(false); // Ensure modal closes after update
  };

  const handleEditModalOpen = () => {
    console.log('Opening edit modal'); // Debug log
    setEditModalOpen(true);
  };

  const handleEditModalClose = () => {
    console.log('Closing edit modal'); // Debug log
    setEditModalOpen(false);
  };
  
  if (loading) return <div className="profile-container"><Spinner /></div>;
  if (error) return <div className="profile-container error-message">{error}</div>;
  if (!user) return null;

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