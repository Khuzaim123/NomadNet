import React, { useState } from 'react';
import {
  X, MapPin, MessageSquare, Clock, Users,
  Wifi, Volume2, Check, Loader, Star,
} from 'lucide-react';
import venueService from '../../services/venueService';
import '../../styles/CheckInModal.css';


const CheckInModal = ({ venue, onClose, onSuccess }) => {
  const [note, setNote] = useState('');
  const [duration, setDuration] = useState('1-2');
  const [ratings, setRatings] = useState({
    wifi: 0,
    noise: 0,
    crowdedness: 0
  });
  const [isPrivate, setIsPrivate] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const durationOptions = [
    { value: '0-1', label: 'Less than 1 hour' },
    { value: '1-2', label: '1-2 hours' },
    { value: '2-4', label: '2-4 hours' },
    { value: '4+', label: '4+ hours' }
  ];

  const handleRatingChange = (category, value) => {
    setRatings(prev => ({
      ...prev,
      [category]: value
    }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');

    try {
      await venueService.checkIn(venue._id, {
        note,
        duration,
        ratings,
        isPrivate
      });
      
      setSuccess(true);
      
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to check in');
    } finally {
      setLoading(false);
    }
  };

  const renderStarRating = (category, label, icon) => {
    const Icon = icon;
    return (
      <div className="rating-row">
        <div className="rating-label">
          <Icon size={16} />
          <span>{label}</span>
        </div>
        <div className="star-rating">
          {[1, 2, 3, 4, 5].map(star => (
            <button
              key={star}
              type="button"
              className={`star-btn ${ratings[category] >= star ? 'active' : ''}`}
              onClick={() => handleRatingChange(category, star)}
            >
              <Star 
                size={20} 
                fill={ratings[category] >= star ? 'currentColor' : 'none'} 
              />
            </button>
          ))}
        </div>
      </div>
    );
  };

  if (success) {
    return (
      <div className="checkin-modal">
        <div className="checkin-modal__overlay" onClick={onClose} />
        <div className="checkin-modal__content checkin-modal__content--success">
          <div className="success-animation">
            <div className="success-icon">
              <Check size={48} />
            </div>
            <h2>Checked In!</h2>
            <p>You're now checked in at {venue.name}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="checkin-modal">
      <div className="checkin-modal__overlay" onClick={onClose} />
      
      <div className="checkin-modal__content">
        <button className="checkin-modal__close" onClick={onClose}>
          <X size={24} />
        </button>

        <div className="checkin-modal__header">
          <div className="venue-badge">
            <MapPin size={20} />
          </div>
          <div className="venue-info">
            <h2>Check In</h2>
            <p>{venue.name}</p>
          </div>
        </div>

        {error && (
          <div className="checkin-modal__error">
            <X size={16} />
            {error}
          </div>
        )}

        <div className="checkin-modal__form">
          {/* Note */}
          <div className="form-group">
            <label>
              <MessageSquare size={16} />
              What are you working on? (optional)
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g., Working on my startup, looking for co-founders..."
              rows={3}
              maxLength={280}
            />
            <span className="char-count">{note.length}/280</span>
          </div>

          {/* Duration */}
          <div className="form-group">
            <label>
              <Clock size={16} />
              How long will you be here?
            </label>
            <div className="duration-options">
              {durationOptions.map(option => (
                <button
                  key={option.value}
                  type="button"
                  className={`duration-btn ${duration === option.value ? 'active' : ''}`}
                  onClick={() => setDuration(option.value)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Ratings */}
          <div className="form-group">
            <label>Rate this venue (optional)</label>
            <div className="ratings-section">
              {renderStarRating('wifi', 'WiFi Quality', Wifi)}
              {renderStarRating('noise', 'Noise Level', Volume2)}
              {renderStarRating('crowdedness', 'Crowdedness', Users)}
            </div>
          </div>

          {/* Privacy */}
          <div className="form-group privacy-toggle">
            <label className="toggle-label">
              <input
                type="checkbox"
                checked={isPrivate}
                onChange={(e) => setIsPrivate(e.target.checked)}
              />
              <span className="toggle-slider" />
              <span className="toggle-text">
                Private check-in (only you can see this)
              </span>
            </label>
          </div>
        </div>

        <div className="checkin-modal__actions">
          <button 
            className="cancel-btn" 
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </button>
          <button 
            className="checkin-btn"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader className="spinning" size={18} />
                Checking in...
              </>
            ) : (
              <>
                <Check size={18} />
                Check In
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CheckInModal;