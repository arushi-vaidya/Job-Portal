import React, { useState } from 'react';
import { Palette, Download, Eye, FileText, Layout, Check } from 'lucide-react';

const TemplateSelector = ({ onTemplateSelect, onColorSelect, selectedTemplate, selectedColor, onDownload, onPreview, resumeData }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);

  const templates = [
    {
      id: 'classic',
      name: 'Classic',
      description: 'Traditional single-column layout',
      preview: 'classic-preview',
      isDefault: true
    },
    {
      id: 'modern',
      name: 'Modern',
      description: 'Two-column with sidebar design',
      preview: 'modern-preview',
      isDefault: false
    },
    {
      id: 'minimal',
      name: 'Minimal',
      description: 'Clean and simple design',
      preview: 'minimal-preview',
      isDefault: false
    }
  ];

  const colorOptions = [
    { name: 'Blue', value: '#4285f4', preview: '#4285f4' },
    { name: 'Green', value: '#059669', preview: '#059669' },
    { name: 'Purple', value: '#8b5cf6', preview: '#8b5cf6' },
    { name: 'Red', value: '#dc2626', preview: '#dc2626' },
    { name: 'Orange', value: '#f59e0b', preview: '#f59e0b' },
    { name: 'Teal', value: '#0891b2', preview: '#0891b2' },
    { name: 'Pink', value: '#db2777', preview: '#db2777' },
    { name: 'Indigo', value: '#6366f1', preview: '#6366f1' },
    { name: 'Black', value: '#000000', preview: '#000000' },
    { name: 'Gray', value: '#6b7280', preview: '#6b7280' }
  ];

  const handleTemplateSelect = (template) => {
    onTemplateSelect(template);
    setIsOpen(false);
  };

  const handleColorSelect = (color) => {
    onColorSelect(color);
    setShowColorPicker(false);
  };

  const handleDownload = () => {
    onDownload(selectedTemplate, selectedColor);
  };

  const handlePreview = () => {
    onPreview(selectedTemplate, selectedColor);
  };

  return (
    <div className="template-selector">
      <div className="template-selector-header">
        <h3>Resume Template</h3>
        <div className="template-actions">
          <button 
            className="template-action-btn preview-btn"
            onClick={handlePreview}
            disabled={!resumeData}
            title="Preview Resume"
          >
            <Eye className="icon" />
            Preview
          </button>
          <button 
            className="template-action-btn download-btn"
            onClick={handleDownload}
            disabled={!resumeData}
            title="Download Resume"
          >
            <Download className="icon" />
            Download
          </button>
        </div>
      </div>

      <div className="template-options">
        <div className="template-grid">
          {templates.map((template) => (
            <div
              key={template.id}
              className={`template-option ${selectedTemplate?.id === template.id ? 'selected' : ''}`}
              onClick={() => handleTemplateSelect(template)}
            >
              <div className="template-preview">
                <div className={`template-preview-content ${template.preview}`}>
                  <div className="preview-header">
                    <div className="preview-name">John Doe</div>
                    <div className="preview-title">Software Engineer</div>
                  </div>
                  <div className="preview-sections">
                    <div className="preview-section">
                      <div className="preview-section-title">Experience</div>
                      <div className="preview-item">Company Name</div>
                    </div>
                    <div className="preview-section">
                      <div className="preview-section-title">Education</div>
                      <div className="preview-item">University Name</div>
                    </div>
                  </div>
                </div>
                {template.isDefault && (
                  <div className="default-badge">Default</div>
                )}
              </div>
              <div className="template-info">
                <div className="template-name">{template.name}</div>
                <div className="template-description">{template.description}</div>
              </div>
              {selectedTemplate?.id === template.id && (
                <div className="selected-indicator">
                  <Check className="icon" />
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="color-selector-section">
          <div className="color-selector-header">
            <Palette className="icon" />
            <span>Accent Color</span>
            <button 
              className="color-picker-toggle"
              onClick={() => setShowColorPicker(!showColorPicker)}
            >
              {showColorPicker ? 'Hide' : 'Customize'}
            </button>
          </div>
          
          {showColorPicker && (
            <div className="color-picker">
              <div className="color-grid">
                {colorOptions.map((color) => (
                  <button
                    key={color.value}
                    className={`color-option ${selectedColor === color.value ? 'selected' : ''}`}
                    style={{ backgroundColor: color.preview }}
                    onClick={() => handleColorSelect(color.value)}
                    title={color.name}
                  >
                    {selectedColor === color.value && <Check className="icon" />}
                  </button>
                ))}
              </div>
              <div className="current-color">
                <span>Current: </span>
                <div 
                  className="color-preview" 
                  style={{ backgroundColor: selectedColor }}
                ></div>
                <span className="color-value">{selectedColor}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TemplateSelector;