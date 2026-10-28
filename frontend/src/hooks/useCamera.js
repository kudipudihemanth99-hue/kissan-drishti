import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Custom hook to manage WebRTC camera stream, rear/environment camera selection,
 * torch/flashlight control, error states, and high-resolution base64 frame capture.
 */
export function useCamera() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  const [isStreaming, setIsStreaming] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [facingMode, setFacingMode] = useState('environment'); // 'environment' (rear) or 'user' (front)
  const [hasTorch, setHasTorch] = useState(false);
  const [isTorchOn, setIsTorchOn] = useState(false);

  // Stop any existing tracks on the current stream
  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch (e) {
          console.warn('Error stopping track:', e);
        }
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsStreaming(false);
    setIsTorchOn(false);
  }, []);

  // Initialize camera stream
  const startStream = useCallback(async (preferredFacing = facingMode) => {
    setIsLoading(true);
    setError(null);
    stopStream();

    // Check for WebRTC API support
    if (!navigator?.mediaDevices?.getUserMedia) {
      setError({
        type: 'UNSUPPORTED',
        message: 'Camera access is not supported by your browser or environment (HTTPS required).'
      });
      setIsLoading(false);
      return;
    }

    // Constraints prioritizing rear smartphone camera
    const primaryConstraints = {
      audio: false,
      video: {
        facingMode: { ideal: preferredFacing },
        width: { ideal: 1920, min: 640 },
        height: { ideal: 1080, min: 480 }
      }
    };

    try {
      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia(primaryConstraints);
      } catch (err) {
        console.warn('Ideal rear camera constraint failed, falling back to basic video...', err);
        // Fallback to basic video constraint (e.g. laptop webcam or strict browsers)
        stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: true
        });
      }

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        
        // Wait for video metadata to load before marking as streaming
        await new Promise((resolve) => {
          if (videoRef.current.readyState >= 1) {
            resolve();
          } else {
            videoRef.current.onloadedmetadata = () => resolve();
          }
        });

        await videoRef.current.play();
        setIsStreaming(true);

        // Detect if the video track supports torch/flashlight
        const videoTrack = stream.getVideoTracks()[0];
        if (videoTrack) {
          const capabilities = videoTrack.getCapabilities?.() || {};
          setHasTorch(Boolean(capabilities.torch));
        }
      }
    } catch (err) {
      console.error('Camera access error:', err);
      let errorType = 'UNKNOWN';
      let errorMessage = 'Could not access camera. Please check device permissions.';

      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        errorType = 'PERMISSION_DENIED';
        errorMessage = 'Camera permission was denied. Please allow camera access in your browser settings to scan crops.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        errorType = 'NOT_FOUND';
        errorMessage = 'No camera found on this device.';
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        errorType = 'IN_USE';
        errorMessage = 'Camera is currently in use by another application.';
      }

      setError({
        type: errorType,
        message: errorMessage,
        raw: err
      });
    } finally {
      setIsLoading(false);
    }
  }, [facingMode, stopStream]);

  // Switch between rear ('environment') and front ('user') camera
  const toggleCameraFacing = useCallback(() => {
    const nextFacing = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextFacing);
    startStream(nextFacing);
  }, [facingMode, startStream]);

  // Toggle hardware flashlight/torch
  const toggleTorch = useCallback(async () => {
    if (!streamRef.current || !hasTorch) return;
    const track = streamRef.current.getVideoTracks()[0];
    if (track) {
      try {
        const nextState = !isTorchOn;
        await track.applyConstraints({
          advanced: [{ torch: nextState }]
        });
        setIsTorchOn(nextState);
      } catch (err) {
        console.warn('Failed to toggle torch:', err);
      }
    }
  }, [hasTorch, isTorchOn]);

  /**
   * Captures the current video frame using HTML5 Canvas and converts it to base64.
   * @param {Object} options
   * @param {string} options.format - 'image/jpeg' or 'image/png' or 'image/webp' (default 'image/jpeg')
   * @param {number} options.quality - image quality between 0.0 and 1.0 (default 0.88)
   * @returns {Object|null} - { dataUrl, base64, width, height, mimeType }
   */
  const captureFrameToBase64 = useCallback((options = {}) => {
    const { format = 'image/jpeg', quality = 0.88 } = options;
    const video = videoRef.current;

    if (!video || !isStreaming || video.videoWidth === 0 || video.videoHeight === 0) {
      console.warn('Cannot capture frame: video stream is not ready or has 0 dimensions.');
      return null;
    }

    const width = video.videoWidth;
    const height = video.videoHeight;

    // Use or create canvas element
    let canvas = canvasRef.current;
    if (!canvas) {
      canvas = document.createElement('canvas');
      canvasRef.current = canvas;
    }

    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) {
      console.error('Failed to get 2D canvas context for frame capture.');
      return null;
    }

    // Mirror horizontal drawing if using front camera for natural selfie orientation
    if (facingMode === 'user') {
      ctx.translate(width, 0);
      ctx.scale(-1, 1);
    }

    // Draw the exact video frame
    ctx.drawImage(video, 0, 0, width, height);

    // Reset transform
    if (facingMode === 'user') {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
    }

    // Export to Data URL (e.g. "data:image/jpeg;base64,/9j/4AAQSkZJRg...")
    const dataUrl = canvas.toDataURL(format, quality);

    // Extract raw base64 string without data URI prefix (useful for AI backends)
    const base64 = dataUrl.split(',')[1] || '';

    // Trigger subtle haptic feedback for physical feel
    if (navigator?.vibrate) {
      try {
        navigator.vibrate(50);
      } catch (_) {}
    }

    return {
      dataUrl,
      base64,
      width,
      height,
      mimeType: format,
      capturedAt: new Date().toISOString()
    };
  }, [facingMode, isStreaming]);

  // Lifecycle stream mount & unmount
  useEffect(() => {
    startStream(facingMode);

    return () => {
      stopStream();
    };
  }, []); // Run on mount

  return {
    videoRef,
    canvasRef,
    isStreaming,
    isLoading,
    error,
    facingMode,
    hasTorch,
    isTorchOn,
    startStream,
    stopStream,
    toggleCameraFacing,
    toggleTorch,
    captureFrameToBase64
  };
}
