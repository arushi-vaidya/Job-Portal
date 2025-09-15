import React, { useState, useEffect } from 'react';
import { CheckCircle, Shield, User, Camera } from 'lucide-react';
import apiService from '../services/api';

const AccountViewPage = ({ resume, onBack, onEdit, isAuthenticated }) => {
  const data = React.useMemo(() => normalizeAccountResume(resume), [resume]);
  const [verificationPhoto, setVerificationPhoto] = useState(null);
  const [photoLoading, setPhotoLoading] = useState(false);
  const [verificationData, setVerificationData] = useState(null);

  // Fetch verification data and photo
  useEffect(() => {
    const fetchVerificationData = async () => {
      if (isAuthenticated) {
        try {
          setPhotoLoading(true);
          const verificationResponse = await apiService.getVerificationStatus();
          setVerificationData(verificationResponse.data?.verification);
          
          // If user has a verification photo, fetch it
          if (verificationResponse.data?.verification?.verificationPhoto?.hasPhoto) {
            try {
              const photoResponse = await apiService.getVerificationPhoto();
              const blob = await photoResponse.blob();
              const photoUrl = URL.createObjectURL(blob);
              setVerificationPhoto(photoUrl);
            } catch (photoError) {
              console.error('Failed to load verification photo:', photoError);
            }
          }
        } catch (error) {
          console.error('Failed to fetch verification data:', error);
        } finally {
          setPhotoLoading(false);
        }
      }
    };

    fetchVerificationData();
  }, [isAuthenticated]);

  // Cleanup photo URL on unmount
  useEffect(() => {
    return () => {
      if (verificationPhoto) {
        URL.revokeObjectURL(verificationPhoto);
      }
    };
  }, [verificationPhoto]);
  return (
    <div className="account-page">
      <div className="account-header">
        <button className="back-button" onClick={onBack}>← Back</button>
        <h2>Account • View Info</h2>
        <div style={{ marginLeft: 'auto' }}>
          <button className="edit-button" onClick={onEdit}>Edit</button>
        </div>
      </div>

      {/* Authentication Status */}
      {isAuthenticated !== undefined && (
        <div className={`resume-auth-status ${isAuthenticated ? '' : 'not-verified'}`}>
          {isAuthenticated ? (
            <>
              <CheckCircle className="icon" />
              <span>Profile Verified - This data is authenticated</span>
            </>
          ) : (
            <>
              <Shield className="icon" />
              <span>Profile Not Verified - Complete authentication for verified data</span>
            </>
          )}
        </div>
      )}

      {!data ? (
        <div className="account-empty">No resume found for this account.</div>
      ) : (
        <div className="account-content">
          {/* Verification Photo Section */}
          {isAuthenticated && (
            <section className="account-section verification-section">
              <h3>Verification</h3>
              <div className="verification-info">
                <div className="verification-status">
                  <CheckCircle className="icon verified" />
                  <span>Profile Verified</span>
                </div>
                {verificationData && (
                  <div className="verification-details">
                    <div className="verification-item">
                      <span className="label">Verified on:</span>
                      <span className="value">
                        {verificationData.verifiedAt 
                          ? new Date(verificationData.verifiedAt).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })
                          : 'Unknown'
                        }
                      </span>
                    </div>
                    <div className="verification-item">
                      <span className="label">Method:</span>
                      <span className="value">{verificationData.verificationMethod || 'Unknown'}</span>
                    </div>
                    {verificationData.aadharNumber && (
                      <div className="verification-item">
                        <span className="label">Aadhar:</span>
                        <span className="value">**** **** **** {verificationData.aadharNumber.slice(-4)}</span>
                      </div>
                    )}
                  </div>
                )}
                
                {/* Verification Photo */}
                <div className="verification-photo-section">
                  <h4>Verification Photo</h4>
                  {photoLoading ? (
                    <div className="photo-loading">
                      <Camera className="icon" />
                      <span>Loading verification photo...</span>
                    </div>
                  ) : verificationPhoto ? (
                    <div className="verification-photo-container">
                      <img 
                        src={verificationPhoto} 
                        alt="Verification Photo" 
                        className="verification-photo"
                        onError={() => {
                          console.error('Failed to load verification photo');
                          setVerificationPhoto(null);
                        }}
                      />
                      <div className="photo-info">
                        <Camera className="icon" />
                        <span>Identity verification photo</span>
                      </div>
                    </div>
                  ) : (
                    <div className="no-photo">
                      <User className="icon" />
                      <span>No verification photo available</span>
                    </div>
                  )}
                </div>
              </div>
            </section>
          )}

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

export default AccountViewPage;
