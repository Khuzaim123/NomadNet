// src/components/chat/ImageUploader.jsx
import React, { useState, useRef, useEffect } from 'react';
import api from '../../services/api';

const ImageUploader = ({ onClose, onUpload }) => {
  const [mode, setMode] = useState('choice'); // 'choice' | 'upload' | 'capture'
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [caption, setCaption] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  // Camera capture states
  const [stream, setStream] = useState(null);
  const [capturedPhoto, setCapturedPhoto] = useState(null);
  const [facingMode, setFacingMode] = useState('user'); // 'user' = front, 'environment' = back

  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // Cleanup camera stream on unmount or mode change
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type.toLowerCase())) {
      setError('Please select a valid image file (JPEG, PNG, GIF, or WEBP)');
      return;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      setError('File size must be less than 5MB');
      return;
    }

    setError(null);
    setSelectedFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const startCamera = async () => {
    try {
      setError(null);
      console.log('🎥 Requesting camera access...');
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });

      console.log('✅ Camera access granted');
      setStream(mediaStream);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        // Explicitly play the video
        try {
          await videoRef.current.play();
          console.log('✅ Video playing');
        } catch (playErr) {
          console.error('❌ Video play error:', playErr);
        }
      }
    } catch (err) {
      console.error('Camera access error:', err);
      if (err.name === 'NotAllowedError') {
        setError('Camera permission denied. Please allow camera access and try again.');
      } else if (err.name === 'NotFoundError') {
        setError('No camera found on this device.');
      } else {
        setError('Failed to access camera. Please try uploading a file instead.');
      }
      setMode('choice');
    }
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas) return;

    // Set canvas size to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw current video frame to canvas
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert canvas to data URL
    const photoDataUrl = canvas.toDataURL('image/jpeg', 0.95);
    setCapturedPhoto(photoDataUrl);

    // Stop camera stream
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const retakePhoto = () => {
    setCapturedPhoto(null);
    startCamera();
  };

  const usePhoto = async () => {
    if (!capturedPhoto) return;

    setError(null);

    // Convert data URL to Blob
    const response = await fetch(capturedPhoto);
    const blob = await response.blob();

    // Create File from Blob
    const file = new File([blob], `photo_${Date.now()}.jpg`, { type: 'image/jpeg' });

    setSelectedFile(file);
    setPreview(capturedPhoto);
    setMode('upload'); // Switch to upload mode to show caption input
  };

  const handleSend = async () => {
    if (!selectedFile) {
      setError('Please select an image');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      // Upload image to backend (which uploads to Cloudinary)
      const formData = new FormData();
      formData.append('image', selectedFile);

      const response = await api.post('/api/messages/upload-image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      console.log('📥 Upload response:', response);
      console.log('📥 Response data:', response.data);

      const imageUrl = response.data?.data?.imageUrl;

      if (!imageUrl) {
        console.error('❌ No imageUrl in response. Full response:', response.data);
        throw new Error('No image URL returned from server');
      }

      // Call the upload callback with image URL and caption
      onUpload({
        imageUrl,
        caption: caption.trim()
      });

      onClose();
    } catch (err) {
      console.error('Upload failed:', err);
      setError(err.response?.data?.message || err.message || 'Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleModeSelect = (selectedMode) => {
    setMode(selectedMode);
    if (selectedMode === 'capture') {
      startCamera();
    }
  };

  const handleClose = () => {
    // Clean up camera stream if active
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && handleClose()}>
      <div className="modal-container" style={{ maxWidth: '500px' }}>
        <div className="modal-header">
          <h2>📷 Send Image</h2>
          <button onClick={handleClose} className="modal-close-btn">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="modal-body">
          {error && (
            <div style={{
              color: 'var(--error)',
              background: 'rgba(224, 122, 95, 0.1)',
              padding: '0.75rem',
              borderRadius: '8px',
              marginBottom: '1rem',
              fontSize: '0.875rem'
            }}>
              {error}
            </div>
          )}

          {/* Choice Screen */}
          {mode === 'choice' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <button
                onClick={() => handleModeSelect('upload')}
                style={{
                  padding: '1.5rem',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  border: 'none',
                  borderRadius: 'var(--radius-md)',
                  color: 'white',
                  fontWeight: 600,
                  fontSize: '1rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.75rem',
                  transition: 'transform 0.2s, box-shadow 0.2s'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 8px 16px rgba(102, 126, 234, 0.4)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <span style={{ fontSize: '1.5rem' }}>📤</span>
                Upload from Device
              </button>

              <button
                onClick={() => handleModeSelect('capture')}
                style={{
                  padding: '1.5rem',
                  background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                  border: 'none',
                  borderRadius: 'var(--radius-md)',
                  color: 'white',
                  fontWeight: 600,
                  fontSize: '1rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.75rem',
                  transition: 'transform 0.2s, box-shadow 0.2s'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 8px 16px rgba(245, 87, 108, 0.4)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <span style={{ fontSize: '1.5rem' }}>📸</span>
                Capture with Camera
              </button>
            </div>
          )}

          {/* Camera Capture Screen */}
          {mode === 'capture' && !capturedPhoto && (
            <div>
              <div style={{
                position: 'relative',
                borderRadius: 'var(--radius-md)',
                overflow: 'hidden',
                background: '#000',
                marginBottom: '1rem'
              }}>
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  playsInline
                  style={{
                    width: '100%',
                    maxHeight: '400px',
                    objectFit: 'cover'
                  }}
                />
              </div>

              <canvas ref={canvasRef} style={{ display: 'none' }} />

              <div style={{ display: 'flex', gap: '1rem' }}>
                <button
                  onClick={() => setMode('choice')}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: 'transparent',
                    border: '1px solid var(--border-light)',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--text-primary)',
                    fontWeight: 600,
                    cursor: 'pointer',
                    flex: 1
                  }}
                >
                  ← Back
                </button>
                <button
                  onClick={capturePhoto}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: 'var(--gradient-primary)',
                    border: 'none',
                    borderRadius: 'var(--radius-md)',
                    color: 'white',
                    fontWeight: 700,
                    cursor: 'pointer',
                    flex: 2
                  }}
                >
                  📸 Capture Photo
                </button>
              </div>
            </div>
          )}

          {/* Captured Photo Preview */}
          {mode === 'capture' && capturedPhoto && (
            <>
              <div style={{ marginBottom: '1.5rem' }}>
                <img
                  src={capturedPhoto}
                  alt="Captured"
                  style={{
                    width: '100%',
                    maxHeight: '300px',
                    objectFit: 'contain',
                    borderRadius: 'var(--radius-md)',
                    background: 'rgba(0,0,0,0.1)'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <button
                  onClick={retakePhoto}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: 'transparent',
                    border: '1px solid var(--border-light)',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--text-primary)',
                    fontWeight: 600,
                    cursor: 'pointer',
                    flex: 1
                  }}
                >
                  🔄 Retake
                </button>
                <button
                  onClick={usePhoto}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: 'var(--gradient-primary)',
                    border: 'none',
                    borderRadius: 'var(--radius-md)',
                    color: 'white',
                    fontWeight: 700,
                    cursor: 'pointer',
                    flex: 1
                  }}
                >
                  ✓ Use Photo
                </button>
              </div>
            </>
          )}

          {/* Upload/Preview Screen */}
          {mode === 'upload' && !preview && (
            <div>
              <input
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
                id="image-upload-input"
              />
              <label
                htmlFor="image-upload-input"
                style={{
                  display: 'block',
                  border: '2px dashed var(--border-light)',
                  borderRadius: 'var(--radius-md)',
                  padding: '3rem',
                  textAlign: 'center',
                  cursor: 'pointer',
                  background: 'rgba(30, 41, 59, 0.2)',
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => e.currentTarget.style.borderColor = 'var(--primary)'}
                onMouseOut={(e) => e.currentTarget.style.borderColor = 'var(--border-light)'}
              >
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📁</div>
                <p style={{ color: 'var(--text-primary)', fontWeight: 600, marginBottom: '0.5rem' }}>
                  Click to select image
                </p>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                  JPEG, PNG, GIF, WEBP • Max 5MB
                </p>
              </label>

              <button
                onClick={() => setMode('choice')}
                style={{
                  marginTop: '1rem',
                  padding: '0.75rem 1.5rem',
                  background: 'transparent',
                  border: '1px solid var(--border-light)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--text-primary)',
                  fontWeight: 600,
                  cursor: 'pointer',
                  width: '100%'
                }}
              >
                ← Back to Options
              </button>
            </div>
          )}

          {mode === 'upload' && preview && (
            <>
              <div style={{ marginBottom: '1.5rem' }}>
                <img
                  src={preview}
                  alt="Preview"
                  style={{
                    width: '100%',
                    maxHeight: '300px',
                    objectFit: 'contain',
                    borderRadius: 'var(--radius-md)',
                    background: 'rgba(0,0,0,0.1)'
                  }}
                />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  Caption (Optional)
                </label>
                <input
                  type="text"
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Add a caption..."
                  autoFocus
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

              <div style={{ display: 'flex', gap: '1rem' }}>
                <button
                  onClick={() => {
                    setSelectedFile(null);
                    setPreview(null);
                    setCaption('');
                    setError(null);
                  }}
                  disabled={uploading}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: 'transparent',
                    border: '1px solid var(--border-light)',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--text-primary)',
                    fontWeight: 600,
                    cursor: uploading ? 'not-allowed' : 'pointer',
                    flex: 1,
                    opacity: uploading ? 0.5 : 1
                  }}
                >
                  Change Image
                </button>
                <button
                  onClick={handleSend}
                  disabled={uploading}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: uploading ? 'var(--gray-light)' : 'var(--gradient-primary)',
                    border: 'none',
                    borderRadius: 'var(--radius-md)',
                    color: 'white',
                    fontWeight: 700,
                    cursor: uploading ? 'not-allowed' : 'pointer',
                    flex: 1
                  }}
                >
                  {uploading ? '⏳ Uploading...' : '📤 Send Image'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImageUploader;