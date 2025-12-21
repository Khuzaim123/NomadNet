// src/components/venues/NearbyNomads.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  MessageCircle, 
  UserPlus, 
  Clock, 
  Briefcase,
  MapPin,
  Users
} from 'lucide-react';
import '../../styles/NearbyNomads.css';

const NearbyNomads = ({ venueId, checkIns }) => {
  const navigate = useNavigate();

  const formatTimeAgo = (date) => {
    const now = new Date();
    const diff = now - new Date(date);
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const handleMessage = (userId) => {
    navigate(`/messages/new?user=${userId}`);
  };

  const handleConnect = (userId) => {
    // Connect logic
  };

  const handleViewProfile = (userId) => {
    navigate(`/profile/${userId}`);
  };

  if (!checkIns || checkIns.length === 0) {
    return (
      <div className="nearby-nomads-empty">
        <Users size={48} />
        <h3>No one here yet</h3>
        <p>Be the first to check in and let others know you're here!</p>
      </div>
    );
  }

  return (
    <div className="nearby-nomads">
      <div className="nomads-header">
        <h3>
          <Users size={20} />
          People Checked In
        </h3>
        <span className="nomad-count">{checkIns.length} nomads</span>
      </div>

      <div className="nomads-list">
        {checkIns.map((checkIn) => {
          const user = checkIn.user;
          if (!user) return null;

          return (
            <div key={checkIn._id} className="nomad-card">
              <div 
                className="nomad-avatar"
                onClick={() => handleViewProfile(user._id)}
              >
                {user.avatar ? (
                  <img src={user.avatar} alt={user.displayName || user.username} />
                ) : (
                  <div className="avatar-placeholder">
                    {(user.displayName || user.username || 'U').charAt(0).toUpperCase()}
                  </div>
                )}
                {user.isOnline && <span className="online-indicator" />}
              </div>

              <div className="nomad-info" onClick={() => handleViewProfile(user._id)}>
                <h4 className="nomad-name">
                  {user.displayName || user.username}
                </h4>
                
                {user.profession && (
                  <p className="nomad-profession">
                    <Briefcase size={12} />
                    {user.profession}
                  </p>
                )}

                <p className="checkin-time">
                  <Clock size={12} />
                  {formatTimeAgo(checkIn.createdAt)}
                </p>

                {checkIn.note && (
                  <p className="checkin-note">"{checkIn.note}"</p>
                )}
              </div>

              <div className="nomad-actions">
                <button 
                  className="action-btn message"
                  onClick={() => handleMessage(user._id)}
                  title="Send message"
                >
                  <MessageCircle size={18} />
                </button>
                <button 
                  className="action-btn connect"
                  onClick={() => handleConnect(user._id)}
                  title="Connect"
                >
                  <UserPlus size={18} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default NearbyNomads;