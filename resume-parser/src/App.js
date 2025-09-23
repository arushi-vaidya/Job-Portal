/* eslint-disable react-hooks/rules-of-hooks */
import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { User } from 'lucide-react';
import './ResumeParser.css';
import apiService from './services/api';

// Import extracted components
import LoginView from './components/LoginView';
import ProfilePage from './components/ProfilePage';
import AccountViewPage from './components/AccountViewPage';
import ViewInfoButton from './components/ViewInfoButton';
import ResumeParser from './components/ResumeParser';
import ProfileAuth from './components/ProfileAuth';

const App = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [isAuthed, setIsAuthed] = useState(!!apiService.getToken());
  const [activePage, setActivePage] = useState('app'); // 'app' | 'view-info' | 'profile' | 'profile-auth'
  const [accountResume, setAccountResume] = useState(null);
  const [editorIntent, setEditorIntent] = useState(null); // { mode: 'edit' }
  const [isProfileAuthenticated, setIsProfileAuthenticated] = useState(false);
  const [verificationData, setVerificationData] = useState(null);

  // Helper function to update verification status from database
  const updateVerificationStatus = async () => {
    try {
      console.log('🔍 Fetching verification status from database...');
      const response = await apiService.getVerificationStatus();
      const verification = response.data?.verification;
      
      console.log('🔍 Verification data from database:', verification);
      
      if (verification?.isVerified && verification?.verificationStatus === 'approved') {
        console.log('✅ User is verified');
        setIsProfileAuthenticated(true);
        setVerificationData(verification);
      } else {
        console.log('❌ User is not verified');
        setIsProfileAuthenticated(false);
        setVerificationData(verification);
      }
    } catch (error) {
      console.error('Failed to fetch verification status:', error);
      setIsProfileAuthenticated(false);
      setVerificationData(null);
    }
  };

  useEffect(() => {
    const verify = async () => {
      if (!apiService.getToken() && window.location.hash.startsWith('#token=')) {
        const raw = window.location.hash.slice('#token='.length);
        const token = decodeURIComponent(raw);
        if (token) {
          apiService.setToken(token);
          window.history.replaceState(null, document.title, window.location.pathname + window.location.search);
        }
      }
      if (!apiService.getToken()) { 
        setIsAuthed(false); 
        return; 
      }
      try { 
        const userResponse = await apiService.me(); 
        setCurrentUser(userResponse.data); // Add this line
        setIsAuthed(true); 
      } catch (_) { 
        setIsAuthed(false); 
      }
    };
    verify();
  }, []);

  useEffect(() => {
    const loadUserProfile = async () => {
      if (isAuthed && currentUser) {
        try {
          const profileResponse = await apiService.makeRequest('/profile');
          setUserProfile(profileResponse.data);
          
          // Load verification status from database
          await updateVerificationStatus();
        } catch (error) {
          console.error('Failed to load user profile:', error);
        }
      }
    };
    loadUserProfile();
  }, [isAuthed, currentUser]);

  // Monitor verification status changes
  useEffect(() => {
    console.log(`🎯 Verification status changed to: ${isProfileAuthenticated}`);
  }, [isProfileAuthenticated]);

  const handleLogout = () => {
    apiService.clearToken();
    setIsAuthed(false);
    setCurrentUser(null);
    setUserProfile(null);
    setIsProfileAuthenticated(false);
    setVerificationData(null);
    setActivePage('app');
  };

  const handleLogin = (userData) => {
    setCurrentUser(userData);
    setIsAuthed(true);
  };

  const handleViewResume = async () => {
            try {
              const list = await apiService.getResumes({ limit: 1 });
              const items = list?.data || [];
              if (items.length > 0) {
        const resume = items[0];
        const id = resume._id || resume.id;
        if (id) {
                const full = await apiService.getResumeById(id);
          setAccountResume(full?.data || resume);
            setActivePage('view-info');
        }
      }
    } catch (error) {
      console.error('Failed to load resume:', error);
    }
  };

  const handleRefreshProfile = async () => {
    if (isAuthed && currentUser) {
      try {
        const profileResponse = await apiService.makeRequest('/profile');
        setUserProfile(profileResponse.data);
        
        // Update verification status from database
        await updateVerificationStatus();
      } catch (error) {
        console.error('Failed to refresh profile:', error);
      }
    }
  };

  const handleEditResume = () => {
    setEditorIntent({ mode: 'edit' });
    setActivePage('app');
  };

  const clearEditorIntent = () => {
    setEditorIntent(null);
  };

  if (!isAuthed) {
    return <LoginView onLoggedIn={handleLogin} />;
  }

  if (activePage === 'profile') {
    return (
      <ProfilePage
        user={currentUser}
        profile={userProfile}
        onBack={() => setActivePage('app')}
        onViewResume={handleViewResume}
        onRefresh={handleRefreshProfile}
        onAuthenticate={() => setActivePage('profile-auth')}
        isAuthenticated={isProfileAuthenticated}
        onVerificationCheck={updateVerificationStatus}
      />
    );
  }

  if (activePage === 'profile-auth') {
    return (
      <ProfileAuth
        onBack={() => setActivePage('profile')}
        onComplete={async (authData) => {
          console.log('Profile authentication completed:', authData);
          // Refresh verification status from database
          await updateVerificationStatus();
          // Refresh profile data to get updated verification status
          await handleRefreshProfile();
          setActivePage('profile');
        }}
      />
    );
  }

  if (activePage === 'view-info') {
    return (
      <AccountViewPage 
        resume={accountResume}
        onBack={() => setActivePage('app')}
        onEdit={handleEditResume}
        isAuthenticated={isProfileAuthenticated}
      />
    );
  }
    
    return (
    <div className="app-container">
      <div className="nav-content" style={{ paddingTop: 16 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginLeft: 'auto' }}>
          {currentUser && (
            <div className="user-profile-info">
              <div className="user-id-badge">
                <User className="user-icon" />
                <span className="user-id-text">ID: {currentUser.userId}</span>
          </div>
              <div className="user-name-text">{currentUser.name}</div>
              <div className="verification-debug" style={{fontSize: '12px', color: '#666'}}>
                {isProfileAuthenticated ? '✅ Verified' : '❌ Not Verified'}
              </div>
              </div>
          )}
          <ViewInfoButton onOpen={async () => {
            // Load full resume before navigating to view page
            try {
              const list = await apiService.getResumes({ limit: 1 });
              const items = list?.data || [];
              if (items.length > 0) {
                const resume = items[0];
                const id = resume._id || resume.id;
                if (id) {
                  const full = await apiService.getResumeById(id);
                  setAccountResume(full?.data || resume);
                  setActivePage('view-info');
                }
              }
    } catch (error) {
              console.error('Failed to load resume:', error);
            }
          }} />
            <button
            className="profile-button"
            onClick={() => setActivePage('profile')}
            title="View Profile"
          >
            <User className="button-icon" />
            Profile
            </button>
            <button
            className="logout-button"
            onClick={handleLogout}
            title="Logout"
          >
            Logout
            </button>
          </div>
        </div>

            <ResumeParser
              editorIntent={editorIntent}
              clearIntent={clearEditorIntent}
              isAuthenticated={isProfileAuthenticated}
            />
    </div>
  );
};

export default App;
