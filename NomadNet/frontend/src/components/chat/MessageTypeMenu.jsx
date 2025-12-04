// src/components/chat/MessageTypeMenu.jsx
import React, { useState } from 'react';
import MarketplaceItemSelector from './MarketplaceItemSelector';
import CheckInSender from './CheckInSender';
import LocationSender from './LocationSender';
import ImageUploader from './ImageUploader';

const MessageTypeMenu = ({ onClose, onSelect }) => {
  const [activeModal, setActiveModal] = useState(null);

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const menuItems = [
    {
      id: 'image',
      icon: (
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      label: 'Image',
      description: 'Send a photo',
      color: '#10b981',
      onClick: () => setActiveModal('image')
    },
    {
      id: 'marketplace',
      icon: (
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
        </svg>
      ),
      label: 'Marketplace Item',
      description: 'Share or offer an item',
      color: '#f59e0b',
      onClick: () => setActiveModal('marketplace')
    },
    {
      id: 'checkin',
      icon: (
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      label: 'Check-in',
      description: 'Share location or invite',
      color: '#ec4899',
      onClick: () => setActiveModal('checkin')
    },
    {
      id: 'location',
      icon: (
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
        </svg>
      ),
      label: 'Location',
      description: 'Share your location',
      color: '#3b82f6',
      onClick: () => setActiveModal('location')
    }
  ];

  return (
    <>
      <div 
        className="message-type-menu-backdrop"
        onClick={handleBackdropClick}
      />

      <div className="message-type-menu">
        <div className="message-type-menu-header">
          <h3>Send</h3>
          <button onClick={onClose} className="message-type-menu-close">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="message-type-menu-grid">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={item.onClick}
              className="message-type-menu-item"
              style={{ '--item-color': item.color }}
            >
              <div className="message-type-menu-item-icon">
                {item.icon}
              </div>
              <div className="message-type-menu-item-content">
                <div className="message-type-menu-item-label">{item.label}</div>
                <div className="message-type-menu-item-description">{item.description}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Modals */}
      {activeModal === 'image' && (
        <ImageUploader
          onClose={() => setActiveModal(null)}
          onSend={(data) => {
            onSelect('image', data);
            setActiveModal(null);
          }}
        />
      )}

      {activeModal === 'marketplace' && (
        <MarketplaceItemSelector
          onClose={() => setActiveModal(null)}
          onSelect={(data) => {
            onSelect('marketplace_item', data);
            setActiveModal(null);
          }}
        />
      )}

      {activeModal === 'checkin' && (
        <CheckInSender
          onClose={() => setActiveModal(null)}
          onSend={(data) => {
            onSelect('checkin', data);
            setActiveModal(null);
          }}
        />
      )}

      {activeModal === 'location' && (
        <LocationSender
          onClose={() => setActiveModal(null)}
          onSend={(data) => {
            onSelect('location', data);
            setActiveModal(null);
          }}
        />
      )}
    </>
  );
};

export default MessageTypeMenu;