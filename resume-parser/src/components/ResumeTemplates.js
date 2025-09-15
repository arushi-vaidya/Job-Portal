import React from 'react';
import { Mail, Phone, MapPin, Linkedin, Github, Calendar, Award, Briefcase, GraduationCap, Code, Star } from 'lucide-react';

const ResumeTemplates = ({ template, color, resumeData, isPreview = false }) => {
  if (!resumeData) {
    return <div className="resume-template-error">No resume data available</div>;
  }

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short' 
    });
  };

  const formatDuration = (startDate, endDate) => {
    if (!startDate) return '';
    const start = formatDate(startDate);
    const end = endDate ? formatDate(endDate) : 'Present';
    return `${start} - ${end}`;
  };

  const renderClassicTemplate = () => (
    <div className="resume-template classic-template" style={{ '--accent-color': color }}>
      <div className="resume-header">
        <h1 className="resume-name">{resumeData.personalInfo?.name || 'Your Name'}</h1>
        <div className="contact-info">
          {resumeData.personalInfo?.email && (
            <div className="contact-item">
              <Mail className="icon" />
              <span>{resumeData.personalInfo.email}</span>
            </div>
          )}
          {resumeData.personalInfo?.phone && (
            <div className="contact-item">
              <Phone className="icon" />
              <span>{resumeData.personalInfo.phone}</span>
            </div>
          )}
          {resumeData.personalInfo?.location && (
            <div className="contact-item">
              <MapPin className="icon" />
              <span>{resumeData.personalInfo.location}</span>
            </div>
          )}
          {resumeData.personalInfo?.linkedinLink && (
            <div className="contact-item">
              <Linkedin className="icon" />
              <span>{resumeData.personalInfo.linkedinLink}</span>
            </div>
          )}
          {resumeData.personalInfo?.githubLink && (
            <div className="contact-item">
              <Github className="icon" />
              <span>{resumeData.personalInfo.githubLink}</span>
            </div>
          )}
        </div>
      </div>

      {resumeData.personalInfo?.bio && (
        <section className="resume-section">
          <h2 className="section-title">SUMMARY</h2>
          <p className="section-content">{resumeData.personalInfo.bio}</p>
        </section>
      )}

      {resumeData.experience && resumeData.experience.length > 0 && (
        <section className="resume-section">
          <h2 className="section-title">PROFESSIONAL EXPERIENCE</h2>
          {resumeData.experience.map((exp, index) => (
            <div key={index} className="experience-item">
              <div className="experience-header">
                <div className="experience-title">
                  <h3>{exp.position}</h3>
                  <span className="company">{exp.company}</span>
                </div>
                <div className="experience-duration">
                  {formatDuration(exp.startDate, exp.endDate)}
                </div>
              </div>
              {exp.description && exp.description.length > 0 && (
                <ul className="experience-description">
                  {exp.description.map((desc, idx) => (
                    <li key={idx}>{desc}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </section>
      )}

      {resumeData.education && resumeData.education.length > 0 && (
        <section className="resume-section">
          <h2 className="section-title">EDUCATION</h2>
          {resumeData.education.map((edu, index) => (
            <div key={index} className="education-item">
              <div className="education-header">
                <div className="education-title">
                  <h3>{edu.degree}</h3>
                  <span className="institution">{edu.institution}</span>
                </div>
                <div className="education-year">
                  {formatDuration(edu.startDate, edu.endDate)}
                </div>
              </div>
              {edu.description && edu.description.length > 0 && (
                <ul className="education-description">
                  {edu.description.map((desc, idx) => (
                    <li key={idx}>{desc}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </section>
      )}

      {resumeData.projects && resumeData.projects.length > 0 && (
        <section className="resume-section">
          <h2 className="section-title">PROJECTS</h2>
          {resumeData.projects.map((project, index) => (
            <div key={index} className="project-item">
              <div className="project-header">
                <h3>{project.title}</h3>
                {project.duration && (
                  <span className="project-duration">{project.duration}</span>
                )}
              </div>
              {project.description && project.description.length > 0 && (
                <ul className="project-description">
                  {project.description.map((desc, idx) => (
                    <li key={idx}>{desc}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </section>
      )}

      {resumeData.skills && resumeData.skills.length > 0 && (
        <section className="resume-section">
          <h2 className="section-title">SKILLS</h2>
          <div className="skills-content">
            {resumeData.skills.map((skill, index) => (
              <span key={index} className="skill-tag">{skill}</span>
            ))}
          </div>
        </section>
      )}

      {resumeData.achievements && resumeData.achievements.length > 0 && (
        <section className="resume-section">
          <h2 className="section-title">ACHIEVEMENTS</h2>
          {resumeData.achievements.map((achievement, index) => (
            <div key={index} className="achievement-item">
              <h3>{achievement.title}</h3>
              {achievement.description && achievement.description.length > 0 && (
                <ul className="achievement-description">
                  {achievement.description.map((desc, idx) => (
                    <li key={idx}>{desc}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </section>
      )}
    </div>
  );

  const renderModernTemplate = () => (
    <div className="resume-template modern-template" style={{ '--accent-color': color }}>
      <div className="resume-header">
        <h1 className="resume-name">{resumeData.personalInfo?.name || 'Your Name'}</h1>
        <div className="contact-info">
          {resumeData.personalInfo?.email && (
            <div className="contact-item">
              <Mail className="icon" />
              <span>{resumeData.personalInfo.email}</span>
            </div>
          )}
          {resumeData.personalInfo?.phone && (
            <div className="contact-item">
              <Phone className="icon" />
              <span>{resumeData.personalInfo.phone}</span>
            </div>
          )}
          {resumeData.personalInfo?.location && (
            <div className="contact-item">
              <MapPin className="icon" />
              <span>{resumeData.personalInfo.location}</span>
            </div>
          )}
          {resumeData.personalInfo?.linkedinLink && (
            <div className="contact-item">
              <Linkedin className="icon" />
              <span>{resumeData.personalInfo.linkedinLink}</span>
            </div>
          )}
          {resumeData.personalInfo?.githubLink && (
            <div className="contact-item">
              <Github className="icon" />
              <span>{resumeData.personalInfo.githubLink}</span>
            </div>
          )}
        </div>
      </div>

      <div className="resume-content">
        <div className="resume-sidebar">
          {resumeData.personalInfo?.bio && (
            <section className="sidebar-section">
              <h2 className="sidebar-title">SUMMARY</h2>
              <p className="sidebar-content">{resumeData.personalInfo.bio}</p>
            </section>
          )}

          {resumeData.skills && resumeData.skills.length > 0 && (
            <section className="sidebar-section">
              <h2 className="sidebar-title">SKILLS</h2>
              <div className="skills-list">
                {resumeData.skills.map((skill, index) => (
                  <div key={index} className="skill-item">{skill}</div>
                ))}
              </div>
            </section>
          )}

          {resumeData.achievements && resumeData.achievements.length > 0 && (
            <section className="sidebar-section">
              <h2 className="sidebar-title">ACHIEVEMENTS</h2>
              {resumeData.achievements.map((achievement, index) => (
                <div key={index} className="achievement-item">
                  <h3>{achievement.title}</h3>
                  {achievement.description && achievement.description.length > 0 && (
                    <ul>
                      {achievement.description.map((desc, idx) => (
                        <li key={idx}>{desc}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </section>
          )}
        </div>

        <div className="resume-main">
          {resumeData.experience && resumeData.experience.length > 0 && (
            <section className="resume-section">
              <h2 className="section-title">WORK EXPERIENCE</h2>
              {resumeData.experience.map((exp, index) => (
                <div key={index} className="experience-item">
                  <div className="experience-header">
                    <div className="experience-title">
                      <h3>{exp.position}</h3>
                      <span className="company">{exp.company}</span>
                    </div>
                    <div className="experience-duration">
                      {formatDuration(exp.startDate, exp.endDate)}
                    </div>
                  </div>
                  {exp.description && exp.description.length > 0 && (
                    <ul className="experience-description">
                      {exp.description.map((desc, idx) => (
                        <li key={idx}>{desc}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </section>
          )}

          {resumeData.education && resumeData.education.length > 0 && (
            <section className="resume-section">
              <h2 className="section-title">EDUCATION</h2>
              {resumeData.education.map((edu, index) => (
                <div key={index} className="education-item">
                  <div className="education-header">
                    <div className="education-title">
                      <h3>{edu.degree}</h3>
                      <span className="institution">{edu.institution}</span>
                    </div>
                    <div className="education-year">
                      {formatDuration(edu.startDate, edu.endDate)}
                    </div>
                  </div>
                  {edu.description && edu.description.length > 0 && (
                    <ul className="education-description">
                      {edu.description.map((desc, idx) => (
                        <li key={idx}>{desc}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </section>
          )}

          {resumeData.projects && resumeData.projects.length > 0 && (
            <section className="resume-section">
              <h2 className="section-title">PROJECTS</h2>
              {resumeData.projects.map((project, index) => (
                <div key={index} className="project-item">
                  <div className="project-header">
                    <h3>{project.title}</h3>
                    {project.duration && (
                      <span className="project-duration">{project.duration}</span>
                    )}
                  </div>
                  {project.description && project.description.length > 0 && (
                    <ul className="project-description">
                      {project.description.map((desc, idx) => (
                        <li key={idx}>{desc}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </section>
          )}
        </div>
      </div>
    </div>
  );

  const renderMinimalTemplate = () => (
    <div className="resume-template minimal-template" style={{ '--accent-color': color }}>
      <div className="resume-header">
        <h1 className="resume-name">{resumeData.personalInfo?.name || 'Your Name'}</h1>
        <div className="contact-info">
          {resumeData.personalInfo?.email && (
            <span className="contact-item">{resumeData.personalInfo.email}</span>
          )}
          {resumeData.personalInfo?.phone && (
            <span className="contact-item">{resumeData.personalInfo.phone}</span>
          )}
          {resumeData.personalInfo?.location && (
            <span className="contact-item">{resumeData.personalInfo.location}</span>
          )}
        </div>
      </div>

      {resumeData.personalInfo?.bio && (
        <section className="resume-section">
          <h2 className="section-title">About</h2>
          <p className="section-content">{resumeData.personalInfo.bio}</p>
        </section>
      )}

      {resumeData.experience && resumeData.experience.length > 0 && (
        <section className="resume-section">
          <h2 className="section-title">Experience</h2>
          {resumeData.experience.map((exp, index) => (
            <div key={index} className="experience-item">
              <div className="experience-header">
                <h3>{exp.position} • {exp.company}</h3>
                <span className="experience-duration">
                  {formatDuration(exp.startDate, exp.endDate)}
                </span>
              </div>
              {exp.description && exp.description.length > 0 && (
                <ul className="experience-description">
                  {exp.description.map((desc, idx) => (
                    <li key={idx}>{desc}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </section>
      )}

      {resumeData.education && resumeData.education.length > 0 && (
        <section className="resume-section">
          <h2 className="section-title">Education</h2>
          {resumeData.education.map((edu, index) => (
            <div key={index} className="education-item">
              <div className="education-header">
                <h3>{edu.degree} • {edu.institution}</h3>
                <span className="education-year">
                  {formatDuration(edu.startDate, edu.endDate)}
                </span>
              </div>
              {edu.description && edu.description.length > 0 && (
                <ul className="education-description">
                  {edu.description.map((desc, idx) => (
                    <li key={idx}>{desc}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </section>
      )}

      {resumeData.skills && resumeData.skills.length > 0 && (
        <section className="resume-section">
          <h2 className="section-title">Skills</h2>
          <div className="skills-content">
            {resumeData.skills.map((skill, index) => (
              <span key={index} className="skill-tag">{skill}</span>
            ))}
          </div>
        </section>
      )}
    </div>
  );

  switch (template?.id) {
    case 'modern':
      return renderModernTemplate();
    case 'minimal':
      return renderMinimalTemplate();
    case 'classic':
    default:
      return renderClassicTemplate();
  }
};

export default ResumeTemplates;