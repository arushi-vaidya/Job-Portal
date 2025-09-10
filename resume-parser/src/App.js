/* eslint-disable react-hooks/rules-of-hooks */
import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { Upload, Download, Eye, Menu, X, Edit3, Save, Plus, Trash2, FileText, RefreshCw, Database, CheckCircle, User, Star, Calendar, Award } from 'lucide-react';import './ResumeParser.css';
import apiService from './services/api';

const LoginView = ({ onLoggedIn }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = mode === 'login'
        ? await apiService.login(email, password)
        : await apiService.register(name, email, password);
      if (res?.success) {
  onLoggedIn(res.data.user); // Pass user data instead of just calling onLoggedIn()
} else {
        setError(res?.message || 'Something went wrong');
      }
    } catch (err) {
      setError(err?.message || 'Failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h2 className="login-title">{mode === 'login' ? 'Welcome back' : 'Create your account'}</h2>
        <p className="login-subtitle">Sign in to manage your single resume profile</p>
        <form onSubmit={handleSubmit} className="login-form">
          {mode === 'register' && (
            <div className="form-row">
              <label>Name</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" required />
            </div>
          )}
          <div className="form-row">
            <label>Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
          </div>
          <div className="form-row">
            <label>Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required />
          </div>
          {error && <div className="form-error">{error}</div>}
          <button className="login-button" type="submit" disabled={loading}>
            {loading ? 'Please wait…' : (mode === 'login' ? 'Sign In' : 'Create Account')}
          </button>
        </form>
        <div className="login-toggle">
          {mode === 'login' ? (
            <span>New here? <button className="link-button" onClick={() => setMode('register')}>Create an account</button></span>
          ) : (
            <span>Already have an account? <button className="link-button" onClick={() => setMode('login')}>Sign in</button></span>
          )}
        </div>
      </div>
    </div>
  );
};

const ProfilePage = ({ user, profile, onBack, onRefresh }) => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        const analyticsResponse = await apiService.makeRequest('/analytics');
        setAnalytics(analyticsResponse.data);
      } catch (error) {
        console.error('Failed to load analytics:', error);
      } finally {
        setLoading(false);
      }
    };
    loadAnalytics();
  }, []);

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

  return (
    <div className="profile-page">
      <div className="profile-header">
        <button className="back-button" onClick={onBack}>← Back</button>
        <div className="profile-title-section">
          <h2>User Profile</h2>
          <button className="refresh-button" onClick={onRefresh} title="Refresh Profile">
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
                <div className="stat-value">{profile?.profileCompleteness || 0}%</div>
                <div className="stat-label">Profile Complete</div>
                <div 
                  className="stat-status"
                  style={{ color: getCompletenessColor(profile?.profileCompleteness || 0) }}
                >
                  {getCompletenessStatus(profile?.profileCompleteness || 0)}
                </div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">
                <FileText className="icon" />
              </div>
              <div className="stat-content">
                <div className="stat-value">{profile?.hasResume ? '1' : '0'}</div>
                <div className="stat-label">Resume Created</div>
                <div className="stat-status">
                  {profile?.hasResume ? 'Active' : 'None'}
                </div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">
                <Calendar className="icon" />
              </div>
              <div className="stat-content">
                <div className="stat-value">
                  {profile?.joinedDate ? formatDate(profile.joinedDate).split(',')[0] : 'Unknown'}
                </div>
                <div className="stat-label">Member Since</div>
                <div className="stat-status">
                  {profile?.joinedDate ? formatDate(profile.joinedDate) : 'Unknown'}
                </div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">
                <Award className="icon" />
              </div>
              <div className="stat-content">
                <div className="stat-value">
                  {Math.floor((new Date() - new Date(profile?.joinedDate || new Date())) / (1000 * 60 * 60 * 24))}
                </div>
                <div className="stat-label">Days Active</div>
                <div className="stat-status">
                  Last login: {profile?.lastLoginDate ? new Date(profile.lastLoginDate).toLocaleDateString() : 'Today'}
                </div>
              </div>
            </div>
          </div>

          {/* Profile Completeness Details */}
          <div className="profile-section">
            <h3>Profile Completeness</h3>
            <div className="completeness-details">
              <div className="completeness-bar-large">
                <div 
                  className="completeness-fill-large" 
                  style={{ 
                    width: `${profile?.profileCompleteness || 0}%`,
                    backgroundColor: getCompletenessColor(profile?.profileCompleteness || 0)
                  }}
                ></div>
              </div>
              <div className="completeness-tips">
                <h4>Ways to improve your profile:</h4>
                <ul>
                  {!profile?.hasResume && <li>✨ Upload or create your resume</li>}
                  {(profile?.profileCompleteness || 0) < 100 && <li>📝 Complete all resume sections</li>}
                  {(profile?.profileCompleteness || 0) < 80 && <li>🔗 Add LinkedIn and GitHub links</li>}
                  {(profile?.profileCompleteness || 0) < 60 && <li>💼 Add work experience details</li>}
                  {(profile?.profileCompleteness || 0) < 40 && <li>🎓 Add education information</li>}
                </ul>
              </div>
            </div>
          </div>

          {/* Analytics Section */}
          {analytics && (
            <div className="profile-section">
              <h3>Account Analytics</h3>
              <div className="analytics-grid">
                <div className="analytics-item">
                  <span className="analytics-label">Total Users:</span>
                  <span className="analytics-value">{analytics.globalStats?.totalUsers || 0}</span>
                </div>
                <div className="analytics-item">
                  <span className="analytics-label">Total Resumes:</span>
                  <span className="analytics-value">{analytics.globalStats?.totalResumes || 0}</span>
                </div>
                <div className="analytics-item">
                  <span className="analytics-label">New This Month:</span>
                  <span className="analytics-value">{analytics.globalStats?.resumesThisMonth || 0}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const App = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [isAuthed, setIsAuthed] = useState(!!apiService.getToken());
const [activePage, setActivePage] = useState('app'); // 'app' | 'view-info' | 'profile'
  const [accountResume, setAccountResume] = useState(null);
  const [editorIntent, setEditorIntent] = useState(null); // { mode: 'edit' }

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
        } catch (error) {
          console.error('Failed to load user profile:', error);
        }
      }
    };
    loadUserProfile();
  }, [isAuthed, currentUser]);

  const handleLogout = () => {
    apiService.clearToken();
    setIsAuthed(false);
    setActivePage('app');
    setAccountResume(null);
    setCurrentUser(null);        // Add this line
    setUserProfile(null);        // Add this line
  };

  if (!isAuthed) {
    // If a token is present in the hash, let the effect handle it before redirecting
    if (typeof window !== 'undefined' && window.location.hash && window.location.hash.startsWith('#token=')) {
      return null;
    }
    // Redirect unauthenticated users to external auth page
    window.location.href = (window.AUTH_LOGIN_URL || 'http://localhost:5173') || '/auth';
    return null;
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
            {userProfile && (
              <div className="profile-completeness">
                <div className="completeness-bar">
                  <div 
                    className="completeness-fill" 
                    style={{ width: `${userProfile.profileCompleteness}%` }}
                  ></div>
                </div>
                <span className="completeness-text">{userProfile.profileCompleteness}%</span>
              </div>
            )}
          </div>
        )}
          <ViewInfoButton onOpen={async () => {
            // Load full resume before navigating to view page
            try {
              const list = await apiService.getResumes({ limit: 1 });
              const items = list?.data || [];
              if (items.length > 0) {
                const id = items[0]._id || items[0].id;
                const full = await apiService.getResumeById(id);
                setAccountResume(full?.data || items[0]);
              } else {
                setAccountResume(null);
              }
            } catch (_) { setAccountResume(null); }
            setActivePage('view-info');
          }} />
          <button 
          className="profile-button" 
          onClick={() => setActivePage('profile')}
          title="View Profile"
        >
          <User className="button-icon" />
          Profile
        </button>
          <button className="logout-button" onClick={handleLogout}>Sign out</button>
        </div>
      </div>
      {activePage === 'app' ? (
  <ResumeParser editorIntent={editorIntent} clearIntent={() => setEditorIntent(null)} />
) : activePage === 'profile' ? (
  <ProfilePage 
    user={currentUser} 
    profile={userProfile} 
    onBack={() => setActivePage('app')}
    onRefresh={async () => {
      try {
        const profileResponse = await apiService.makeRequest('/profile');
        setUserProfile(profileResponse.data);
      } catch (error) {
        console.error('Failed to refresh profile:', error);
      }
    }}
  />
) : (
        <AccountViewPage resume={accountResume} onBack={() => setActivePage('app')} onEdit={() => { setEditorIntent({ mode: 'edit' }); setActivePage('app'); }} />
      )}
    </div>
  );
};

const ViewInfoButton = ({ onOpen }) => (
  <div className="view-info">
    <button className="view-info-button" onClick={onOpen}>View Info</button>
  </div>

);



const AccountViewPage = ({ resume, onBack, onEdit }) => {
  const data = React.useMemo(() => normalizeAccountResume(resume), [resume]);
  return (
    <div className="account-page">
      <div className="account-header">
        <button className="back-button" onClick={onBack}>← Back</button>
        <h2>Account • View Info</h2>
        <div style={{ marginLeft: 'auto' }}>
          <button className="edit-button" onClick={onEdit}>Edit</button>
        </div>
      </div>
      {!data ? (
        <div className="account-empty">No resume found for this account.</div>
      ) : (
        <div className="account-content">
          <section className="account-section">
            <h3>Personal Info</h3>
            <div className="kv"><span>Name</span><span>{data.personalInfo.name}</span></div>
            <div className="kv"><span>Email</span><span>{data.personalInfo.email}</span></div>
            <div className="kv"><span>Phone</span><span>{data.personalInfo.phone}</span></div>
            <div className="kv"><span>Location</span><span>{data.personalInfo.location}</span></div>
            <div className="kv"><span>Bio</span><span>{data.personalInfo.bio}</span></div>
            <div className="kv"><span>LinkedIn</span><span>{data.personalInfo.linkedinLink}</span></div>
            <div className="kv"><span>GitHub</span><span>{data.personalInfo.githubLink}</span></div>
            <div className="kv"><span>Hometown</span><span>{data.personalInfo.hometown}</span></div>
            <div className="kv"><span>Current Location</span><span>{data.personalInfo.currentLocation}</span></div>
            {data.personalInfo.hobbies.length > 0 && (
              <div className="kv"><span>Hobbies</span><span>{data.personalInfo.hobbies.join(', ')}</span></div>
            )}
          </section>

          <section className="account-section">
            <h3>Experience</h3>
            {data.experience.length === 0 ? <div className="empty">No entries</div> : data.experience.map((e, i) => (
              <div className="entry" key={`exp-${i}`}>
                <div className="entry-header">
                  <div className="entry-title">{e.position} @ {e.company}</div>
                  <div className="entry-sub">{e.duration}</div>
                </div>
                {e.description?.length > 0 && (
                  <ul>{e.description.map((d, idx) => <li key={idx}>{d}</li>)}</ul>
                )}
              </div>
            ))}
          </section>

          <section className="account-section">
            <h3>Education</h3>
            {data.education.length === 0 ? <div className="empty">No entries</div> : data.education.map((ed, i) => (
              <div className="entry" key={`edu-${i}`}>
                <div className="entry-header">
                  <div className="entry-title">{ed.degree} • {ed.institution}</div>
                  <div className="entry-sub">{ed.year}</div>
                </div>
                {ed.description?.length > 0 && (
                  <ul>{ed.description.map((d, idx) => <li key={idx}>{d}</li>)}</ul>
                )}
              </div>
            ))}
          </section>

          <section className="account-section">
            <h3>Projects</h3>
            {data.projects.length === 0 ? <div className="empty">No entries</div> : data.projects.map((p, i) => (
              <div className="entry" key={`proj-${i}`}>
                <div className="entry-title">{p.title}</div>
                {p.description?.length > 0 && (
                  <ul>{p.description.map((d, idx) => <li key={idx}>{d}</li>)}</ul>
                )}
              </div>
            ))}
          </section>

          <section className="account-section">
            <h3>Achievements</h3>
            {data.achievements.length === 0 ? <div className="empty">No entries</div> : data.achievements.map((a, i) => (
              <div className="entry" key={`ach-${i}`}>
                <div className="entry-title">{a.title}</div>
                {a.description?.length > 0 && (
                  <ul>{a.description.map((d, idx) => <li key={idx}>{d}</li>)}</ul>
                )}
              </div>
            ))}
          </section>

          <section className="account-section">
            <h3>Certificates</h3>
            {data.certificates.length === 0 ? <div className="empty">No entries</div> : data.certificates.map((c, i) => (
              <div className="entry" key={`cert-${i}`}>
                <div className="entry-header">
                  <div className="entry-title">{c.title}</div>
                  <div className="entry-sub">{c.issuer} • {c.year}</div>
                </div>
                {c.description?.length > 0 && (
                  <ul>{c.description.map((d, idx) => <li key={idx}>{d}</li>)}</ul>
                )}
              </div>
            ))}
          </section>

          <section className="account-section">
            <h3>Skills</h3>
            {data.skills.length === 0 ? <div className="empty">No entries</div> : (
              <div className="chips">{data.skills.map((s, i) => <span className="chip" key={`skill-${i}`}>{s}</span>)}</div>
            )}
          </section>

          <section className="account-section">
            <h3>Additional Information</h3>
            {data.additionalInformation.length === 0 ? <div className="empty">No entries</div> : (
              <ul>{data.additionalInformation.map((d, i) => <li key={`add-${i}`}>{d}</li>)}</ul>
            )}
          </section>
        </div>
      )}
    </div>
  );
};

function normalizeAccountResume(r) {
  if (!r) return null;
  return {
    personalInfo: {
      name: r?.personalInfo?.name || '-',
      email: r?.personalInfo?.email || '-',
      phone: r?.personalInfo?.phone || '-',
      location: r?.personalInfo?.location || '-',
      bio: r?.personalInfo?.bio || '-',
      linkedinLink: r?.personalInfo?.linkedinLink || '-',
      githubLink: r?.personalInfo?.githubLink || '-',
      hometown: r?.personalInfo?.hometown || '-',
      currentLocation: r?.personalInfo?.currentLocation || '-',
      hobbies: Array.isArray(r?.personalInfo?.hobbies) ? r.personalInfo.hobbies : []
    },
    experience: Array.isArray(r?.experience) ? r.experience : [],
    education: Array.isArray(r?.education) ? r.education : [],
    projects: Array.isArray(r?.projects) ? r.projects : [],
    achievements: Array.isArray(r?.achievements) ? r.achievements : [],
    certificates: Array.isArray(r?.certificates) ? r.certificates : [],
    skills: Array.isArray(r?.skills) ? r.skills : [],
    additionalInformation: Array.isArray(r?.additionalInformation) ? r.additionalInformation : [],
  };
}

const ResumeParser = ({ editorIntent, clearIntent }) => {
  const [parsedData, setParsedData] = useState(null);
  const [editableData, setEditableData] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [activeView, setActiveView] = useState('upload');
  const [aiStatus, setAiStatus] = useState('checking');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [manualMode, setManualMode] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [aiProcessingComplete, setAiProcessingComplete] = useState(false);
  const [aiProcessingError, setAiProcessingError] = useState(null);
  const [extractedText, setExtractedText] = useState('');
  const [showProcessingPopup, setShowProcessingPopup] = useState(false);
  const [showAdditionalInfoPopup, setShowAdditionalInfoPopup] = useState(false);
  const [additionalInfo, setAdditionalInfo] = useState({
    currentSalary: '',
    linkedinLink: '',
    githubLink: '',
    hometown: '',
    currentLocation: '',
    hobbies: []
  });

  // New state for database integration
  const [dbStatus, setDbStatus] = useState('checking'); // 'checking', 'connected', 'disconnected'
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null); // null, 'success', 'error'
  const [saveMessage, setSaveMessage] = useState('');
  const [showSaveConfirmation, setShowSaveConfirmation] = useState(false);
  
  // Safari detection
  const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

  const checkDatabaseStatus = async () => {
    try {
      await apiService.checkHealth();
      setDbStatus('connected');
      console.log('Database connection successful');
    } catch (error) {
      console.error('Database connection failed:', error);
      setDbStatus('disconnected');
    }
  };

  // Check database status on mount
  useEffect(() => {
    checkDatabaseStatus();
  }, []);

  // Load existing resume for current user on mount
  useEffect(() => {
    const loadExisting = async () => {
      try {
        const response = await apiService.getResumes({ limit: 1 });
        const items = response?.data || [];
        if (!Array.isArray(items) || items.length === 0) return;

        const summary = items[0];
        const id = summary._id || summary.id;
        if (!id) return;

        const full = await apiService.getResumeById(id);
        const resume = normalizeResume(full?.data || summary);
        setParsedData(resume);
        setEditableData(resume);
        setActiveView('results');
      } catch (e) {
        // ignore if none exists or unauthorized
      }
    };
    loadExisting();
  }, []);

  const normalizeResume = (r) => {
    const safe = r || {};
    safe.personalInfo = safe.personalInfo || {};
    safe.experience = Array.isArray(safe.experience) ? safe.experience : [];
    safe.education = Array.isArray(safe.education) ? safe.education : [];
    safe.projects = Array.isArray(safe.projects) ? safe.projects : [];
    safe.achievements = Array.isArray(safe.achievements) ? safe.achievements : [];
    safe.certificates = Array.isArray(safe.certificates) ? safe.certificates : [];
    safe.skills = Array.isArray(safe.skills) ? safe.skills : [];
    safe.additionalInformation = Array.isArray(safe.additionalInformation) ? safe.additionalInformation : [];
    return safe;
  };

  useEffect(() => {
  // Auto-save when parsedData changes and database is connected
  const autoSave = async () => {
    if (parsedData && 
        parsedData.personalInfo?.name && 
        parsedData.personalInfo?.email && 
        dbStatus === 'connected' && 
        !isSaving && 
        !isEditing) {
      
      console.log('Auto-saving resume data...');
      
      try {
        setIsSaving(true);
        const response = await apiService.saveResume(parsedData);
        console.log('Auto-save successful:', response);
        
        // Optional: Show brief success indicator without popup
        setSaveStatus('success');
        setSaveMessage('Resume auto-saved');
        
        // Clear status after 2 seconds
        setTimeout(() => {
          setSaveStatus(null);
          setSaveMessage('');
        }, 2000);
        
      } catch (error) {
        console.error('Auto-save failed:', error);
        // Silently fail for auto-save, or show minimal notification
        setSaveStatus('error');
        setSaveMessage('Auto-save failed');
        
        setTimeout(() => {
          setSaveStatus(null);
          setSaveMessage('');
        }, 3000);
      } finally {
        setIsSaving(false);
      }
    }
  };

  // Debounce auto-save to avoid too frequent saves
  const timeoutId = setTimeout(autoSave, 1000);
  return () => clearTimeout(timeoutId);
}, [parsedData, dbStatus, isSaving, isEditing]);

  

  // Save to database function
  const saveToDatabase = async (dataToSave = null) => {
    const resumeData = dataToSave || parsedData;
    
    if (!resumeData) {
      alert('No resume data available to save.');
      return;
    }

    // Validate required fields
    if (!resumeData.personalInfo?.name || !resumeData.personalInfo?.email) {
      alert('Name and email are required to save to database.');
      return;
    }

    setIsSaving(true);
    setSaveStatus(null);
    setSaveMessage('');

    try {
      const response = await apiService.saveResume(resumeData);
      
      setSaveStatus('success');
      setSaveMessage(response.message || 'Resume saved successfully!');
      setShowSaveConfirmation(true);
      
      console.log('Resume saved to database:', response);
      
      // Auto-hide confirmation after 3 seconds
      setTimeout(() => {
        setShowSaveConfirmation(false);
      }, 3000);

    } catch (error) {
      console.error('Error saving to database:', error);
      setSaveStatus('error');
      setSaveMessage(error.message || 'Failed to save resume to database.');
      setShowSaveConfirmation(true);
      
      // Auto-hide error after 5 seconds
      setTimeout(() => {
        setShowSaveConfirmation(false);
      }, 5000);
    } finally {
      setIsSaving(false);
    }
  };

  // Enhanced save changes to include database save
  const handleSaveChanges = async () => {
  setParsedData(editableData);
  setIsEditing(false);
  setManualMode(false);
  
  // Don't manually save here - auto-save will handle it
  alert('Changes saved successfully!');
};

  // Enhanced save confirmation popup
  const SaveConfirmationPopup = useMemo(() => {
    if (!showSaveConfirmation) return null;
    
    return (
      <div className="popup-overlay">
        <div className="popup-content save-confirmation-popup">
          <div className="popup-header">
            <div className={`save-status-icon ${saveStatus}`}>
              {saveStatus === 'success' ? (
                <CheckCircle className="success-icon" />
              ) : (
                <X className="error-icon" />
              )}
            </div>
            <h3 className={`save-status-title ${saveStatus}`}>
              {saveStatus === 'success' ? 'Success!' : 'Error'}
            </h3>
            <p className="save-status-message">{saveMessage}</p>
          </div>
          
          <div className="popup-actions">
            <button 
              onClick={() => setShowSaveConfirmation(false)}
              className="close-button"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }, [showSaveConfirmation, saveStatus, saveMessage]);

  // Database status indicator
  const DatabaseStatusIndicator = () => {
    if (dbStatus === 'checking') return null;
    
    return (
      <div className={`db-status-indicator ${dbStatus}`}>
        <Database className="db-icon" />
        <span className="db-status-text">
          {dbStatus === 'connected' ? 'Database Connected' : 'Database Disconnected'}
        </span>
        {dbStatus === 'disconnected' && (
          <button 
            onClick={checkDatabaseStatus}
            className="retry-db-button"
            title="Retry connection"
          >
            <RefreshCw className="retry-icon" />
          </button>
        )}
      </div>
    );
  };
  
  // Safari-compatible button handlers
  const handleAddExperience = () => {
    console.log('=== HANDLE ADD EXPERIENCE CALLED ===');
    addNewItem('experience');
  };
  
  const handleRemoveSkill = (index) => {
    console.log('=== HANDLE REMOVE SKILL CALLED ===');
    console.log('Index to remove:', index);
    removeSkill(index);
  };

  const handleRemoveCertificate = (index) => {
    console.log('=== HANDLE REMOVE CERTIFICATE CALLED ===');
    console.log('Index to remove:', index);
    removeItem('certificates', index);
  };

  const handleRemoveAdditionalInfo = (index) => {
    console.log('=== HANDLE REMOVE ADDITIONAL INFO CALLED ===');
    console.log('Index to remove:', index);
    removeAdditionalInfo(index);
  };

  const handleAddEducation = () => {
    console.log('=== HANDLE ADD EDUCATION CALLED ===');
    addNewItem('education');
  };
  
  const handleAddProject = () => {
    console.log('=== HANDLE ADD PROJECT CALLED ===');
    addNewItem('projects');
  };
  
  const handleAddAchievement = () => {
    console.log('=== HANDLE ADD ACHIEVEMENT CALLED ===');
    addNewItem('achievements');
  };
  
  const handleAddCertificate = () => {
    console.log('=== HANDLE ADD CERTIFICATE CALLED ===');
    addNewItem('certificates');
  };
  
  const handleAddSkill = () => {
    console.log('=== HANDLE ADD SKILL CALLED ===');
    addNewSkill();
  };
  
  const handleAddAdditionalInfo = () => {
    console.log('=== HANDLE ADD ADDITIONAL INFO CALLED ===');
    addNewAdditionalInfo();
  };

  const handleAdditionalInfoSubmit = useCallback(() => {
  // Check if AI processing is still in progress
  if (isAiProcessing) {
    setShowAdditionalInfoPopup(false);
    setShowProcessingPopup(true);
    return;
  }

  // AI processing complete, proceed normally
  if (parsedData) {
    const updatedData = {
      ...parsedData,
      personalInfo: {
        ...parsedData.personalInfo,
        ...additionalInfo
      }
    };
    setParsedData(updatedData); // This will trigger auto-save
    setEditableData(updatedData);
  } else {
    // No AI data yet, create with additional info
    const dataWithAdditionalInfo = {
      ...createEmptyResume(),
      personalInfo: {
        ...createEmptyResume().personalInfo,
        ...additionalInfo
      }
    };
    setParsedData(dataWithAdditionalInfo); // This will trigger auto-save
    setEditableData(dataWithAdditionalInfo);
  }
  
  setShowAdditionalInfoPopup(false);
  setActiveView('results');
}, [parsedData, additionalInfo, isAiProcessing]);

  const ProcessingPopup = useMemo(() => {
    if (!showProcessingPopup) return null;
    
    return (
      <div className="popup-overlay">
        <div className="popup-content processing-popup">
          <div className="popup-header">
            <div className="spinner"></div>
            <h3>AI Processing in Progress</h3>
            <p>Please wait while we analyze your resume content...</p>
          </div>
          
          <div className="processing-status">
            {aiProcessingError ? (
              <div className="processing-error">
                <p>⚠️ AI processing encountered an issue: {aiProcessingError}</p>
                <p>You can continue editing manually, and the system will use your inputs.</p>
              </div>
            ) : (
              <div className="processing-info">
                <p>✨ We're extracting information from your resume</p>
                <p>📝 Organizing sections and formatting content</p>
                <p>🚀 Almost ready!</p>
              </div>
            )}
          </div>

          <div className="popup-actions">
            <button 
              onClick={() => {
                // Force proceed even if AI isn't done
                setShowProcessingPopup(false);
                
                if (!parsedData) {
                  // Create basic structure with additional info
                  const basicData = {
                    ...createEmptyResume(),
                    personalInfo: {
                      ...createEmptyResume().personalInfo,
                      ...additionalInfo
                    }
                  };
                  setParsedData(basicData);
                  setEditableData(basicData);
                } else {
                  // Update existing data with additional info
                  const updatedData = {
                    ...parsedData,
                    personalInfo: {
                      ...parsedData.personalInfo,
                      ...additionalInfo
                    }
                  };
                  setParsedData(updatedData);
                  setEditableData(updatedData);
                }
                
                setActiveView('results');
              }}
              className="continue-button"
            >
              Continue Anyway
            </button>
            
            <button 
              onClick={() => {
                setShowProcessingPopup(false);
                setShowAdditionalInfoPopup(true);
              }}
              className="wait-button"
            >
              Wait & Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }, [showProcessingPopup, aiProcessingError, parsedData, additionalInfo]);

  useEffect(() => {
  if (aiProcessingComplete && showProcessingPopup) {
    // AI processing finished while user was waiting
    setTimeout(() => {
      setShowProcessingPopup(false);
      
      if (parsedData) {
        const updatedData = {
          ...parsedData,
          personalInfo: {
            ...parsedData.personalInfo,
            ...additionalInfo
          }
        };
        setParsedData(updatedData); // This will trigger auto-save
        setEditableData(updatedData);
      }
      
      setActiveView('results');
    }, 1000);
  }
}, [aiProcessingComplete, showProcessingPopup, parsedData, additionalInfo]);


  // Processing status indicator in the main UI
  const ProcessingIndicator = () => {
    if (!isAiProcessing && !aiProcessingComplete) return null;
    
    return (
      <div className="processing-indicator">
        {isAiProcessing ? (
          <div className="processing-active">
            <div className="mini-spinner"></div>
            <span>AI analyzing resume...</span>
          </div>
        ) : null}
      </div>
    );
  };

  const handleSkipAdditionalInfo = useCallback(() => {
    setShowAdditionalInfoPopup(false);
    setActiveView('results');
  }, []);

  const updateAdditionalInfo = useCallback((field, value) => {
    setAdditionalInfo(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  const addHobby = useCallback(() => {
    setAdditionalInfo(prev => ({
      ...prev,
      hobbies: [...prev.hobbies, '']
    }));
  }, []);

  const updateHobby = useCallback((index, value) => {
    setAdditionalInfo(prev => ({
      ...prev,
      hobbies: prev.hobbies.map((hobby, i) => i === index ? value : hobby)
    }));
  }, []);

  const removeHobby = useCallback((index) => {
    setAdditionalInfo(prev => ({
      ...prev,
      hobbies: prev.hobbies.filter((_, i) => i !== index)
    }));
  }, []);

  // Additional Info Popup Component
  const AdditionalInfoPopup = useMemo(() => {
    if (!showAdditionalInfoPopup) return null;
    
    return (
      <div className="popup-overlay">
        <div className="popup-content">
          <div className="popup-header">
            <h3>Complete Your Profile</h3>
            <p>Add some additional information to enhance your resume</p>
          </div>
          
          <div className="popup-form">
            <div className="form-row">
              <div className="form-group">
                <label>Current Salary</label>
                <input
                  type="text"
                  value={additionalInfo.currentSalary}
                  onChange={(e) => updateAdditionalInfo('currentSalary', e.target.value)}
                  placeholder="e.g., $75,000 or ₹12 LPA"
                  className="popup-input"
                />
              </div>
              <div className="form-group">
                <label>Hometown</label>
                <input
                  type="text"
                  value={additionalInfo.hometown}
                  onChange={(e) => updateAdditionalInfo('hometown', e.target.value)}
                  placeholder="e.g., Mumbai, Maharashtra"
                  className="popup-input"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Current Location</label>
                <input
                  type="text"
                  value={additionalInfo.currentLocation}
                  onChange={(e) => updateAdditionalInfo('currentLocation', e.target.value)}
                  placeholder="e.g., Bengaluru, Karnataka"
                  className="popup-input"
                />
              </div>
              <div className="form-group">
                <label>LinkedIn Profile</label>
                <input
                  type="url"
                  value={additionalInfo.linkedinLink}
                  onChange={(e) => updateAdditionalInfo('linkedinLink', e.target.value)}
                  placeholder="https://linkedin.com/in/yourprofile"
                  className="popup-input"
                />
              </div>
            </div>

            <div className="form-group">
              <label>GitHub Profile</label>
              <input
                type="url"
                value={additionalInfo.githubLink}
                onChange={(e) => updateAdditionalInfo('githubLink', e.target.value)}
                placeholder="https://github.com/yourusername"
                className="popup-input"
              />
            </div>

            <div className="form-group">
              <div className="section-header-with-actions">
                <label>Hobbies & Interests</label>
                <button onClick={addHobby} className="add-hobby-button">
                  <Plus className="button-icon" />
                  Add Hobby
                </button>
              </div>
              {additionalInfo.hobbies.map((hobby, index) => (
                <div key={index} className="hobby-input">
                  <input
                    type="text"
                    value={hobby}
                    onChange={(e) => updateHobby(index, e.target.value)}
                    placeholder="e.g., Photography, Hiking, Gaming"
                    className="popup-input"
                  />
                  <button 
                    onClick={() => removeHobby(index)}
                    className="remove-hobby-button"
                    type="button"
                  >
                    <Trash2 className="button-icon" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="popup-actions">
            <button onClick={handleSkipAdditionalInfo} className="skip-button">
              Skip for Now
            </button>
            <button onClick={handleAdditionalInfoSubmit} className="submit-button">
              Continue
            </button>
          </div>
        </div>
      </div>
    );
  }, [showAdditionalInfoPopup, additionalInfo, updateAdditionalInfo, addHobby, updateHobby, removeHobby, handleSkipAdditionalInfo, handleAdditionalInfoSubmit]);

  // Global error handler
  useEffect(() => {
    const handleGlobalError = (event) => {
      console.error('Global error caught:', event.error);
      event.preventDefault();
      return true;
    };

    const handleUnhandledRejection = (event) => {
      console.error('Unhandled promise rejection:', event.reason);
      event.preventDefault();
      return true;
    };

    window.addEventListener('error', handleGlobalError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleGlobalError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  // Check AI status on component mount
  useEffect(() => {
    try {
      checkAiStatus();
    } catch (err) {
      console.error('Failed to check AI status:', err);
      setAiStatus('disconnected');
    }
  }, []);

  // Initialize editableData when parsedData changes
  useEffect(() => {
    if (parsedData && !editableData) {
      setEditableData(JSON.parse(JSON.stringify(parsedData)));
    }
  }, [parsedData, editableData]);

  const checkAiStatus = async () => {
    try {
      const response = await fetch('http://localhost:11434/api/tags');
      if (response.ok) {
        setAiStatus('connected');
      } else {
        setAiStatus('disconnected');
      }
    } catch (err) {
      console.error('AI status check failed:', err);
      setAiStatus('disconnected');
    }
  };

  // Create empty resume structure for manual entry
  const createEmptyResume = () => {
    return {
      personalInfo: { 
        name: '', 
        email: '', 
        phone: '', 
        location: '',
        // New fields
        currentSalary: '',
        linkedinLink: '',
        githubLink: '',
        hometown: '',
        currentLocation: '',
        hobbies: []
      },
      experience: [],
      education: [],
      projects: [],
      achievements: [],
      certificates: [],
      skills: [],
      additionalInformation: []
    };
  };

  // Handle manual resume entry
  const handleManualEntry = () => {
    const emptyResume = createEmptyResume();
    setParsedData(emptyResume);
    setEditableData(emptyResume);
    setIsEditing(true);
    setManualMode(true);
    setActiveView('results');
    setUploadError(null);
  };

  // Handle retry after upload failure
  const handleRetryUpload = () => {
    setUploadError(null);
    setActiveView('upload');
  };

  // Clean and preprocess extracted text
  const cleanExtractedText = (text) => {
    return text
      .replace(/\s+/g, ' ')                    // Normalize whitespace
      .replace(/\t/g, ' ')                     // Replace tabs with spaces
      .replace(/\n{3,}/g, '\n\n')             // Reduce excessive newlines
      .replace(/[^\w\s@.\-+()]/g, ' ')        // Keep only alphanumeric, email, phone chars
      .replace(/\s+([.@])/g, '$1')            // Fix spacing around email/phone chars
      .replace(/([.@])\s+/g, '$1')            // Fix spacing around email/phone chars
      .trim();
  };

  // Extract text from PDF using PDF.js (loaded from CDN)
  const extractTextFromPDF = async (file) => {
    return new Promise((resolve, reject) => {
      try {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
        script.onload = async () => {
          try {
            const pdfjsLib = window.pdfjsLib;
            pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
            
            const arrayBuffer = await file.arrayBuffer();
            const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
            let fullText = '';
            
            for (let i = 1; i <= pdf.numPages; i++) {
              const page = await pdf.getPage(i);
              const textContent = await page.getTextContent();
              const pageText = textContent.items
                .map(item => item.str)
                .join(' ')
                .replace(/\s+/g, ' '); // Clean spacing per page
              fullText += pageText + '\n';
            }
            
            resolve(cleanExtractedText(fullText));
          } catch (err) {
            reject(new Error(`PDF extraction failed: ${err && err.message ? err.message : 'Unknown PDF error'}`));
          }
        };
        script.onerror = () => reject(new Error('Failed to load PDF.js library'));
        document.head.appendChild(script);
      } catch (err) {
        reject(new Error(`PDF setup failed: ${err && err.message ? err.message : 'Unknown setup error'}`));
      }
    });
  };

  // Extract text from DOCX using mammoth.js
  const extractTextFromDOCX = async (file) => {
    return new Promise((resolve, reject) => {
      try {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.4.2/mammoth.browser.min.js';
        
        script.onload = async () => {
          try {
            console.log('Mammoth.js loaded, processing DOCX...');
            
            // Check if mammoth is available
            if (!window.mammoth) {
              throw new Error('Mammoth.js failed to load properly');
            }
            
            const arrayBuffer = await file.arrayBuffer();
            const result = await window.mammoth.extractRawText({ arrayBuffer: arrayBuffer });
            
            console.log('DOCX processing completed, text length:', result.value ? result.value.length : 0);
            
            if (!result.value || result.value.trim().length < 10) {
              reject(new Error('Could not extract readable text from the DOCX file. Please ensure the document contains text content.'));
              return;
            }
            
            resolve(cleanExtractedText(result.value));
          } catch (docxError) {
            console.error('DOCX Error:', docxError);
            reject(new Error(`DOCX processing failed: ${docxError?.message || 'Unknown DOCX error'}`));
          }
        };
        
        script.onerror = () => {
          reject(new Error('Failed to load DOCX processing library. Please check your internet connection.'));
        };
        
        // Add script to document
        if (!document.head.querySelector('script[src*="mammoth"]')) {
          document.head.appendChild(script);
        } else {
          // Library already loaded, trigger onload
          script.onload();
        }
        
      } catch (setupError) {
        console.error('DOCX Setup Error:', setupError);
        reject(new Error(`DOCX setup failed: ${setupError?.message || 'Unknown setup error'}`));
      }
    });
  };

  // Helper function to validate and fix structure
  const validateAndFixStructure = (data) => {
    return {
      personalInfo: {
        name: (data.personalInfo?.name || '').toString().trim(),
        email: (data.personalInfo?.email || '').toString().trim(),
        phone: (data.personalInfo?.phone || '').toString().trim(),
        location: (data.personalInfo?.location || '').toString().trim(),
        // New fields
        currentSalary: (data.personalInfo?.currentSalary || '').toString().trim(),
        linkedinLink: (data.personalInfo?.linkedinLink || '').toString().trim(),
        githubLink: (data.personalInfo?.githubLink || '').toString().trim(),
        hometown: (data.personalInfo?.hometown || '').toString().trim(),
        currentLocation: (data.personalInfo?.currentLocation || '').toString().trim(),
        hobbies: Array.isArray(data.personalInfo?.hobbies) ? 
          data.personalInfo.hobbies.map(h => h.toString().trim()).filter(Boolean) : []
      },
      experience: Array.isArray(data.experience) ? data.experience.map(exp => ({
        position: (exp.position || '').toString().trim(),
        company: (exp.company || '').toString().trim(),
        duration: (exp.duration || '').toString().trim(),
        description: Array.isArray(exp.description) ? 
          exp.description.map(d => d.toString().trim()).filter(Boolean) : []
      })).filter(exp => exp.position || exp.company) : [],
      education: Array.isArray(data.education) ? data.education.map(edu => ({
        degree: (edu.degree || '').toString().trim(),
        institution: (edu.institution || '').toString().trim(),
        year: (edu.year || '').toString().trim(),
        description: Array.isArray(edu.description) ? 
          edu.description.map(d => d.toString().trim()).filter(Boolean) : []
      })).filter(edu => edu.degree || edu.institution) : [],
      projects: Array.isArray(data.projects) ? data.projects.map(proj => ({
        title: (proj.title || '').toString().trim(),
        description: Array.isArray(proj.description) ? 
          proj.description.map(d => d.toString().trim()).filter(Boolean) : []
      })).filter(proj => proj.title) : [],
      achievements: Array.isArray(data.achievements) ? data.achievements.map(ach => ({
        title: (ach.title || '').toString().trim(),
        description: Array.isArray(ach.description) ? 
          ach.description.map(d => d.toString().trim()).filter(Boolean) : []
      })).filter(ach => ach.title) : [],
      certificates: Array.isArray(data.certificates) ? data.certificates.map(cert => ({
        title: (cert.title || '').toString().trim(),
        issuer: (cert.issuer || '').toString().trim(),
        year: (cert.year || '').toString().trim(),
        description: Array.isArray(cert.description) ? 
          cert.description.map(d => d.toString().trim()).filter(Boolean) : []
      })).filter(cert => cert.title) : [],
      skills: Array.isArray(data.skills) ? 
        data.skills.map(s => s.toString().trim()).filter(Boolean) : [],
      additionalInformation: Array.isArray(data.additionalInformation) ? 
        data.additionalInformation.map(s => s.toString().trim()).filter(Boolean) : []
    };
  };

  // Helper function to try fixing common JSON issues
  const tryFixJSON = (jsonStr) => {
    try {
      // Common fixes for malformed JSON
      let fixed = jsonStr
        .replace(/,(\s*[}\]])/g, '$1')                    // Remove trailing commas
        .replace(/([{,]\s*)(\w+):/g, '$1"$2":')          // Add quotes to unquoted keys
        .replace(/:\s*'([^']*)'/g, ': "$1"')             // Replace single quotes with double
        .replace(/:\s*([^",{\[\s][^,}\]]*)/g, ': "$1"')  // Quote unquoted string values
        .replace(/\\"/g, '\\"')                          // Fix escaped quotes
        .replace(/\n/g, ' ')                             // Remove newlines
        .replace(/\s+/g, ' ')                            // Normalize whitespace
        .replace(/,\s*}/g, '}')                          // Final comma cleanup
        .replace(/,\s*]/g, ']')                          // Final comma cleanup
        .trim();
      
      return JSON.parse(fixed);
    } catch (e) {
      console.error('Could not fix JSON:', e);
      return null;
    }
  };

  // Enhanced AI parsing with better prompting and error handling
  const parseWithAI = async (text) => {
    // Enhanced prompt with strict instructions
    const promptText = `You are a precise resume parser. Extract information from the resume text and return ONLY valid JSON.

RESUME TEXT:
${text}

STRICT INSTRUCTIONS:
1. Extract ALL information without skipping accurately from the text above.
2. Return ONLY the JSON object below - no other text
3. Use empty strings "" for missing text fields
4. Use empty arrays [] for missing list fields
5. Ensure ALL JSON is properly formatted with quotes
6. Do NOT add markdown, or extra text

REQUIRED JSON STRUCTURE:
{
  "personalInfo": {
    "name": "",
    "email": "",
    "phone": "",
    "location": "",
    "currentSalary": "",
    "linkedinLink": "",
    "githubLink": "",
    "hometown": "",
    "currentLocation": "",
    "hobbies": []
  },
  "experience": [
    {
      "position": "",
      "company": "",
      "duration": "",
      "description": [""]
    }
  ],
  "education": [
    {
      "degree": "",
      "institution": "",
      "year": "",
      "description": [""]
    }
  ],
  "projects": [
    {
      "title": "",
      "description": [""]
    }
  ],
  "achievements": [
    {
      "title": "",
      "description": [""]
    }
  ],
  "certificates": [
    {
      "title": "",
      "issuer": "",
      "year": "",
      "description": [""]
    }
  ],
  "skills": [],
  "additionalInformation": []
}

JSON RESPONSE:`;

    try {
      console.log('Sending request to Qwen with enhanced parameters...');
      
      const response = await fetch('http://localhost:11434/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'qwen2.5:1.5b',
          prompt: promptText,
          stream: false,
          options: {
            temperature: 0.0,        // Completely deterministic
            top_p: 0.1,             // Very focused responses
            top_k: 1,               // Only consider top choice
            repeat_penalty: 1.0,     // No repeat penalty
            num_predict: 2048,       // Adequate response length
            stop: ["\n\n", "```", "END", "EXPLANATION"] // Stop tokens
          }
        })
      });

      if (!response.ok) {
        throw new Error(`AI service error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      let generatedText = data.response?.trim();
      
      if (!generatedText) {
        throw new Error('No response from AI service');
      }

      console.log('Raw AI response length:', generatedText.length);

      // More robust JSON extraction
      let jsonStr = generatedText;
      
      // Remove any markdown code blocks or extra formatting
      jsonStr = jsonStr
        .replace(/```json\s*|\s*```/g, '')
        .replace(/^[^{]*/, '')  // Remove everything before first {
        .replace(/[^}]*$/, ''); // Remove everything after last }
      
      // Find the JSON object boundaries
      const jsonStart = jsonStr.indexOf('{');
      const jsonEnd = jsonStr.lastIndexOf('}');
      
      if (jsonStart === -1 || jsonEnd === -1 || jsonEnd <= jsonStart) {
        console.error('No valid JSON found in response:', generatedText);
        throw new Error('No valid JSON structure found in AI response');
      }
      
      jsonStr = jsonStr.substring(jsonStart, jsonEnd + 1);
      
      // Clean up the JSON string
      jsonStr = jsonStr
        .replace(/,(\s*[}\]])/g, '$1')           // Remove trailing commas
        .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // Remove control chars
        .replace(/\r?\n/g, ' ')                  // Replace newlines with spaces
        .replace(/\s+/g, ' ')                    // Normalize whitespace
        .trim();
      
      console.log('Cleaned JSON string length:', jsonStr.length);
      
      try {
        const parsedData = JSON.parse(jsonStr);
        
        // Validate and fix the structure
        const validatedData = validateAndFixStructure(parsedData);
        
        console.log('Successfully parsed resume data with', 
          Object.keys(validatedData).length, 'sections');
        return validatedData;
        
      } catch (parseError) {
        console.error('JSON Parse Error:', parseError);
        console.error('Problematic JSON string:', jsonStr);
        
        // Try to fix common JSON issues
        const fixedJson = tryFixJSON(jsonStr);
        if (fixedJson) {
          console.log('Successfully fixed and parsed JSON');
          return validateAndFixStructure(fixedJson);
        }
        
        // If all else fails, try a simpler retry
        console.log('Attempting simplified retry...');
        return await retryWithSimplifiedPrompt(text);
      }
      
    } catch (error) {
      console.error('AI Parsing Error:', error);
      // Safe error handling for AI parsing
      const safeErrorMsg = error && typeof error.message === 'string' ? error.message : 'AI parsing failed';
      throw new Error(safeErrorMsg);
    }
  };

  // Simplified retry function for when main parsing fails
  const retryWithSimplifiedPrompt = async (text) => {
    const simplePrompt = `Extract resume information as JSON:

${text}

Return only this JSON format:
{"personalInfo":{"name":"","email":"","phone":"","location":""},"experience":[],"education":[],"projects":[],"achievements":[],"certificates":[],"skills":[],"additionalInformation":[]}`;

    try {
      const response = await fetch('http://localhost:11434/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'qwen2.5:1.5b',
          prompt: simplePrompt,
          stream: false,
          options: {
            temperature: 0.0,
            top_p: 0.05,
            num_predict: 1024
          }
        })
      });

      const data = await response.json();
      const jsonStr = data.response?.trim() || '{}';
      
      const jsonMatch = jsonStr.match(/\{.*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return validateAndFixStructure(parsed);
      }
      
      throw new Error('Simplified retry also failed');
    } catch (error) {
      console.error('Simplified retry failed:', error);
      // Return minimal structure as last resort
      return {
        personalInfo: { name: '', email: '', phone: '', location: '' },
        experience: [],
        education: [],
        projects: [],
        achievements: [],
        certificates: [],
        skills: [],
        additionalInformation: []
      };
    }
  };

  // Main parsing function with validation
  const parseResumeData = async (text) => {
    if (aiStatus !== 'connected') {
      throw new Error('AI service is not connected');
    }

    // Validate input text
    const cleanedText = cleanExtractedText(text);
    if (!cleanedText || cleanedText.length < 50) {
      throw new Error('Insufficient text content for processing');
    }

    console.log('Processing resume with cleaned text length:', cleanedText.length);
    return await parseWithAI(cleanedText);
  };

  const handleFileUpload = useCallback(async (uploadedFile) => {
    try {
      setUploadError(null);
      setIsAiProcessing(true);
      setAiProcessingComplete(false);
      setAiProcessingError(null);

      console.log('Processing file:', uploadedFile?.name || 'unknown', 'Type:', uploadedFile?.type || 'unknown');
      let text = '';
      
      if (!uploadedFile) {
        throw new Error('No file provided');
      }

      // Extract text from file
      if (uploadedFile.type === 'application/pdf') {
        console.log('Extracting text from PDF...');
        text = await extractTextFromPDF(uploadedFile);
      } else if (uploadedFile.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || 
                 uploadedFile.name?.toLowerCase().endsWith('.docx')) {
        console.log('Extracting text from DOCX...');
        text = await extractTextFromDOCX(uploadedFile);
      } else {
        throw new Error('Unsupported file type. Please upload a PDF or DOCX file.');
      }

      console.log('Extracted text length:', text ? text.length : 0);

      if (!text || text.trim().length < 50) {
        throw new Error('Unable to extract sufficient text from the file. Please ensure the file contains readable text and try again.');
      }

      // Store extracted text and show popup immediately
      setExtractedText(text);
      setShowAdditionalInfoPopup(true);

      // Start AI processing in background
      if (aiStatus === 'connected') {
        try {
          console.log('Starting background AI parsing...');
          const parsed = await parseResumeData(text);
          console.log('AI parsing completed successfully');
          
          // Create initial parsed data structure
          const initialData = {
            personalInfo: { 
              name: '', 
              email: '', 
              phone: '', 
              location: '',
              currentSalary: '',
              linkedinLink: '',
              githubLink: '',
              hometown: '',
              currentLocation: '',
              hobbies: []
            },
            ...parsed
          };
          
          setParsedData(initialData);
          setAiProcessingComplete(true);
          setIsAiProcessing(false);
        } catch (aiError) {
          console.error('AI processing failed:', aiError);
          setAiProcessingError(aiError.message || 'AI processing failed');
          setIsAiProcessing(false);
          
          // Create minimal structure if AI fails
          const fallbackData = createEmptyResume();
          setParsedData(fallbackData);
          setAiProcessingComplete(true);
        }
      } else {
        // AI not available, create empty structure
        const emptyData = createEmptyResume();
        setParsedData(emptyData);
        setAiProcessingComplete(true);
        setIsAiProcessing(false);
      }
      
      setManualMode(false);
      
    } catch (err) {
      console.error('Error processing file:', err);
      
      let errorMessage = 'Processing failed: ';
      let errorMsg = 'Unknown error occurred';
      
      // Error handling logic
      try {
        if (err) {
          if (typeof err === 'string') {
            errorMsg = err;
          } else if (err && typeof err === 'object') {
            if (typeof err.message === 'string' && err.message.length > 0) {
              errorMsg = err.message;
            } else if (typeof err.toString === 'function') {
              try {
                errorMsg = err.toString();
              } catch (e) {
                errorMsg = 'Error object toString failed';
              }
            }
          }
        }
      } catch (e) {
        console.error('Error extracting error message:', e);
        errorMsg = 'Error processing failed';
      }
      
      // Error message formatting
      try {
        if (typeof errorMsg === 'string' && errorMsg.length > 0) {
          const lowerMsg = errorMsg.toLowerCase();
          if (lowerMsg.indexOf('pdf extraction') !== -1) {
            errorMessage += 'Could not read the PDF file. Please ensure it\'s not password-protected and contains selectable text.';
          } else if (lowerMsg.indexOf('docx') !== -1) {
            errorMessage += 'Could not read the DOCX file. Please ensure it\'s a valid Word document with readable text content.';
          } else if (lowerMsg.indexOf('unsupported file type') !== -1) {
            errorMessage += 'Please upload a PDF or DOCX file only.';
          } else {
            errorMessage += errorMsg;
          }
        } else {
          errorMessage += 'An unexpected error occurred during processing.';
        }
      } catch (e) {
        console.error('Error processing error message:', e);
        errorMessage = 'An unexpected error occurred. Please try again.';
      }
      
      setUploadError(errorMessage);
      setActiveView('upload');
      setIsAiProcessing(false);
    }
  }, [aiStatus]);

  const handleDrop = useCallback((e) => {
    try {
      e.preventDefault();
      const droppedFile = e.dataTransfer?.files?.[0];
      if (droppedFile) {
        handleFileUpload(droppedFile);
      }
    } catch (err) {
      console.error('Drop handler error:', err);
    }
  }, [handleFileUpload]);

  const handleDragOver = useCallback((e) => {
    try {
      e.preventDefault();
    } catch (err) {
      console.error('Drag over handler error:', err);
    }
  }, []);

  const downloadPDF = async () => {
    if (!parsedData) {
      alert('No resume data available to download.');
      return;
    }
    
    try {
      const resumeHtml = generateTraditionalResumeTemplate(parsedData);
      const blob = new Blob([resumeHtml], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      
      const printWindow = window.open(url, '_blank', 'width=800,height=600');
      
      if (!printWindow) {
        const a = document.createElement('a');
        a.href = url;
        a.download = `${parsedData.personalInfo?.name || 'Resume'}_Professional.html`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        alert('Resume downloaded as HTML. Open the file and use your browser\'s print function to save as PDF.');
        return;
      }
      
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print();
        }, 1000);
      };
      
    } catch (err) {
      console.error('Error generating PDF:', err);
      const errorMsg = err && typeof err.message === 'string' ? err.message : 'Unknown download error';
      alert(`Failed to generate PDF: ${errorMsg}. Please try again.`);
    }
  };

  const downloadTemplate = () => {
    downloadPDF();
  };

  // Handle entering edit mode
  const handleEditMode = () => {
    // Always create a fresh copy when entering edit mode
    console.log('Entering edit mode, parsedData:', parsedData);
    
    if (!parsedData) {
      console.error('No parsed data available for editing');
      alert('No resume data available to edit. Please upload and parse a resume first.');
      return;
    }
    
    try {
      const freshData = JSON.parse(JSON.stringify(parsedData));
      console.log('Fresh editable data:', freshData);
      setEditableData(freshData);
      setIsEditing(true);
    } catch (error) {
      console.error('Error creating editable data:', error);
      alert('Error entering edit mode. Please try again.');
    }
  };

  // Handle canceling edits
  const handleCancelEdit = () => {
    if (manualMode) {
      // If in manual mode and canceling, go back to upload
      setParsedData(null);
      setEditableData(null);
      setActiveView('upload');
      setManualMode(false);
    } else {
      setEditableData(null);
    }
    setIsEditing(false);
  };

  // Update editable data
  const updateEditableData = (section, field, value, index = null) => {
    console.log(`Updating ${section}.${field}${index !== null ? `[${index}]` : ''} to:`, value);
    
    setEditableData(prev => {
      try {
        const newData = JSON.parse(JSON.stringify(prev));
        if (index !== null) {
          if (!newData[section]) {
            newData[section] = [];
          }
          if (!newData[section][index]) {
            newData[section][index] = {};
          }
          newData[section][index][field] = value;
        } else {
          if (!newData[section]) {
            newData[section] = {};
          }
          newData[section][field] = value;
        }
        console.log('Updated data:', newData);
        return newData;
      } catch (error) {
        console.error('Error updating editable data:', error);
        return prev;
      }
    });
  };

  // Add new item to a section
  const addNewItem = (section) => {
    console.log('=== ADD NEW ITEM CALLED ===');
    console.log('Section:', section);
    console.log('Current editableData:', editableData);
    console.log('Current isEditing:', isEditing);
    
    if (!isEditing) {
      console.error('Not in edit mode');
      alert('Please enter edit mode first before adding items.');
      return;
    }
    
    if (!editableData) {
      console.error('No editable data available');
      alert('No editable data available. Please try refreshing the page.');
      return;
    }
    
    try {
      setEditableData(prev => {
        console.log('Previous editable data:', prev);
        
        if (!prev) {
          console.error('Previous data is null');
          return prev;
        }
        
        const newData = JSON.parse(JSON.stringify(prev));
        console.log('Cloned data:', newData);
        
        // Ensure the section array exists
        if (!newData[section]) {
          console.log(`Creating new array for section: ${section}`);
          newData[section] = [];
        }
        
        const newItem = getDefaultItem(section);
        console.log('New item to add:', newItem);
        
        newData[section].push(newItem);
        console.log(`Added item to ${section}. New length:`, newData[section].length);
        console.log('Final updated data:', newData);
        
        return newData;
      });
      
      // Force a re-render for Safari
      if (isSafari) {
        setTimeout(() => {
          console.log('Safari: Forcing re-render after add');
          setEditableData(current => current);
        }, 100);
      }
      
    } catch (error) {
      console.error('Error in addNewItem:', error);
      alert(`Error adding new item: ${error.message}`);
    }
  };

  // Remove item from a section
  const removeItem = (section, index) => {
    setEditableData(prev => {
      const newData = JSON.parse(JSON.stringify(prev));
      newData[section].splice(index, 1);
      return newData;
    });
  };

  // Get default item structure for different sections
  const getDefaultItem = (section) => {
    switch (section) {
      case 'experience':
        return { position: '', company: '', duration: '', description: [''] };
      case 'education':
        return { degree: '', institution: '', year: '', description: [''] };
      case 'projects':
        return { title: '', description: [''] };
      case 'achievements':
        return { title: '', description: [''] };
      case 'certificates':
        return { title: '', issuer: '', year: '', description: [''] };
      default:
        return {};
    }
  };

  // Add new description line
  const addDescriptionLine = (section, index) => {
    setEditableData(prev => {
      const newData = JSON.parse(JSON.stringify(prev));
      newData[section][index].description.push('');
      return newData;
    });
  };

  // Remove description line
  const removeDescriptionLine = (section, itemIndex, descIndex) => {
    setEditableData(prev => {
      const newData = JSON.parse(JSON.stringify(prev));
      newData[section][itemIndex].description.splice(descIndex, 1);
      return newData;
    });
  };

  // Update description line
  const updateDescriptionLine = (section, itemIndex, descIndex, value) => {
    setEditableData(prev => {
      const newData = JSON.parse(JSON.stringify(prev));
      newData[section][itemIndex].description[descIndex] = value;
      return newData;
    });
  };

  // Add new skill
  const addNewSkill = () => {
    console.log('=== ADD NEW SKILL CALLED ===');
    
    if (!isEditing) {
      console.error('Not in edit mode');
      alert('Please enter edit mode first before adding skills.');
      return;
    }
    
    if (!editableData) {
      console.error('No editable data available');
      alert('No editable data available. Please try refreshing the page.');
      return;
    }
    
    try {
      setEditableData(prev => {
        console.log('Previous editable data:', prev);
        
        if (!prev) {
          console.error('Previous data is null');
          return prev;
        }
        
        const newData = JSON.parse(JSON.stringify(prev));
        
        // Ensure skills array exists
        if (!newData.skills) {
          console.log('Creating new skills array');
          newData.skills = [];
        }
        
        newData.skills.push('');
        console.log('Added new skill. Total skills:', newData.skills.length);
        
        return newData;
      });
      
      // Force a re-render for Safari
      if (isSafari) {
        setTimeout(() => {
          console.log('Safari: Forcing re-render after adding skill');
          setEditableData(current => current);
        }, 100);
      }
      
    } catch (error) {
      console.error('Error adding new skill:', error);
      alert(`Error adding new skill: ${error.message}`);
    }
  };

  // Remove skill
  const removeSkill = (index) => {
    console.log('=== REMOVE SKILL CALLED ===');
    console.log('Removing skill at index:', index);
    console.log('Current editableData:', editableData);
    
    if (!isEditing) {
      console.error('Not in edit mode');
      alert('Please enter edit mode first before removing skills.');
      return;
    }
    
    if (!editableData) {
      console.error('No editable data available');
      alert('No editable data available. Please try refreshing the page.');
      return;
    }
    
    try {
      setEditableData(prev => {
        console.log('Previous editable data:', prev);
        
        if (!prev) {
          console.error('Previous data is null');
          return prev;
        }
        
        const newData = JSON.parse(JSON.stringify(prev));
        
        // Ensure skills array exists
        if (!newData.skills) {
          console.log('No skills array found');
          return prev;
        }
        
        if (index < 0 || index >= newData.skills.length) {
          console.error('Invalid index:', index, 'Skills length:', newData.skills.length);
          return prev;
        }
        
        console.log('Before removal:', newData.skills);
        newData.skills.splice(index, 1);
        console.log('After removal:', newData.skills);
        
        return newData;
      });
      
      // Force a re-render for Safari
      if (isSafari) {
        setTimeout(() => {
          console.log('Safari: Forcing re-render after remove');
          setEditableData(current => current);
        }, 100);
      }
      
    } catch (error) {
      console.error('Error removing skill:', error);
      alert(`Error removing skill: ${error.message}`);
    }
  };

  // Add new additional information
  const addNewAdditionalInfo = () => {
    console.log('=== ADD NEW ADDITIONAL INFO CALLED ===');
    
    if (!isEditing) {
      console.error('Not in edit mode');
      alert('Please enter edit mode first before adding additional info.');
      return;
    }
    
    if (!editableData) {
      console.error('No editable data available');
      alert('No editable data available. Please try refreshing the page.');
      return;
    }
    
    try {
      setEditableData(prev => {
        console.log('Previous editable data:', prev);
        
        if (!prev) {
          console.error('Previous data is null');
          return prev;
        }
        
        const newData = JSON.parse(JSON.stringify(prev));
        
        // Ensure additionalInformation array exists
        if (!newData.additionalInformation) {
          console.log('Creating new additionalInformation array');
          newData.additionalInformation = [];
        }
        
        newData.additionalInformation.push('');
        console.log('Added new additional info. Total items:', newData.additionalInformation.length);
        
        return newData;
      });
      
      // Force a re-render for Safari
      if (isSafari) {
        setTimeout(() => {
          console.log('Safari: Forcing re-render after adding additional info');
          setEditableData(current => current);
        }, 100);
      }
      
    } catch (error) {
      console.error('Error adding new additional info:', error);
      alert(`Error adding new additional info: ${error.message}`);
    }
  };

  // Remove additional information
  const removeAdditionalInfo = (index) => {
    console.log('=== REMOVE ADDITIONAL INFO CALLED ===');
    console.log('Removing additional info at index:', index);
    console.log('Current editableData:', editableData);
    
    if (!isEditing) {
      console.error('Not in edit mode');
      alert('Please enter edit mode first before removing additional information.');
      return;
    }
    
    if (!editableData) {
      console.error('No editable data available');
      alert('No editable data available. Please try refreshing the page.');
      return;
    }
    
    try {
      setEditableData(prev => {
        console.log('Previous editable data:', prev);
        
        if (!prev) {
          console.error('Previous data is null');
          return prev;
        }
        
        const newData = JSON.parse(JSON.stringify(prev));
        
        // Ensure additionalInformation array exists
        if (!newData.additionalInformation) {
          console.log('No additionalInformation array found');
          return prev;
        }
        
        if (index < 0 || index >= newData.additionalInformation.length) {
          console.error('Invalid index:', index, 'Additional info length:', newData.additionalInformation.length);
          return prev;
        }
        
        console.log('Before removal:', newData.additionalInformation);
        newData.additionalInformation.splice(index, 1);
        console.log('After removal:', newData.additionalInformation);
        
        return newData;
      });
      
      // Force a re-render for Safari
      if (isSafari) {
        setTimeout(() => {
          console.log('Safari: Forcing re-render after remove additional info');
          setEditableData(current => current);
        }, 100);
      }
      
    } catch (error) {
      console.error('Error removing additional info:', error);
      alert(`Error removing additional info: ${error.message}`);
    }
  };

  const generateTraditionalResumeTemplate = (data) => {
    const name = data.personalInfo?.name || 'Your Name';
    const email = data.personalInfo?.email || '';
    const phone = data.personalInfo?.phone || '';
    const location = data.personalInfo?.location || '';

    const contactInfo = [email, phone, location].filter(Boolean).join(' | ');

    const experienceSection = (data.experience && data.experience.length > 0) ? `
      <div class="section">
        <h2 class="section-title">PROFESSIONAL EXPERIENCE</h2>
        ${data.experience.map(exp => `
          <div class="entry">
            <div class="entry-header">
              <div class="position-company">
                <strong>${exp.company || 'Company'}</strong>, ${exp.position || 'Position'}
              </div>
              <div class="duration">${exp.duration || 'Duration'}</div>
            </div>
            ${exp.description?.length > 0 ? `
              <ul class="bullet-list">
                ${exp.description.map(desc => `<li>${desc}</li>`).join('')}
              </ul>
            ` : ''}
          </div>
        `).join('')}
      </div>
    ` : '';

    const projectsSection = (data.projects && data.projects.length > 0) ? `
      <div class="section">
        <h2 class="section-title">KEY PROJECTS</h2>
        ${data.projects.map(project => `
          <div class="entry">
            <div class="entry-header">
              <div class="position-company">
                <strong>${project.title || 'Project Title'}</strong>
              </div>
            </div>
            ${project.description?.length > 0 ? `
              <ul class="bullet-list">
                ${project.description.map(desc => `<li>${desc}</li>`).join('')}
              </ul>
            ` : ''}
          </div>
        `).join('')}
      </div>
    ` : '';

    const educationSection = (data.education && data.education.length > 0) ? `
      <div class="section">
        <h2 class="section-title">EDUCATION</h2>
        ${data.education.map(edu => `
          <div class="entry">
            <div class="entry-header">
              <div class="position-company">
                <strong>${edu.institution || 'Institution'}</strong>
              </div>
              <div class="duration">${edu.year || 'Year'}</div>
            </div>
            <div class="education-details">${edu.degree || 'Degree'}</div>
              ${edu.description?.length > 0 ? `
              <ul class="bullet-list">
                ${edu.description.map(desc => `<li>${desc}</li>`).join('')}
              </ul>
            ` : ''}
          </div>
        `).join('')}
      </div>
    ` : '';

    const skillsSection = (data.skills && data.skills.length > 0) ? `
      <div class="section">
        <h2 class="section-title">TECHNICAL SKILLS</h2>
        <div class="skills-text">${data.skills.join(' | ')}</div>
      </div>
    ` : '';

    const achievementsSection = (data.achievements && data.achievements.length > 0) ? `
      <div class="section">
        <h2 class="section-title">ACHIEVEMENTS & AWARDS</h2>
        ${data.achievements.map(achievement => `
          <div class="entry">
            <div class="achievement-title"><strong>${achievement.title || 'Achievement'}</strong></div>
            ${achievement.description?.length > 0 ? `
              <ul class="bullet-list">
                ${achievement.description.map(desc => `<li>${desc}</li>`).join('')}
              </ul>
            ` : ''}
          </div>
        `).join('')}
      </div>
    ` : '';

    const certificatesSection = (data.certificates && data.certificates.length > 0) ? `
      <div class="section">
        <h2 class="section-title">CERTIFICATIONS & COURSEWORK</h2>
        <div class="coursework-text">${data.certificates.map(cert => `${cert.title} (${cert.issuer || 'Provider'})`).join(' | ')}</div>
      </div>
    ` : '';

    const additionalSection = (data.additionalInformation && data.additionalInformation.length > 0) ? `
      <div class="section">
        <h2 class="section-title">ADDITIONAL INFORMATION</h2>
        <div class="entry">
          ${data.additionalInformation.map(info => `<div>${info}</div>`).join('')}
        </div>
      </div>
    ` : '';

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Resume - ${name}</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            font-size: 11pt;
            line-height: 1.3;
            color: #000;
            max-width: 8.5in;
            margin: 0 auto;
            padding: 0.5in;
            background: white;
        }
        
        .header {
            text-align: center;
            margin-bottom: 20px;
        }
        
        .name {
            font-size: 18pt;
            font-weight: bold;
            color: #000;
            margin-bottom: 5px;
        }
        
        .contact {
            font-size: 10pt;
            color: #000;
            margin-bottom: 15px;
        }
        
        .section {
            margin-bottom: 20px;
        }
        
        .section-title {
            font-size: 11pt;
            font-weight: bold;
            color: #4285f4;
            text-transform: uppercase;
            border-bottom: 1px solid #4285f4;
            padding-bottom: 2px;
            margin-bottom: 10px;
            letter-spacing: 0.5px;
        }
        
        .entry {
            margin-bottom: 15px;
        }
        
        .entry-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 5px;
        }
        
        .position-company {
            font-size: 11pt;
            color: #000;
            flex: 1;
        }
        
        .duration {
            font-size: 10pt;
            color: #000;
            font-style: italic;
            text-align: right;
            white-space: nowrap;
            margin-left: 20px;
        }
        
        .education-details {
            font-size: 10pt;
            color: #000;
            margin-bottom: 5px;
        }
        
        .achievement-title {
            font-size: 10pt;
            color: #000;
            margin-bottom: 5px;
        }
        
        .bullet-list {
            margin: 5px 0 0 20px;
            padding: 0;
        }
        
        .bullet-list li {
            font-size: 10pt;
            line-height: 1.4;
            margin-bottom: 3px;
            color: #000;
        }
        
        .skills-text, .coursework-text {
            font-size: 10pt;
            line-height: 1.4;
            color: #000;
        }
        
        @media print {
            body {
                margin: 0;
                padding: 0.5in;
            }
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="name">${name}</div>
        <div class="contact">${contactInfo}</div>
    </div>

    ${experienceSection}
    ${projectsSection}
    ${educationSection}
    ${skillsSection}
    ${achievementsSection}
    ${certificatesSection}
    ${additionalSection}

</body>
</html>`;
  };

  // Handle external intent to enter edit mode
  useEffect(() => {
    if (editorIntent?.mode === 'edit') {
      setIsEditing(true);
      if (parsedData) setEditableData(parsedData);
      if (typeof clearIntent === 'function') clearIntent();
    }
  }, [editorIntent, parsedData, clearIntent]);

  return (
    <div className="app-container">
      {/* Navigation Bar */}
      

      <div className="app-content">
        {/* Only show header section on upload and processing views, not on results */}
        {activeView !== 'results' && (
          <div className="header-section">
            <h1 className="app-title">Smart Resume Parser</h1>
            <p className="app-subtitle">Transform your resume into a professional format with AI-powered analysis or manual entry</p>
          </div>
        )}

        <div className="nav-buttons">
          <div className="nav-container">
            <button
              onClick={() => setActiveView('upload')}
              className={'nav-button ' + (activeView === 'upload' ? 'active' : '')}
            >
              <Upload className="nav-icon" />
              Upload Resume
            </button>
            <button onClick={handleManualEntry} className='nav-button'>
              <FileText className="button-icon" />
              Manual Entry
            </button>
            <button
              onClick={() => setActiveView('results')}
              className={'nav-button ' + (activeView === 'results' ? 'active' : '') + (!parsedData ? ' disabled' : '')}
              disabled={!parsedData}
            >
              <Eye className="nav-icon" />
              View Results
            </button>
          </div>
        </div>
        <ProcessingIndicator />

        {activeView === 'upload' && (
          <div className="upload-section">
            {uploadError && (
              <div className="upload-error">
                <div className="error-content">
                  <h3>❌ Upload Failed</h3>
                  <p>{uploadError}</p>
                  <div className="error-actions">
                    <button onClick={handleRetryUpload} className="retry-button">
                      <RefreshCw className="button-icon" />
                      Try Again
                    </button>
                    <button onClick={handleManualEntry} className="manual-entry-button">
                      <FileText className="button-icon" />
                      Enter Manually
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            {!uploadError && (
              <>
                <div
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  className="upload-area"
                >
                  <Upload className="upload-icon" />
                  <h3 className="upload-title">Upload Your Resume</h3>
                  <p className="upload-subtitle">Drag and drop your resume here, or click to browse</p>
                  <p className="upload-formats">Supports PDF and DOCX files</p>
                  <input
                    type="file"
                    accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    onChange={(e) => e.target.files[0] && handleFileUpload(e.target.files[0])}
                    className="file-input"
                    id="file-upload"
                  />
                  <label htmlFor="file-upload" className="upload-button">
                    Choose File
                  </label>
                </div>
              </>
            )}

            {aiStatus !== 'connected' && !uploadError && (
              <div className="service-info">
                <h3>⚠️ AI Service Unavailable</h3>
                <p>
                  The AI parsing service is not currently available. You can still create and edit resumes manually using the "Create Resume Manually" option above.
                </p>
                <button onClick={checkAiStatus} className="status-retry-button">
                  <RefreshCw className="status-button-icon" />
                  Check AI Status
                </button>
              </div>
            )}
          </div>
        )}

        {activeView === 'processing' && (
          <div className="processing-section">
            <div className="spinner"></div>
            <h3 className="processing-title">Processing Your Resume</h3>
            <p className="processing-subtitle">AI is analyzing content and extracting information...</p>
          </div>
        )}

        {activeView === 'results' && parsedData && (
          <div className="results-section">
            {/* Edit Mode Toggle */}
            <div className="edit-mode-toggle">
              {!isEditing ? (
                <button onClick={handleEditMode} className="edit-button">
                  <Edit3 className="button-icon" />
                  Edit Resume
                </button>
              ) : (
                <div className="edit-controls">
                  <button onClick={handleSaveChanges} className="save-button">
                    <Save className="button-icon" />
                    Save Changes
                  </button>
                  <button onClick={handleCancelEdit} className="cancel-button">
                    {manualMode ? 'Cancel & Return' : 'Cancel'}
                  </button>
                </div>
              )}
            </div>

            {/* Resume Preview - Formatted like template */}
            <div className="resume-preview">
              <div className="resume-header">
                <h1 className="resume-name">
                  {isEditing ? (
                    <input
                      type="text"
                      value={editableData?.personalInfo?.name || ''}
                      onChange={(e) => {
                        console.log('Updating name to:', e.target.value);
                        updateEditableData('personalInfo', 'name', e.target.value);
                      }}
                      onInput={(e) => {
                        // Safari sometimes needs onInput for immediate updates
                        console.log('Input event - updating name to:', e.target.value);
                        updateEditableData('personalInfo', 'name', e.target.value);
                      }}
                      className="editable-input name-input"
                      placeholder="Your Name"
                    />
                  ) : (
                    parsedData?.personalInfo?.name || 'Your Name'
                  )}
                </h1>
                <div className="resume-contact">
                  {isEditing ? (
                    <div className="contact-inputs">
                      <input
                        type="email"
                        value={editableData?.personalInfo?.email || ''}
                        onChange={(e) => updateEditableData('personalInfo', 'email', e.target.value)}
                        className="editable-input contact-input"
                        placeholder="Email"
                      />
                      <span className="contact-separator">|</span>
                      <input
                        type="tel"
                        value={editableData?.personalInfo?.phone || ''}
                        onChange={(e) => updateEditableData('personalInfo', 'phone', e.target.value)}
                        className="editable-input contact-input"
                        placeholder="Phone"
                      />
                      <span className="contact-separator">|</span>
                      <input
                        type="text"
                        value={editableData?.personalInfo?.location || ''}
                        onChange={(e) => updateEditableData('personalInfo', 'location', e.target.value)}
                        className="editable-input contact-input"
                        placeholder="Location"
                      />
                    </div>
                  ) : (
                    `${parsedData?.personalInfo?.email || ''} | ${parsedData?.personalInfo?.phone || ''} | ${parsedData?.personalInfo?.location || ''}`
                  )}
                </div>
              </div>

              {/* Additional Personal Information Section */}
              {(isEditing || (parsedData?.personalInfo?.bio || parsedData?.personalInfo?.linkedinLink || parsedData?.personalInfo?.githubLink || parsedData?.personalInfo?.currentSalary || parsedData?.personalInfo?.hometown || parsedData?.personalInfo?.currentLocation)) && (
                <div className="resume-section">
                  <div className="section-header-with-actions">
                    <h2 className="resume-section-title">PERSONAL INFORMATION</h2>
                  </div>
                  
                  <div className="personal-info-grid">
                    {/* Bio */}
                    {(isEditing || parsedData?.personalInfo?.bio) && (
                      <div className="personal-info-item">
                        <label className="personal-info-label">Bio:</label>
                        {isEditing ? (
                          <textarea
                            className="editable-input personal-info-input"
                            rows={3}
                            value={editableData?.personalInfo?.bio || ''}
                            onChange={(e) => updateEditableData('personalInfo', 'bio', e.target.value)}
                            placeholder="Brief summary about you"
                          />
                        ) : (
                          <span className="personal-info-text">{parsedData?.personalInfo?.bio}</span>
                        )}
                      </div>
                    )}
                    {/* LinkedIn */}
                    {(isEditing || parsedData?.personalInfo?.linkedinLink) && (
                      <div className="personal-info-item">
                        <label className="personal-info-label">LinkedIn:</label>
                        {isEditing ? (
                          <input
                            type="url"
                            value={editableData?.personalInfo?.linkedinLink || ''}
                            onChange={(e) => updateEditableData('personalInfo', 'linkedinLink', e.target.value)}
                            className="editable-input personal-info-input"
                            placeholder="LinkedIn Profile URL"
                          />
                        ) : (
                          <a href={parsedData?.personalInfo?.linkedinLink || '#'} target={parsedData?.personalInfo?.linkedinLink ? "_blank" : undefined} rel={parsedData?.personalInfo?.linkedinLink ? "noopener noreferrer" : undefined} className="personal-info-link">
                            {parsedData?.personalInfo?.linkedinLink}
                          </a>
                        )}
                      </div>
                    )}

                    {/* GitHub */}
                    {(isEditing || parsedData?.personalInfo?.githubLink) && (
                      <div className="personal-info-item">
                        <label className="personal-info-label">GitHub:</label>
                        {isEditing ? (
                          <input
                            type="url"
                            value={editableData?.personalInfo?.githubLink || ''}
                            onChange={(e) => updateEditableData('personalInfo', 'githubLink', e.target.value)}
                            className="editable-input personal-info-input"
                            placeholder="GitHub Profile URL"
                          />
                        ) : (
                          <a href={parsedData?.personalInfo?.githubLink || '#'} target={parsedData?.personalInfo?.githubLink ? "_blank" : undefined} rel={parsedData?.personalInfo?.githubLink ? "noopener noreferrer" : undefined} className="personal-info-link">
                            {parsedData?.personalInfo?.githubLink}
                          </a>
                        )}
                      </div>
                    )}

                    {/* Current Salary */}
                    {(isEditing || parsedData?.personalInfo?.currentSalary) && (
                      <div className="personal-info-item">
                        <label className="personal-info-label">Current Salary:</label>
                        {isEditing ? (
                          <input
                            type="text"
                            value={editableData?.personalInfo?.currentSalary || ''}
                            onChange={(e) => updateEditableData('personalInfo', 'currentSalary', e.target.value)}
                            className="editable-input personal-info-input"
                            placeholder="e.g., $75,000 or ₹12 LPA"
                          />
                        ) : (
                          <span className="personal-info-text">{parsedData?.personalInfo?.currentSalary}</span>
                        )}
                      </div>
                    )}

                    {/* Hometown */}
                    {(isEditing || parsedData?.personalInfo?.hometown) && (
                      <div className="personal-info-item">
                        <label className="personal-info-label">Hometown:</label>
                        {isEditing ? (
                          <input
                            type="text"
                            value={editableData?.personalInfo?.hometown || ''}
                            onChange={(e) => updateEditableData('personalInfo', 'hometown', e.target.value)}
                            className="editable-input personal-info-input"
                            placeholder="e.g., Mumbai, Maharashtra"
                          />
                        ) : (
                          <span className="personal-info-text">{parsedData?.personalInfo?.hometown}</span>
                        )}
                      </div>
                    )}

                    {/* Current Location */}
                    {(isEditing || parsedData?.personalInfo?.currentLocation) && (
                      <div className="personal-info-item">
                        <label className="personal-info-label">Current Location:</label>
                        {isEditing ? (
                          <input
                            type="text"
                            value={editableData?.personalInfo?.currentLocation || ''}
                            onChange={(e) => updateEditableData('personalInfo', 'currentLocation', e.target.value)}
                            className="editable-input personal-info-input"
                            placeholder="e.g., Bengaluru, Karnataka"
                          />
                        ) : (
                          <span className="personal-info-text">{parsedData?.personalInfo?.currentLocation}</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Hobbies & Interests Section */}
              {(isEditing || (parsedData?.personalInfo?.hobbies && parsedData?.personalInfo?.hobbies.length > 0)) && (
                <div className="resume-section">
                  <div className="section-header-with-actions">
                    <h2 className="resume-section-title">HOBBIES & INTERESTS</h2>
                    {isEditing && (
                      <button 
                        onClick={() => {
                          setEditableData(prev => {
                            const newData = JSON.parse(JSON.stringify(prev));
                            if (!newData.personalInfo) newData.personalInfo = {};
                            if (!newData.personalInfo.hobbies) newData.personalInfo.hobbies = [];
                            newData.personalInfo.hobbies.push('');
                            return newData;
                          });
                        }} 
                        className="add-item-button"
                      >
                        <Plus className="button-icon" />
                        Add Hobby
                      </button>
                    )}
                  </div>
                  {((isEditing ? editableData?.personalInfo?.hobbies : parsedData?.personalInfo?.hobbies) || []).length > 0 ? (
                    <div className="resume-skills-text">
                      {isEditing ? (
                        <div className="hobbies-inputs">
                          {(editableData?.personalInfo?.hobbies || []).map((hobby, index) => (
                            <div key={`hobby-edit-${index}`} className="hobby-input">
                              <input
                                type="text"
                                value={hobby}
                                onChange={(e) => {
                                  setEditableData(prev => {
                                    const newData = JSON.parse(JSON.stringify(prev));
                                    if (!newData.personalInfo) newData.personalInfo = {};
                                    if (!newData.personalInfo.hobbies) newData.personalInfo.hobbies = [];
                                    newData.personalInfo.hobbies[index] = e.target.value;
                                    return newData;
                                  });
                                }}
                                className="editable-input hobby-input-field"
                                placeholder="e.g., Photography, Hiking, Gaming"
                              />
                              <button 
                                onClick={() => {
                                  setEditableData(prev => {
                                    const newData = JSON.parse(JSON.stringify(prev));
                                    if (newData.personalInfo && newData.personalInfo.hobbies) {
                                      newData.personalInfo.hobbies.splice(index, 1);
                                    }
                                    return newData;
                                  });
                                }}
                                className="remove-hobby-button"
                              >
                                <Trash2 className="button-icon" />
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        (parsedData?.personalInfo?.hobbies || []).join(' | ')
                      )}
                    </div>
                  ) : (
                    <div className="empty-section">
                      {isEditing ? 'No hobbies added yet. Click "Add Hobby" to add one.' : 'No hobbies information available.'}
                    </div>
                  )}
                </div>
              )}

              {/* Professional Experience Section */}
              <div className="resume-section">
                <div className="section-header-with-actions">
                  <h2 className="resume-section-title">PROFESSIONAL EXPERIENCE</h2>
                  {isEditing && (
                    <button onClick={handleAddExperience} className="add-item-button">
                      <Plus className="button-icon" />
                      Add Experience
                    </button>
                  )}
                </div>
                {((isEditing ? editableData?.experience : parsedData?.experience) || []).length > 0 ? (
                  (isEditing ? editableData.experience : parsedData.experience).map((exp, index) => (
                    <div key={index} className="resume-entry">
                      {isEditing && (
                        <div className="entry-actions">
                          <button onClick={() => removeItem('experience', index)} className="remove-item-button">
                            <Trash2 className="button-icon" />
                          </button>
                        </div>
                      )}
                      <div className="resume-entry-header">
                        <div className="resume-company-position">
                          {isEditing ? (
                            <>
                              <input
                                type="text"
                                value={editableData?.experience[index]?.company || ''}
                                onChange={(e) => updateEditableData('experience', 'company', e.target.value, index)}
                                className="editable-input company-input"
                                placeholder="Company"
                              />
                              <span className="separator">,</span>
                              <input
                                type="text"
                                value={editableData?.experience[index]?.position || ''}
                                onChange={(e) => updateEditableData('experience', 'position', e.target.value, index)}
                                className="editable-input position-input"
                                placeholder="Position"
                              />
                            </>
                          ) : (
                            <>
                              <strong>{exp.company || 'Company'}</strong>, {exp.position || 'Position'}
                            </>
                          )}
                        </div>
                        <div className="resume-duration">
                          {isEditing ? (
                            <input
                              type="text"
                              value={editableData?.experience[index]?.duration || ''}
                              onChange={(e) => updateEditableData('experience', 'duration', e.target.value, index)}
                              className="editable-input duration-input"
                              placeholder="Duration"
                            />
                          ) : (
                            <em>{exp.duration || 'Duration'}</em>
                          )}
                        </div>
                      </div>
                      <div className="description-section">
                        {isEditing ? (
                          <div className="description-inputs">
                            {(editableData?.experience[index]?.description || []).map((desc, descIndex) => (
                              <div key={descIndex} className="description-line">
                                <input
                                  type="text"
                                  value={desc}
                                  onChange={(e) => updateDescriptionLine('experience', index, descIndex, e.target.value)}
                                  className="editable-input description-input"
                                  placeholder="Description line"
                                />
                                <button 
                                  onClick={() => removeDescriptionLine('experience', index, descIndex)}
                                  className="remove-line-button"
                                  disabled={(editableData?.experience[index]?.description || []).length <= 1}
                                >
                                  <Trash2 className="button-icon" />
                                </button>
                              </div>
                            ))}
                            <button onClick={() => addDescriptionLine('experience', index)} className="add-line-button">
                              <Plus className="button-icon" />
                              Add Line
                            </button>
                          </div>
                        ) : (
                          exp.description && Array.isArray(exp.description) && exp.description.length > 0 && (
                            <ul className="resume-bullet-list">
                              {exp.description.map((desc, descIndex) => (
                                <li key={descIndex}>{desc}</li>
                              ))}
                            </ul>
                          )
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="empty-section">
                    {isEditing ? 'No experience entries yet. Click "Add Experience" to add one.' : 'No experience information available.'}
                  </div>
                )}
              </div>

              {/* Education Section */}
              <div className="resume-section">
                <div className="section-header-with-actions">
                  <h2 className="resume-section-title">EDUCATION</h2>
                  {isEditing && (
                    <button onClick={handleAddEducation} className="add-item-button">
                      <Plus className="button-icon" />
                      Add Education
                    </button>
                  )}
                </div>
                {((isEditing ? editableData?.education : parsedData?.education) || []).length > 0 ? (
                  (isEditing ? editableData.education : parsedData.education).map((edu, index) => (
                    <div key={index} className="resume-entry">
                      {isEditing && (
                        <div className="entry-actions">
                          <button onClick={() => removeItem('education', index)} className="remove-item-button">
                            <Trash2 className="button-icon" />
                          </button>
                        </div>
                      )}
                      <div className="resume-entry-header">
                        <div className="resume-company-position">
                          {isEditing ? (
                            <input
                              type="text"
                              value={editableData?.education[index]?.institution || ''}
                              onChange={(e) => updateEditableData('education', 'institution', e.target.value, index)}
                              className="editable-input institution-input"
                              placeholder="Institution"
                            />
                          ) : (
                            <strong>{edu.institution || 'Institution'}</strong>
                          )}
                        </div>
                        <div className="resume-duration">
                          {isEditing ? (
                            <input
                              type="text"
                              value={editableData?.education[index]?.year || ''}
                              onChange={(e) => updateEditableData('education', 'year', e.target.value, index)}
                              className="editable-input year-input"
                              placeholder="Year"
                            />
                          ) : (
                            <em>{edu.year || 'Year'}</em>
                          )}
                        </div>
                      </div>
                      <div className="resume-education-details">
                        {isEditing ? (
                          <input
                            type="text"
                            value={editableData?.education[index]?.degree || ''}
                            onChange={(e) => updateEditableData('education', 'degree', e.target.value, index)}
                            className="editable-input degree-input"
                            placeholder="Degree"
                          />
                        ) : (
                          edu.degree || 'Degree'
                        )}
                      </div>
                      {isEditing && (
                        <div className="description-section">
                          <div className="description-inputs">
                            {(editableData?.education[index]?.description || []).map((desc, descIndex) => (
                              <div key={descIndex} className="description-line">
                                <input
                                  type="text"
                                  value={desc}
                                  onChange={(e) => updateDescriptionLine('education', index, descIndex, e.target.value)}
                                  className="editable-input description-input"
                                  placeholder="Description line"
                                />
                                <button 
                                  onClick={() => removeDescriptionLine('education', index, descIndex)}
                                  className="remove-line-button"
                                  disabled={(editableData?.education[index]?.description || []).length <= 1}
                                >
                                  <Trash2 className="button-icon" />
                                </button>
                              </div>
                            ))}
                            <button onClick={() => addDescriptionLine('education', index)} className="add-line-button">
                              <Plus className="button-icon" />
                              Add Line
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="empty-section">
                    {isEditing ? 'No education entries yet. Click "Add Education" to add one.' : 'No education information available.'}
                  </div>
                )}
              </div>

              {/* Technical Skills Section */}
              <div className="resume-section">
                <div className="section-header-with-actions">
                  <h2 className="resume-section-title">TECHNICAL SKILLS</h2>
                  {isEditing && (
                    <button onClick={handleAddSkill} className="add-item-button">
                      <Plus className="button-icon" />
                      Add Skill
                    </button>
                  )}
                </div>
                {((isEditing ? editableData?.skills : parsedData?.skills) || []).length > 0 ? (
                  <div className="resume-skills-text">
                    {isEditing ? (
                      <div className="skills-inputs">
                        {(isEditing ? editableData.skills : parsedData.skills).map((skill, index) => (
                          <div key={`skill-${index}-${skill}`} className="skill-input">
                            <input
                              type="text"
                              value={skill}
                              onChange={(e) => {
                                console.log(`Updating skill at index ${index} to:`, e.target.value);
                                setEditableData(prev => {
                                  const newData = JSON.parse(JSON.stringify(prev));
                                  if (!newData.skills) newData.skills = [];
                                  newData.skills[index] = e.target.value;
                                  return newData;
                                });
                              }}
                              onInput={(e) => {
                                // Safari sometimes needs onInput for immediate updates
                                console.log(`Input event - updating skill at index ${index} to:`, e.target.value);
                                setEditableData(prev => {
                                  const newData = JSON.parse(JSON.stringify(prev));
                                  if (!newData.skills) newData.skills = [];
                                  newData.skills[index] = e.target.value;
                                  return newData;
                                });
                              }}
                              className="editable-input skill-input-field"
                              placeholder="Skill"
                            />
                            <button 
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                console.log('Remove skill button clicked for index:', index);
                                handleRemoveSkill(index);
                              }}
                              onMouseDown={(e) => {
                                // Safari-specific event handling
                                e.preventDefault();
                                console.log('Mouse down on remove skill button for index:', index);
                              }}
                              className="remove-skill-button"
                              type="button"
                              style={{
                                // Safari-specific styles
                                WebkitAppearance: 'none',
                                WebkitUserSelect: 'none',
                                WebkitTapHighlightColor: 'transparent',
                                WebkitTouchCallout: 'none',
                                WebkitTransform: 'translateZ(0)',
                                transform: 'translateZ(0)',
                                position: 'relative',
                                zIndex: 1
                              }}
                            >
                              <Trash2 className="button-icon" />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      (isEditing ? editableData.skills : parsedData.skills).join(' | ')
                    )}
                  </div>
                ) : (
                  <div className="empty-section">
                    {isEditing ? 'No skills yet. Click "Add Skill" to add one.' : 'No skills information available.'}
                  </div>
                )}
              </div>

              {/* Projects Section */}
              <div className="resume-section">
                <div className="section-header-with-actions">
                  <h2 className="resume-section-title">KEY PROJECTS</h2>
                  {isEditing && (
                    <button onClick={handleAddProject} className="add-item-button">
                      <Plus className="button-icon" />
                      Add Project
                    </button>
                  )}
                </div>
                {((isEditing ? editableData?.projects : parsedData?.projects) || []).length > 0 ? (
                  (isEditing ? editableData.projects : parsedData.projects).map((project, index) => (
                    <div key={index} className="resume-entry">
                      {isEditing && (
                        <div className="entry-actions">
                          <button onClick={() => removeItem('projects', index)} className="remove-item-button">
                            <Trash2 className="button-icon" />
                          </button>
                        </div>
                      )}
                      <div className="resume-project-title">
                        {isEditing ? (
                          <input
                            type="text"
                            value={editableData?.projects[index]?.title || ''}
                            onChange={(e) => updateEditableData('projects', 'title', e.target.value, index)}
                            className="editable-input project-title-input"
                            placeholder="Project Title"
                          />
                        ) : (
                          <strong>{project.title || 'Project Title'}</strong>
                        )}
                      </div>
                      <div className="description-section">
                        {isEditing ? (
                          <div className="description-inputs">
                            {(editableData?.projects[index]?.description || []).map((desc, descIndex) => (
                              <div key={descIndex} className="description-line">
                                <input
                                  type="text"
                                  value={desc}
                                  onChange={(e) => updateDescriptionLine('projects', index, descIndex, e.target.value)}
                                  className="editable-input description-input"
                                  placeholder="Description line"
                                />
                                <button 
                                  onClick={() => removeDescriptionLine('projects', index, descIndex)}
                                  className="remove-line-button"
                                  disabled={(editableData?.projects[index]?.description || []).length <= 1}
                                >
                                  <Trash2 className="button-icon" />
                                </button>
                              </div>
                            ))}
                            <button onClick={() => addDescriptionLine('projects', index)} className="add-line-button">
                              <Plus className="button-icon" />
                              Add Line
                            </button>
                          </div>
                        ) : (
                          project.description && Array.isArray(project.description) && project.description.length > 0 && (
                            <ul className="resume-bullet-list">
                              {project.description.map((desc, descIndex) => (
                                <li key={descIndex}>{desc}</li>
                              ))}
                            </ul>
                          )
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="empty-section">
                    {isEditing ? 'No projects yet. Click "Add Project" to add one.' : 'No projects information available.'}
                  </div>
                )}
              </div>

              {/* Achievements Section */}
              <div className="resume-section">
                <div className="section-header-with-actions">
                  <h2 className="resume-section-title">ACHIEVEMENTS & AWARDS</h2>
                  {isEditing && (
                    <button onClick={handleAddAchievement} className="add-item-button">
                      <Plus className="button-icon" />
                      Add Achievement
                    </button>
                  )}
                </div>
                {((isEditing ? editableData?.achievements : parsedData?.achievements) || []).length > 0 ? (
                  (isEditing ? editableData.achievements : parsedData.achievements).map((achievement, index) => (
                    <div key={index} className="resume-entry">
                      {isEditing && (
                        <div className="entry-actions">
                          <button onClick={() => removeItem('achievements', index)} className="remove-item-button">
                            <Trash2 className="button-icon" />
                          </button>
                        </div>
                      )}
                      <div className="resume-project-title">
                        {isEditing ? (
                          <input
                            type="text"
                            value={editableData?.achievements[index]?.title || ''}
                            onChange={(e) => updateEditableData('achievements', 'title', e.target.value, index)}
                            className="editable-input achievement-title-input"
                            placeholder="Achievement Title"
                          />
                        ) : (
                          <strong>{achievement.title || 'Achievement Title'}</strong>
                        )}
                      </div>
                      <div className="description-section">
                        {isEditing ? (
                          <div className="description-inputs">
                            {(editableData?.achievements[index]?.description || []).map((desc, descIndex) => (
                              <div key={descIndex} className="description-line">
                                <input
                                  type="text"
                                  value={desc}
                                  onChange={(e) => updateDescriptionLine('achievements', index, descIndex, e.target.value)}
                                  className="editable-input description-input"
                                  placeholder="Description line"
                                />
                                <button 
                                  onClick={() => removeDescriptionLine('achievements', index, descIndex)}
                                  className="remove-line-button"
                                  disabled={(editableData?.achievements[index]?.description || []).length <= 1}
                                >
                                  <Trash2 className="button-icon" />
                                </button>
                              </div>
                            ))}
                            <button onClick={() => addDescriptionLine('achievements', index)} className="add-line-button">
                              <Plus className="button-icon" />
                              Add Line
                            </button>
                          </div>
                        ) : (
                          achievement.description && Array.isArray(achievement.description) && achievement.description.length > 0 && (
                            <ul className="resume-bullet-list">
                              {achievement.description.map((desc, descIndex) => (
                                <li key={descIndex}>{desc}</li>
                              ))}
                            </ul>
                          )
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="empty-section">
                    {isEditing ? 'No achievements yet. Click "Add Achievement" to add one.' : 'No achievements information available.'}
                  </div>
                )}
              </div>

              {/* Certificates Section */}
              <div className="resume-section">
                <div className="section-header-with-actions">
                  <h2 className="resume-section-title">CERTIFICATIONS & COURSEWORK</h2>
                  {isEditing && (
                    <button onClick={handleAddCertificate} className="add-item-button">
                      <Plus className="button-icon" />
                      Add Certificate
                    </button>
                  )}
                </div>
                {((isEditing ? editableData?.certificates : parsedData?.certificates) || []).length > 0 ? (
                  <div className="resume-skills-text">
                    {isEditing ? (
                      <div className="certificates-inputs">
                        {(isEditing ? editableData.certificates : parsedData.certificates).map((cert, index) => (
                          <div key={`cert-${index}-${cert.title}`} className="certificate-input">
                            <input
                              type="text"
                              value={editableData?.certificates[index]?.title || ''}
                              onChange={(e) => {
                                console.log(`Updating cert title at index ${index} to:`, e.target.value);
                                updateEditableData('certificates', 'title', e.target.value, index);
                              }}
                              onInput={(e) => {
                                // Safari sometimes needs onInput for immediate updates
                                console.log(`Input event - updating cert title at index ${index} to:`, e.target.value);
                                updateEditableData('certificates', 'title', e.target.value, index);
                              }}
                              className="editable-input cert-title-input"
                              placeholder="Certificate Title"
                            />
                            <span className="separator">(</span>
                            <input
                              type="text"
                              value={editableData?.certificates[index]?.issuer || ''}
                              onChange={(e) => {
                                console.log(`Updating cert issuer at index ${index} to:`, e.target.value);
                                updateEditableData('certificates', 'issuer', e.target.value, index);
                              }}
                              onInput={(e) => {
                                // Safari sometimes needs onInput for immediate updates
                                console.log(`Input event - updating cert issuer at index ${index} to:`, e.target.value);
                                updateEditableData('certificates', 'issuer', e.target.value, index);
                              }}
                              className="editable-input cert-issuer-input"
                              placeholder="Issuer"
                            />
                            <span className="separator">)</span>
                            <button 
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                console.log('Remove certificate button clicked for index:', index);
                                handleRemoveCertificate(index);
                              }}
                              onMouseDown={(e) => {
                                // Safari-specific event handling
                                e.preventDefault();
                                console.log('Mouse down on remove certificate button for index:', index);
                              }}
                              className="remove-cert-button"
                              type="button"
                              style={{
                                // Safari-specific styles
                                WebkitAppearance: 'none',
                                WebkitUserSelect: 'none',
                                WebkitTapHighlightColor: 'transparent',
                                WebkitTouchCallout: 'none',
                                WebkitTransform: 'translateZ(0)',
                                transform: 'translateZ(0)',
                                position: 'relative',
                                zIndex: 1
                              }}
                            >
                              <Trash2 className="button-icon" />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      (isEditing ? editableData.certificates : parsedData.certificates).map(cert => `${cert.title} (${cert.issuer || 'Provider'})`).join(' | ')
                    )}
                  </div>
                ) : (
                  <div className="empty-section">
                    {isEditing ? 'No certificates yet. Click "Add Certificate" to add one.' : 'No certificates information available.'}
                  </div>
                )}
              </div>

              {/* Additional Information Section */}
              <div className="resume-section">
                <div className="section-header-with-actions">
                  <h2 className="resume-section-title">ADDITIONAL INFORMATION</h2>
                  {isEditing && (
                    <button onClick={handleAddAdditionalInfo} className="add-item-button">
                      <Plus className="button-icon" />
                      Add Info
                    </button>
                  )}
                </div>
                {((isEditing ? editableData?.additionalInformation : parsedData?.additionalInformation) || []).length > 0 ? (
                  <div className="resume-skills-text">
                    {isEditing ? (
                      <div className="additional-info-inputs">
                        {(isEditing ? editableData.additionalInformation : parsedData.additionalInformation).map((info, index) => (
                          <div key={index} className="additional-info-input">
                            <input
                              type="text"
                              value={info}
                              onChange={(e) => {
                                setEditableData(prev => {
                                  const newData = JSON.parse(JSON.stringify(prev));
                                  newData.additionalInformation[index] = e.target.value;
                                  return newData;
                                });
                              }}
                              className="editable-input additional-info-input-field"
                              placeholder="Additional information"
                            />
                            <button 
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                console.log('Remove additional info button clicked for index:', index);
                                handleRemoveAdditionalInfo(index);
                              }}
                              onMouseDown={(e) => {
                                // Safari-specific event handling
                                e.preventDefault();
                                console.log('Mouse down on remove additional info button for index:', index);
                              }}
                              className="remove-info-button"
                              type="button"
                              style={{
                                // Safari-specific styles
                                WebkitAppearance: 'none',
                                WebkitUserSelect: 'none',
                                WebkitTapHighlightColor: 'transparent',
                                WebkitTouchCallout: 'none',
                                WebkitTransform: 'translateZ(0)',
                                transform: 'translateZ(0)',
                                position: 'relative',
                                zIndex: 1
                              }}
                            >
                              <Trash2 className="button-icon" />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      (isEditing ? editableData.additionalInformation : parsedData.additionalInformation).join(' | ')
                    )}
                  </div>
                ) : (
                  <div className="empty-section">
                    {isEditing ? 'No additional information yet. Click "Add Info" to add one.' : 'No additional information available.'}
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons - Download and Save to Database */}
            <div className="resume-actions">
              <div className="view-actions">
                <button onClick={downloadTemplate} className="download-button">
                  <Download className="button-icon" />
                  Download PDF
                </button>
                
                
              </div>
              
              
            </div>
          </div>
        )}
      </div>
      
      {/* Database Status Indicator */}
      <DatabaseStatusIndicator />
      
      {/* Additional Info Popup */}
      {AdditionalInfoPopup}
      {ProcessingPopup}
      {SaveConfirmationPopup}
    </div>
  );
};
export default App;

