// src/pages/EditListingPage.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  getListingById,
  updateListing,
  deletePhoto,
  CATEGORIES,
  CONDITIONS,
  PRICE_TYPES,
  DELIVERY_OPTIONS
} from '../services/marketplaceService';
import { getUser } from '../utils/authUtils';
import Spinner from '../components/Spinner';
import '../styles/marketplace.css';

const EditListingPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    otherCategoryName: '',
    condition: '',
    priceType: 'free',
    price: {
      amount: '',
      currency: 'USD'
    },
    deliveryOptions: ['pickup'],
    available: true
  });

  const [existingPhotos, setExistingPhotos] = useState([]);
  const [newPhotos, setNewPhotos] = useState([]);
  const [newPhotoPreviews, setNewPhotoPreviews] = useState([]);
  const [deletingPhotos, setDeletingPhotos] = useState([]);

  const currentUserId = getUser()?.id || getUser()?._id;

  useEffect(() => {
    fetchListing();
  }, [id]);

  const fetchListing = async () => {
    try {
      setLoading(true);
      const data = await getListingById(id);
      const listing = data.data.listing;

      // Check if user is the owner
      if (listing.owner._id !== currentUserId) {
        setError('You can only edit your own listings');
        setTimeout(() => navigate('/marketplace'), 2000);
        return;
      }

      // Populate form with existing data
      setFormData({
        title: listing.title || '',
        description: listing.description || '',
        category: listing.category || '',
        otherCategoryName: listing.otherCategoryName || '',
        condition: listing.condition || '',
        priceType: listing.priceType || 'free',
        price: {
          amount: listing.price?.amount || '',
          currency: listing.price?.currency || 'USD'
        },
        deliveryOptions: listing.deliveryOptions || ['pickup'],
        available: listing.available !== undefined ? listing.available : true
      });

      setExistingPhotos(listing.photos || []);
    } catch (err) {
      console.error('Error fetching listing:', err);
      setError(err.response?.data?.message || 'Failed to load listing');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name.startsWith('price.')) {
      const priceField = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        price: {
          ...prev.price,
          [priceField]: value
        }
      }));
    } else if (type === 'checkbox' && name === 'available') {
      setFormData(prev => ({
        ...prev,
        available: checked
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleDeliveryOptionChange = (option) => {
    setFormData(prev => {
      const currentOptions = prev.deliveryOptions;
      if (currentOptions.includes(option)) {
        return {
          ...prev,
          deliveryOptions: currentOptions.filter(opt => opt !== option)
        };
      } else {
        return {
          ...prev,
          deliveryOptions: [...currentOptions, option]
        };
      }
    });
  };

  const handleNewPhotoChange = (e) => {
    const files = Array.from(e.target.files);
    const totalPhotos = existingPhotos.length + newPhotos.length + files.length;

    if (totalPhotos > 5) {
      setError('Maximum 5 photos allowed');
      return;
    }

    setNewPhotos(prev => [...prev, ...files]);

    // Create previews
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewPhotoPreviews(prev => [...prev, reader.result]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeNewPhoto = (index) => {
    setNewPhotos(prev => prev.filter((_, i) => i !== index));
    setNewPhotoPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleDeleteExistingPhoto = async (photoUrl) => {
    if (!window.confirm('Delete this photo?')) return;

    try {
      setDeletingPhotos(prev => [...prev, photoUrl]);
      await deletePhoto(id, photoUrl);
      setExistingPhotos(prev => prev.filter(photo => photo !== photoUrl));
      setDeletingPhotos(prev => prev.filter(url => url !== photoUrl));
    } catch (err) {
      console.error('Delete photo error:', err);
      setError(err.response?.data?.message || 'Failed to delete photo');
      setDeletingPhotos(prev => prev.filter(url => url !== photoUrl));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!formData.title.trim()) {
      setError('Title is required');
      return;
    }
    if (formData.title.trim().length < 3) {
      setError('Title must be at least 3 characters');
      return;
    }
    if (!formData.description.trim()) {
      setError('Description is required');
      return;
    }
    if (formData.description.trim().length < 10) {
      setError('Description must be at least 10 characters');
      return;
    }
    if (formData.category === 'other' && !formData.otherCategoryName.trim()) {
      setError('Please specify category name for "Other"');
      return;
    }
    if (formData.priceType === 'paid' && (!formData.price.amount || formData.price.amount <= 0)) {
      setError('Price is required for paid listings');
      return;
    }
    if (formData.deliveryOptions.length === 0) {
      setError('At least one delivery option is required');
      return;
    }

    try {
      setSaving(true);

      const updateData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        priceType: formData.priceType,
        deliveryOptions: formData.deliveryOptions,
        available: formData.available
      };

      if (formData.category === 'other' && formData.otherCategoryName.trim()) {
        updateData.otherCategoryName = formData.otherCategoryName.trim();
      }

      if (formData.condition) {
        updateData.condition = formData.condition;
      }

      if (formData.priceType === 'paid' && formData.price.amount) {
        updateData.price = {
          amount: parseFloat(formData.price.amount),
          currency: formData.price.currency
        };
      }

      // Add new photos if any
      if (newPhotos.length > 0) {
        updateData.photos = newPhotos;
      }

      await updateListing(id, updateData);

      setSuccess(true);
      setTimeout(() => {
        navigate(`/marketplace/${id}`);
      }, 1500);
    } catch (err) {
      console.error('Update listing error:', err);
      
      if (err.response?.data?.errors && Array.isArray(err.response.data.errors)) {
        const errorMessages = err.response.data.errors.map(e => e.message).join(', ');
        setError(errorMessages);
      } else {
        setError(err.response?.data?.message || 'Failed to update listing');
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="marketplace-page">
        <div className="loading-container">
          <Spinner />
        </div>
      </div>
    );
  }

  return (
    <div className="marketplace-page">
      <div className="marketplace-container">
        <div className="create-listing-container">
          <div className="create-listing-header">
            <h1 className="marketplace-title">Edit Listing</h1>
            <p className="marketplace-subtitle">Update your listing details</p>
          </div>

          {error && (
            <div className="error-message">
              ⚠️ {error}
            </div>
          )}

          {success && (
            <div className="success-message">
              ✅ Listing updated successfully! Redirecting...
            </div>
          )}

          <form onSubmit={handleSubmit} className="create-listing-form">
            {/* Basic Information */}
            <div className="form-section">
              <h3 className="form-section-title">Basic Information</h3>

              <div className="form-group">
                <label htmlFor="title">Title *</label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="E.g., MacBook Pro 2021"
                  maxLength={100}
                  required
                />
                <span className="char-count">{formData.title.length}/100</span>
              </div>

              <div className="form-group">
                <label htmlFor="description">Description *</label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Describe your offering in detail... (minimum 10 characters)"
                  rows={5}
                  maxLength={1000}
                  required
                />
                <span className="char-count">
                  {formData.description.length}/1000
                  {formData.description.length < 10 && formData.description.length > 0 && 
                    <span style={{ color: 'red' }}> (min 10 chars)</span>
                  }
                </span>
              </div>

              {formData.category === 'other' && (
                <div className="form-group">
                  <label htmlFor="otherCategoryName">Category Name *</label>
                  <input
                    type="text"
                    id="otherCategoryName"
                    name="otherCategoryName"
                    value={formData.otherCategoryName}
                    onChange={handleInputChange}
                    placeholder="E.g., Pet Care, Photography Equipment"
                    maxLength={50}
                    required
                  />
                  <small>Specify the category name (2-50 characters)</small>
                </div>
              )}

              {formData.condition && (
                <div className="form-group">
                  <label htmlFor="condition">Condition</label>
                  <select
                    id="condition"
                    name="condition"
                    value={formData.condition}
                    onChange={handleInputChange}
                  >
                    <option value="">Select condition</option>
                    {CONDITIONS.map(cond => (
                      <option key={cond.value} value={cond.value}>
                        {cond.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Pricing */}
            <div className="form-section">
              <h3 className="form-section-title">Pricing</h3>

              <div className="price-type-selector">
                {PRICE_TYPES.map(price => (
                  <label key={price.value} className="price-type-option">
                    <input
                      type="radio"
                      name="priceType"
                      value={price.value}
                      checked={formData.priceType === price.value}
                      onChange={handleInputChange}
                    />
                    <span className="price-type-label">{price.label}</span>
                  </label>
                ))}
              </div>

              {formData.priceType === 'paid' && (
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="price.amount">Price *</label>
                    <input
                      type="number"
                      id="price.amount"
                      name="price.amount"
                      value={formData.price.amount}
                      onChange={handleInputChange}
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="price.currency">Currency</label>
                    <select
                      id="price.currency"
                      name="price.currency"
                      value={formData.price.currency}
                      onChange={handleInputChange}
                    >
                      <option value="USD">USD</option>
                      <option value="EUR">EUR</option>
                      <option value="GBP">GBP</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* Delivery Options */}
            <div className="form-section">
              <h3 className="form-section-title">Delivery Options *</h3>
              <div className="delivery-options">
                {DELIVERY_OPTIONS.map(option => (
                  <label key={option.value} className="checkbox-option">
                    <input
                      type="checkbox"
                      checked={formData.deliveryOptions.includes(option.value)}
                      onChange={() => handleDeliveryOptionChange(option.value)}
                    />
                    <span>{option.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Availability */}
            <div className="form-section">
              <h3 className="form-section-title">Availability</h3>
              <label className="checkbox-option">
                <input
                  type="checkbox"
                  name="available"
                  checked={formData.available}
                  onChange={handleInputChange}
                />
                <span>This listing is available</span>
              </label>
            </div>

            {/* Photos */}
            <div className="form-section">
              <h3 className="form-section-title">Photos (Max 5 total)</h3>

              {/* Existing Photos */}
              {existingPhotos.length > 0 && (
                <div className="existing-photos-section">
                  <h4>Current Photos</h4>
                  <div className="photo-upload-container">
                    {existingPhotos.map((photo, index) => (
                      <div key={index} className="photo-preview">
                        <img src={photo} alt={`Existing ${index + 1}`} />
                        <button
                          type="button"
                          className="remove-photo-btn"
                          onClick={() => handleDeleteExistingPhoto(photo)}
                          disabled={deletingPhotos.includes(photo)}
                        >
                          {deletingPhotos.includes(photo) ? '⏳' : '✕'}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* New Photos */}
              <div className="new-photos-section">
                <h4>Add New Photos</h4>
                <div className="photo-upload-container">
                  {newPhotoPreviews.map((preview, index) => (
                    <div key={index} className="photo-preview">
                      <img src={preview} alt={`New ${index + 1}`} />
                      <button
                        type="button"
                        className="remove-photo-btn"
                        onClick={() => removeNewPhoto(index)}
                      >
                        ✕
                      </button>
                    </div>
                  ))}

                  {(existingPhotos.length + newPhotos.length) < 5 && (
                    <label className="photo-upload-btn">
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleNewPhotoChange}
                        style={{ display: 'none' }}
                      />
                      <div className="upload-placeholder">
                        <span className="upload-icon">📷</span>
                        <span>Add Photo</span>
                      </div>
                    </label>
                  )}
                </div>
              </div>
            </div>

            {/* Submit */}
            <div className="form-actions">
              <Link
                to={`/marketplace/${id}`}
                className="cancel-btn"
              >
                Cancel
              </Link>
              <button
                type="submit"
                className="submit-btn"
                disabled={saving}
              >
                {saving ? <Spinner /> : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditListingPage;