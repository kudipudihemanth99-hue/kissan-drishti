import { useState, useRef, useEffect } from 'react';
import { Camera, Zap, ZapOff, RefreshCw, AlertCircle, Volume2, Sparkles, Image as ImageIcon } from 'lucide-react';
import { useCamera } from '../hooks/useCamera';

/**
 * CameraViewfinder Component
 * Mobile-first WebRTC rear-camera viewfinder designed for farmers.
 * Supports:
 * - Direct tap anywhere on viewfinder to capture frame
 * - Dedicated high-contrast tactile shutter button
 * - HTML5 Canvas frame extraction to base64
 * - Visual target reticle with animated scan guides
 * - Hardware torch toggle & camera flip
 * - Graceful permission error handling
 */
export function CameraViewfinder({
  onCapture,
  voicePrompt = 'Tap anywhere on screen to scan',
  onSpeakPrompt,
  isSpeaking = false
}) {
  const {
    videoRef,
    canvasRef,
    isStreaming,
    isLoading,
    error,
    facingMode,
    hasTorch,
    isTorchOn,
    startStream,
    toggleCameraFacing,
    toggleTorch,
    captureFrameToBase64
  } = useCamera();

  const [isCapturing, setIsCapturing] = useState(false);
  const [flashActive, setFlashActive] = useState(false);
  const fileInputRef = useRef(null);

  // Trigger capture, animation, and notify parent with base64 data
  const handleCapture = () => {
    if (!isStreaming || isCapturing) return;

    setIsCapturing(true);
    setFlashActive(true);

    setTimeout(() => {
      setFlashActive(false);
    }, 180);

    const result = captureFrameToBase64({
      format: 'image/jpeg',
      quality: 0.88
    });

    if (result) {
      if (onCapture) {
        onCapture(result);
      }
    } else {
      console.warn('Frame capture returned empty');
    }

    setIsCapturing(false);
  };

  // Fallback for file input if camera is not physically available
  const handleFallbackFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result;
      if (typeof dataUrl === 'string') {
        const base64 = dataUrl.split(',')[1] || '';
        onCapture?.({
          dataUrl,
          base64,
          mimeType: file.type || 'image/jpeg',
          capturedAt: new Date().toISOString()
        });
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="camera-viewfinder-container">
      {/* Hidden canvas for high-resolution frame extraction */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {/* Hidden file input for emergency fallback */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        style={{ display: 'none' }}
        onChange={handleFallbackFile}
      />

      {/* Screen Shutter Flash FX */}
      {flashActive && <div className="camera-flash-overlay" />}

      {/* Primary Video Feed */}
      <div 
        className="video-feed-wrapper"
        onClick={handleCapture}
        role="button"
        tabIndex={0}
        aria-label="Tap camera feed to scan plant leaf"
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleCapture()}
      >
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`camera-video ${facingMode === 'user' ? 'mirrored' : ''}`}
        />

        {/* Loading Spinner State */}
        {isLoading && (
          <div className="camera-loader-overlay">
            <div className="spinner-leaf" />
            <p className="loader-text">Starting Camera Viewfinder...</p>
          </div>
        )}

        {/* Error / Permission Denied State */}
        {error && (
          <div className="camera-error-overlay" onClick={(e) => e.stopPropagation()}>
            <div className="error-card">
              <AlertCircle size={48} className="error-icon" />
              <h3>Camera Access Needed</h3>
              <p>{error.message}</p>
              
              <div className="error-actions">
                <button
                  type="button"
                  className="btn-retry"
                  onClick={() => startStream(facingMode)}
                >
                  <RefreshCw size={18} />
                  Retry Camera
                </button>

                <button
                  type="button"
                  className="btn-gallery-fallback"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <ImageIcon size={18} />
                  Upload Photo Instead
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Farmer-friendly Scanning Reticle Overlay */}
        {isStreaming && !error && (
          <div className="reticle-container">
            <div className="scanner-frame">
              {/* Corner brackets for aiming at plant leaf */}
              <span className="corner top-left" />
              <span className="corner top-right" />
              <span className="corner bottom-left" />
              <span className="corner bottom-right" />
              
              {/* Laser scanning beam line */}
              <div className="scanning-beam" />

              {/* Center Leaf Indicator */}
              <div className="reticle-center">
                <Sparkles size={24} className="leaf-sparkle" />
                <span className="reticle-hint">Align sick leaf here</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Top Floating Bar: Voice Hint & Mode Indicator */}
      <div className="camera-top-bar">
        <div 
          className={`voice-banner ${isSpeaking ? 'speaking-active' : ''}`}
          onClick={onSpeakPrompt}
          role="button"
          tabIndex={0}
        >
          <Volume2 size={20} className="voice-icon" />
          <span className="voice-text">{voicePrompt}</span>
        </div>
      </div>

      {/* Bottom Floating Control Bar */}
      {isStreaming && !error && (
        <div className="camera-bottom-bar">
          {/* Torch / Flashlight Toggle */}
          <button
            type="button"
            className={`btn-control-circle ${isTorchOn ? 'active-torch' : ''}`}
            onClick={toggleTorch}
            disabled={!hasTorch}
            aria-label="Toggle Flashlight"
            title={hasTorch ? 'Toggle Flash' : 'Flash not available on this device'}
          >
            {isTorchOn ? <Zap size={22} /> : <ZapOff size={22} />}
          </button>

          {/* Primary Tactile Shutter Button (For easy thumb access) */}
          <button
            type="button"
            className="btn-shutter-main"
            onClick={(e) => {
              e.stopPropagation();
              handleCapture();
            }}
            disabled={isCapturing}
            aria-label="Capture and Diagnose Leaf"
          >
            <div className="shutter-inner">
              <Camera size={32} />
            </div>
          </button>

          {/* Camera Flip (Rear / Front) */}
          <button
            type="button"
            className="btn-control-circle"
            onClick={toggleCameraFacing}
            aria-label="Flip Camera"
            title="Flip to Front/Rear Camera"
          >
            <RefreshCw size={22} />
          </button>
        </div>
      )}
    </div>
  );
}
export default CameraViewfinder;
