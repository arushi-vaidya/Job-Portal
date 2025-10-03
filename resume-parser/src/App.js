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
      <div className="app-container">
        <nav className="navbar">
          <div className="navbar-left">
            <div className="logo">
              <span>Job Portal.AI</span>
            </div>       
          </div>
          <div class="nav-center">
              <a href="#" title="Home">Home</a>
              <a href="#" title="Your AI job scout - Jobs tailored just for you" className="nav-tooltip">Recommendations</a>
              <a href="#" title="AI Resume Analyzer - One click to a perfect, ATS-friendly resume. " className="nav-tooltip" onClick={(e) => { e.preventDefault(); setActivePage('app'); }}>ParsePort</a>
              <a href="#" title="Level up with personalized growth paths. Courses & certifications that unlock your next job" className="nav-tooltip">Career Copilot</a>
          </div>
          <div className="nav-right">
            {currentUser && (
              <div className="profile-button-container">
                <button className="profile-button-main">
                  <User className="button-icon" />
                  <span className="profile-name">{currentUser.name}</span>
                  {isProfileAuthenticated ? (
                    <span className="verified-tick">✓</span>
                  ) : (
                    <span className="unverified-cross">✗</span>
                  )}
                </button>
                <div className="profile-dropdown">
                  <div className="dropdown-item">
                    <span className="dropdown-label">ID:</span>
                    <span className="dropdown-value">{currentUser.userId}</span>
                  </div>
                  <div className="dropdown-item" onClick={handleViewResume}>
                    <span className="dropdown-label">View Info</span>
                  </div>
                  <div className="dropdown-item" onClick={() => setActivePage('profile')}>
                    <span className="dropdown-label">Profile</span>
                  </div>
                  <div className="dropdown-item logout-item" onClick={handleLogout}>
                    <span className="dropdown-label">Logout</span>
                  </div>
                </div>
              </div>
            )}
          </div>
          <div className="hamburger" onClick={() => {}}>
            <span></span>
            <span></span>
            <span></span>
          </div>
        </nav>
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
      </div>
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
      <div className="app-container">
        <nav className="navbar">
          <div className="navbar-left">
            <div className="logo">
              <span>Job Portal.AI</span>
            </div>       
          </div>
          <div class="nav-center">
              <a href="#" title="Home">Home</a>
              <a href="#" title="Your AI job scout - Jobs tailored just for you" className="nav-tooltip">Recommendations</a>
              <a href="#" title="AI Resume Analyzer - One click to a perfect, ATS-friendly resume. " className="nav-tooltip" onClick={(e) => { e.preventDefault(); setActivePage('app'); }}>ParsePort</a>
              <a href="#" title="Level up with personalized growth paths. Courses & certifications that unlock your next job" className="nav-tooltip">Career Copilot</a>
          </div>
          <div className="nav-right">
            {currentUser && (
              <div className="profile-button-container">
                <button className="profile-button-main">
                  <User className="button-icon" />
                  <span className="profile-name">{currentUser.name}</span>
                  {isProfileAuthenticated ? (
                    <span className="verified-tick">✓</span>
                  ) : (
                    <span className="unverified-cross">✗</span>
                  )}
                </button>
                <div className="profile-dropdown">
                  <div className="dropdown-item">
                    <span className="dropdown-label">ID:</span>
                    <span className="dropdown-value">{currentUser.userId}</span>
                  </div>
                  <div className="dropdown-item" onClick={handleViewResume}>
                    <span className="dropdown-label">View Info</span>
                  </div>
                  <div className="dropdown-item" onClick={() => setActivePage('profile')}>
                    <span className="dropdown-label">Profile</span>
                  </div>
                  <div className="dropdown-item logout-item" onClick={handleLogout}>
                    <span className="dropdown-label">Logout</span>
                  </div>
                </div>
              </div>
            )}
          </div>
          <div className="hamburger" onClick={() => {}}>
            <span></span>
            <span></span>
            <span></span>
          </div>
        </nav>
        <AccountViewPage 
          resume={accountResume}
          onBack={() => setActivePage('app')}
          onEdit={handleEditResume}
          isAuthenticated={isProfileAuthenticated}
        />
      </div>
    );
  }
    
    return (
    <div className="app-container">
      <nav className="navbar">
        <div className="navbar-left">
          <div className="logo">
            <span>Job Portal.AI</span>
          </div>       
        </div>
        <div class="nav-center">
            <a href="#" title="Home">Home</a>
            <a href="#" title="Your AI job scout - Jobs tailored just for you" className="nav-tooltip">Recommendations</a>
            <a href="#" title="AI Resume Analyzer - One click to a perfect, ATS-friendly resume. " className="nav-tooltip" onClick={(e) => { e.preventDefault(); setActivePage('app'); }}>ParsePort</a>
            <a href="#" title="Level up with personalized growth paths. Courses & certifications that unlock your next job" className="nav-tooltip">Career Copilot</a>
        </div>
        <div className="nav-right">
          {currentUser && (
            <div className="profile-button-container">
              <button class="cta-nav" >
                <span className="profile-name">{currentUser.name}</span>
                {isProfileAuthenticated ? (
                  <span className="verified-tick">  ✓</span>
                ) : (
                  <span className="unverified-cross"> ✗</span>
                )}
              </button>
              <div className="profile-dropdown">
                <div className="dropdown-item">
                  <span className="dropdown-label">ID:</span>
                  <span className="dropdown-value">{currentUser.userId}</span>
                </div>

                <div className="dropdown-item" onClick={handleViewResume}>
                  <span className="dropdown-label">View Info</span>
                </div>

                <div className="dropdown-item" onClick={() => setActivePage('profile')}>
                  <span className="dropdown-label">Profile</span>
                </div>

                <div className="dropdown-item logout-item" onClick={handleLogout}>
                  <span className="dropdown-label">Logout</span>
                </div>
              </div>

            </div>
          )}
        </div>
        <div className="hamburger" onClick={() => {}}>
          <span></span>
          <span></span>
          <span></span>
        </div>
      </nav>

      

        <ResumeParser
              editorIntent={editorIntent}
              clearIntent={clearEditorIntent}
              isAuthenticated={isProfileAuthenticated}
            />
    </div>
  );
};

export default App;
