import React from 'react';

const ProfileCompletionDetails = ({ completionBreakdown, nextSteps }) => {
  const sectionNames = {
    basicInfo: 'Basic Information',
    contactInfo: 'Contact Details',
    professional: 'Professional Experience',
    education: 'Education & Learning',
    additional: 'Additional Information'
  };

  const priorityColors = {
    high: '#ef4444',
    medium: '#f59e0b',
    low: '#6b7280'
  };

  return (
    <div className="profile-completion-details">
      <h4>Profile Completion Breakdown</h4>
      
      {/* Section-wise breakdown */}
      <div className="completion-sections">
        {Object.entries(completionBreakdown).map(([key, section]) => (
          <div key={key} className="completion-section">
            <div className="section-header">
              <span className="section-name">{sectionNames[key]}</span>
              <span className="section-percentage">{section.percentage}%</span>
            </div>
            <div className="section-progress">
              <div 
                className="progress-bar"
                style={{ width: `${section.percentage}%` }}
              />
            </div>
            <div className="section-items">
              {section.items.map((item, idx) => (
                <div key={idx} className={`item ${item.completed ? 'completed' : 'incomplete'}`}>
                  <span className="item-status">{item.completed ? '✓' : '○'}</span>
                  <span className="item-name">{item.name}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Next Steps */}
      <div className="next-steps">
        <h4>Recommended Next Steps</h4>
        <div className="steps-list">
          {nextSteps.map((step, idx) => (
            <div key={idx} className="step-item">
              <div 
                className="priority-indicator"
                style={{ backgroundColor: priorityColors[step.priority] }}
              />
              <span className="step-text">{step.item}</span>
              <span className="step-section">{sectionNames[step.section]}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProfileCompletionDetails;
