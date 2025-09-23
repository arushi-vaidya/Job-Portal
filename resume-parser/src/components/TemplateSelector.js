// TemplateSelector.js
// Create this as a new file in src/components/

import React, { useState } from 'react';
import { Eye, Download } from 'lucide-react';

const TemplateSelector = ({ selectedTemplate, onTemplateChange, selectedColor, onDownload }) => {
  const [isPreviewMode, setIsPreviewMode] = useState(false);

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
      <p className="template-selector-subtitle">Select a layout that best fits your career level and industry</p>
      
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
        <button 
          className="preview-template-button"
          onClick={() => setIsPreviewMode(!isPreviewMode)}
        >
          <Eye className="button-icon" />
          {isPreviewMode ? 'Hide Preview' : 'Preview Layout'}
        </button>
        
        <button 
          className="download-template-button"
          onClick={onDownload}
        >
          <Download className="button-icon" />
          Download Selected Template
        </button>
      </div>
      
      {isPreviewMode && (
        <div className="template-preview-modal">
          <div className="preview-modal-content">
            <div className="preview-modal-header">
              <h4>Template Preview: {templates.find(t => t.id === selectedTemplate)?.name}</h4>
              <button 
                className="close-preview-button"
                onClick={() => setIsPreviewMode(false)}
              >
                ×
              </button>
            </div>
            <div className={`full-preview preview-${selectedTemplate}`}>
              <div className="full-preview-description">
                <p><strong>Layout:</strong> {templates.find(t => t.id === selectedTemplate)?.preview}</p>
                <p><strong>Best for:</strong> {templates.find(t => t.id === selectedTemplate)?.description}</p>
                <p><strong>Color:</strong> <span className="color-preview" style={{backgroundColor: selectedColor}}></span> {selectedColor}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TemplateSelector;