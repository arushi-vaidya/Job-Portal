import React, { useState, useCallback, useEffect } from 'react';
import { Upload, FileText, User, Mail, Phone, MapPin, Briefcase, GraduationCap, Code, Download, Eye, Award, BadgeCheck, Info as InfoIcon, Settings, CheckCircle, XCircle } from 'lucide-react';
import './ResumeParser.css';

const ResumeParser = () => {
  const [extractedText, setExtractedText] = useState('');
  const [parsedData, setParsedData] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeView, setActiveView] = useState('upload');
  const [ollamaStatus, setOllamaStatus] = useState('checking');

  // Check Ollama status on component mount
  useEffect(() => {
    checkOllamaStatus();
  }, []);

  const checkOllamaStatus = async () => {
    try {
      const response = await fetch('http://localhost:11434/api/tags');
      if (response.ok) {
        setOllamaStatus('connected');
      } else {
        setOllamaStatus('disconnected');
      }
    } catch (error) {
      setOllamaStatus('disconnected');
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

  // Parse using Ollama qwen2.5:1.5b
  const parseWithOllama = async (text) => {
    const promptText = "You are an expert resume parser. Extract structured information from the following resume text and return it as valid JSON.\n\nRESUME TEXT:\n" + text + "\n\nTASK: Parse the above resume and return ONLY a JSON object with this EXACT structure:\n\n{\n  \"personalInfo\": {\n    \"name\": \"string\",\n    \"email\": \"string\", \n    \"phone\": \"string\",\n    \"location\": \"string\"\n  },\n  \"experience\": [\n    {\n      \"position\": \"string\",\n      \"company\": \"string\", \n      \"duration\": \"string\",\n      \"description\": [\"string\"]\n    }\n  ],\n  \"education\": [\n    {\n      \"degree\": \"string\",\n      \"institution\": \"string\",\n      \"year\": \"string\",\n      \"description\": [\"string\"]\n    }\n  ],\n  \"projects\": [\n    {\n      \"title\": \"string\",\n      \"description\": [\"string\"]\n    }\n  ],\n  \"achievements\": [\n    {\n      \"title\": \"string\",\n      \"description\": [\"string\"]\n    }\n  ],\n  \"certificates\": [\n    {\n      \"title\": \"string\",\n      \"issuer\": \"string\",\n      \"year\": \"string\",\n      \"description\": [\"string\"]\n    }\n  ],\n  \"skills\": [\"string\"],\n  \"additionalInformation\": [\"string\"]\n}\n\nRULES:\n1. Return ONLY the JSON object, no other text\n2. Use empty strings for missing text fields\n3. Use empty arrays for missing array fields\n4. Extract ALL information present in the resume\n5. Be thorough and accurate\n\nJSON:";

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
      throw new Error('Ollama API error: ' + response.status);
    }

    const data = await response.json();
    const generatedText = data.response;
    
    if (!generatedText) {
      throw new Error('No response from Ollama');
    }

    // Find JSON in the response
    let jsonMatch = generatedText.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) {
      const jsonStart = generatedText.indexOf('{');
      const jsonEnd = generatedText.lastIndexOf('}');
      if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
        jsonMatch = [generatedText.substring(jsonStart, jsonEnd + 1)];
      }
    }
    
    if (!jsonMatch) {
      throw new Error('No valid JSON found in response');
    }

    let jsonStr = jsonMatch[0].trim();
    
    if (jsonStr.includes('\n\n')) {
      jsonStr = jsonStr.split('\n\n')[0];
    }
    
    return JSON.parse(jsonStr);
  };

  // Main parsing function
  const parseResumeData = async (text) => {
    if (ollamaStatus !== 'connected') {
      throw new Error('Ollama not connected. Please install Ollama and qwen2.5:1.5b model.');
    }

    console.log('Using Ollama qwen2.5:1.5b for parsing...');
    return await parseWithOllama(text);
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
        throw new Error('Unsupported file type');
      }

      setExtractedText(text);
      const parsed = await parseResumeData(text);
      setParsedData(parsed);
      setActiveView('results');
    } catch (error) {
      console.error('Error processing file:', error);
      alert('Error processing file: ' + error.message);
      setActiveView('upload');
    } finally {
      setIsProcessing(false);
    }
  }, [ollamaStatus]);

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

  const downloadTemplate = () => {
    if (!parsedData) return;
    
    const resumeHtml = generateResumeTemplate(parsedData);
    const blob = new Blob([resumeHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'formatted-resume.html';
    a.click();
    URL.revokeObjectURL(url);
  };

  const generateResumeTemplate = (data) => {
    const skillsSection = data.skills.length > 0 ? 
      '<div class="section"><h2>Skills</h2><div class="skills-grid">' + 
      data.skills.map(skill => '<div class="skill-item">' + skill + '</div>').join('') + 
      '</div></div>' : '';

    return '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Resume - ' + (data.personalInfo.name || 'Candidate') + '</title><style>body { font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 20px; }.header { text-align: center; border-bottom: 3px solid #2563eb; padding-bottom: 20px; margin-bottom: 30px; }.header h1 { color: #1e40af; margin: 0; font-size: 2.5em; }.contact-info { display: flex; justify-content: center; gap: 20px; margin-top: 10px; flex-wrap: wrap; }.contact-item { display: flex; align-items: center; gap: 5px; }.section { margin-bottom: 30px; }.section h2 { color: #1e40af; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px; }.experience-item, .education-item { margin-bottom: 20px; padding: 15px; background: #f8fafc; border-left: 4px solid #2563eb; }.job-title { font-weight: bold; color: #1e40af; }.company { color: #64748b; font-style: italic; }.duration { color: #64748b; font-size: 0.9em; }.skills-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px; }.skill-item { background: #e0e7ff; color: #3730a3; padding: 8px 12px; border-radius: 20px; text-align: center; }</style></head><body><div class="header"><h1>' + (data.personalInfo.name || 'Your Name') + '</h1><div class="contact-info">' + 
    (data.personalInfo.email ? '<div class="contact-item">📧 ' + data.personalInfo.email + '</div>' : '') +
    (data.personalInfo.phone ? '<div class="contact-item">📞 ' + data.personalInfo.phone + '</div>' : '') +
    (data.personalInfo.location ? '<div class="contact-item">📍 ' + data.personalInfo.location + '</div>' : '') +
    '</div></div>' + skillsSection + '</body></html>';
  };

  return (
    <div className="app-container">
      <div className="app-content">
        <div className="header-section">
          <h1 className="app-title">Resume Parser</h1>
          <p className="app-subtitle">Local AI-powered resume parsing with Qwen2.5:1.5b</p>
        </div>

        <div className="api-status">
          <div className={ollamaStatus === 'connected' ? 'api-enabled' : 'api-disabled'}>
            {ollamaStatus === 'connected' ? (
              <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                <CheckCircle className="api-icon" />
                Ollama Connected (qwen2.5:1.5b ready)
              </div>
            ) : ollamaStatus === 'checking' ? (
              <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                <Settings className="api-icon" />
                Checking Ollama status...
              </div>
            ) : (
              <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
                <XCircle className="api-icon" />
                Ollama not connected - Need qwen2.5:1.5b model
                <button onClick={checkOllamaStatus} className="api-setup-button">
                  <Settings className="api-button-icon" />
                  Retry Connection
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
              Upload
            </button>
            <button
              onClick={() => setActiveView('results')}
              className={'nav-button ' + (activeView === 'results' ? 'active' : '') + (!parsedData ? ' disabled' : '')}
              disabled={!parsedData}
            >
              <Eye className="nav-icon" />
              Results
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
              <h3 className="upload-title">Drop your resume here</h3>
              <p className="upload-subtitle">Supports PDF and image files (JPG, PNG)</p>
              {ollamaStatus !== 'connected' && (
                <p style={{ color: '#ff9800', fontSize: '0.9em', marginTop: '10px' }}>
                  ⚠️ Ollama not connected. Please install Ollama and the qwen2.5:1.5b model.
                </p>
              )}
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

            {ollamaStatus !== 'connected' && (
              <div className="ollama-setup" style={{ 
                marginTop: '30px', 
                padding: '20px', 
                backgroundColor: '#f8f9fa', 
                borderRadius: '12px',
                border: '1px solid #e9ecef'
              }}>
                <h3 style={{ color: '#333', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Settings size={20} />
                  Required: Install Ollama & Model
                </h3>
                <p style={{ color: '#666', marginBottom: '15px' }}>
                  This app requires Ollama with the qwen2.5:1.5b model:
                </p>
                <ol style={{ color: '#666', paddingLeft: '20px', lineHeight: '1.6' }}>
                  <li>Download Ollama from <a href="https://ollama.ai" target="_blank" rel="noopener noreferrer" style={{ color: '#1976d2' }}>ollama.ai</a></li>
                  <li>Install and start Ollama</li>
                  <li>Run: <code style={{ background: '#e9ecef', padding: '2px 6px', borderRadius: '4px' }}>ollama pull qwen2.5:1.5b</code></li>
                  <li>Refresh this page to connect</li>
                </ol>
                <p style={{ color: '#666', fontSize: '0.9em', marginTop: '15px' }}>
                  💡 Model size: ~1GB, Processing speed: 3-8 seconds
                </p>
              </div>
            )}
          </div>
        )}

        {activeView === 'processing' && (
          <div className="processing-section">
            <div className="spinner"></div>
            <h3 className="processing-title">Processing Your Resume</h3>
            <p className="processing-subtitle">Using qwen2.5:1.5b for AI parsing...</p>
          </div>
        )}

        {activeView === 'results' && parsedData && (
          <div className="results-section">
            <div className="results-card">
              <div className="results-header">
                <h2 className="results-title">Parsed Resume Data</h2>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <span style={{ 
                    fontSize: '0.85rem', 
                    color: '#4caf50', 
                    backgroundColor: '#e8f5e8', 
                    padding: '4px 8px', 
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    <CheckCircle size={14} />
                    AI Parsed (qwen2.5:1.5b)
                  </span>
                  <button onClick={downloadTemplate} className="download-button">
                    <Download className="button-icon" />
                    Download Template
                  </button>
                </div>
              </div>

              <div className="results-grid">
                <div className="results-column">
                  <div className="info-card personal-info accent-personal">
                    <h3 className="card-title">
                      <User className="card-icon" />
                      Personal Information
                    </h3>
                    <div className="info-items">
                      <div className="info-item">
                        <User className="info-icon" />
                        <span className="info-label">Name:</span>
                        <span className="info-value">{parsedData.personalInfo.name || 'Not found'}</span>
                      </div>
                      <div className="info-item">
                        <Mail className="info-icon" />
                        <span className="info-label">Email:</span>
                        <span className="info-value">{parsedData.personalInfo.email || 'Not found'}</span>
                      </div>
                      <div className="info-item">
                        <Phone className="info-icon" />
                        <span className="info-label">Phone:</span>
                        <span className="info-value">{parsedData.personalInfo.phone || 'Not found'}</span>
                      </div>
                      <div className="info-item">
                        <MapPin className="info-icon" />
                        <span className="info-label">Location:</span>
                        <span className="info-value">{parsedData.personalInfo.location || 'Not found'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="info-card experience-info accent-experience">
                    <h3 className="card-title">
                      <Briefcase className="card-icon" />
                      Experience ({parsedData.experience.length})
                    </h3>
                    <div className="experience-items">
                      {parsedData.experience.length > 0 ? parsedData.experience.map((exp, index) => (
                        <div key={index} className="experience-item">
                          <div className="exp-position">{exp.position || 'Position not specified'}</div>
                          <div className="exp-company">{exp.company || 'Company not specified'}</div>
                          <div className="exp-duration">{exp.duration || 'Duration not specified'}</div>
                          {exp.description && Array.isArray(exp.description) && exp.description.length > 0 && (
                            <ul>
                              {exp.description.map((desc, descIndex) => (
                                <li key={descIndex}>{desc}</li>
                              ))}
                            </ul>
                          )}
                        </div>
                      )) : <p className="no-data">No experience found</p>}
                    </div>
                  </div>
                </div>

                <div className="results-column">
                  <div className="info-card education-info accent-education">
                    <h3 className="card-title">
                      <GraduationCap className="card-icon" />
                      Education ({parsedData.education.length})
                    </h3>
                    <div className="education-items">
                      {parsedData.education.length > 0 ? parsedData.education.map((edu, index) => (
                        <div key={index} className="education-item">
                          <div className="edu-degree">{edu.degree || 'Degree not specified'}</div>
                          <div className="edu-institution">{edu.institution || 'Institution not specified'}</div>
                          <div className="edu-year">{edu.year || 'Year not specified'}</div>
                          {edu.description && Array.isArray(edu.description) && edu.description.length > 0 && (
                            <ul>
                              {edu.description.map((desc, descIndex) => (
                                <li key={descIndex}>{desc}</li>
                              ))}
                            </ul>
                          )}
                        </div>
                      )) : <p className="no-data">No education found</p>}
                    </div>
                  </div>

                  <div className="info-card skills-info accent-skills">
                    <h3 className="card-title">
                      <Code className="card-icon" />
                      Skills ({parsedData.skills.length})
                    </h3>
                    <div className="skills-grid">
                      {parsedData.skills && parsedData.skills.length > 0 ? parsedData.skills.map((skill, index) => (
                        <span key={index} className="skill-tag">
                          {skill}
                        </span>
                      )) : <p className="no-data">No skills found</p>}
                    </div>
                  </div>

                  <div className="info-card projects-info accent-projects">
                    <h3 className="card-title">
                      <Code className="card-icon" />
                      Projects ({parsedData.projects.length})
                    </h3>
                    <div className="projects-list">
                      {parsedData.projects.length > 0 ? parsedData.projects.map((project, index) => (
                        <div key={index} className="project-item">
                          <div className="project-title">{project.title || 'Project title not specified'}</div>
                          {project.description && Array.isArray(project.description) && project.description.length > 0 && (
                            <ul>
                              {project.description.map((desc, descIndex) => (
                                <li key={descIndex}>{desc}</li>
                              ))}
                            </ul>
                          )}
                        </div>
                      )) : <p className="no-data">No projects found</p>}
                    </div>
                  </div>

                  <div className="info-card achievements-info accent-achievements">
                    <h3 className="card-title">
                      <Award className="card-icon" />
                      Achievements ({parsedData.achievements.length})
                    </h3>
                    <div className="achievements-list">
                      {parsedData.achievements.length > 0 ? parsedData.achievements.map((achievement, index) => (
                        <div key={index} className="achievement-item">
                          <div className="achievement-title">{achievement.title || 'Achievement title not specified'}</div>
                          {achievement.description && Array.isArray(achievement.description) && achievement.description.length > 0 && (
                            <ul>
                              {achievement.description.map((desc, descIndex) => (
                                <li key={descIndex}>{desc}</li>
                              ))}
                            </ul>
                          )}
                        </div>
                      )) : <p className="no-data">No achievements found</p>}
                    </div>
                  </div>

                  <div className="info-card certificates-info accent-certificates">
                    <h3 className="card-title">
                      <BadgeCheck className="card-icon" />
                      Certificates ({parsedData.certificates.length})
                    </h3>
                    <div className="certificates-list">
                      {parsedData.certificates.length > 0 ? parsedData.certificates.map((certificate, index) => (
                        <div key={index} className="certificate-item">
                          <div className="certificate-title">{certificate.title || 'Certificate title not specified'}</div>
                          <div className="certificate-issuer">Issued by: {certificate.issuer || 'Issuer not specified'}</div>
                          <div className="certificate-year">Year: {certificate.year || 'Year not specified'}</div>
                          {certificate.description && Array.isArray(certificate.description) && certificate.description.length > 0 && (
                            <ul>
                              {certificate.description.map((desc, descIndex) => (
                                <li key={descIndex}>{desc}</li>
                              ))}
                            </ul>
                          )}
                        </div>
                      )) : <p className="no-data">No certificates found</p>}
                    </div>
                  </div>

                  <div className="info-card additional-info accent-additional-info">
                    <h3 className="card-title">
                      <InfoIcon className="card-icon" />
                      Additional Information
                    </h3>
                    <div className="additional-info-list">
                      {parsedData.additionalInformation && parsedData.additionalInformation.length > 0 ? (
                        <ul>
                          {parsedData.additionalInformation.map((info, index) => (
                            <li key={index}>{info}</li>
                          ))}
                        </ul>
                      ) : <p className="no-data">No additional information found</p>}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResumeParser;