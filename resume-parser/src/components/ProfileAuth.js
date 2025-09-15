import React, { useState, useRef, useEffect } from 'react';
import { Camera, X, CheckCircle, AlertCircle, User, CreditCard } from 'lucide-react';
import apiService from '../services/api';

const ProfileAuth = ({ onBack, onComplete }) => {
  const [step, setStep] = useState(1); // 1: Photo, 2: Aadhar, 3: Review, 4: Success
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [aadharNumber, setAadharNumber] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [stream, setStream] = useState(null);
  const [isAlreadyVerified, setIsAlreadyVerified] = useState(false);
  const [verificationData, setVerificationData] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const openCamera = async () => {
    try {
      setError('');
      
      // Clean up any existing stream first
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
        setStream(null);
      }
      
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      });
      
      setStream(mediaStream);
      setIsCameraOpen(true);
    } catch (err) {
      console.error('Error accessing camera:', err);
      setError('Unable to access camera. Please ensure camera permissions are granted.');
    }
  };

  const closeCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    
    // Clear the video element
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    setIsCameraOpen(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      const context = canvas.getContext('2d');
      
      // Set canvas dimensions to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // Draw the video frame to canvas
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Convert canvas to blob
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], 'camera-capture.jpg', { type: 'image/jpeg' });
          setPhoto(file);
          setPhotoPreview(URL.createObjectURL(blob));
          closeCamera();
        }
      }, 'image/jpeg', 0.8);
    }
  };

  const handleRetakePhoto = () => {
    setPhoto(null);
    setPhotoPreview(null);
    closeCamera(); // Ensure camera is properly closed
    setStep(1);
  };

  // Handle video stream when camera opens
  useEffect(() => {
    if (isCameraOpen && stream && videoRef.current) {
      console.log('Setting up video stream');
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(err => {
        console.error('Error playing video:', err);
      });
    }
  }, [isCameraOpen, stream]);

  // Check if user is already verified on component mount
  useEffect(() => {
    const checkVerificationStatus = async () => {
      try {
        const response = await apiService.getVerificationStatus();
        const verification = response.data?.verification;
        
        if (verification?.isVerified && verification?.verificationStatus === 'approved') {
          setIsAlreadyVerified(true);
          setVerificationData(verification);
          setSuccess('Your profile is already verified!');
          setStep(4); // Skip to success step
        }
      } catch (error) {
        console.error('Failed to check verification status:', error);
        // Continue with normal verification flow if check fails
      }
    };
    
    checkVerificationStatus();
  }, []);

  // Cleanup camera stream on component unmount
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  const handleAadharChange = (e) => {
    let value = e.target.value.replace(/\D/g, ''); // Remove non-digits
    // Format as XXXX XXXX XXXX
    if (value.length > 12) value = value.substring(0, 12);
    if (value.length > 8) {
      value = value.substring(0, 8) + ' ' + value.substring(8);
    }
    if (value.length > 4) {
      value = value.substring(0, 4) + ' ' + value.substring(4);
    }
    setAadharNumber(value);
  };

  const validateAadhar = (aadhar) => {
    // Remove spaces and check if it's 12 digits
    const cleanAadhar = aadhar.replace(/\s/g, '');
    return /^\d{12}$/.test(cleanAadhar);
  };

  const handleNext = () => {
    if (step === 1) {
      if (!photo) {
        setError('Please capture or upload a photo');
        return;
      }
      setStep(2);
      setError('');
    } else if (step === 2) {
      if (!validateAadhar(aadharNumber)) {
        setError('Please enter a valid 12-digit Aadhar number');
        return;
      }
      setStep(3);
      setError('');
    } else if (step === 3) {
      handleSubmit();
    }
  };

  const handleSubmit = async () => {
    setIsProcessing(true);
    setError('');
    
    try {
      // Save verification status to database
      const verificationData = {
        isVerified: true,
        verifiedAt: new Date().toISOString(),
        verificationMethod: 'photo_aadhar',
        aadharNumber: aadharNumber.replace(/\s/g, ''),
        verificationPhoto: photo // Send the base64 photo data
      };

      // Update user profile with verification status
      const response = await apiService.verifyProfile(verificationData);
      
      console.log('Verification response:', response);
      setSuccess('Profile verification completed successfully!');
      setStep(4);
    } catch (err) {
      console.error('Verification error:', err);
      
      // Check if user is already verified
      if (err.message && err.message.includes('already verified')) {
        setError('You are already verified. Re-verification is not allowed.');
        setStep(4); // Go to success step to show current verification status
        return;
      }
      
      // Provide more specific error messages
      let errorMessage = 'Failed to submit verification. Please try again.';
      
      if (err.message) {
        if (err.message.includes('HTTP error! status: 400')) {
          errorMessage = 'Invalid verification data. Please check your information and try again.';
        } else if (err.message.includes('HTTP error! status: 401')) {
          errorMessage = 'Authentication required. Please log in again.';
        } else if (err.message.includes('HTTP error! status: 404')) {
          errorMessage = 'User not found. Please try logging in again.';
        } else if (err.message.includes('HTTP error! status: 500')) {
          errorMessage = 'Server error. Please try again later.';
        } else if (err.message.includes('NetworkError') || err.message.includes('Failed to fetch')) {
          errorMessage = 'Network error. Please check your connection and try again.';
        } else {
          errorMessage = `Verification failed: ${err.message}`;
        }
      }
      
      setError(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleComplete = () => {
    if (onComplete) {
      onComplete({
        photo: isAlreadyVerified ? null : photo,
        aadharNumber: isAlreadyVerified ? verificationData?.aadharNumber : aadharNumber.replace(/\s/g, ''),
        verified: true,
        isAlreadyVerified: isAlreadyVerified,
        verificationData: verificationData
      });
    }
  };

  const renderStep1 = () => (
    <div className="auth-step">
      <div className="step-header">
        <div className="step-icon">
          <Camera className="icon" />
        </div>
        <h2>Take Your Photo</h2>
        <p>Please use your device's camera to take a clear photo of yourself for identity verification.</p>
      </div>
      
      <div className="photo-section">
        {photoPreview ? (
          <div className="photo-preview">
            <img src={photoPreview} alt="Profile preview" />
            <button 
              className="retake-button"
              onClick={handleRetakePhoto}
            >
              <X className="icon" />
              Retake
            </button>
          </div>
        ) : isCameraOpen ? (
          <div className="camera-view">
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              muted
              className="camera-video"
              onLoadedMetadata={() => {
                if (videoRef.current) {
                  videoRef.current.play().catch(console.error);
                }
              }}
            />
            <div className="camera-controls">
              <button 
                className="capture-photo-button"
                onClick={capturePhoto}
              >
                <Camera className="icon" />
                Capture Photo
              </button>
              <button 
                className="cancel-camera-button"
                onClick={closeCamera}
              >
                <X className="icon" />
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="photo-capture">
            <div 
              className="camera-placeholder"
              onClick={openCamera}
              style={{ cursor: 'pointer' }}
            >
              <Camera className="camera-icon" />
              <p>Click to open camera</p>
            </div>
            <button 
              className="capture-button"
              onClick={openCamera}
            >
              <Camera className="icon" />
              Open Camera
            </button>
          </div>
        )}
      </div>
      
      {/* Hidden canvas for photo capture */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  );

  const renderStep2 = () => (
    <div className="auth-step">
      <div className="step-header">
        <div className="step-icon">
          <CreditCard className="icon" />
        </div>
        <h2>Enter Aadhar Number</h2>
        <p>Please enter your 12-digit Aadhar number for verification</p>
      </div>
      
      <div className="aadhar-section">
        <div className="input-group">
          <label htmlFor="aadhar">Aadhar Number</label>
          <input
            type="text"
            id="aadhar"
            value={aadharNumber}
            onChange={handleAadharChange}
            placeholder="1234 5678 9012"
            maxLength="14"
            className="aadhar-input"
          />
          <small className="input-hint">Enter your 12-digit Aadhar number</small>
        </div>
        
        <div className="privacy-notice">
          <AlertCircle className="icon" />
          <p>Your Aadhar number will be used only for identity verification and will be kept secure.</p>
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="auth-step">
      <div className="step-header">
        <div className="step-icon">
          <User className="icon" />
        </div>
        <h2>Review Your Information</h2>
        <p>Please review your details before submitting for verification</p>
      </div>
      
      <div className="review-section">
        <div className="review-item">
          <h4>Photo</h4>
          <div className="review-photo">
            <img src={photoPreview} alt="Profile" />
          </div>
        </div>
        
        <div className="review-item">
          <h4>Aadhar Number</h4>
          <div className="review-aadhar">
            <span className="aadhar-masked">
              {aadharNumber.substring(0, 4)} **** **** {aadharNumber.substring(13)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="auth-step success-step">
      <div className="step-header">
        <div className="step-icon success">
          <CheckCircle className="icon" />
        </div>
        <h2>{isAlreadyVerified ? 'Profile Already Verified!' : 'Verification Submitted!'}</h2>
        <p>
          {isAlreadyVerified 
            ? 'Your profile is already verified and up to date. No further action needed.'
            : 'Your profile verification has been submitted successfully. You will be notified once it\'s reviewed.'
          }
        </p>
      </div>
      
      <div className="success-details">
        {isAlreadyVerified ? (
          <>
            <div className="success-item">
              <CheckCircle className="icon" />
              <span>Profile verified on {verificationData?.verifiedAt ? new Date(verificationData.verifiedAt).toLocaleDateString() : 'Unknown date'}</span>
            </div>
            <div className="success-item">
              <CheckCircle className="icon" />
              <span>Verification method: {verificationData?.verificationMethod || 'Unknown'}</span>
            </div>
            <div className="success-item">
              <CheckCircle className="icon" />
              <span>Status: {verificationData?.verificationStatus || 'Unknown'}</span>
            </div>
          </>
        ) : (
          <>
            <div className="success-item">
              <CheckCircle className="icon" />
              <span>Photo uploaded successfully</span>
            </div>
            <div className="success-item">
              <CheckCircle className="icon" />
              <span>Aadhar number verified</span>
            </div>
            <div className="success-item">
              <CheckCircle className="icon" />
              <span>Verification submitted for review</span>
            </div>
          </>
        )}
      </div>
    </div>
  );

  return (
    <div className="profile-auth-container">
      <div className="auth-header">
        <button className="back-button" onClick={onBack}>
          ← Back
        </button>
        <h1>Profile Authentication</h1>
        <div className="step-indicator">
          <div className={`step ${step >= 1 ? 'active' : ''}`}>1</div>
          <div className={`step ${step >= 2 ? 'active' : ''}`}>2</div>
          <div className={`step ${step >= 3 ? 'active' : ''}`}>3</div>
          <div className={`step ${step >= 4 ? 'active' : ''}`}>4</div>
        </div>
      </div>

      <div className="auth-content">
        {error && (
          <div className="error-message">
            <AlertCircle className="icon" />
            {error}
          </div>
        )}

        {success && (
          <div className="success-message">
            <CheckCircle className="icon" />
            {success}
          </div>
        )}

        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
        {step === 4 && renderStep4()}

        <div className="auth-actions">
          {step < 4 && (
            <button 
              className="next-button"
              onClick={handleNext}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>
                  <div className="spinner"></div>
                  Processing...
                </>
              ) : (
                step === 3 ? 'Submit Verification' : 'Next'
              )}
            </button>
          )}
          
          {step === 4 && (
            <button 
              className="complete-button"
              onClick={handleComplete}
            >
              Complete
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileAuth;
