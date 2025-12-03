// src/utils/helpers.js

/**
 * Get the other participant in a conversation
 * @param {Object} conversation - The conversation object
 * @param {String} currentUserId - The current user's ID
 * @returns {Object|null} The other participant object
 */
export const getOtherParticipant = (conversation, currentUserId) => {
  if (!conversation) {
    console.warn('getOtherParticipant: conversation is undefined');
    return null;
  }

  // Check if otherParticipant is already provided
  if (conversation.otherParticipant) {
    return conversation.otherParticipant;
  }

  // Check if participants array exists
  if (!conversation.participants || !Array.isArray(conversation.participants)) {
    console.warn('getOtherParticipant: participants array is missing', conversation);
    
    // Fallback: check for receiver/sender fields
    if (conversation.receiver) {
      const receiverId = conversation.receiver._id || conversation.receiver.id || conversation.receiver;
      if (receiverId?.toString() !== currentUserId?.toString()) {
        return typeof conversation.receiver === 'object' ? conversation.receiver : null;
      }
    }

    if (conversation.sender) {
      const senderId = conversation.sender._id || conversation.sender.id || conversation.sender;
      if (senderId?.toString() !== currentUserId?.toString()) {
        return typeof conversation.sender === 'object' ? conversation.sender : null;
      }
    }

    return null;
  }

  // Find the other participant from the participants array
  const otherParticipant = conversation.participants.find((participant) => {
    if (!participant) return false;
    
    // Handle both populated and non-populated participants
    const participantId = participant._id || participant.id || participant;
    return participantId?.toString() !== currentUserId?.toString();
  });

  return otherParticipant || null;
};

/**
 * Get user's display name with fallback
 * @param {Object} user - User object
 * @returns {String} Display name
 */
export const getUserDisplayName = (user) => {
  if (!user) return 'Unknown User';
  return user.displayName || user.username || user.name || user.email?.split('@')[0] || 'Unknown User';
};

/**
 * Get user's avatar URL with fallback
 * @param {Object} user - User object
 * @returns {String} Avatar URL
 */
export const getUserAvatar = (user) => {
  if (!user) {
    return 'https://ui-avatars.com/api/?name=U&background=6366f1&color=fff';
  }

  if (user.avatar && user.avatar.trim() !== '') {
    return user.avatar;
  }

  const name = encodeURIComponent(getUserDisplayName(user));
  return `https://ui-avatars.com/api/?name=${name}&background=6366f1&color=fff`;
};

/**
 * Get user ID safely
 * @param {Object} user - User object or ID string
 * @returns {String|null} User ID
 */
export const getUserId = (user) => {
  if (!user) return null;
  if (typeof user === 'string') return user;
  return user._id || user.id || null;
};

/**
 * Check if two user IDs match
 * @param {String|Object} user1 - First user or user ID
 * @param {String|Object} user2 - Second user or user ID
 * @returns {Boolean} True if IDs match
 */
export const isSameUser = (user1, user2) => {
  const id1 = getUserId(user1);
  const id2 = getUserId(user2);
  if (!id1 || !id2) return false;
  return id1.toString() === id2.toString();
};

/**
 * Get initials from a name
 * @param {String} name - The full name
 * @returns {String} The initials (max 2 characters)
 */
export const getInitials = (name) => {
  if (!name) return '?';

  const cleanName = name.trim();
  if (!cleanName) return '?';

  const parts = cleanName.split(' ').filter(part => part.length > 0);

  if (parts.length === 0) return '?';
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }

  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

/**
 * Truncate text to a maximum length
 * @param {String} text - The text to truncate
 * @param {Number} maxLength - Maximum length (default: 50)
 * @returns {String} Truncated text with ellipsis if needed
 */
export const truncateText = (text, maxLength = 50) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + '...';
};

/**
 * Check if a URL is an image
 * @param {String} url - The URL to check
 * @returns {Boolean} True if the URL points to an image
 */
export const isImageUrl = (url) => {
  if (!url) return false;
  return /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(url);
};

/**
 * Check if a URL is a video
 * @param {String} url - The URL to check
 * @returns {Boolean} True if the URL points to a video
 */
export const isVideoUrl = (url) => {
  if (!url) return false;
  return /\.(mp4|webm|ogg|mov|avi)$/i.test(url);
};

