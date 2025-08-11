import React, { useState, useCallback, useEffect } from 'react';
import { Upload, FileText, User, Mail, Phone, MapPin, Briefcase, GraduationCap, Code, Download, Eye, Award, BadgeCheck, Info as InfoIcon, Settings, CheckCircle, XCircle, Menu, X } from 'lucide-react';
import './ResumeParser.css';

const ResumeParser = () => {
  const [extractedText, setExtractedText] = useState('');
  const [parsedData, setParsedData] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeView, setActiveView] = useState('upload');
  const [aiStatus, setAiStatus] = useState('checking');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState(null);

  // Check AI status on component mount
  useEffect(() => {
    checkAiStatus();
  }, []);

  const checkAiStatus = async () => {
    try {
      const response = await fetch('http://localhost:11434/api/tags');
      if (response.ok) {
        setAiStatus('connected');
      } else {
        setAiStatus('disconnected');
      }
    } catch (error) {
      setAiStatus('disconnected');
    }
  };

  // Extract text from PDF using PDF.js (loaded from CDN)
  const extractTextFromPDF = async (file) => {
    return new Promise((resolve, reject) => {
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
            const pageText = textContent.items.map(item => item.str).join(' ');
            fullText += pageText + '\n';
          }
          
          resolve(fullText);
        } catch (error) {
          reject(error);
        }
      };
      document.head.appendChild(script);
    });
  };

  // Extract text from images using Tesseract.js
  const extractTextFromImage = async (file) => {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/tesseract.js/4.1.1/tesseract.min.js';
      script.onload = async () => {
        try {
          const { createWorker } = window.Tesseract;
          const worker = await createWorker('eng');
          const { data: { text } } = await worker.recognize(file);
          await worker.terminate();
          resolve(text);
        } catch (error) {
          reject(error);
        }
      };
      document.head.appendChild(script);
    });
  };

  // Parse using AI
  const parseWithAI = async (text) => {
    const promptText = "You are an expert resume parser. Extract structured information from the following resume text and return it as valid JSON.\n\nRESUME TEXT:\n" + text + "\n\nTASK: Parse the above resume and return ONLY a JSON object with this EXACT structure:\n\n{\n  \"personalInfo\": {\n    \"name\": \"string\",\n    \"email\": \"string\", \n    \"phone\": \"string\",\n    \"location\": \"string\"\n  },\n  \"experience\": [\n    {\n      \"position\": \"string\",\n      \"company\": \"string\", \n      \"duration\": \"string\",\n      \"description\": [\"string\"]\n    }\n  ],\n  \"education\": [\n    {\n      \"degree\": \"string\",\n      \"institution\": \"string\",\n      \"year\": \"string\",\n      \"description\": [\"string\"]\n    }\n  ],\n  \"projects\": [\n    {\n      \"title\": \"string\",\n      \"description\": [\"string\"]\n    }\n  ],\n  \"achievements\": [\n    {\n      \"title\": \"string\",\n      \"description\": [\"string\"]\n    }\n  ],\n  \"certificates\": [\n    {\n      \"title\": \"string\",\n      \"issuer\": \"string\",\n      \"year\": \"string\",\n      \"description\": [\"string\"]\n    }\n  ],\n  \"skills\": [\"string\"],\n  \"additionalInformation\": [\"string\"]\n}\n\nRULES:\n1. Return ONLY the JSON object, no other text\n2. Use empty strings for missing text fields\n3. Use empty arrays for missing array fields\n4. Extract ALL information present in the resume\n5. Be thorough and accurate\n\nJSON:";

    try {
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
            temperature: 0.1,
            top_p: 0.9,
            num_predict: 2048,
            repeat_penalty: 1.1
          }
        })
      });

      if (!response.ok) {
        throw new Error(`AI service error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const generatedText = data.response;
      
      if (!generatedText) {
        throw new Error('No response from AI service');
      }

      // Clean the response to extract JSON
      let jsonStr = generatedText.trim();
      
      // Find JSON in the response
      let jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
      
      if (!jsonMatch) {
        const jsonStart = jsonStr.indexOf('{');
        const jsonEnd = jsonStr.lastIndexOf('}');
        if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
          jsonStr = jsonStr.substring(jsonStart, jsonEnd + 1);
        } else {
          throw new Error('No valid JSON structure found in AI response');
        }
      } else {
        jsonStr = jsonMatch[0];
      }
      
      // Clean up common JSON formatting issues
      jsonStr = jsonStr
        .replace(/,\s*}/g, '}')  // Remove trailing commas
        .replace(/,\s*]/g, ']')  // Remove trailing commas in arrays
        .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // Remove control characters
        .trim();
      
      try {
        const parsedData = JSON.parse(jsonStr);
        
        // Validate structure
        if (!parsedData || typeof parsedData !== 'object') {
          throw new Error('Invalid JSON structure returned by AI');
        }
        
        // Ensure all required fields exist with proper defaults
        const validatedData = {
          personalInfo: {
            name: parsedData.personalInfo?.name || '',
            email: parsedData.personalInfo?.email || '',
            phone: parsedData.personalInfo?.phone || '',
            location: parsedData.personalInfo?.location || ''
          },
          experience: Array.isArray(parsedData.experience) ? parsedData.experience : [],
          education: Array.isArray(parsedData.education) ? parsedData.education : [],
          projects: Array.isArray(parsedData.projects) ? parsedData.projects : [],
          achievements: Array.isArray(parsedData.achievements) ? parsedData.achievements : [],
          certificates: Array.isArray(parsedData.certificates) ? parsedData.certificates : [],
          skills: Array.isArray(parsedData.skills) ? parsedData.skills : [],
          additionalInformation: Array.isArray(parsedData.additionalInformation) ? parsedData.additionalInformation : []
        };
        
        return validatedData;
        
      } catch (parseError) {
        console.error('JSON Parse Error:', parseError);
        console.error('Raw response:', generatedText);
        console.error('Cleaned JSON string:', jsonStr);
        throw new Error('Failed to parse AI response as valid JSON. The AI may need to be retrained or the model might be having issues.');
      }
      
    } catch (error) {
      console.error('AI Parsing Error:', error);
      throw error;
    }
  };

  // Main parsing function
  const parseResumeData = async (text) => {
    if (aiStatus !== 'connected') {
      throw new Error('AI service is not available. Please ensure Ollama is running and the qwen2.5:1.5b model is installed.');
    }

    console.log('Processing resume with AI...');
    return await parseWithAI(text);
  };

  const handleFileUpload = useCallback(async (uploadedFile) => {
    setIsProcessing(true);
    setActiveView('processing');

    try {
      let text = '';
      
      if (uploadedFile.type === 'application/pdf') {
        text = await extractTextFromPDF(uploadedFile);
      } else if (uploadedFile.type.startsWith('image/')) {
        text = await extractTextFromImage(uploadedFile);
      } else {
        throw new Error('Unsupported file type. Please upload a PDF, JPG, or PNG file.');
      }

      if (!text || text.trim().length < 50) {
        throw new Error('Unable to extract sufficient text from the file. Please ensure the file contains readable text.');
      }

      setExtractedText(text);
      const parsed = await parseResumeData(text);
      setParsedData(parsed);
      setEditedData(parsed); // Initialize edited data
      setActiveView('results');
    } catch (error) {
      console.error('Error processing file:', error);
      let errorMessage = 'Processing failed. ';
      
      if (error.message.includes('JSON')) {
        errorMessage += 'AI parsing failed - please try again. If the issue persists, the AI service may be having difficulties.';
      } else if (error.message.includes('AI service')) {
        errorMessage += 'AI service is not available. Please ensure Ollama is running with the qwen2.5:1.5b model.';
      } else {
        errorMessage += error.message;
      }
      
      alert(errorMessage);
      setActiveView('upload');
    } finally {
      setIsProcessing(false);
    }
  }, [aiStatus]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFileUpload(droppedFile);
    }
  }, [handleFileUpload]);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
  }, []);

  const downloadPDF = async () => {
    if (!editedData) {
      alert('No resume data available to download.');
      return;
    }
    
    try {
      // Create HTML content
      const resumeHtml = generateTraditionalResumeTemplate(editedData);
      
      // Create a blob and download as HTML first (for debugging)
      const blob = new Blob([resumeHtml], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      
      // Open in new window for printing
      const printWindow = window.open(url, '_blank', 'width=800,height=600');
      
      if (!printWindow) {
        // Fallback: direct download
        const a = document.createElement('a');
        a.href = url;
        a.download = `${editedData.personalInfo?.name || 'Resume'}_Professional.html`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        alert('Resume downloaded as HTML. Open the file and use your browser\'s print function to save as PDF.');
        return;
      }
      
      // Wait for window to load then trigger print
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print();
          // Don't close automatically - let user handle it
        }, 1000);
      };
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again or contact support if the issue persists.');
    }
  };

  const downloadTemplate = () => {
    downloadPDF();
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = () => {
    setIsEditing(false);
    setParsedData(editedData);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedData(parsedData);
  };

  const updateField = (section, field, value, index = null) => {
    setEditedData(prev => {
      const newData = { ...prev };
      
      if (index !== null) {
        // Handle array items (experience, education, projects, etc.)
        if (!newData[section]) newData[section] = [];
        if (!newData[section][index]) newData[section][index] = {};
        
        if (field === 'description' && Array.isArray(value)) {
          // For description arrays
          newData[section][index][field] = value;
        } else {
          // For other fields
          newData[section][index][field] = value;
        }
      } else if (section === 'personalInfo') {
        // Handle personal info
        if (!newData.personalInfo) newData.personalInfo = {};
        newData.personalInfo[field] = value;
      } else if (section === 'skills') {
        // Handle skills array
        newData.skills = value.split(',').map(skill => skill.trim()).filter(Boolean);
      }
      
      return newData;
    });
  };

  const addNewItem = (section) => {
    setEditedData(prev => {
      const newData = { ...prev };
      if (!newData[section]) newData[section] = [];
      
      switch (section) {
        case 'experience':
          newData[section].push({ position: '', company: '', duration: '', description: [''] });
          break;
        case 'education':
          newData[section].push({ degree: '', institution: '', year: '', description: [''] });
          break;
        case 'projects':
          newData[section].push({ title: '', description: [''] });
          break;
        case 'achievements':
          newData[section].push({ title: '', description: [''] });
          break;
        case 'certificates':
          newData[section].push({ title: '', issuer: '', year: '', description: [''] });
          break;
        default:
          break;
      }
      return newData;
    });
  };

  const removeItem = (section, index) => {
    setEditedData(prev => {
      const newData = { ...prev };
      if (newData[section] && newData[section][index] !== undefined) {
        newData[section].splice(index, 1);
      }
      return newData;
    });
  };

  const generateTraditionalResumeTemplate = (data) => {
    const name = data.personalInfo?.name || 'Your Name';
    const email = data.personalInfo?.email || '';
    const phone = data.personalInfo?.phone || '';
    const location = data.personalInfo?.location || '';

    // Contact info section
    const contactInfo = [email, phone].filter(Boolean).join(' | ');

    // Experience section (using our JSON structure)
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
            ${exp.description && exp.description.length > 0 ? `
              <ul class="bullet-list">
                ${exp.description.map(desc => `<li>${desc}</li>`).join('')}
              </ul>
            ` : ''}
          </div>
        `).join('')}
      </div>
    ` : '';

    // Projects section (using our JSON structure)
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
            ${project.description && project.description.length > 0 ? `
              <ul class="bullet-list">
                ${project.description.map(desc => `<li>${desc}</li>`).join('')}
              </ul>
            ` : ''}
          </div>
        `).join('')}
      </div>
    ` : '';

    // Education section
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
            ${edu.description && edu.description.length > 0 ? `
              <ul class="bullet-list">
                ${edu.description.map(desc => `<li>${desc}</li>`).join('')}
              </ul>
            ` : ''}
          </div>
        `).join('')}
      </div>
    ` : '';

    // Skills section (formatted like your sample)
    const skillsSection = (data.skills && data.skills.length > 0) ? `
      <div class="section">
        <h2 class="section-title">TECHNICAL SKILLS</h2>
        <div class="skills-text">${data.skills.join(' | ')}</div>
      </div>
    ` : '';

    // Achievements section (using our JSON structure)
    const achievementsSection = (data.achievements && data.achievements.length > 0) ? `
      <div class="section">
        <h2 class="section-title">ACHIEVEMENTS & AWARDS</h2>
        ${data.achievements.map(achievement => `
          <div class="entry">
            <div class="achievement-title"><strong>${achievement.title || 'Achievement'}</strong></div>
            ${achievement.description && achievement.description.length > 0 ? `
              <ul class="bullet-list">
                ${achievement.description.map(desc => `<li>${desc}</li>`).join('')}
              </ul>
            ` : ''}
          </div>
        `).join('')}
      </div>
    ` : '';

    // Certificates section (renamed to coursework like your sample)
    const certificatesSection = (data.certificates && data.certificates.length > 0) ? `
      <div class="section">
        <h2 class="section-title">CERTIFICATIONS & COURSEWORK</h2>
        <div class="coursework-text">${data.certificates.map(cert => `${cert.title} (${cert.issuer || 'Provider'})`).join(' | ')}</div>
      </div>
    ` : '';

    // Additional info (can be memberships, languages, etc.)
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

  return (
    <div className="app-container">
      {/* Navigation Bar */}
      <nav className="navbar">
        <div className="nav-content">
          <div className="nav-brand">
            <h2>JobDekho</h2>
          </div>
          <div className="nav-links">
            <a href="#" className="nav-link active">Resume Parser</a>
            <a href="#" className="nav-link">Jobs</a>
            <a href="#" className="nav-link">Companies</a>
            <a href="#" className="nav-link">Profile</a>
          </div>
          <button 
            className="mobile-menu-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
        
        {/* Mobile Menu */}
        <div className={`mobile-menu ${mobileMenuOpen ? 'open' : ''}`}>
          <a href="#" className="mobile-nav-link active">Resume Parser</a>
          <a href="#" className="mobile-nav-link">Jobs</a>
          <a href="#" className="mobile-nav-link">Companies</a>
          <a href="#" className="mobile-nav-link">Profile</a>
        </div>
      </nav>

      <div className="app-content">
        <div className="header-section">
          <h1 className="app-title">Smart Resume Parser</h1>
          <p className="app-subtitle">Transform your resume into a professional format and get instant analysis</p>
        </div>

        <div className="status-section">
          <div className={aiStatus === 'connected' ? 'status-enabled' : 'status-disabled'}>
            {aiStatus === 'connected' ? (
              <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                <CheckCircle className="status-icon" />
                AI Parser Ready
              </div>
            ) : aiStatus === 'checking' ? (
              <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                <Settings className="status-icon" />
                Checking service status...
              </div>
            ) : (
              <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
                <XCircle className="status-icon" />
                Service unavailable - Limited functionality
                <button onClick={checkAiStatus} className="status-retry-button">
                  <Settings className="status-button-icon" />
                  Retry
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="nav-buttons">
          <div className="nav-container">
            <button
              onClick={() => setActiveView('upload')}
              className={'nav-button ' + (activeView === 'upload' ? 'active' : '')}
            >
              <Upload className="nav-icon" />
              Upload Resume
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

        {activeView === 'upload' && (
          <div className="upload-section">
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              className="upload-area"
            >
              <Upload className="upload-icon" />
              <h3 className="upload-title">Upload Your Resume</h3>
              <p className="upload-subtitle">Drag and drop your resume here, or click to browse</p>
              <p className="upload-formats">Supports PDF, JPG, and PNG files</p>
              <input
                type="file"
                accept=".pdf,image/*"
                onChange={(e) => e.target.files[0] && handleFileUpload(e.target.files[0])}
                className="file-input"
                id="file-upload"
              />
              <label htmlFor="file-upload" className="upload-button">
                Choose File
              </label>
            </div>

            {aiStatus !== 'connected' && (
              <div className="service-info">
                <h3>❌ AI Service Required</h3>
                <p>Please ensure Ollama is running with the qwen2.5:1.5b model installed. Resume parsing will not work without the AI service.</p>
                <div style={{ marginTop: '15px', padding: '15px', background: '#f1f5f9', borderRadius: '8px' }}>
                  <h4>Setup Instructions:</h4>
                  <ol style={{ marginLeft: '20px', lineHeight: '1.6' }}>
                    <li>Download and install Ollama from <a href="https://ollama.ai" target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb' }}>ollama.ai</a></li>
                    <li>Run: <code style={{ background: '#e2e8f0', padding: '2px 6px', borderRadius: '4px' }}>ollama pull qwen2.5:1.5b</code></li>
                    <li>Ensure Ollama is running in the background</li>
                    <li>Click "Retry" above to reconnect</li>
                  </ol>
                </div>
              </div>
            )}
          </div>
        )}

        {activeView === 'processing' && (
          <div className="processing-section">
            <div className="spinner"></div>
            <h3 className="processing-title">Processing Your Resume</h3>
            <p className="processing-subtitle">Analyzing content and extracting information...</p>
          </div>
        )}

        {activeView === 'results' && parsedData && (
          <div className="results-section">
            {/* Resume Preview - Formatted like template */}
            <div className="resume-preview">
              <div className="resume-header">
                <h1 className="resume-name">
                  {isEditing ? (
                    <input
                      type="text"
                      value={editedData?.personalInfo?.name || ''}
                      onChange={(e) => updateField('personalInfo', 'name', e.target.value)}
                      className="edit-input name-input"
                    />
                  ) : (
                    editedData?.personalInfo?.name || 'Your Name'
                  )}
                </h1>
                <div className="resume-contact">
                  {isEditing ? (
                    <>
                      <input
                        type="email"
                        value={editedData?.personalInfo?.email || ''}
                        onChange={(e) => updateField('personalInfo', 'email', e.target.value)}
                        className="edit-input"
                        placeholder="Email"
                      />
                      <span> | </span>
                      <input
                        type="tel"
                        value={editedData?.personalInfo?.phone || ''}
                        onChange={(e) => updateField('personalInfo', 'phone', e.target.value)}
                        className="edit-input"
                        placeholder="Phone"
                      />
                    </>
                  ) : (
                    `${editedData?.personalInfo?.email || ''} | ${editedData?.personalInfo?.phone || ''}`
                  )}
                </div>
              </div>

              {/* Professional Experience Section */}
              {editedData?.experience && editedData.experience.length > 0 && (
                <div className="resume-section">
                  <h2 className="resume-section-title">PROFESSIONAL EXPERIENCE</h2>
                  {editedData.experience.map((exp, index) => (
                    <div key={index} className="resume-entry">
                      <div className="resume-entry-header">
                        <div className="resume-company-position">
                          {isEditing ? (
                            <>
                              <input
                                type="text"
                                value={exp.company || ''}
                                onChange={(e) => updateField('experience', 'company', e.target.value, index)}
                                className="edit-input"
                                placeholder="Company"
                              />
                              <span>, </span>
                              <input
                                type="text"
                                value={exp.position || ''}
                                onChange={(e) => updateField('experience', 'position', e.target.value, index)}
                                className="edit-input"
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
                              value={exp.duration || ''}
                              onChange={(e) => updateField('experience', 'duration', e.target.value, index)}
                              className="edit-input duration-input"
                              placeholder="Duration"
                            />
                          ) : (
                            <em>{exp.duration || 'Duration'}</em>
                          )}
                        </div>
                      </div>
                      {exp.description && Array.isArray(exp.description) && exp.description.length > 0 && (
                        <ul className="resume-bullet-list">
                          {exp.description.map((desc, descIndex) => (
                            <li key={descIndex}>
                              {isEditing ? (
                                <textarea
                                  value={desc}
                                  onChange={(e) => {
                                    const newDesc = [...exp.description];
                                    newDesc[descIndex] = e.target.value;
                                    updateField('experience', 'description', newDesc, index);
                                  }}
                                  className="edit-textarea"
                                  rows="2"
                                />
                              ) : (
                                desc
                              )}
                            </li>
                          ))}
                        </ul>
                      )}
                      {isEditing && (
                        <button
                          onClick={() => removeItem('experience', index)}
                          className="remove-btn"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  ))}
                  {isEditing && (
                    <button
                      onClick={() => addNewItem('experience')}
                      className="add-btn"
                    >
                      + Add Experience
                    </button>
                  )}
                </div>
              )}

              {/* Education Section */}
              {editedData?.education && editedData.education.length > 0 && (
                <div className="resume-section">
                  <h2 className="resume-section-title">EDUCATION</h2>
                  {editedData.education.map((edu, index) => (
                    <div key={index} className="resume-entry">
                      <div className="resume-entry-header">
                        <div className="resume-company-position">
                          {isEditing ? (
                            <input
                              type="text"
                              value={edu.institution || ''}
                              onChange={(e) => updateField('education', 'institution', e.target.value, index)}
                              className="edit-input"
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
                              value={edu.year || ''}
                              onChange={(e) => updateField('education', 'year', e.target.value, index)}
                              className="edit-input duration-input"
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
                            value={edu.degree || ''}
                            onChange={(e) => updateField('education', 'degree', e.target.value, index)}
                            className="edit-input"
                            placeholder="Degree"
                          />
                        ) : (
                          edu.degree || 'Degree'
                        )}
                      </div>
                      {isEditing && (
                        <button
                          onClick={() => removeItem('education', index)}
                          className="remove-btn"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  ))}
                  {isEditing && (
                    <button
                      onClick={() => addNewItem('education')}
                      className="add-btn"
                    >
                      + Add Education
                    </button>
                  )}
                </div>
              )}

              {/* Technical Skills Section */}
              {editedData?.skills && editedData.skills.length > 0 && (
                <div className="resume-section">
                  <h2 className="resume-section-title">TECHNICAL SKILLS</h2>
                  <div className="resume-skills-text">
                    {isEditing ? (
                      <textarea
                        value={editedData.skills.join(', ')}
                        onChange={(e) => updateField('skills', 'skills', e.target.value)}
                        className="edit-textarea skills-textarea"
                        placeholder="Enter skills separated by commas"
                        rows="3"
                      />
                    ) : (
                      editedData.skills.join(' | ')
                    )}
                  </div>
                </div>
              )}

              {/* Projects Section */}
              {editedData?.projects && editedData.projects.length > 0 && (
                <div className="resume-section">
                  <h2 className="resume-section-title">KEY PROJECTS</h2>
                  {editedData.projects.map((project, index) => (
                    <div key={index} className="resume-entry">
                      <div className="resume-project-title">
                        {isEditing ? (
                          <input
                            type="text"
                            value={project.title || ''}
                            onChange={(e) => updateField('projects', 'title', e.target.value, index)}
                            className="edit-input"
                            placeholder="Project Title"
                          />
                        ) : (
                          <strong>{project.title || 'Project Title'}</strong>
                        )}
                      </div>
                      {project.description && Array.isArray(project.description) && project.description.length > 0 && (
                        <ul className="resume-bullet-list">
                          {project.description.map((desc, descIndex) => (
                            <li key={descIndex}>
                              {isEditing ? (
                                <textarea
                                  value={desc}
                                  onChange={(e) => {
                                    const newDesc = [...project.description];
                                    newDesc[descIndex] = e.target.value;
                                    updateField('projects', 'description', newDesc, index);
                                  }}
                                  className="edit-textarea"
                                  rows="2"
                                />
                              ) : (
                                desc
                              )}
                            </li>
                          ))}
                        </ul>
                      )}
                      {isEditing && (
                        <button
                          onClick={() => removeItem('projects', index)}
                          className="remove-btn"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  ))}
                  {isEditing && (
                    <button
                      onClick={() => addNewItem('projects')}
                      className="add-btn"
                    >
                      + Add Project
                    </button>
                  )}
                </div>
              )}

              {/* Achievements Section */}
              {editedData?.achievements && editedData.achievements.length > 0 && (
                <div className="resume-section">
                  <h2 className="resume-section-title">ACHIEVEMENTS & AWARDS</h2>
                  {editedData.achievements.map((achievement, index) => (
                    <div key={index} className="resume-entry">
                      <div className="resume-project-title">
                        {isEditing ? (
                          <input
                            type="text"
                            value={achievement.title || ''}
                            onChange={(e) => updateField('achievements', 'title', e.target.value, index)}
                            className="edit-input"
                            placeholder="Achievement Title"
                          />
                        ) : (
                          <strong>{achievement.title || 'Achievement Title'}</strong>
                        )}
                      </div>
                      {achievement.description && Array.isArray(achievement.description) && achievement.description.length > 0 && (
                        <ul className="resume-bullet-list">
                          {achievement.description.map((desc, descIndex) => (
                            <li key={descIndex}>
                              {isEditing ? (
                                <textarea
                                  value={desc}
                                  onChange={(e) => {
                                    const newDesc = [...achievement.description];
                                    newDesc[descIndex] = e.target.value;
                                    updateField('achievements', 'description', newDesc, index);
                                  }}
                                  className="edit-textarea"
                                  rows="2"
                                />
                              ) : (
                                desc
                              )}
                            </li>
                          ))}
                        </ul>
                      )}
                      {isEditing && (
                        <button
                          onClick={() => removeItem('achievements', index)}
                          className="remove-btn"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  ))}
                  {isEditing && (
                    <button
                      onClick={() => addNewItem('achievements')}
                      className="add-btn"
                    >
                      + Add Achievement
                    </button>
                  )}
                </div>
              )}

              {/* Certificates Section */}
              {editedData?.certificates && editedData.certificates.length > 0 && (
                <div className="resume-section">
                  <h2 className="resume-section-title">CERTIFICATIONS & COURSEWORK</h2>
                  <div className="resume-skills-text">
                    {isEditing ? (
                      <textarea
                        value={editedData.certificates.map(cert => `${cert.title} (${cert.issuer || 'Provider'})`).join(' | ')}
                        onChange={(e) => {
                          const items = e.target.value.split('|').map(item => item.trim());
                          const newCerts = items.map(item => {
                            const match = item.match(/^(.+?)\s*\((.+?)\)$/);
                            if (match) {
                              return { title: match[1].trim(), issuer: match[2].trim(), year: '', description: [] };
                            }
                            return { title: item, issuer: '', year: '', description: [] };
                          });
                          setEditedData(prev => ({ ...prev, certificates: newCerts }));
                        }}
                        className="edit-textarea skills-textarea"
                        placeholder="Enter certifications as: Title (Issuer) | Title (Issuer)"
                        rows="3"
                      />
                    ) : (
                      editedData.certificates.map(cert => `${cert.title} (${cert.issuer || 'Provider'})`).join(' | ')
                    )}
                  </div>
                  {isEditing && (
                    <button
                      onClick={() => addNewItem('certificates')}
                      className="add-btn"
                    >
                      + Add Certificate
                    </button>
                  )}
                </div>
              )}

              {/* Additional Information Section */}
              {editedData?.additionalInformation && editedData.additionalInformation.length > 0 && (
                <div className="resume-section">
                  <h2 className="resume-section-title">ADDITIONAL INFORMATION</h2>
                  <div className="resume-skills-text">
                    {isEditing ? (
                      <textarea
                        value={editedData.additionalInformation.join(' | ')}
                        onChange={(e) => {
                          const items = e.target.value.split('|').map(item => item.trim()).filter(Boolean);
                          setEditedData(prev => ({ ...prev, additionalInformation: items }));
                        }}
                        className="edit-textarea skills-textarea"
                        placeholder="Enter additional information separated by |"
                        rows="3"
                      />
                    ) : (
                      editedData.additionalInformation.join(' | ')
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="resume-actions">
              {isEditing ? (
                <div className="edit-actions">
                  <button onClick={handleSave} className="save-button">
                    <CheckCircle className="button-icon" />
                    Save Changes
                  </button>
                  <button onClick={handleCancel} className="cancel-button">
                    <XCircle className="button-icon" />
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="view-actions">
                  <button onClick={handleEdit} className="edit-button">
                    <Settings className="button-icon" />
                    Edit Resume
                  </button>
                  <button onClick={downloadTemplate} className="download-button">
                    <Download className="button-icon" />
                    Download PDF
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResumeParser;