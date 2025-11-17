import React, { useState, useRef } from 'react';
import { uploadAvatar } from '../services/userService';
import Spinner from '../components/Spinner'; 

const AvatarUploadModal = ({ user, onClose, onAvatarUpdate }) => {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(user.avatar);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    
    if (!selectedFile) return;

    // ✅ VALIDATE FILE TYPE
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    const fileType = selectedFile.type.toLowerCase();
    
    if (!validTypes.includes(fileType)) {
      setError('Please select a valid image file (JPEG, JPG, PNG, GIF, or WEBP)');
      setFile(null);
      return;
    }

    // ✅ VALIDATE FILE SIZE (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (selectedFile.size > maxSize) {
      setError('File size must be less than 5MB');
      setFile(null);
      return;
    }

    // ✅ Clear any previous errors
    setError('');
    setFile(selectedFile);
    
    // Create preview URL
    const previewURL = URL.createObjectURL(selectedFile);
    setPreview(previewURL);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!file) {
      setError('Please select an image to upload.');
      return;
    }
    
    setLoading(true);
    setError('');

    try {
      const response = await uploadAvatar(user._id, file);
      onAvatarUpdate(response.data.data.user);
      onClose();
    } catch (err) {
      console.error('Avatar upload error:', err);
      setError(err.response?.data?.message || 'Failed to upload avatar.');
    } finally {
      setLoading(false);
    }
  };

  // Cleanup preview URL on unmount
  React.useEffect(() => {
    return () => {
      if (preview && preview.startsWith('blob:')) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [preview]);
  
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content text-center" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose}>&times;</button>
        <h2>Change Avatar</h2>
        
        {error && (
          <div style={{
            color: 'var(--danger)',
            background: 'rgba(224, 122, 95, 0.1)',
            padding: '1rem',
            borderRadius: '12px',
            marginBottom: '1rem',
            border: '1px solid rgba(224, 122, 95, 0.3)',
            fontSize: '0.9rem'
          }}>
            {error}
          </div>
        )}
        
        <img 
          src={preview || '/default-avatar.png'} 
          alt="Avatar preview" 
          className="avatar-preview" 
        />
        
        <form onSubmit={handleSubmit}>
          <input 
            type="file" 
            accept="image/jpeg,image/jpg,image/png,image/gif,image/webp" 
            onChange={handleFileChange} 
            ref={fileInputRef} 
            style={{ display: 'none' }} 
          />
          
          <button 
            type="button" 
            className="action-btn" 
            onClick={() => fileInputRef.current.click()}
            disabled={loading}
            style={{ marginBottom: '1rem', width: '100%' }}
          >
            📁 Choose Image
          </button>

          {file && (
            <div style={{
              background: 'rgba(107, 142, 124, 0.1)',
              padding: '0.8rem',
              borderRadius: '8px',
              marginBottom: '1rem',
              fontSize: '0.9rem',
              color: 'var(--text-light)'
            }}>
              ✓ Selected: {file.name} ({(file.size / 1024).toFixed(2)} KB)
            </div>
          )}

          <small style={{ 
            color: 'var(--text-light)', 
            display: 'block', 
            marginBottom: '1.5rem' 
          }}>
            Accepted: JPEG, JPG, PNG, GIF, WEBP • Max size: 5MB
          </small>

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
              type="submit" 
              className="action-btn primary" 
              disabled={loading || !file}
            >
              {loading ? (
                <>
                  <Spinner size="small" /> Uploading...
                </>
              ) : (
                '📤 Upload & Save'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AvatarUploadModal;