import React, { useState, useCallback } from 'react';
import { Upload, FileText, User, Mail, Phone, MapPin, Briefcase, GraduationCap, Code, Download, Eye, Award, BadgeCheck, Info as InfoIcon } from 'lucide-react';
import './ResumeParser.css';

const ResumeParser = () => {
  const [extractedText, setExtractedText] = useState('');
  const [parsedData, setParsedData] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeView, setActiveView] = useState('upload');

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

  // Parse resume data using Gemini API (free) or fallback to Mistral
  const parseResumeData = async (text) => {
    // Try Gemini API if available
    const geminiApiKey = process.env.REACT_APP_GEMINI_API_KEY;
    if (geminiApiKey) {
      try {
        console.log('Using Gemini API for parsing...');
        const geminiResult = await parseWithGemini(text, geminiApiKey);
        if (geminiResult) {
          console.log('Gemini parsed data:', geminiResult);
          return geminiResult;
        }
      } catch (error) {
        console.error('Gemini API failed, falling back to Mistral:', error);
      }
    } else {
      console.log('No Gemini API key found, using Mistral...');
    }

    // Fallback to Mistral
    const mistralApiKey = process.env.REACT_APP_MISTRAL_API_KEY;
    if (mistralApiKey) {
      try {
        console.log('Using Mistral API for parsing...');
        const mistralResult = await parseWithMistral(text, mistralApiKey);
        if (mistralResult) {
          console.log('Mistral parsed data:', mistralResult);
          return mistralResult;
        }
      } catch (error) {
        console.error('Mistral API failed:', error);
        throw new Error('Both Gemini and Mistral parsing failed.');
      }
    } else {
      throw new Error('No Mistral API key found. Cannot parse resume.');
    }
  };

  // Parse using Gemini API
  const parseWithGemini = async (text, apiKey) => {
    const prompt = `
Extract structured data from this resume text. Return ONLY valid JSON in the exact format specified below, with no additional text or explanations.

Resume text:
"""
${text}
"""

Required JSON format:
{
  "personalInfo": {
    "name": "Full Name or empty string",
    "email": "email@example.com or empty string", 
    "phone": "phone number or empty string",
    "location": "city, state or address or empty string"
  },
  "experience": [
    {
      "position": "Job Title",
      "company": "Company Name", 
      "duration": "Start Date - End Date or Present",
      "description": ["responsibility 1", "responsibility 2"]
    }
  ],
  "education": [
    {
      "degree": "Degree Name",
      "institution": "School/University Name",
      "year": "Graduation Year or Year Range",
      "description": ["detail 1", "detail 2"]
    }
  ],
  "projects": [
    {
      "title": "Project Title",
      "description": ["project detail 1", "project detail 2"]
    }
  ],
  "achievements": [
    {
      "title": "Achievement Title",
      "description": ["achievement detail 1", "achievement detail 2"]
    }
  ],
  "certificates": [
    {
      "title": "Certificate Title",
      "issuer": "Issuer Name",
      "year": "Year or Date",
      "description": ["certificate detail 1", "certificate detail 2"]
    }
  ],
  "skills": ["skill1", "skill2", "skill3"],
  "additionalInformation": ["info1", "info2"]
}

Instructions:
- Extract ALL available information accurately, including projects, achievements, certificates, additional information, and descriptions for every section
- For missing information, use empty strings or empty arrays, not null
- Combine similar skills (e.g., "JS" and "JavaScript" → "JavaScript")
- Format dates consistently (e.g., "2020 - 2023" or "2020 - Present")
- Include relevant technical and soft skills
- Parse multi-column layouts correctly
- Handle poor formatting gracefully
- For every section, extract and include all available descriptions or details
`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.1,
          topK: 1,
          topP: 1,
          maxOutputTokens: 2048,
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!generatedText) {
      throw new Error('No response from Gemini API');
    }

    // Extract JSON from the response
    const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No valid JSON found in Gemini response');
    }

    return JSON.parse(jsonMatch[0]);
  };

  // Parse using Mistral API
  const parseWithMistral = async (text, apiKey) => {
    const prompt = `Extract structured data from this resume text. Return ONLY valid JSON in the exact format specified below, with no additional text or explanations.\n\nResume text:\n"""\n${text}\n"""\n\nRequired JSON format:\n{\n  "personalInfo": {\n    "name": "Full Name or empty string",\n    "email": "email@example.com or empty string", \n    "phone": "phone number or empty string",\n    "location": "city, state or address or empty string"\n  },\n  "experience": [\n    {\n      "position": "Job Title",\n      "company": "Company Name", \n      "duration": "Start Date - End Date or Present",\n      "description": ["responsibility 1", "responsibility 2"]\n    }\n  ],\n  "education": [\n    {\n      "degree": "Degree Name",\n      "institution": "School/University Name",\n      "year": "Graduation Year or Year Range",\n      "description": ["detail 1", "detail 2"]\n    }\n  ],\n  "projects": [\n    {\n      "title": "Project Title",\n      "description": ["project detail 1", "project detail 2"]\n    }\n  ],\n  "achievements": [\n    {\n      "title": "Achievement Title",\n      "description": ["achievement detail 1", "achievement detail 2"]\n    }\n  ],\n  "certificates": [\n    {\n      "title": "Certificate Title",\n      "issuer": "Issuer Name",\n      "year": "Year or Date",\n      "description": ["certificate detail 1", "certificate detail 2"]\n    }\n  ],\n  "skills": ["skill1", "skill2", "skill3"],\n  "additionalInformation": ["info1", "info2"]\n}\n\nInstructions:\n- Extract ALL available information accurately, including projects, achievements, certificates, additional information, and descriptions for every section\n- For missing information, use empty strings or empty arrays, not null\n- Combine similar skills (e.g., "JS" and "JavaScript" → "JavaScript")\n- Format dates consistently (e.g., "2020 - 2023" or "2020 - Present")\n- Include relevant technical and soft skills\n- Parse multi-column layouts correctly\n- Handle poor formatting gracefully\n- For every section, extract and include all available descriptions or details`;

    const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'mistral-large-latest',
        messages: [
          { role: 'system', content: 'You are a helpful assistant that extracts structured resume data as JSON.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.1,
        max_tokens: 2048
      })
    });

    if (!response.ok) {
      throw new Error(`Mistral API error: ${response.status}`);
    }

    const data = await response.json();
    const generatedText = data.choices?.[0]?.message?.content;
    if (!generatedText) {
      throw new Error('No response from Mistral API');
    }
    // Extract JSON from the response
    const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No valid JSON found in Mistral response');
    }
    return JSON.parse(jsonMatch[0]);
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
      alert('Error processing file. Please try again.');
      setActiveView('upload');
    } finally {
      setIsProcessing(false);
    }
  }, [parseResumeData]);

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
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Resume - ${data.personalInfo.name || 'Candidate'}</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; border-bottom: 3px solid #2563eb; padding-bottom: 20px; margin-bottom: 30px; }
        .header h1 { color: #1e40af; margin: 0; font-size: 2.5em; }
        .contact-info { display: flex; justify-content: center; gap: 20px; margin-top: 10px; flex-wrap: wrap; }
        .contact-item { display: flex; align-items: center; gap: 5px; }
        .section { margin-bottom: 30px; }
        .section h2 { color: #1e40af; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px; }
        .experience-item, .education-item { margin-bottom: 20px; padding: 15px; background: #f8fafc; border-left: 4px solid #2563eb; }
        .job-title { font-weight: bold; color: #1e40af; }
        .company { color: #64748b; font-style: italic; }
        .duration { color: #64748b; font-size: 0.9em; }
        .skills-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px; }
        .skill-item { background: #e0e7ff; color: #3730a3; padding: 8px 12px; border-radius: 20px; text-align: center; }
        ul { list-style-type: none; padding: 0; }
        li { margin-bottom: 5px; padding-left: 15px; position: relative; }
        li:before { content: "•"; color: #2563eb; font-weight: bold; position: absolute; left: 0; }
    </style>
</head>
<body>
    <div class="header">
        <h1>${data.personalInfo.name || 'Your Name'}</h1>
        <div class="contact-info">
            ${data.personalInfo.email ? `<div class="contact-item">✉️ ${data.personalInfo.email}</div>` : ''}
            ${data.personalInfo.phone ? `<div class="contact-item">📞 ${data.personalInfo.phone}</div>` : ''}
            ${data.personalInfo.location ? `<div class="contact-item">📍 ${data.personalInfo.location}</div>` : ''}
        </div>
    </div>

    ${data.experience.length > 0 ? `
    <div class="section">
        <h2>Professional Experience</h2>
        ${data.experience.map(exp => `
        <div class="experience-item">
            <div class="job-title">${exp.position}</div>
            <div class="company">${exp.company}</div>
            <div class="duration">${exp.duration}</div>
            ${exp.description.length > 0 ? `
            <ul>
                ${exp.description.map(desc => `<li>${desc}</li>`).join('')}
            </ul>
            ` : ''}
        </div>
        `).join('')}
    </div>
    ` : ''}

    ${data.education.length > 0 ? `
    <div class="section">
        <h2>Education</h2>
        ${data.education.map(edu => `
        <div class="education-item">
            <div class="job-title">${edu.degree}</div>
            <div class="company">${edu.institution}</div>
            <div class="duration">${edu.year}</div>
            ${edu.description.length > 0 ? `
            <ul>
                ${edu.description.map(desc => `<li>${desc}</li>`).join('')}
            </ul>
            ` : ''}
        </div>
        `).join('')}
    </div>
    ` : ''}

    ${data.projects.length > 0 ? `
    <div class="section">
        <h2>Projects</h2>
        ${data.projects.map(project => `
        <div class="project-item">
            <div class="project-title">${project.title}</div>
            ${project.description.length > 0 ? `
            <ul>
                ${project.description.map(desc => `<li>${desc}</li>`).join('')}
            </ul>
            ` : ''}
        </div>
        `).join('')}
    </div>
    ` : ''}

    ${data.achievements.length > 0 ? `
    <div class="section">
        <h2>Achievements</h2>
        ${data.achievements.map(achievement => `
        <div class="achievement-item">
            <div class="achievement-title">${achievement.title}</div>
            ${achievement.description.length > 0 ? `
            <ul>
                ${achievement.description.map(desc => `<li>${desc}</li>`).join('')}
            </ul>
            ` : ''}
        </div>
        `).join('')}
    </div>
    ` : ''}

    ${data.certificates.length > 0 ? `
    <div class="section">
        <h2>Certificates</h2>
        ${data.certificates.map(certificate => `
        <div class="certificate-item">
            <div class="certificate-title">${certificate.title}</div>
            <div class="certificate-issuer">Issued by: ${certificate.issuer}</div>
            <div class="certificate-year">Year: ${certificate.year}</div>
            ${certificate.description.length > 0 ? `
            <ul>
                ${certificate.description.map(desc => `<li>${desc}</li>`).join('')}
            </ul>
            ` : ''}
        </div>
        `).join('')}
    </div>
    ` : ''}

    ${data.additionalInformation.length > 0 ? `
    <div class="section">
        <h2>Additional Information</h2>
        <ul>
            ${data.additionalInformation.map(info => `<li>${info}</li>`).join('')}
        </ul>
    </div>
    ` : ''}

    ${data.skills.length > 0 ? `
    <div class="section">
        <h2>Skills</h2>
        <div class="skills-grid">
            ${data.skills.map(skill => `<div class="skill-item">${skill}</div>`).join('')}
        </div>
    </div>
    ` : ''}
</body>
</html>`;
  };

  return (
    <div className="app-container">
      <div className="app-content">
        <div className="header-section">
          <h1 className="app-title">Resume Parser</h1>
        </div>

        <div className="nav-buttons">
          <div className="nav-container">
            <button
              onClick={() => setActiveView('upload')}
              className={`nav-button ${activeView === 'upload' ? 'active' : ''}`}
            >
              <Upload className="nav-icon" />
              Upload
            </button>
            <button
              onClick={() => setActiveView('results')}
              className={`nav-button ${activeView === 'results' ? 'active' : ''} ${!parsedData ? 'disabled' : ''}`}
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
          </div>
        )}

        {activeView === 'processing' && (
          <div className="processing-section">
            <div className="spinner"></div>
            <h3 className="processing-title">Processing Your Resume</h3>
            <p className="processing-subtitle">This may take a few moments...</p>
          </div>
        )}

        {activeView === 'results' && parsedData && (
          <div className="results-section">
            <div className="results-card">
              <div className="results-header">
                <h2 className="results-title">Parsed Resume Data</h2>
                <button onClick={downloadTemplate} className="download-button">
                  <Download className="button-icon" />
                  Download Template
                </button>
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
                          <div className="exp-position">{exp.position}</div>
                          <div className="exp-company">{exp.company}</div>
                          <div className="exp-duration">{exp.duration}</div>
                          {exp.description.length > 0 && (
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
                          <div className="edu-degree">{edu.degree}</div>
                          <div className="edu-institution">{edu.institution}</div>
                          <div className="edu-year">{edu.year}</div>
                          {edu.description.length > 0 && (
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
                      {parsedData.skills.length > 0 ? parsedData.skills.map((skill, index) => (
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
                          <div className="project-title">{project.title}</div>
                          {project.description.length > 0 && (
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
                          <div className="achievement-title">{achievement.title}</div>
                          {achievement.description.length > 0 && (
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
                          <div className="certificate-title">{certificate.title}</div>
                          <div className="certificate-issuer">Issued by: {certificate.issuer}</div>
                          <div className="certificate-year">Year: {certificate.year}</div>
                          {certificate.description.length > 0 && (
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
                      {parsedData.additionalInformation.length > 0 ? (
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