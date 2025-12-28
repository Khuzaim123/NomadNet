// src/components/ProfileDetails.jsx
import React from 'react';
import {
  FiMapPin,
  FiLinkedin,
  FiGithub,
  FiGlobe,
  FiTwitter,
  FiGlobe as FiHome,
  FiMessageCircle,
  FiEdit2,
  FiCamera,
  FiLogOut,
  FiSlash,
  FiAlertTriangle,
  FiKey
} from 'react-icons/fi';

const ProfileDetails = ({
  user,
  currentUser,
  isOwner,
  onEditProfile,
  onAvatarClick,
  onChangePassword,
  onLogout,
  onBlock,
  onReport
}) => {
  console.log('ProfileDetails user data:', user); // Debug log

  const renderLinks = () => {
    const { links } = user;
    if (!links || Object.values(links).every(val => !val)) {
      console.log('No links to display'); // Debug log
      return null;
    }

    console.log('Displaying links:', links); // Debug log

    return (
      <div className="profile-card links-card">
        <h3>On the Web</h3>
        <div className="links-container">
          {links.linkedin && (
            <a href={links.linkedin} target="_blank" rel="noopener noreferrer">
              <FiLinkedin /> LinkedIn
            </a>
          )}
          {links.github && (
            <a href={links.github} target="_blank" rel="noopener noreferrer">
              <FiGithub /> GitHub
            </a>
          )}
          {links.portfolio && (
            <a href={links.portfolio} target="_blank" rel="noopener noreferrer">
              <FiGlobe /> Portfolio
            </a>
          )}
          {links.twitter && (
            <a href={links.twitter} target="_blank" rel="noopener noreferrer">
              <FiTwitter /> Twitter
            </a>
          )}
        </div>
      </div>
    );
  };

  const renderLanguages = () => {
    if (!user.languages || user.languages.length === 0) {
      console.log('No languages to display'); // Debug log
      return null;
    }

    console.log('Displaying languages:', user.languages); // Debug log

    return (
      <div className="profile-card tags-card">
        <h3>Languages</h3>
        <div className="tags-container">
          {user.languages.map((language, i) => (
            <span key={i} className="tag language-tag">
              <FiMessageCircle style={{ marginRight: '5px' }} /> {language}
            </span>
          ))}
        </div>
      </div>
    );
  };

  return (
    <main className="profile-details-grid">
      {/* Header / main profile card with avatar and actions */}
      <div className="profile-card main-profile-card">
        <div className="profile-main-top">
          <div
            className={`profile-avatar-wrapper ${isOwner && onAvatarClick ? 'clickable' : ''
              }`}
            onClick={isOwner && onAvatarClick ? onAvatarClick : undefined}
          >
            <img
              src={user.avatar || '/default-avatar.png'}
              alt={user.displayName || user.username}
              className="profile-avatar"
            />
            {isOwner && (
              <button
                type="button"
                className="avatar-edit-btn"
                onClick={e => {
                  e.stopPropagation();
                  onAvatarClick && onAvatarClick();
                }}
              >
                <FiCamera size={16} />
                Change
              </button>
            )}
          </div>

          <div className="profile-main-info">
            <h2>{user.displayName || user.username}</h2>
            {user.username && (
              <p className="profile-username">@{user.username}</p>
            )}
            {user.profession && (
              <p className="profile-profession">{user.profession}</p>
            )}
          </div>
        </div>

        <div className="profile-main-actions">
          {isOwner ? (
            <>
              {onEditProfile && (
                <button
                  type="button"
                  className="profile-action-btn primary"
                  onClick={onEditProfile}
                >
                  <FiEdit2 size={16} />
                  Edit Profile
                </button>
              )}
              {onChangePassword && (
                <button
                  type="button"
                  className="profile-action-btn"
                  onClick={onChangePassword}
                >
                  <FiKey size={16} />
                  Change Password
                </button>
              )}
              {onLogout && (
                <button
                  type="button"
                  className="profile-action-btn"
                  onClick={onLogout}
                >
                  <FiLogOut size={16} />
                  Logout
                </button>
              )}
            </>
          ) : (
            <>
              {onBlock && (
                <button
                  type="button"
                  className="profile-action-btn danger"
                  onClick={onBlock}
                >
                  <FiSlash size={16} />
                  Block
                </button>
              )}
              {onReport && (
                <button
                  type="button"
                  className="profile-action-btn warning"
                  onClick={onReport}
                >
                  <FiAlertTriangle size={16} />
                  Report
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* About */}
      <div className="profile-card about-card">
        <h3>About {user.displayName || user.username}</h3>
        <p className="bio">{user.bio || 'No bio provided.'}</p>
      </div>

      {/* Location */}
      <div className="profile-card location-card">
        <h3>Location</h3>
        {user.currentCity && user.currentCountry ? (
          <p className="location-info">
            <FiMapPin style={{ marginRight: '5px' }} />
            Currently in{' '}
            <strong>
              {user.currentCity}, {user.currentCountry}
            </strong>
          </p>
        ) : (
          <p className="location-info">Location not specified</p>
        )}
        {user.homeCountry && (
          <p className="location-info">
            <FiHome style={{ marginRight: '5px' }} />
            From <strong>{user.homeCountry}</strong>
          </p>
        )}
      </div>

      {/* Skills */}
      <div className="profile-card tags-card">
        <h3>Skills</h3>
        <div className="tags-container">
          {user.skills?.length > 0 ? (
            user.skills.map((skill, i) => (
              <span key={i} className="tag skill-tag">
                {skill}
              </span>
            ))
          ) : (
            <p>No skills listed.</p>
          )}
        </div>
      </div>

      {/* Interests */}
      <div className="profile-card tags-card">
        <h3>Interests</h3>
        <div className="tags-container">
          {user.interests?.length > 0 ? (
            user.interests.map((interest, i) => (
              <span key={i} className="tag interest-tag">
                {interest}
              </span>
            ))
          ) : (
            <p>No interests listed.</p>
          )}
        </div>
      </div>

      {renderLanguages()}
      {renderLinks()}
    </main>
  );
};

export default ProfileDetails;