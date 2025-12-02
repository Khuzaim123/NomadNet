import React from 'react';

const EmptyState = ({ icon, title, description, action, onAction }) => {
  return (
    <div className="chat-empty-state">
      <div className="chat-empty-icon">{icon}</div>
      <h2 className="chat-empty-title">{title}</h2>
      <p className="chat-empty-description">{description}</p>
      {action && onAction && (
        <button onClick={onAction} className="chat-empty-action">
          {action}
        </button>
      )}
    </div>
  );
};

export default EmptyState;