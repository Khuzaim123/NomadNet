import React, { useState } from 'react';
import { updateProfile } from '../services/userService';

const EditProfileModal = ({ user, onClose, onProfileUpdate }) => {
  const [formData, setFormData] = useState({
    displayName: user.displayName || '',
    bio: user.bio || '',
    profession: user.profession || '',
    skills: user.skills?.join(', ') || '',
    interests: user.interests?.join(', ') || '',
    languages: user.languages?.join(', ') || '',
    currentCity: user.currentCity || '',
    currentCountry: user.currentCountry || '',
    homeCountry: user.homeCountry || '',
    linkedin: user.links?.linkedin || '',
    github: user.links?.github || '',
    portfolio: user.links?.portfolio || '',
    twitter: user.links?.twitter || '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');

    try {
      // Convert comma-separated strings back to arrays
      const payload = {
        displayName: formData.displayName,
        bio: formData.bio,
        profession: formData.profession,
        currentCity: formData.currentCity,
        currentCountry: formData.currentCountry,
        homeCountry: formData.homeCountry,
        skills: formData.skills.split(',').map(s => s.trim()).filter(Boolean),
        interests: formData.interests.split(',').map(i => i.trim()).filter(Boolean),
        languages: formData.languages.split(',').map(l => l.trim()).filter(Boolean),
        links: {
          linkedin: formData.linkedin,
          github: formData.github,
          portfolio: formData.portfolio,
          twitter: formData.twitter,
        }
      };
      
      console.log('Submitting payload:', payload); // Debug log
      
      const response = await updateProfile(user._id, payload);
      console.log('Update response:', response); // Debug log
      
      onProfileUpdate(response.data.data.user);
    } catch (err) {
      console.error('Update error:', err); // Debug log
      setError(err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  const handleOverlayClick = (e) => {
    // Close modal if clicking on the overlay (not the content)
    if (e.target.className === 'modal-overlay') {
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-content">
        <button className="modal-close-btn" onClick={onClose}>&times;</button>
        <h2>Edit Profile</h2>
        <div className="edit-form">
          {error && <p className="error-message">{error}</p>}
          
          <div className="form-group">
            <label htmlFor="displayName">Display Name *</label>
            <input 
              type="text" 
              id="displayName" 
              name="displayName" 
              value={formData.displayName} 
              onChange={handleChange} 
              required 
            />
          </div>

          <div className="form-group">
            <label htmlFor="profession">Profession</label>
            <input 
              type="text" 
              id="profession" 
              name="profession" 
              value={formData.profession} 
              onChange={handleChange} 
              placeholder="e.g., Full Stack Developer"
            />
          </div>

          <div className="form-group">
            <label htmlFor="bio">Bio</label>
            <textarea 
              id="bio" 
              name="bio" 
              value={formData.bio} 
              onChange={handleChange} 
              rows="4"
              placeholder="Tell us about yourself..."
            ></textarea>
          </div>
          
          <div className="form-group">
            <label htmlFor="skills">Skills (comma-separated)</label>
            <input 
              type="text" 
              id="skills" 
              name="skills" 
              value={formData.skills} 
              onChange={handleChange} 
              placeholder="JavaScript, React, Node.js" 
            />
          </div>

          <div className="form-group">
            <label htmlFor="interests">Interests (comma-separated)</label>
            <input 
              type="text" 
              id="interests" 
              name="interests" 
              value={formData.interests} 
              onChange={handleChange} 
              placeholder="Coffee, Hiking, Photography" 
            />
          </div>

          <div className="form-group">
            <label htmlFor="languages">Languages (comma-separated)</label>
            <input 
              type="text" 
              id="languages" 
              name="languages" 
              value={formData.languages} 
              onChange={handleChange} 
              placeholder="English, Spanish, Portuguese" 
            />
          </div>

          <h3 style={{marginTop: '20px', marginBottom: '10px', fontSize: '16px'}}>Location</h3>

          <div className="form-group">
            <label htmlFor="currentCity">Current City</label>
            <input 
              type="text" 
              id="currentCity" 
              name="currentCity" 
              value={formData.currentCity} 
              onChange={handleChange}
              placeholder="e.g., Lisbon"
            />
          </div>

          <div className="form-group">
            <label htmlFor="currentCountry">Current Country</label>
            <input 
              type="text" 
              id="currentCountry" 
              name="currentCountry" 
              value={formData.currentCountry} 
              onChange={handleChange}
              placeholder="e.g., Portugal"
            />
          </div>

          <div className="form-group">
            <label htmlFor="homeCountry">Home Country</label>
            <input 
              type="text" 
              id="homeCountry" 
              name="homeCountry" 
              value={formData.homeCountry} 
              onChange={handleChange}
              placeholder="e.g., USA"
            />
          </div>

          <h3 style={{marginTop: '20px', marginBottom: '10px', fontSize: '16px'}}>Social Links</h3>

          <div className="form-group">
            <label htmlFor="linkedin">LinkedIn URL</label>
            <input 
              type="url" 
              id="linkedin" 
              name="linkedin" 
              value={formData.linkedin} 
              onChange={handleChange} 
              placeholder="https://linkedin.com/in/yourprofile" 
            />
          </div>

          <div className="form-group">
            <label htmlFor="github">GitHub URL</label>
            <input 
              type="url" 
              id="github" 
              name="github" 
              value={formData.github} 
              onChange={handleChange} 
              placeholder="https://github.com/yourusername" 
            />
          </div>

          <div className="form-group">
            <label htmlFor="portfolio">Portfolio URL</label>
            <input 
              type="url" 
              id="portfolio" 
              name="portfolio" 
              value={formData.portfolio} 
              onChange={handleChange} 
              placeholder="https://yourportfolio.com" 
            />
          </div>

          <div className="form-group">
            <label htmlFor="twitter">Twitter URL</label>
            <input 
              type="url" 
              id="twitter" 
              name="twitter" 
              value={formData.twitter} 
              onChange={handleChange} 
              placeholder="https://twitter.com/yourusername" 
            />
          </div>
          
          <div className="form-actions">
            <button 
              type="button" 
              className="action-btn secondary" 
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button 
              type="button" 
              className="action-btn primary" 
              disabled={loading || !formData.displayName} 
              onClick={handleSubmit}
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditProfileModal;