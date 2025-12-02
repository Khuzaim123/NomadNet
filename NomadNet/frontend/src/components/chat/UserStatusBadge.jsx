import React from 'react';

const UserStatusBadge = ({ status }) => {
  if (!status) return null;

  const getStatusColor = (type) => {
    switch (type) {
      case 'available':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'busy':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'away':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(status.type)}`}>
      {status.emoji && <span>{status.emoji}</span>}
      <span>{status.message || status.type}</span>
    </div>
  );
};

export default UserStatusBadge;