import React, { useState, useEffect } from 'react';
import { RefreshCw, User, Star, FileText, CheckCircle, Shield } from 'lucide-react';
import apiService from '../services/api';
import ProfileCompletionDetails from './ProfileCompletionDetails';

// Function to calculate profile completeness based on resume data
const calculateProfileCompleteness = (resumeData) => {
  if (!resumeData) return 0;
  
  let score = 0;
  let totalFields = 0;
  
  // Basic Information (30 points)
  const basicInfoFields = ['name', 'email', 'phone', 'location'];
  basicInfoFields.forEach(field => {
    totalFields++;
    if (resumeData.personalInfo?.[field] && resumeData.personalInfo[field].trim()) {
      score++;
    }
  });
  
  // Professional Experience (25 points)
  totalFields++;
  if (resumeData.experience && resumeData.experience.length > 0) {
    score++;
  }
  
  // Education (20 points)
  totalFields++;
  if (resumeData.education && resumeData.education.length > 0) {
    score++;
  }
  
  // Skills (10 points)
  totalFields++;
  if (resumeData.skills && resumeData.skills.length > 0) {
    score++;
  }
  
  // Additional Information (15 points)
  const additionalFields = ['linkedinLink', 'githubLink', 'hometown', 'currentLocation'];
  additionalFields.forEach(field => {
    totalFields++;
    if (resumeData.personalInfo?.[field] && resumeData.personalInfo[field].trim()) {
      score++;
    }
  });
  
  return Math.round((score / totalFields) * 100);
};

const ProfilePage = ({ user, profile, onBack, onViewResume, onRefresh, onAuthenticate, isAuthenticated, onVerificationCheck }) => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [resumeData, setResumeData] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Check verification status first
        if (onVerificationCheck) {
          await onVerificationCheck();
        }
        
        // Load analytics
        const analyticsResponse = await apiService.makeRequest('/analytics');
        setAnalytics(analyticsResponse.data);
        
        // Load resume data for completeness calculation
        const resumeResponse = await apiService.getResumes({ limit: 1 });
        const items = resumeResponse?.data || [];
        if (items.length > 0) {
          const resume = items[0];
          const id = resume._id || resume.id;
          if (id) {
            const fullResume = await apiService.getResumeById(id);
            setResumeData(fullResume?.data || resume);
          }
        }
      } catch (error) {
        console.error('Failed to load data:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [onVerificationCheck]);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getCompletenessColor = (percentage) => {
    if (percentage >= 80) return '#10b981'; // Green
    if (percentage >= 60) return '#f59e0b'; // Orange
    return '#ef4444'; // Red
  };

  const getCompletenessStatus = (percentage) => {
    if (percentage >= 80) return 'Complete';
    if (percentage >= 60) return 'Good';
    if (percentage >= 40) return 'Fair';
    return 'Needs Work';
  };

  const handleRefresh = async () => {
    setLoading(true);
    try {
      // Load analytics
      const analyticsResponse = await apiService.makeRequest('/analytics');
      setAnalytics(analyticsResponse.data);
      
      // Load resume data for completeness calculation
      const resumeResponse = await apiService.getResumes({ limit: 1 });
      const items = resumeResponse?.data || [];
      if (items.length > 0) {
        const resume = items[0];
        const id = resume._id || resume.id;
        if (id) {
          const fullResume = await apiService.getResumeById(id);
          setResumeData(fullResume?.data || resume);
        }
      }
    } catch (error) {
      console.error('Failed to refresh profile:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="profile-page">
      <div className="profile-header">
        <button className="back-button" onClick={onBack}>← Back</button>
        <div className="profile-title-section">
          <div className="profile-title-with-status">
            <h2>User Profile</h2>
            {isAuthenticated && (
              <div className="auth-status-badge">
                <CheckCircle className="icon" />
                <span>Verified</span>
              </div>
            )}
          </div>
          <button className="refresh-button" onClick={handleRefresh} title="Refresh Profile">
            <RefreshCw className="button-icon" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="profile-loading">
          <div className="spinner"></div>
          <p>Loading profile data...</p>
        </div>
      ) : (
        <div className="profile-content">
          {/* Main Profile Card */}
          <div className="profile-main-card">
            <div className="profile-avatar">
              <User className="avatar-icon" />
            </div>
            <div className="profile-basic-info">
              <h3 className="profile-name">{user?.name}</h3>
              <p className="profile-email">{user?.email}</p>
              <div className="profile-user-id">
                <span className="user-id-label">User ID:</span>
                <span className="user-id-value">{user?.userId}</span>
                <button 
                  className="copy-id-button"
                  onClick={() => {
                    navigator.clipboard.writeText(user?.userId);
                    // Could add toast notification here
                  }}
                  title="Copy User ID"
                >
                  📋
                </button>
              </div>
            </div>
          </div>

          {/* Profile Stats */}
          <div className="profile-stats-grid">
            <div className="stat-card">
              <div className="stat-icon">
                <Star className="icon" />
              </div>
              <div className="stat-content">
                <div className="stat-value">{calculateProfileCompleteness(resumeData)}%</div>
                <div className="stat-label">Profile Complete</div>
                <div 
                  className="stat-status"
                  style={{ color: getCompletenessColor(calculateProfileCompleteness(resumeData)) }}
                >
                  {getCompletenessStatus(calculateProfileCompleteness(resumeData))}
                </div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">
                <FileText className="icon" />
              </div>
              <div className="stat-content">
                <div className="stat-actions">
                  {profile?.hasResume && (
                    <button 
                      className="view-resume-button"
                      onClick={() => onViewResume && onViewResume()}
                    >
                      View Resume
                    </button>
                  )}

                  {onAuthenticate && (
                    <button 
                      className={`auth-profile-button ${isAuthenticated ? 'authenticated' : ''}`}
                      onClick={onAuthenticate}
                    >
                      {isAuthenticated ? (
                        <>
                          <CheckCircle className="icon" />
                          Re-verify Profile
                        </>
                      ) : (
                        <>
                          <Shield className="icon" />
                          Verify Profile
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Profile Completeness Details */}
          <div className="profile-section">
            <h3>Profile Completeness</h3>
            {profile?.completionBreakdown ? (
              <ProfileCompletionDetails 
                completionBreakdown={profile.completionBreakdown} 
                nextSteps={profile.nextSteps || []}
              />
            ) : (
              <div className="completeness-details">
                <div className="completeness-bar-large">
                  <div 
                    className="completeness-fill-large" 
                    style={{ 
                      width: `${calculateProfileCompleteness(resumeData)}%`,
                      backgroundColor: getCompletenessColor(calculateProfileCompleteness(resumeData))
                    }}
                  ></div>
                </div>
                <div className="completeness-tips">
                  <h4>Ways to improve your profile:</h4>
                  <ul>
                    {!resumeData && <li>✨ Upload or create your resume</li>}
                    {calculateProfileCompleteness(resumeData) < 100 && <li>📝 Complete all resume sections</li>}
                    {calculateProfileCompleteness(resumeData) < 80 && <li>🔗 Add LinkedIn and GitHub links</li>}
                    {calculateProfileCompleteness(resumeData) < 60 && <li>💼 Add work experience details</li>}
                    {calculateProfileCompleteness(resumeData) < 40 && <li>🎓 Add education information</li>}
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
