// src/components/chat/MarketplaceItemSelector.jsx
import React, { useState, useEffect } from 'react';
import { getMyListings } from '../../services/marketplaceService';
import LoadingSpinner from '../LoadingSpinner';

const MarketplaceItemSelector = ({ onClose, onSelect }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [isOffer, setIsOffer] = useState(false);
  const [offerMessage, setOfferMessage] = useState('');
  const [proposedExchange, setProposedExchange] = useState('');

  useEffect(() => {
    loadMyItems();
  }, []);

  const loadMyItems = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Loading marketplace items...');

      const response = await getMyListings('active');
      console.log('Marketplace response:', response);

      // ✅ FIX: Handle the actual response structure
      let itemsData = [];

      if (response?.data?.listings) {
        // Response structure: { success: true, data: { listings: [...] } }
        itemsData = response.data.listings;
      } else if (response?.listings) {
        // Response structure: { success: true, listings: [...] }
        itemsData = response.listings;
      } else if (response?.data?.data) {
        // Response structure: { success: true, data: { data: [...] } }
        itemsData = response.data.data;
      } else if (response?.data) {
        // Response structure: { success: true, data: [...] }
        if (Array.isArray(response.data)) {
          itemsData = response.data;
        } else if (response.data.listings) {
          itemsData = response.data.listings;
        }
      } else if (Array.isArray(response)) {
        // Direct array response
        itemsData = response;
      }

      console.log('Extracted items:', itemsData);

      const activeItems = Array.isArray(itemsData)
        ? itemsData.filter(item => item.isActive !== false && item.available !== false)
        : [];

      console.log('Active items:', activeItems);
      setItems(activeItems);
    } catch (error) {
      console.error('Failed to load items:', error);
      setError(error.message || 'Failed to load items');
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedItem) return;

    const messageContent = offerMessage.trim() || `Check out my ${selectedItem.type}: ${selectedItem.title}`;

    onSelect({
      marketplaceItemId: selectedItem._id,
      offerMessage: offerMessage.trim(),
      proposedExchange: proposedExchange.trim(),
      isOffer,
      content: messageContent
    });
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-container" style={{ maxWidth: '600px' }}>
        <div className="modal-header">
          <h2>Share Marketplace Item</h2>
          <button onClick={onClose} className="modal-close-btn">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="modal-body">
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '2rem' }}>
              <LoadingSpinner size="lg" />
              <p style={{ marginTop: '1rem', color: 'var(--text-secondary)' }}>Loading your items...</p>
            </div>
          ) : error ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--error)' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
              <p style={{ fontWeight: 600, marginBottom: '0.5rem' }}>Failed to load items</p>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{error}</p>
              <button
                onClick={loadMyItems}
                style={{
                  marginTop: '1rem',
                  padding: '0.5rem 1rem',
                  background: 'var(--primary)',
                  border: 'none',
                  borderRadius: 'var(--radius-md)',
                  color: 'white',
                  cursor: 'pointer',
                  fontWeight: 600
                }}
              >
                Retry
              </button>
            </div>
          ) : items.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📦</div>
              <p style={{ color: 'var(--text-primary)', fontWeight: 600, marginBottom: '0.5rem' }}>
                You don't have any active marketplace items.
              </p>
              <p style={{ fontSize: '0.875rem' }}>
                Create a listing first to share it in messages.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              {/* Item Selection */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.75rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  Select Item ({items.length} available)
                </label>
                <div style={{ display: 'grid', gap: '0.75rem', maxHeight: '300px', overflowY: 'auto', paddingRight: '0.5rem' }}>
                  {items.map((item) => (
                    <div
                      key={item._id}
                      onClick={() => setSelectedItem(item)}
                      style={{
                        display: 'flex',
                        gap: '1rem',
                        padding: '1rem',
                        background: selectedItem?._id === item._id
                          ? 'rgba(99, 102, 241, 0.15)'
                          : 'rgba(30, 41, 59, 0.4)',
                        border: selectedItem?._id === item._id
                          ? '2px solid var(--primary)'
                          : '1px solid var(--border-light)',
                        borderRadius: 'var(--radius-md)',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      {item.photos?.[0] ? (
                        <img
                          src={item.photos[0]}
                          alt={item.title}
                          style={{
                            width: '60px',
                            height: '60px',
                            objectFit: 'cover',
                            borderRadius: 'var(--radius-sm)',
                            flexShrink: 0
                          }}
                        />
                      ) : (
                        <div style={{
                          width: '60px',
                          height: '60px',
                          background: 'rgba(99, 102, 241, 0.1)',
                          borderRadius: 'var(--radius-sm)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '1.5rem',
                          flexShrink: 0
                        }}>
                          {item.type === 'item' ? '📦' : item.type === 'service' ? '🛠️' : '💡'}
                        </div>
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          fontWeight: 600,
                          color: 'var(--text-primary)',
                          marginBottom: '0.25rem',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}>
                          {item.title}
                        </div>
                        <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                          {item.priceType === 'paid' && item.price?.amount && `$${item.price.amount}`}
                          {item.priceType === 'free' && '🎁 Free'}
                          {item.priceType === 'barter' && '🔄 Barter'}
                          {' • '}
                          <span style={{ textTransform: 'capitalize' }}>{item.type}</span>
                        </div>
                        {item.category && (
                          <div style={{
                            fontSize: '0.75rem',
                            color: 'var(--text-muted)',
                            marginTop: '0.25rem',
                            textTransform: 'capitalize'
                          }}>
                            {item.category.replace(/_/g, ' ')}
                          </div>
                        )}
                      </div>
                      {selectedItem?._id === item._id && (
                        <div style={{ color: 'var(--primary)', alignSelf: 'center' }}>
                          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: '24px', height: '24px' }}>
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Offer Toggle */}
              {selectedItem && (
                <>
                  <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      cursor: 'pointer',
                      padding: '0.75rem',
                      background: isOffer ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
                      border: `1px solid ${isOffer ? 'var(--primary)' : 'var(--border-light)'}`,
                      borderRadius: 'var(--radius-md)',
                      transition: 'all 0.2s'
                    }}>
                      <input
                        type="checkbox"
                        checked={isOffer}
                        onChange={(e) => setIsOffer(e.target.checked)}
                        style={{
                          width: '20px',
                          height: '20px',
                          accentColor: 'var(--primary)'
                        }}
                      />
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                          Send as formal offer
                        </div>
                        <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                          The recipient can accept or decline your offer
                        </div>
                      </div>
                    </label>
                  </div>

                  {/* Message */}
                  <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {isOffer ? 'Offer Message' : 'Message'} (Optional)
                    </label>
                    <textarea
                      value={offerMessage}
                      onChange={(e) => setOfferMessage(e.target.value)}
                      placeholder={isOffer ? 'Explain your offer...' : 'Add a message...'}
                      rows={3}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        background: 'rgba(30, 41, 59, 0.4)',
                        border: '1px solid var(--border-light)',
                        borderRadius: 'var(--radius-md)',
                        color: 'var(--text-primary)',
                        fontSize: '0.9375rem',
                        resize: 'vertical',
                        fontFamily: 'inherit'
                      }}
                    />
                  </div>

                  {/* Proposed Exchange (for barter items) */}
                  {isOffer && selectedItem.priceType === 'barter' && (
                    <div style={{ marginBottom: '1.5rem' }}>
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                        Proposed Exchange
                      </label>
                      <input
                        type="text"
                        value={proposedExchange}
                        onChange={(e) => setProposedExchange(e.target.value)}
                        placeholder="What are you offering in exchange?"
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          background: 'rgba(30, 41, 59, 0.4)',
                          border: '1px solid var(--border-light)',
                          borderRadius: 'var(--radius-md)',
                          color: 'var(--text-primary)',
                          fontSize: '0.9375rem'
                        }}
                      />
                    </div>
                  )}
                </>
              )}

              {/* Actions */}
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                <button
                  type="button"
                  onClick={onClose}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: 'transparent',
                    border: '1px solid var(--border-light)',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--text-primary)',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!selectedItem}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: selectedItem ? 'var(--gradient-primary)' : 'var(--gray-light)',
                    border: 'none',
                    borderRadius: 'var(--radius-md)',
                    color: 'white',
                    fontWeight: 700,
                    cursor: selectedItem ? 'pointer' : 'not-allowed',
                    opacity: selectedItem ? 1 : 0.5,
                    transition: 'all 0.2s'
                  }}
                >
                  {isOffer ? '💼 Send Offer' : '📤 Share Item'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default MarketplaceItemSelector;