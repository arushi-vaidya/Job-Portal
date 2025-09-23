// TemplateSelector.js
// Updated version without preview button - template changes reflect immediately in View Results

import React from 'react';
import { Download } from 'lucide-react';

const TemplateSelector = ({ selectedTemplate, onTemplateChange, selectedColor, onDownload }) => {
  const templates = [
    {
      id: 'classic',
      name: 'Classic Professional',
      description: 'Clean, traditional layout perfect for corporate roles',
      preview: 'Traditional single-column layout with clear sections',
      thumbnail: '📄'
    },
    {
      id: 'modern',
      name: 'Modern Sidebar', 
      description: 'Two-column design with sidebar for skills and contact info',
      preview: 'Contemporary layout with left sidebar and main content area',
      thumbnail: '📋'
    },
    {
      id: 'executive',
      name: 'Executive Minimal',
      description: 'Sophisticated layout for senior professionals',
      preview: 'Elegant design with emphasis on experience and achievements',
      thumbnail: '📊'
    }
  ];

  return (
    <div className="template-selector-section">
      <h3 className="template-selector-title">Choose Resume Template</h3>
      <div className="template-grid">
        {templates.map((template) => (
          <div
            key={template.id}
            className={`template-card ${selectedTemplate === template.id ? 'active' : ''}`}
            onClick={() => onTemplateChange(template.id)}
          >
            <div className="template-thumbnail">
              <span className="template-icon">{template.thumbnail}</span>
              <div className="template-preview">
                <div className={`preview-layout preview-${template.id}`}>
                  {template.id === 'classic' && (
                    <div className="preview-content">
                      <div className="preview-header"></div>
                      <div className="preview-section"></div>
                      <div className="preview-section"></div>
                      <div className="preview-section"></div>
                    </div>
                  )}
                  {template.id === 'modern' && (
                    <div className="preview-content">
                      <div className="preview-sidebar"></div>
                      <div className="preview-main">
                        <div className="preview-header"></div>
                        <div className="preview-section"></div>
                        <div className="preview-section"></div>
                      </div>
                    </div>
                  )}
                  {template.id === 'executive' && (
                    <div className="preview-content">
                      <div className="preview-header-large"></div>
                      <div className="preview-two-col">
                        <div className="preview-col"></div>
                        <div className="preview-col"></div>
                      </div>
                      <div className="preview-section"></div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="template-info">
              <h4 className="template-name">{template.name}</h4>
              <p className="template-description">{template.description}</p>
            </div>
            
            {selectedTemplate === template.id && (
              <div className="template-selected-indicator">
                ✓ Selected
              </div>
            )}
          </div>
        ))}
      </div>
      
      <div className="template-actions">
      </div>
    </div>
  );
};

export default TemplateSelector;