/**
 * Play a notification sound
 */
export const playNotificationSound = () => {
  try {
    const audio = new Audio('/sounds/notification.mp3');
    audio.volume = 0.5;
    audio.play().catch(err => console.log('Could not play sound:', err));
  } catch (error) {
    console.log('Notification sound error:', error);
  }
};

/**
 * Request browser notification permission and show notification
 * @param {String} title - Notification title
 * @param {Object} options - Notification options
 */
export const showBrowserNotification = (title, options = {}) => {
  if (!('Notification' in window)) {
    console.log('This browser does not support notifications');
    return;
  }

  if (Notification.permission === 'granted') {
    new Notification(title, {
      icon: '/logo.png',
      badge: '/logo.png',
      ...options,
    });
  } else if (Notification.permission !== 'denied') {
    Notification.requestPermission().then((permission) => {
      if (permission === 'granted') {
        new Notification(title, {
          icon: '/logo.png',
          badge: '/logo.png',
          ...options,
        });
      }
    });
  }
};

/**
 * Format file size to human readable format
 * @param {Number} bytes - File size in bytes
 * @returns {String} Formatted file size
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

/**
 * Debounce function to limit function calls
 * @param {Function} func - The function to debounce
 * @param {Number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
export const debounce = (func, wait = 300) => {
  let timeout;

  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };

    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

/**
 * Throttle function to limit function calls
 * @param {Function} func - The function to throttle
 * @param {Number} limit - Time limit in milliseconds
 * @returns {Function} Throttled function
 */
export const throttle = (func, limit = 300) => {
  let inThrottle;

  return function (...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

/**
 * Copy text to clipboard
 * @param {String} text - Text to copy
 * @returns {Promise<Boolean>} Success status
 */
export const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    console.error('Failed to copy text:', err);
    return false;
  }
};

/**
 * Validate email format
 * @param {String} email - Email to validate
 * @returns {Boolean} True if valid email
 */
export const isValidEmail = (email) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

/**
 * Validate URL format
 * @param {String} url - URL to validate
 * @returns {Boolean} True if valid URL
 */
export const isValidUrl = (url) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

/**
 * Generate a random color (for avatars, etc.)
 * @returns {String} Hex color code
 */
export const getRandomColor = () => {
  const colors = [
    '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e',
    '#f59e0b', '#10b981', '#06b6d4', '#3b82f6'
  ];
  return colors[Math.floor(Math.random() * colors.length)];
};

/**
 * Get contrast color (black or white) for a background color
 * @param {String} hexColor - Hex color code
 * @returns {String} 'black' or 'white'
 */
export const getContrastColor = (hexColor) => {
  if (!hexColor) return 'white';
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 128 ? 'black' : 'white';
};

/**
 * Scroll to bottom of an element
 * @param {HTMLElement} element - The element to scroll
 * @param {Boolean} smooth - Use smooth scrolling
 */
export const scrollToBottom = (element, smooth = true) => {
  if (!element) return;

  element.scrollTo({
    top: element.scrollHeight,
    behavior: smooth ? 'smooth' : 'auto',
  });
};

/**
 * Check if element is in viewport
 * @param {HTMLElement} element - The element to check
 * @returns {Boolean} True if element is in viewport
 */
export const isInViewport = (element) => {
  if (!element) return false;

  const rect = element.getBoundingClientRect();
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  );
};

/**
 * Format location for display
 * @param {String} city - City name
 * @param {String} country - Country name
 * @returns {String} Formatted location
 */
export const formatLocation = (city, country) => {
  if (city && country) {
    return `${city}, ${country}`;
  }
  return city || country || 'Unknown';
};

/**
 * Get user status color
 * @param {String} status - User status ('online', 'away', 'busy', 'offline')
 * @returns {String} Color code
 */
export const getStatusColor = (status) => {
  const colors = {
    online: '#10b981',
    away: '#f59e0b',
    busy: '#ef4444',
    offline: '#6b7280',
  };
  return colors[status] || colors.offline;
};

/**
 * Parse mentions from text (e.g., @username)
 * @param {String} text - Text to parse
 * @returns {Array} Array of mentioned usernames
 */
export const parseMentions = (text) => {
  if (!text) return [];
  const mentionRegex = /@(\w+)/g;
  const mentions = [];
  let match;

  while ((match = mentionRegex.exec(text)) !== null) {
    mentions.push(match[1]);
  }

  return mentions;
};

