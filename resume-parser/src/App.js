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

  // Global error handler
  useEffect(() => {
    const handleGlobalError = (event) => {
      console.error('Global error caught:', event.error);
      event.preventDefault();
      return true;
    };

    const handleUnhandledRejection = (event) => {
      console.error('Unhandled promise rejection:', event.reason);
      event.preventDefault();
      return true;
    };

    window.addEventListener('error', handleGlobalError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleGlobalError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  // Check AI status on component mount
  useEffect(() => {
    try {
      checkAiStatus();
    } catch (err) {
      console.error('Failed to check AI status:', err);
      setAiStatus('disconnected');
    }
  }, []);

  const checkAiStatus = async () => {
    try {
      const response = await fetch('http://localhost:11434/api/tags');
      if (response.ok) {
        setAiStatus('connected');
      } else {
        setAiStatus('disconnected');
      }
    } catch (err) {
      console.error('AI status check failed:', err);
      setAiStatus('disconnected');
    }
  };

  // Clean and preprocess extracted text
  const cleanExtractedText = (text) => {
    return text
      .replace(/\s+/g, ' ')                    // Normalize whitespace
      .replace(/\t/g, ' ')                     // Replace tabs with spaces
      .replace(/\n{3,}/g, '\n\n')             // Reduce excessive newlines
      .replace(/[^\w\s@.\-+()]/g, ' ')        // Keep only alphanumeric, email, phone chars
      .replace(/\s+([.@])/g, '$1')            // Fix spacing around email/phone chars
      .replace(/([.@])\s+/g, '$1')            // Fix spacing around email/phone chars
      .trim();
  };

  // Extract text from PDF using PDF.js (loaded from CDN)
  const extractTextFromPDF = async (file) => {
    return new Promise((resolve, reject) => {
      try {
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
              const pageText = textContent.items
                .map(item => item.str)
                .join(' ')
                .replace(/\s+/g, ' '); // Clean spacing per page
              fullText += pageText + '\n';
            }
            
            resolve(cleanExtractedText(fullText));
          } catch (err) {
            reject(new Error(`PDF extraction failed: ${err && err.message ? err.message : 'Unknown PDF error'}`));
          }
        };
        script.onerror = () => reject(new Error('Failed to load PDF.js library'));
        document.head.appendChild(script);
      } catch (err) {
        reject(new Error(`PDF setup failed: ${err && err.message ? err.message : 'Unknown setup error'}`));
      }
    });
  };

  // Extract text from DOCX using mammoth.js
  const extractTextFromDOCX = async (file) => {
    return new Promise((resolve, reject) => {
      try {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.4.2/mammoth.browser.min.js';
        
        script.onload = async () => {
          try {
            console.log('Mammoth.js loaded, processing DOCX...');
            
            // Check if mammoth is available
            if (!window.mammoth) {
              throw new Error('Mammoth.js failed to load properly');
            }
            
            const arrayBuffer = await file.arrayBuffer();
            const result = await window.mammoth.extractRawText({ arrayBuffer: arrayBuffer });
            
            console.log('DOCX processing completed, text length:', result.value ? result.value.length : 0);
            
            if (!result.value || result.value.trim().length < 10) {
              reject(new Error('Could not extract readable text from the DOCX file. Please ensure the document contains text content.'));
              return;
            }
            
            resolve(cleanExtractedText(result.value));
          } catch (docxError) {
            console.error('DOCX Error:', docxError);
            reject(new Error(`DOCX processing failed: ${docxError?.message || 'Unknown DOCX error'}`));
          }
        };
        
        script.onerror = () => {
          reject(new Error('Failed to load DOCX processing library. Please check your internet connection.'));
        };
        
        // Add script to document
        if (!document.head.querySelector('script[src*="mammoth"]')) {
          document.head.appendChild(script);
        } else {
          // Library already loaded, trigger onload
          script.onload();
        }
        
      } catch (setupError) {
        console.error('DOCX Setup Error:', setupError);
        reject(new Error(`DOCX setup failed: ${setupError?.message || 'Unknown setup error'}`));
      }
    });
  };

  // Helper function to validate and fix structure
  const validateAndFixStructure = (data) => {
    return {
      personalInfo: {
        name: (data.personalInfo?.name || '').toString().trim(),
        email: (data.personalInfo?.email || '').toString().trim(),
        phone: (data.personalInfo?.phone || '').toString().trim(),
        location: (data.personalInfo?.location || '').toString().trim()
      },
      experience: Array.isArray(data.experience) ? data.experience.map(exp => ({
        position: (exp.position || '').toString().trim(),
        company: (exp.company || '').toString().trim(),
        duration: (exp.duration || '').toString().trim(),
        description: Array.isArray(exp.description) ? 
          exp.description.map(d => d.toString().trim()).filter(Boolean) : []
      })).filter(exp => exp.position || exp.company) : [],
      education: Array.isArray(data.education) ? data.education.map(edu => ({
        degree: (edu.degree || '').toString().trim(),
        institution: (edu.institution || '').toString().trim(),
        year: (edu.year || '').toString().trim(),
        description: Array.isArray(edu.description) ? 
          edu.description.map(d => d.toString().trim()).filter(Boolean) : []
      })).filter(edu => edu.degree || edu.institution) : [],
      projects: Array.isArray(data.projects) ? data.projects.map(proj => ({
        title: (proj.title || '').toString().trim(),
        description: Array.isArray(proj.description) ? 
          proj.description.map(d => d.toString().trim()).filter(Boolean) : []
      })).filter(proj => proj.title) : [],
      achievements: Array.isArray(data.achievements) ? data.achievements.map(ach => ({
        title: (ach.title || '').toString().trim(),
        description: Array.isArray(ach.description) ? 
          ach.description.map(d => d.toString().trim()).filter(Boolean) : []
      })).filter(ach => ach.title) : [],
      certificates: Array.isArray(data.certificates) ? data.certificates.map(cert => ({
        title: (cert.title || '').toString().trim(),
        issuer: (cert.issuer || '').toString().trim(),
        year: (cert.year || '').toString().trim(),
        description: Array.isArray(cert.description) ? 
          cert.description.map(d => d.toString().trim()).filter(Boolean) : []
      })).filter(cert => cert.title) : [],
      skills: Array.isArray(data.skills) ? 
        data.skills.map(s => s.toString().trim()).filter(Boolean) : [],
      additionalInformation: Array.isArray(data.additionalInformation) ? 
        data.additionalInformation.map(s => s.toString().trim()).filter(Boolean) : []
    };
  };

  // Helper function to try fixing common JSON issues
  const tryFixJSON = (jsonStr) => {
    try {
      // Common fixes for malformed JSON
      let fixed = jsonStr
        .replace(/,(\s*[}\]])/g, '$1')                    // Remove trailing commas
        .replace(/([{,]\s*)(\w+):/g, '$1"$2":')          // Add quotes to unquoted keys
        .replace(/:\s*'([^']*)'/g, ': "$1"')             // Replace single quotes with double
        .replace(/:\s*([^",{\[\s][^,}\]]*)/g, ': "$1"')  // Quote unquoted string values
        .replace(/\\"/g, '\\"')                          // Fix escaped quotes
        .replace(/\n/g, ' ')                             // Remove newlines
        .replace(/\s+/g, ' ')                            // Normalize whitespace
        .replace(/,\s*}/g, '}')                          // Final comma cleanup
        .replace(/,\s*]/g, ']')                          // Final comma cleanup
        .trim();
      
      return JSON.parse(fixed);
    } catch (e) {
      console.error('Could not fix JSON:', e);
      return null;
    }
  };

  // Enhanced AI parsing with better prompting and error handling
  const parseWithAI = async (text) => {
    // Enhanced prompt with strict instructions
    const promptText = `You are a precise resume parser. Extract information from the resume text and return ONLY valid JSON.

RESUME TEXT:
${text}

STRICT INSTRUCTIONS:
1. Extract ALL information accurately from the text above
2. Return ONLY the JSON object below - no other text
3. Use empty strings "" for missing text fields
4. Use empty arrays [] for missing list fields
5. Ensure ALL JSON is properly formatted with quotes
6. Do NOT add explanations, markdown, or extra text

REQUIRED JSON STRUCTURE:
{
  "personalInfo": {
    "name": "",
    "email": "",
    "phone": "",
    "location": ""
  },
  "experience": [
    {
      "position": "",
      "company": "",
      "duration": "",
      "description": [""]
    }
  ],
  "education": [
    {
      "degree": "",
      "institution": "",
      "year": "",
      "description": [""]
    }
  ],
  "projects": [
    {
      "title": "",
      "description": [""]
    }
  ],
  "achievements": [
    {
      "title": "",
      "description": [""]
    }
  ],
  "certificates": [
    {
      "title": "",
      "issuer": "",
      "year": "",
      "description": [""]
    }
  ],
  "skills": [],
  "additionalInformation": []
}

JSON RESPONSE:`;

    try {
      console.log('Sending request to Qwen with enhanced parameters...');
      
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
            temperature: 0.0,        // Completely deterministic
            top_p: 0.1,             // Very focused responses
            top_k: 1,               // Only consider top choice
            repeat_penalty: 1.0,     // No repeat penalty
            num_predict: 2048,       // Adequate response length
            stop: ["\n\n", "```", "END", "EXPLANATION"] // Stop tokens
          }
        })
      });

      if (!response.ok) {
        throw new Error(`AI service error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      let generatedText = data.response?.trim();
      
      if (!generatedText) {
        throw new Error('No response from AI service');
      }

      console.log('Raw AI response length:', generatedText.length);

      // More robust JSON extraction
      let jsonStr = generatedText;
      
      // Remove any markdown code blocks or extra formatting
      jsonStr = jsonStr
        .replace(/```json\s*|\s*```/g, '')
        .replace(/^[^{]*/, '')  // Remove everything before first {
        .replace(/[^}]*$/, ''); // Remove everything after last }
      
      // Find the JSON object boundaries
      const jsonStart = jsonStr.indexOf('{');
      const jsonEnd = jsonStr.lastIndexOf('}');
      
      if (jsonStart === -1 || jsonEnd === -1 || jsonEnd <= jsonStart) {
        console.error('No valid JSON found in response:', generatedText);
        throw new Error('No valid JSON structure found in AI response');
      }
      
      jsonStr = jsonStr.substring(jsonStart, jsonEnd + 1);
      
      // Clean up the JSON string
      jsonStr = jsonStr
        .replace(/,(\s*[}\]])/g, '$1')           // Remove trailing commas
        .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // Remove control chars
        .replace(/\r?\n/g, ' ')                  // Replace newlines with spaces
        .replace(/\s+/g, ' ')                    // Normalize whitespace
        .trim();
      
      console.log('Cleaned JSON string length:', jsonStr.length);
      
      try {
        const parsedData = JSON.parse(jsonStr);
        
        // Validate and fix the structure
        const validatedData = validateAndFixStructure(parsedData);
        
        console.log('Successfully parsed resume data with', 
          Object.keys(validatedData).length, 'sections');
        return validatedData;
        
      } catch (parseError) {
        console.error('JSON Parse Error:', parseError);
        console.error('Problematic JSON string:', jsonStr);
        
        // Try to fix common JSON issues
        const fixedJson = tryFixJSON(jsonStr);
        if (fixedJson) {
          console.log('Successfully fixed and parsed JSON');
          return validateAndFixStructure(fixedJson);
        }
        
        // If all else fails, try a simpler retry
        console.log('Attempting simplified retry...');
        return await retryWithSimplifiedPrompt(text);
      }
      
    } catch (error) {
      console.error('AI Parsing Error:', error);
      // Safe error handling for AI parsing
      const safeErrorMsg = error && typeof error.message === 'string' ? error.message : 'AI parsing failed';
      throw new Error(safeErrorMsg);
    }
  };

  // Simplified retry function for when main parsing fails
  const retryWithSimplifiedPrompt = async (text) => {
    const simplePrompt = `Extract resume information as JSON:

${text}

Return only this JSON format:
{"personalInfo":{"name":"","email":"","phone":"","location":""},"experience":[],"education":[],"projects":[],"achievements":[],"certificates":[],"skills":[],"additionalInformation":[]}`;

    try {
      const response = await fetch('http://localhost:11434/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'qwen2.5:1.5b',
          prompt: simplePrompt,
          stream: false,
          options: {
            temperature: 0.0,
            top_p: 0.05,
            num_predict: 1024
          }
        })
      });

      const data = await response.json();
      const jsonStr = data.response?.trim() || '{}';
      
      const jsonMatch = jsonStr.match(/\{.*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return validateAndFixStructure(parsed);
      }
      
      throw new Error('Simplified retry also failed');
    } catch (error) {
      console.error('Simplified retry failed:', error);
      // Return minimal structure as last resort
      return {
        personalInfo: { name: '', email: '', phone: '', location: '' },
        experience: [],
        education: [],
        projects: [],
        achievements: [],
        certificates: [],
        skills: [],
        additionalInformation: []
      };
    }
  };

  // Main parsing function with validation
  const parseResumeData = async (text) => {
    if (aiStatus !== 'connected') {
      throw new Error('AI service is not connected');
    }

    // Validate input text
    const cleanedText = cleanExtractedText(text);
    if (!cleanedText || cleanedText.length < 50) {
      throw new Error('Insufficient text content for processing');
    }

    console.log('Processing resume with cleaned text length:', cleanedText.length);
    return await parseWithAI(cleanedText);
  };

  const handleFileUpload = useCallback(async (uploadedFile) => {
    try {
      setIsProcessing(true);
      setActiveView('processing');

      console.log('Processing file:', uploadedFile?.name || 'unknown', 'Type:', uploadedFile?.type || 'unknown');
      let text = '';
      
      if (!uploadedFile) {
        throw new Error('No file provided');
      }

      if (uploadedFile.type === 'application/pdf') {
        console.log('Extracting text from PDF...');
        text = await extractTextFromPDF(uploadedFile);
      } else if (uploadedFile.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || 
                 uploadedFile.name?.toLowerCase().endsWith('.docx')) {
        console.log('Extracting text from DOCX...');
        text = await extractTextFromDOCX(uploadedFile);
      } else {
        throw new Error('Unsupported file type. Please upload a PDF or DOCX file.');
      }

      console.log('Extracted text length:', text ? text.length : 0);
      if (text && text.length > 200) {
        console.log('Text preview:', text.substring(0, 200) + '...');
      }

      if (!text || text.trim().length < 50) {
        throw new Error('Unable to extract sufficient text from the file. Please ensure the file contains readable text and try again.');
      }

      setExtractedText(text);
      console.log('Starting AI parsing...');
      const parsed = await parseResumeData(text);
      
      console.log('Parsing completed successfully');
      setParsedData(parsed);
      setEditedData(parsed);
      setActiveView('results');
      
    } catch (err) {
      console.error('Error processing file:', err);
      
      // Ultra-safe error handling
      let errorMessage = 'Processing failed: ';
      let errorMsg = 'Unknown error occurred';
      
      try {
        if (err) {
          if (typeof err === 'string') {
            errorMsg = err;
          } else if (err && typeof err === 'object') {
            if (typeof err.message === 'string' && err.message.length > 0) {
              errorMsg = err.message;
            } else if (typeof err.toString === 'function') {
              try {
                errorMsg = err.toString();
              } catch (e) {
                errorMsg = 'Error object toString failed';
              }
            }
          }
        }
      } catch (e) {
        console.error('Error extracting error message:', e);
        errorMsg = 'Error processing failed';
      }
      
      try {
        if (typeof errorMsg === 'string' && errorMsg.length > 0) {
          const lowerMsg = errorMsg.toLowerCase();
          if (lowerMsg.indexOf('pdf extraction') !== -1) {
            errorMessage += 'Could not read the PDF file. Please ensure it\'s not password-protected and contains selectable text.';
          } else if (lowerMsg.indexOf('docx') !== -1) {
            errorMessage += 'Could not read the DOCX file. Please ensure it\'s a valid Word document with readable text content.';
          } else if (lowerMsg.indexOf('json') !== -1) {
            errorMessage += 'AI parsing encountered an issue. This may be due to complex resume formatting. Please try again or simplify your resume layout.';
          } else if (lowerMsg.indexOf('ai service') !== -1) {
            errorMessage += 'AI service is not available. Please ensure Ollama is running with the qwen2.5:1.5b model.';
          } else if (lowerMsg.indexOf('failed to load') !== -1) {
            errorMessage += 'Failed to load required libraries. Please check your internet connection and try again.';
          } else if (lowerMsg.indexOf('insufficient text') !== -1) {
            errorMessage += 'Not enough readable text found in the file. Please ensure your resume has clear, readable content.';
          } else if (lowerMsg.indexOf('unsupported file type') !== -1) {
            errorMessage += 'Please upload a PDF or DOCX file only.';
          } else {
            errorMessage += errorMsg;
          }
        } else {
          errorMessage += 'An unexpected error occurred during processing.';
        }
      } catch (e) {
        console.error('Error processing error message:', e);
        errorMessage = 'An unexpected error occurred. Please try again.';
      }
      
      try {
        alert(errorMessage);
      } catch (e) {
        console.error('Alert failed:', e);
      }
      
      setActiveView('upload');
    } finally {
      try {
        setIsProcessing(false);
      } catch (e) {
        console.error('Failed to set processing state:', e);
      }
    }
  }, [aiStatus]);

  const handleDrop = useCallback((e) => {
    try {
      e.preventDefault();
      const droppedFile = e.dataTransfer?.files?.[0];
      if (droppedFile) {
        handleFileUpload(droppedFile);
      }
    } catch (err) {
      console.error('Drop handler error:', err);
    }
  }, [handleFileUpload]);

  const handleDragOver = useCallback((e) => {
    try {
      e.preventDefault();
    } catch (err) {
      console.error('Drag over handler error:', err);
    }
  }, []);

  const downloadPDF = async () => {
    if (!editedData) {
      alert('No resume data available to download.');
      return;
    }
    
    try {
      const resumeHtml = generateTraditionalResumeTemplate(editedData);
      const blob = new Blob([resumeHtml], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      
      const printWindow = window.open(url, '_blank', 'width=800,height=600');
      
      if (!printWindow) {
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
      
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print();
        }, 1000);
      };
      
    } catch (err) {
      console.error('Error generating PDF:', err);
      const errorMsg = err && typeof err.message === 'string' ? err.message : 'Unknown download error';
      alert(`Failed to generate PDF: ${errorMsg}. Please try again.`);
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
        if (!newData[section]) newData[section] = [];
        if (!newData[section][index]) newData[section][index] = {};
        
        if (field === 'description' && Array.isArray(value)) {
          newData[section][index][field] = value;
        } else {
          newData[section][index][field] = value;
        }
      } else if (section === 'personalInfo') {
        if (!newData.personalInfo) newData.personalInfo = {};
        newData.personalInfo[field] = value;
      } else if (section === 'skills') {
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

    const contactInfo = [email, phone].filter(Boolean).join(' | ');

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

    const skillsSection = (data.skills && data.skills.length > 0) ? `
      <div class="section">
        <h2 class="section-title">TECHNICAL SKILLS</h2>
        <div class="skills-text">${data.skills.join(' | ')}</div>
      </div>
    ` : '';

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

    const certificatesSection = (data.certificates && data.certificates.length > 0) ? `
      <div class="section">
        <h2 class="section-title">CERTIFICATIONS & COURSEWORK</h2>
        <div class="coursework-text">${data.certificates.map(cert => `${cert.title} (${cert.issuer || 'Provider'})`).join(' | ')}</div>
      </div>
    ` : '';

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
        </div>
      </nav>

      <div className="app-content">
        {/* Only show header section on upload and processing views, not on results */}
        {activeView !== 'results' && (
          <div className="header-section">
            <h1 className="app-title">Smart Resume Parser</h1>
            <p className="app-subtitle">Transform your resume into a professional format with AI-powered analysis</p>
          </div>
        )}

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
              <p className="upload-formats">Supports PDF and DOCX files</p>
              <input
                type="file"
                accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
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
                <div style={{ marginTop: '15px', padding: '15px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '12px', backdropFilter: 'blur(10px)' }}>
                  <h4>Setup Instructions:</h4>
                  <ol style={{ marginLeft: '20px', lineHeight: '1.6' }}>
                    <li>Download and install Ollama from <a href="https://ollama.ai" target="_blank" rel="noopener noreferrer" style={{ color: '#64ffda' }}>ollama.ai</a></li>
                    <li>Run: <code style={{ background: 'rgba(0, 0, 0, 0.3)', padding: '2px 6px', borderRadius: '4px', color: '#64ffda' }}>ollama pull qwen2.5:1.5b</code></li>
                    <li>Ensure Ollama is running in the background</li>
                    <li>Refresh the page to reconnect</li>
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
            <p className="processing-subtitle">AI is analyzing content and extracting information...</p>
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