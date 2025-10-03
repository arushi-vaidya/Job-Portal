import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, User, Camera } from 'lucide-react';
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

  useEffect(() => {
    return () => {
      if (verificationPhoto) {
        URL.revokeObjectURL(verificationPhoto);
      }
    };
  }, [verificationPhoto]);

  // Helper to display value or placeholder
  const displayValue = (value) => {
    return (value && value !== '-') ? value : 'Not provided';
  };

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
        <div className="account-content-full">
          {/* Profile Card - Full Width with Your Data */}
          <section className="profile-card-exact">
            <div className="profile-card-header">
              <div className="profile-avatar-circle">
                {photoLoading ? (
                  <div className="avatar-loading">
                    <div className="spinner"></div>
                  </div>
                ) : isAuthenticated && verificationPhoto ? (
                  <img 
                    src={verificationPhoto} 
                    alt="Profile" 
                    className="avatar-image-exact"
                    onError={() => {
                      console.error('Failed to load verification photo');
                      setVerificationPhoto(null);
                    }}
                  />
                ) : (
                  <div className="avatar-placeholder-exact">
                    <User className="avatar-icon-exact" />
                  </div>
                )}
              </div>
              <div className="profile-name-section">
                <h1 className="profile-display-name">{data.personalInfo.name}</h1>
                <div className={`verification-badge-inline ${isAuthenticated ? 'verified' : 'unverified'}`}>
                  {isAuthenticated ? (
                    <CheckCircle className="verify-icon-inline" />
                  ) : (
                    <XCircle className="verify-icon-inline" />
                  )}
                </div>
              </div>
              <div className="profile-email-display">{data.personalInfo.email}</div>
            </div>

            <div className="profile-sections-grid">
              {/* Personal Details Column */}
              <div className="profile-details-column">
                <h3 className="column-heading">Personal details</h3>
                
                <div className="detail-row">
                  <span className="detail-label">Full name:</span>
                  <span className="detail-value">{displayValue(data.personalInfo.name)}</span>
                </div>

                <div className="detail-row">
                  <span className="detail-label">Email:</span>
                  <span className="detail-value">{displayValue(data.personalInfo.email)}</span>
                </div>

                <div className="detail-row">
                  <span className="detail-label">Phone:</span>
                  <span className="detail-value">{displayValue(data.personalInfo.phone)}</span>
                </div>

                <div className="detail-row">
                  <span className="detail-label">Location:</span>
                  <span className="detail-value">{displayValue(data.personalInfo.location)}</span>
                </div>

                <div className="detail-row">
                  <span className="detail-label">Bio:</span>
                  <span className="detail-value">{displayValue(data.personalInfo.bio)}</span>
                </div>

                <div className="detail-row">
                  <span className="detail-label">Current Salary:</span>
                  <span className="detail-value">{displayValue(data.personalInfo.currentSalary)}</span>
                </div>

                <div className="detail-row">
                  <span className="detail-label">Salary Expectation:</span>
                  <span className="detail-value">{displayValue(data.personalInfo.salaryExpectation)}</span>
                </div>
              </div>

              {/* Additional Information Column */}
              <div className="profile-details-column">
                <h3 className="column-heading">Additional Information</h3>
                
                <div className="detail-row">
                  <span className="detail-label">LinkedIn:</span>
                  <span className="detail-value">
                    {data.personalInfo.linkedinLink && data.personalInfo.linkedinLink !== '-' ? (
                      <a href={data.personalInfo.linkedinLink} target="_blank" rel="noopener noreferrer" className="detail-link">
                        View Profile
                      </a>
                    ) : 'Not provided'}
                  </span>
                </div>

                <div className="detail-row">
                  <span className="detail-label">GitHub:</span>
                  <span className="detail-value">
                    {data.personalInfo.githubLink && data.personalInfo.githubLink !== '-' ? (
                      <a href={data.personalInfo.githubLink} target="_blank" rel="noopener noreferrer" className="detail-link">
                        View Profile
                      </a>
                    ) : 'Not provided'}
                  </span>
                </div>

                <div className="detail-row">
                  <span className="detail-label">Hometown:</span>
                  <span className="detail-value">{displayValue(data.personalInfo.hometown)}</span>
                </div>

                <div className="detail-row">
                  <span className="detail-label">Current Location:</span>
                  <span className="detail-value">{displayValue(data.personalInfo.currentLocation)}</span>
                </div>

                <div className="detail-row">
                  <span className="detail-label">Hobbies:</span>
                  <span className="detail-value">
                    {data.personalInfo.hobbies.length > 0 
                      ? data.personalInfo.hobbies.join(', ') 
                      : 'Not provided'}
                  </span>
                </div>

                <div className="detail-row">
                  <span className="detail-label">Profile Status:</span>
                  <span className={`detail-value ${isAuthenticated ? 'detail-verified' : 'detail-unverified'}`}>
                    {isAuthenticated ? 'Verified' : 'Not Verified'}
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* Experience Section */}
          <section className="account-section-full">
            <h3>Professional Experience</h3>
            {data.experience.length === 0 ? (
              <div className="empty">No experience entries</div>
            ) : (
              data.experience.map((e, i) => (
                <div className="entry" key={`exp-${i}`}>
                  <div className="entry-header">
                    <div className="entry-title">{e.position} @ {e.company}</div>
                    <div className="entry-sub">{e.duration}</div>
                  </div>
                  {e.description?.length > 0 && (
                    <ul>{e.description.map((d, idx) => <li key={idx}>{d}</li>)}</ul>
                  )}
                </div>
              ))
            )}
          </section>

          {/* Two Column Layout for Education & Projects */}
          <div className="two-column-layout">
            <section className="account-section-half">
              <h3>Education</h3>
              {data.education.length === 0 ? (
                <div className="empty">No education entries</div>
              ) : (
                data.education.map((ed, i) => (
                  <div className="entry" key={`edu-${i}`}>
                    <div className="entry-header">
                      <div className="entry-title">{ed.degree}</div>
                      <div className="entry-sub">{ed.year}</div>
                    </div>
                    <div className="entry-subtitle">{ed.institution}</div>
                    {ed.description?.length > 0 && (
                      <ul>{ed.description.map((d, idx) => <li key={idx}>{d}</li>)}</ul>
                    )}
                  </div>
                ))
              )}
            </section>

            <section className="account-section-half">
              <h3>Projects</h3>
              {data.projects.length === 0 ? (
                <div className="empty">No project entries</div>
              ) : (
                data.projects.map((p, i) => (
                  <div className="entry" key={`proj-${i}`}>
                    <div className="entry-title">{p.title}</div>
                    {p.description?.length > 0 && (
                      <ul>{p.description.map((d, idx) => <li key={idx}>{d}</li>)}</ul>
                    )}
                  </div>
                ))
              )}
            </section>
          </div>

          {/* Two Column Layout for Achievements & Certificates */}
          <div className="two-column-layout">
            <section className="account-section-half">
              <h3>Achievements</h3>
              {data.achievements.length === 0 ? (
                <div className="empty">No achievement entries</div>
              ) : (
                data.achievements.map((a, i) => (
                  <div className="entry" key={`ach-${i}`}>
                    <div className="entry-title">{a.title}</div>
                    {a.description?.length > 0 && (
                      <ul>{a.description.map((d, idx) => <li key={idx}>{d}</li>)}</ul>
                    )}
                  </div>
                ))
              )}
            </section>

            <section className="account-section-half">
              <h3>Certificates</h3>
              {data.certificates.length === 0 ? (
                <div className="empty">No certificate entries</div>
              ) : (
                data.certificates.map((c, i) => (
                  <div className="entry" key={`cert-${i}`}>
                    <div className="entry-header">
                      <div className="entry-title">{c.title}</div>
                      <div className="entry-sub">{c.year}</div>
                    </div>
                    <div className="entry-subtitle">{c.issuer}</div>
                    {c.description?.length > 0 && (
                      <ul>{c.description.map((d, idx) => <li key={idx}>{d}</li>)}</ul>
                    )}
                  </div>
                ))
              )}
            </section>
          </div>

          {/* Skills Section - Full Width */}
          <section className="account-section-full">
            <h3>Skills</h3>
            {data.skills.length === 0 ? (
              <div className="empty">No skills listed</div>
            ) : (
              <div className="chips">{data.skills.map((s, i) => <span className="chip" key={`skill-${i}`}>{s}</span>)}</div>
            )}
          </section>

          {/* Additional Information Section - Full Width */}
          <section className="account-section-full">
            <h3>Additional Information</h3>
            {data.additionalInformation.length === 0 ? (
              <div className="empty">No additional information</div>
            ) : (
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
      currentSalary: r?.personalInfo?.currentSalary || '-',
      salaryExpectation: r?.personalInfo?.salaryExpectation || '-',
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