/**
 * Parse hashtags from text
 * @param {String} text - Text to parse
 * @returns {Array} Array of hashtags
 */
export const parseHashtags = (text) => {
  if (!text) return [];
  const hashtagRegex = /#(\w+)/g;
  const hashtags = [];
  let match;

  while ((match = hashtagRegex.exec(text)) !== null) {
    hashtags.push(match[1]);
  }

  return hashtags;
};

/**
 * Parse URLs from text
 * @param {String} text - Text to parse
 * @returns {Array} Array of URLs
 */
export const parseUrls = (text) => {
  if (!text) return [];
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  return text.match(urlRegex) || [];
};

/**
 * Generate unique ID
 * @returns {String} Unique ID
 */
export const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

/**
 * Sleep/delay function
 * @param {Number} ms - Milliseconds to sleep
 * @returns {Promise}
 */
export const sleep = (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Group array items by a key
 * @param {Array} array - Array to group
 * @param {String} key - Key to group by
 * @returns {Object} Grouped object
 */
export const groupBy = (array, key) => {
  if (!array || !Array.isArray(array)) return {};
  return array.reduce((result, item) => {
    const group = item[key];
    if (!result[group]) {
      result[group] = [];
    }
    result[group].push(item);
    return result;
  }, {});
};

/**
 * Remove duplicates from array of objects
 * @param {Array} array - Array to process
 * @param {String} key - Key to check for uniqueness
 * @returns {Array} Array without duplicates
 */
export const uniqueBy = (array, key) => {
  if (!array || !Array.isArray(array)) return [];
  const seen = new Set();
  return array.filter(item => {
    const value = item[key];
    if (seen.has(value)) {
      return false;
    }
    seen.add(value);
    return true;
  });
};

/**
 * Check if user is on mobile device
 * @returns {Boolean} True if mobile
 */
export const isMobile = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
};

/**
 * Get browser name
 * @returns {String} Browser name
 */
export const getBrowser = () => {
  const ua = navigator.userAgent;
  if (ua.includes('Firefox')) return 'Firefox';
  if (ua.includes('Chrome')) return 'Chrome';
  if (ua.includes('Safari')) return 'Safari';
  if (ua.includes('Edge')) return 'Edge';
  return 'Unknown';
};

/**
 * Safe JSON parse with fallback
 * @param {String} str - String to parse
 * @param {*} fallback - Fallback value if parsing fails
 * @returns {*} Parsed object or fallback
 */
export const safeJsonParse = (str, fallback = null) => {
  try {
    return JSON.parse(str);
  } catch {
    return fallback;
  }
};

/**
 * Check if object is empty
 * @param {Object} obj - Object to check
 * @returns {Boolean} True if empty
 */
export const isEmpty = (obj) => {
  if (!obj) return true;
  if (Array.isArray(obj)) return obj.length === 0;
  if (typeof obj === 'object') return Object.keys(obj).length === 0;
  if (typeof obj === 'string') return obj.trim().length === 0;
  return false;
};

/**
 * Capitalize first letter of string
 * @param {String} str - String to capitalize
 * @returns {String} Capitalized string
 */
export const capitalize = (str) => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
};

/**
 * Format currency
 * @param {Number} amount - Amount to format
 * @param {String} currency - Currency code (default: USD)
 * @returns {String} Formatted currency string
 */
export const formatCurrency = (amount, currency = 'USD') => {
  if (amount === null || amount === undefined) return '';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(amount);
};

export default {
  getOtherParticipant,
  getUserDisplayName,
  getUserAvatar,
  getUserId,
  isSameUser,
  getInitials,
  truncateText,
  isImageUrl,
  isVideoUrl,
  playNotificationSound,
  showBrowserNotification,
  formatFileSize,
  debounce,
  throttle,
  copyToClipboard,
  isValidEmail,
  isValidUrl,
  getRandomColor,
  getContrastColor,
  scrollToBottom,
  isInViewport,
  formatLocation,
  getStatusColor,
  parseMentions,
  parseHashtags,
  parseUrls,
  generateId,
  sleep,
  groupBy,
  uniqueBy,
  isMobile,
  getBrowser,
  safeJsonParse,
  isEmpty,
  capitalize,
  formatCurrency,
};