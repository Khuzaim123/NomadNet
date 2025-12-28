// src/components/chat/MessageTypeMenu.jsx
import React, { useState } from 'react';
import MarketplaceItemSelector from './MarketplaceItemSelector';
import CheckInSender from './CheckInSender';
import LocationSender from './LocationSender';
import ImageUploader from './ImageUploader';
import '../../styles/MessageTypeMenu.css';

const MessageTypeMenu = ({ onClose, onSelect }) => {
  const [activeModal, setActiveModal] = useState(null);

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      if (activeModal) {
        setActiveModal(null);
      } else {
        onClose();
      }
    }
  };

  const menuItems = [
    {
      id: 'image',
      icon: '',
      label: 'Image',
      description: 'Send a photo',
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      onClick: () => setActiveModal('image')
    },
    {
      id: 'marketplace',
      icon: '',
      label: 'Marketplace',
      description: 'Share or offer an item',
      gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      onClick: () => setActiveModal('marketplace')
    },
    {
      id: 'checkin',
      icon: '',
      label: 'Check-in',
      description: 'Share location or invite',
      gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      onClick: () => setActiveModal('checkin')
    },
    {
      id: 'location',
      icon: '',
      label: 'Location',
      description: 'Share your location',
      gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
      onClick: () => setActiveModal('location')
    }
  ];

  return (
    <>
      {/* Backdrop */}
      <div
        className="message-type-backdrop"
        onClick={handleBackdropClick}
      >
        {/* Main Menu - Centered Modal */}
        {!activeModal && (
          <div className="message-type-modal" onClick={(e) => e.stopPropagation()}>
            <div className="message-type-modal-header">
              <h2>Send Message</h2>
              <button onClick={onClose} className="message-type-close-btn">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="message-type-grid">
              {menuItems.map((item) => (
                <button
                  key={item.id}
                  className="message-type-card"
                  onClick={item.onClick}
                  style={{ background: item.gradient }}
                >
                  <div className="message-type-icon">{item.icon}</div>
                  <div className="message-type-info">
                    <h3>{item.label}</h3>
                    <p>{item.description}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Sub-modals for each type */}
        {activeModal === 'image' && (
          <div className="message-sub-modal" onClick={(e) => e.stopPropagation()}>
            <ImageUploader
              onClose={() => setActiveModal(null)}
              onUpload={(data) => {
                onSelect('image', data);
                setActiveModal(null);
              }}
            />
          </div>
        )}

        {activeModal === 'marketplace' && (
          <div className="message-sub-modal" onClick={(e) => e.stopPropagation()}>
            <MarketplaceItemSelector
              onClose={() => setActiveModal(null)}
              onSelect={(data) => {
                onSelect('marketplace_item', data);
                setActiveModal(null);
              }}
            />
          </div>
        )}

        {activeModal === 'checkin' && (
          <div className="message-sub-modal" onClick={(e) => e.stopPropagation()}>
            <CheckInSender
              onClose={() => setActiveModal(null)}
              onSend={(data) => {
                onSelect('checkin', data);
                setActiveModal(null);
              }}
            />
          </div>
        )}

        {activeModal === 'location' && (
          <div className="message-sub-modal" onClick={(e) => e.stopPropagation()}>
            <LocationSender
              onClose={() => setActiveModal(null)}
              onSend={(data) => {
                onSelect('location', data);
                setActiveModal(null);
              }}
            />
          </div>
        )}
      </div>
    </>
  );
};

export default MessageTypeMenu;