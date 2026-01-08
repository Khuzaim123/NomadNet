// src/pages/CreateListingPage.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  createListing,
  CATEGORIES,
  TYPES,
  PRICE_TYPES,
  CONDITIONS,
  DELIVERY_OPTIONS
} from '../services/marketplaceService';
import Spinner from '../components/Spinner';
import '../styles/marketplace.css';

const CreateListingPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    type: 'item',
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
    deliveryOption: 'pickup'
  });

  const [photos, setPhotos] = useState([]);
  const [photoPreviews, setPhotoPreviews] = useState([]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    if (name.startsWith('price.')) {
      const priceField = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        price: {
          ...prev.price,
          [priceField]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleDeliveryOptionChange = (option) => {
    setFormData(prev => ({
      ...prev,
      deliveryOption: option
    }));
  };

  const handlePhotoChange = (e) => {
    const files = Array.from(e.target.files);

    if (files.length + photos.length > 5) {
      setError('Maximum 5 photos allowed');
      return;
    }

    setPhotos(prev => [...prev, ...files]);

    // Create previews
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreviews(prev => [...prev, reader.result]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removePhoto = (index) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
    setPhotoPreviews(prev => prev.filter((_, i) => i !== index));
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
    if (!formData.category) {
      setError('Category is required');
      return;
    }
    if (formData.category === 'other' && !formData.otherCategoryName.trim()) {
      setError('Please specify category name for "Other"');
      return;
    }
    if (formData.type === 'item' && !formData.condition) {
      setError('Condition is required for items');
      return;
    }
    if (formData.priceType === 'paid' && (!formData.price.amount || formData.price.amount <= 0)) {
      setError('Price is required for paid listings');
      return;
    }
    if (!formData.deliveryOption) {
      setError('Delivery option is required');
      return;
    }

    try {
      setLoading(true);

      const listingData = {
        type: formData.type,
        title: formData.title.trim(),
        description: formData.description.trim(),
        category: formData.category,
        priceType: formData.priceType,
        deliveryOptions: [formData.deliveryOption],
        photos: photos
      };

      if (formData.category === 'other' && formData.otherCategoryName.trim()) {
        listingData.otherCategoryName = formData.otherCategoryName.trim();
      }

      if (formData.type === 'item' && formData.condition) {
        listingData.condition = formData.condition;
      }

      if (formData.priceType === 'paid' && formData.price.amount) {
        listingData.price = {
          amount: parseFloat(formData.price.amount),
          currency: formData.price.currency
        };
      }

      const response = await createListing(listingData);

      setSuccess(true);
      setTimeout(() => {
        navigate(`/marketplace/${response.data.listing._id}`);
      }, 1500);
    } catch (err) {
      console.error('Create listing error:', err);

      // ✅ ADD: Show backend validation errors
      if (err.response?.data?.errors && Array.isArray(err.response.data.errors)) {
        const errorMessages = err.response.data.errors.map(e => e.message).join(', ');
        setError(errorMessages);
      } else {
        setError(err.response?.data?.message || 'Failed to create listing');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="marketplace-page">
      <div className="marketplace-container">
        <div className="create-listing-container">
          <div className="create-listing-header">
            <h1 className="marketplace-title">Create New Listing</h1>
            <p className="marketplace-subtitle">
              Share an item, offer a service, or teach a skill
            </p>
          </div>

          {error && (
            <div className="error-message">
              ⚠️ {error}
            </div>
          )}

          {success && (
            <div className="success-message">
              ✅ Listing created successfully! Redirecting...
            </div>
          )}

          <form onSubmit={handleSubmit} className="create-listing-form">
            {/* Type Selection */}
            <div className="form-section">
              <h3 className="form-section-title">What are you offering?</h3>
              <div className="type-selector">
                {TYPES.map(type => (
                  <label key={type.value} className="type-option">
                    <input
                      type="radio"
                      name="type"
                      value={type.value}
                      checked={formData.type === type.value}
                      onChange={handleInputChange}
                    />
                    <span className="type-label">{type.label}</span>
                  </label>
                ))}
              </div>
            </div>

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
                  placeholder="E.g., MacBook Pro 2021, Web Development Services"
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

              <div className="form-group">
                <label htmlFor="category">Category *</label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select a category</option>
                  {CATEGORIES.map(cat => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Other Category Name */}
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

              {/* Condition (only for items) */}
              {formData.type === 'item' && (
                <div className="form-group">
                  <label htmlFor="condition">Condition *</label>
                  <select
                    id="condition"
                    name="condition"
                    value={formData.condition}
                    onChange={handleInputChange}
                    required
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
              <h3 className="form-section-title">Delivery Option *</h3>
              <div className="delivery-options">
                {DELIVERY_OPTIONS.map(option => (
                  <label key={option.value} className="type-option">
                    <input
                      type="radio"
                      name="deliveryOption"
                      value={option.value}
                      checked={formData.deliveryOption === option.value}
                      onChange={() => handleDeliveryOptionChange(option.value)}
                    />
                    <span className="type-label">{option.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Photos */}
            <div className="form-section">
              <h3 className="form-section-title">Photos (Max 5)</h3>

              <div className="photo-upload-container">
                {photoPreviews.map((preview, index) => (
                  <div key={index} className="photo-preview">
                    <img src={preview} alt={`Preview ${index + 1}`} />
                    <button
                      type="button"
                      className="remove-photo-btn"
                      onClick={() => removePhoto(index)}
                    >
                      ✕
                    </button>
                  </div>
                ))}

                {photos.length < 5 && (
                  <label className="photo-upload-btn">
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handlePhotoChange}
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

            {/* Submit */}
            <div className="form-actions">
              <button
                type="button"
                className="cancel-btn"
                onClick={() => navigate('/marketplace')}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="submit-btn"
                disabled={loading}
              >
                {loading ? <Spinner /> : 'Create Listing'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateListingPage;