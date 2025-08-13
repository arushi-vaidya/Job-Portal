
                                import React, { useState, useCallback, useEffect } from 'react';
import { Upload, Download, Eye, Menu, X, Edit3, Save, Plus, Trash2, FileText, RefreshCw } from 'lucide-react';
import './ResumeParser.css';

const ResumeParser = () => {
  const [parsedData, setParsedData] = useState(null);
  const [editableData, setEditableData] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [activeView, setActiveView] = useState('upload');
  const [aiStatus, setAiStatus] = useState('checking');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [manualMode, setManualMode] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  
  // Safari detection
  const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
  
  // Safari-compatible button handlers
  const handleAddExperience = () => {
    console.log('=== HANDLE ADD EXPERIENCE CALLED ===');
    addNewItem('experience');
  };
  
  const handleRemoveSkill = (index) => {
    console.log('=== HANDLE REMOVE SKILL CALLED ===');
    console.log('Index to remove:', index);
    removeSkill(index);
  };

  const handleRemoveCertificate = (index) => {
    console.log('=== HANDLE REMOVE CERTIFICATE CALLED ===');
    console.log('Index to remove:', index);
    removeItem('certificates', index);
  };

  const handleRemoveAdditionalInfo = (index) => {
    console.log('=== HANDLE REMOVE ADDITIONAL INFO CALLED ===');
    console.log('Index to remove:', index);
    removeAdditionalInfo(index);
  };

  const handleAddEducation = () => {
    console.log('=== HANDLE ADD EDUCATION CALLED ===');
    addNewItem('education');
  };
  
  const handleAddProject = () => {
    console.log('=== HANDLE ADD PROJECT CALLED ===');
    addNewItem('projects');
  };
  
  const handleAddAchievement = () => {
    console.log('=== HANDLE ADD ACHIEVEMENT CALLED ===');
    addNewItem('achievements');
  };
  
  const handleAddCertificate = () => {
    console.log('=== HANDLE ADD CERTIFICATE CALLED ===');
    addNewItem('certificates');
  };
  
  const handleAddSkill = () => {
    console.log('=== HANDLE ADD SKILL CALLED ===');
    addNewSkill();
  };
  
  const handleAddAdditionalInfo = () => {
    console.log('=== HANDLE ADD ADDITIONAL INFO CALLED ===');
    addNewAdditionalInfo();
  };

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

  // Initialize editableData when parsedData changes
  useEffect(() => {
    if (parsedData && !editableData) {
      setEditableData(JSON.parse(JSON.stringify(parsedData)));
    }
  }, [parsedData, editableData]);

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

  // Create empty resume structure for manual entry
  const createEmptyResume = () => {
    return {
      personalInfo: { 
        name: '', 
        email: '', 
        phone: '', 
        location: '' 
      },
      experience: [],
      education: [],
      projects: [],
      achievements: [],
      certificates: [],
      skills: [],
      additionalInformation: []
    };
  };

  // Handle manual resume entry
  const handleManualEntry = () => {
    const emptyResume = createEmptyResume();
    setParsedData(emptyResume);
    setEditableData(emptyResume);
    setIsEditing(true);
    setManualMode(true);
    setActiveView('results');
    setUploadError(null);
  };

  // Handle retry after upload failure
  const handleRetryUpload = () => {
    setUploadError(null);
    setActiveView('upload');
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
      setActiveView('processing');
      setUploadError(null);

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

      console.log('Starting AI parsing...');
      const parsed = await parseResumeData(text);
      
      console.log('Parsing completed successfully');
      setParsedData(parsed);
      setActiveView('results');
      setManualMode(false);
      
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
            errorMessage += 'AI parsing encountered an issue. This may be due to complex resume formatting.';
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
      
      setUploadError(errorMessage);
      setActiveView('upload');
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
    if (!parsedData) {
      alert('No resume data available to download.');
      return;
    }
    
    try {
      const resumeHtml = generateTraditionalResumeTemplate(parsedData);
      const blob = new Blob([resumeHtml], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      
      const printWindow = window.open(url, '_blank', 'width=800,height=600');
      
      if (!printWindow) {
        const a = document.createElement('a');
        a.href = url;
        a.download = `${parsedData.personalInfo?.name || 'Resume'}_Professional.html`;
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

  // Handle entering edit mode
  const handleEditMode = () => {
    // Always create a fresh copy when entering edit mode
    console.log('Entering edit mode, parsedData:', parsedData);
    
    if (!parsedData) {
      console.error('No parsed data available for editing');
      alert('No resume data available to edit. Please upload and parse a resume first.');
      return;
    }
    
    try {
      const freshData = JSON.parse(JSON.stringify(parsedData));
      console.log('Fresh editable data:', freshData);
      setEditableData(freshData);
      setIsEditing(true);
    } catch (error) {
      console.error('Error creating editable data:', error);
      alert('Error entering edit mode. Please try again.');
    }
  };

  // Handle saving changes
  const handleSaveChanges = () => {
    setParsedData(editableData);
    setIsEditing(false);
    setManualMode(false);
    alert('Changes saved successfully!');
  };

  // Handle canceling edits
  const handleCancelEdit = () => {
    if (manualMode) {
      // If in manual mode and canceling, go back to upload
      setParsedData(null);
      setEditableData(null);
      setActiveView('upload');
      setManualMode(false);
    } else {
      setEditableData(null);
    }
    setIsEditing(false);
  };

  // Update editable data
  const updateEditableData = (section, field, value, index = null) => {
    console.log(`Updating ${section}.${field}${index !== null ? `[${index}]` : ''} to:`, value);
    
    setEditableData(prev => {
      try {
        const newData = JSON.parse(JSON.stringify(prev));
        if (index !== null) {
          if (!newData[section]) {
            newData[section] = [];
          }
          if (!newData[section][index]) {
            newData[section][index] = {};
          }
          newData[section][index][field] = value;
        } else {
          if (!newData[section]) {
            newData[section] = {};
          }
          newData[section][field] = value;
        }
        console.log('Updated data:', newData);
        return newData;
      } catch (error) {
        console.error('Error updating editable data:', error);
        return prev;
      }
    });
  };

  // Add new item to a section
  const addNewItem = (section) => {
    console.log('=== ADD NEW ITEM CALLED ===');
    console.log('Section:', section);
    console.log('Current editableData:', editableData);
    console.log('Current isEditing:', isEditing);
    
    if (!isEditing) {
      console.error('Not in edit mode');
      alert('Please enter edit mode first before adding items.');
      return;
    }
    
    if (!editableData) {
      console.error('No editable data available');
      alert('No editable data available. Please try refreshing the page.');
      return;
    }
    
    try {
      setEditableData(prev => {
        console.log('Previous editable data:', prev);
        
        if (!prev) {
          console.error('Previous data is null');
          return prev;
        }
        
        const newData = JSON.parse(JSON.stringify(prev));
        console.log('Cloned data:', newData);
        
        // Ensure the section array exists
        if (!newData[section]) {
          console.log(`Creating new array for section: ${section}`);
          newData[section] = [];
        }
        
        const newItem = getDefaultItem(section);
        console.log('New item to add:', newItem);
        
        newData[section].push(newItem);
        console.log(`Added item to ${section}. New length:`, newData[section].length);
        console.log('Final updated data:', newData);
        
        return newData;
      });
      
      // Force a re-render for Safari
      if (isSafari) {
        setTimeout(() => {
          console.log('Safari: Forcing re-render after add');
          setEditableData(current => current);
        }, 100);
      }
      
    } catch (error) {
      console.error('Error in addNewItem:', error);
      alert(`Error adding new item: ${error.message}`);
    }
  };

  // Remove item from a section
  const removeItem = (section, index) => {
    setEditableData(prev => {
      const newData = JSON.parse(JSON.stringify(prev));
      newData[section].splice(index, 1);
      return newData;
    });
  };

  // Get default item structure for different sections
  const getDefaultItem = (section) => {
    switch (section) {
      case 'experience':
        return { position: '', company: '', duration: '', description: [''] };
      case 'education':
        return { degree: '', institution: '', year: '', description: [''] };
      case 'projects':
        return { title: '', description: [''] };
      case 'achievements':
        return { title: '', description: [''] };
      case 'certificates':
        return { title: '', issuer: '', year: '', description: [''] };
      default:
        return {};
    }
  };

  // Add new description line
  const addDescriptionLine = (section, index) => {
    setEditableData(prev => {
      const newData = JSON.parse(JSON.stringify(prev));
      newData[section][index].description.push('');
      return newData;
    });
  };

  // Remove description line
  const removeDescriptionLine = (section, itemIndex, descIndex) => {
    setEditableData(prev => {
      const newData = JSON.parse(JSON.stringify(prev));
      newData[section][itemIndex].description.splice(descIndex, 1);
      return newData;
    });
  };

  // Update description line
  const updateDescriptionLine = (section, itemIndex, descIndex, value) => {
    setEditableData(prev => {
      const newData = JSON.parse(JSON.stringify(prev));
      newData[section][itemIndex].description[descIndex] = value;
      return newData;
    });
  };

  // Add new skill
  const addNewSkill = () => {
    console.log('=== ADD NEW SKILL CALLED ===');
    
    if (!isEditing) {
      console.error('Not in edit mode');
      alert('Please enter edit mode first before adding skills.');
      return;
    }
    
    if (!editableData) {
      console.error('No editable data available');
      alert('No editable data available. Please try refreshing the page.');
      return;
    }
    
    try {
      setEditableData(prev => {
        console.log('Previous editable data:', prev);
        
        if (!prev) {
          console.error('Previous data is null');
          return prev;
        }
        
        const newData = JSON.parse(JSON.stringify(prev));
        
        // Ensure skills array exists
        if (!newData.skills) {
          console.log('Creating new skills array');
          newData.skills = [];
        }
        
        newData.skills.push('');
        console.log('Added new skill. Total skills:', newData.skills.length);
        
        return newData;
      });
      
      // Force a re-render for Safari
      if (isSafari) {
        setTimeout(() => {
          console.log('Safari: Forcing re-render after adding skill');
          setEditableData(current => current);
        }, 100);
      }
      
    } catch (error) {
      console.error('Error adding new skill:', error);
      alert(`Error adding new skill: ${error.message}`);
    }
  };

  // Remove skill
  const removeSkill = (index) => {
    console.log('=== REMOVE SKILL CALLED ===');
    console.log('Removing skill at index:', index);
    console.log('Current editableData:', editableData);
    
    if (!isEditing) {
      console.error('Not in edit mode');
      alert('Please enter edit mode first before removing skills.');
      return;
    }
    
    if (!editableData) {
      console.error('No editable data available');
      alert('No editable data available. Please try refreshing the page.');
      return;
    }
    
    try {
      setEditableData(prev => {
        console.log('Previous editable data:', prev);
        
        if (!prev) {
          console.error('Previous data is null');
          return prev;
        }
        
        const newData = JSON.parse(JSON.stringify(prev));
        
        // Ensure skills array exists
        if (!newData.skills) {
          console.log('No skills array found');
          return prev;
        }
        
        if (index < 0 || index >= newData.skills.length) {
          console.error('Invalid index:', index, 'Skills length:', newData.skills.length);
          return prev;
        }
        
        console.log('Before removal:', newData.skills);
        newData.skills.splice(index, 1);
        console.log('After removal:', newData.skills);
        
        return newData;
      });
      
      // Force a re-render for Safari
      if (isSafari) {
        setTimeout(() => {
          console.log('Safari: Forcing re-render after remove');
          setEditableData(current => current);
        }, 100);
      }
      
    } catch (error) {
      console.error('Error removing skill:', error);
      alert(`Error removing skill: ${error.message}`);
    }
  };

  // Add new additional information
  const addNewAdditionalInfo = () => {
    console.log('=== ADD NEW ADDITIONAL INFO CALLED ===');
    
    if (!isEditing) {
      console.error('Not in edit mode');
      alert('Please enter edit mode first before adding additional info.');
      return;
    }
    
    if (!editableData) {
      console.error('No editable data available');
      alert('No editable data available. Please try refreshing the page.');
      return;
    }
    
    try {
      setEditableData(prev => {
        console.log('Previous editable data:', prev);
        
        if (!prev) {
          console.error('Previous data is null');
          return prev;
        }
        
        const newData = JSON.parse(JSON.stringify(prev));
        
        // Ensure additionalInformation array exists
        if (!newData.additionalInformation) {
          console.log('Creating new additionalInformation array');
          newData.additionalInformation = [];
        }
        
        newData.additionalInformation.push('');
        console.log('Added new additional info. Total items:', newData.additionalInformation.length);
        
        return newData;
      });
      
      // Force a re-render for Safari
      if (isSafari) {
        setTimeout(() => {
          console.log('Safari: Forcing re-render after adding additional info');
          setEditableData(current => current);
        }, 100);
      }
      
    } catch (error) {
      console.error('Error adding new additional info:', error);
      alert(`Error adding new additional info: ${error.message}`);
    }
  };

  // Remove additional information
  const removeAdditionalInfo = (index) => {
    console.log('=== REMOVE ADDITIONAL INFO CALLED ===');
    console.log('Removing additional info at index:', index);
    console.log('Current editableData:', editableData);
    
    if (!isEditing) {
      console.error('Not in edit mode');
      alert('Please enter edit mode first before removing additional information.');
      return;
    }
    
    if (!editableData) {
      console.error('No editable data available');
      alert('No editable data available. Please try refreshing the page.');
      return;
    }
    
    try {
      setEditableData(prev => {
        console.log('Previous editable data:', prev);
        
        if (!prev) {
          console.error('Previous data is null');
          return prev;
        }
        
        const newData = JSON.parse(JSON.stringify(prev));
        
        // Ensure additionalInformation array exists
        if (!newData.additionalInformation) {
          console.log('No additionalInformation array found');
          return prev;
        }
        
        if (index < 0 || index >= newData.additionalInformation.length) {
          console.error('Invalid index:', index, 'Additional info length:', newData.additionalInformation.length);
          return prev;
        }
        
        console.log('Before removal:', newData.additionalInformation);
        newData.additionalInformation.splice(index, 1);
        console.log('After removal:', newData.additionalInformation);
        
        return newData;
      });
      
      // Force a re-render for Safari
      if (isSafari) {
        setTimeout(() => {
          console.log('Safari: Forcing re-render after remove additional info');
          setEditableData(current => current);
        }, 100);
      }
      
    } catch (error) {
      console.error('Error removing additional info:', error);
      alert(`Error removing additional info: ${error.message}`);
    }
  };

  const generateTraditionalResumeTemplate = (data) => {
    const name = data.personalInfo?.name || 'Your Name';
    const email = data.personalInfo?.email || '';
    const phone = data.personalInfo?.phone || '';
    const location = data.personalInfo?.location || '';

    const contactInfo = [email, phone, location].filter(Boolean).join(' | ');

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
            <p className="app-subtitle">Transform your resume into a professional format with AI-powered analysis or manual entry</p>
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
            <button onClick={handleManualEntry}  className = 'nav-button'>
                    <FileText className="button-icon" />
                    Manual Entry
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
            {uploadError && (
              <div className="upload-error">
                <div className="error-content">
                  <h3>❌ Upload Failed</h3>
                  <p>{uploadError}</p>
                  <div className="error-actions">
                    <button onClick={handleRetryUpload} className="retry-button">
                      <RefreshCw className="button-icon" />
                      Try Again
                    </button>
                    <button onClick={handleManualEntry} className="manual-entry-button">
                      <FileText className="button-icon" />
                      Enter Manually
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            {!uploadError && (
              <>
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




                  
                  

              </>
            )}

            {aiStatus !== 'connected' && !uploadError && (
              <div className="service-info">
                <h3>⚠️ AI Service Unavailable</h3>
                <p>
                  The AI parsing service is not currently available. You can still create and edit resumes manually using the "Create Resume Manually" option above.
                </p>
                <button onClick={checkAiStatus} className="status-retry-button">
                  <RefreshCw className="status-button-icon" />
                  Check AI Status
                </button>
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
            {/* Edit Mode Toggle */}
            <div className="edit-mode-toggle">
              {!isEditing ? (
                <button onClick={handleEditMode} className="edit-button">
                  <Edit3 className="button-icon" />
                  Edit Resume
                </button>
              ) : (
                <div className="edit-controls">
                  <button onClick={handleSaveChanges} className="save-button">
                    <Save className="button-icon" />
                    Save Changes
                  </button>
                  <button onClick={handleCancelEdit} className="cancel-button">
                    {manualMode ? 'Cancel & Return' : 'Cancel'}
                  </button>
                </div>
              )}
            </div>

            {/* Resume Preview - Formatted like template */}
            <div className="resume-preview">
              <div className="resume-header">
                <h1 className="resume-name">
                  {isEditing ? (
                    <input
                      type="text"
                      value={editableData?.personalInfo?.name || ''}
                      onChange={(e) => {
                        console.log('Updating name to:', e.target.value);
                        updateEditableData('personalInfo', 'name', e.target.value);
                      }}
                      onInput={(e) => {
                        // Safari sometimes needs onInput for immediate updates
                        console.log('Input event - updating name to:', e.target.value);
                        updateEditableData('personalInfo', 'name', e.target.value);
                      }}
                      className="editable-input name-input"
                      placeholder="Your Name"
                    />
                  ) : (
                    parsedData?.personalInfo?.name || 'Your Name'
                  )}
                </h1>
                <div className="resume-contact">
                  {isEditing ? (
                    <div className="contact-inputs">
                      <input
                        type="email"
                        value={editableData?.personalInfo?.email || ''}
                        onChange={(e) => updateEditableData('personalInfo', 'email', e.target.value)}
                        className="editable-input contact-input"
                        placeholder="Email"
                      />
                      <span className="contact-separator">|</span>
                      <input
                        type="tel"
                        value={editableData?.personalInfo?.phone || ''}
                        onChange={(e) => updateEditableData('personalInfo', 'phone', e.target.value)}
                        className="editable-input contact-input"
                        placeholder="Phone"
                      />
                      <span className="contact-separator">|</span>
                      <input
                        type="text"
                        value={editableData?.personalInfo?.location || ''}
                        onChange={(e) => updateEditableData('personalInfo', 'location', e.target.value)}
                        className="editable-input contact-input"
                        placeholder="Location"
                      />
                    </div>
                  ) : (
                    `${parsedData?.personalInfo?.email || ''} | ${parsedData?.personalInfo?.phone || ''} | ${parsedData?.personalInfo?.location || ''}`
                  )}
                </div>
              </div>

              {/* Professional Experience Section */}
              <div className="resume-section">
                <div className="section-header-with-actions">
                  <h2 className="resume-section-title">PROFESSIONAL EXPERIENCE</h2>
                  {isEditing && (
                    <button onClick={handleAddExperience} className="add-item-button">
                      <Plus className="button-icon" />
                      Add Experience
                    </button>
                  )}
                </div>
                {((isEditing ? editableData?.experience : parsedData?.experience) || []).length > 0 ? (
                  (isEditing ? editableData.experience : parsedData.experience).map((exp, index) => (
                    <div key={index} className="resume-entry">
                      {isEditing && (
                        <div className="entry-actions">
                          <button onClick={() => removeItem('experience', index)} className="remove-item-button">
                            <Trash2 className="button-icon" />
                          </button>
                        </div>
                      )}
                      <div className="resume-entry-header">
                        <div className="resume-company-position">
                          {isEditing ? (
                            <>
                              <input
                                type="text"
                                value={editableData?.experience[index]?.company || ''}
                                onChange={(e) => updateEditableData('experience', 'company', e.target.value, index)}
                                className="editable-input company-input"
                                placeholder="Company"
                              />
                              <span className="separator">,</span>
                              <input
                                type="text"
                                value={editableData?.experience[index]?.position || ''}
                                onChange={(e) => updateEditableData('experience', 'position', e.target.value, index)}
                                className="editable-input position-input"
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
                              value={editableData?.experience[index]?.duration || ''}
                              onChange={(e) => updateEditableData('experience', 'duration', e.target.value, index)}
                              className="editable-input duration-input"
                              placeholder="Duration"
                            />
                          ) : (
                            <em>{exp.duration || 'Duration'}</em>
                          )}
                        </div>
                      </div>
                      <div className="description-section">
                        {isEditing ? (
                          <div className="description-inputs">
                            {(editableData?.experience[index]?.description || []).map((desc, descIndex) => (
                              <div key={descIndex} className="description-line">
                                <input
                                  type="text"
                                  value={desc}
                                  onChange={(e) => updateDescriptionLine('experience', index, descIndex, e.target.value)}
                                  className="editable-input description-input"
                                  placeholder="Description line"
                                />
                                <button 
                                  onClick={() => removeDescriptionLine('experience', index, descIndex)}
                                  className="remove-line-button"
                                  disabled={(editableData?.experience[index]?.description || []).length <= 1}
                                >
                                  <Trash2 className="button-icon" />
                                </button>
                              </div>
                            ))}
                            <button onClick={() => addDescriptionLine('experience', index)} className="add-line-button">
                              <Plus className="button-icon" />
                              Add Line
                            </button>
                          </div>
                        ) : (
                          exp.description && Array.isArray(exp.description) && exp.description.length > 0 && (
                            <ul className="resume-bullet-list">
                              {exp.description.map((desc, descIndex) => (
                                <li key={descIndex}>{desc}</li>
                              ))}
                            </ul>
                          )
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="empty-section">
                    {isEditing ? 'No experience entries yet. Click "Add Experience" to add one.' : 'No experience information available.'}
                  </div>
                )}
              </div>

              {/* Education Section */}
              <div className="resume-section">
                <div className="section-header-with-actions">
                  <h2 className="resume-section-title">EDUCATION</h2>
                  {isEditing && (
                    <button onClick={handleAddEducation} className="add-item-button">
                      <Plus className="button-icon" />
                      Add Education
                    </button>
                  )}
                </div>
                {((isEditing ? editableData?.education : parsedData?.education) || []).length > 0 ? (
                  (isEditing ? editableData.education : parsedData.education).map((edu, index) => (
                    <div key={index} className="resume-entry">
                      {isEditing && (
                        <div className="entry-actions">
                          <button onClick={() => removeItem('education', index)} className="remove-item-button">
                            <Trash2 className="button-icon" />
                          </button>
                        </div>
                      )}
                      <div className="resume-entry-header">
                        <div className="resume-company-position">
                          {isEditing ? (
                            <input
                              type="text"
                              value={editableData?.education[index]?.institution || ''}
                              onChange={(e) => updateEditableData('education', 'institution', e.target.value, index)}
                              className="editable-input institution-input"
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
                              value={editableData?.education[index]?.year || ''}
                              onChange={(e) => updateEditableData('education', 'year', e.target.value, index)}
                              className="editable-input year-input"
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
                            value={editableData?.education[index]?.degree || ''}
                            onChange={(e) => updateEditableData('education', 'degree', e.target.value, index)}
                            className="editable-input degree-input"
                            placeholder="Degree"
                          />
                        ) : (
                          edu.degree || 'Degree'
                        )}
                      </div>
                      {isEditing && (
                        <div className="description-section">
                          <div className="description-inputs">
                            {(editableData?.education[index]?.description || []).map((desc, descIndex) => (
                              <div key={descIndex} className="description-line">
                                <input
                                  type="text"
                                  value={desc}
                                  onChange={(e) => updateDescriptionLine('education', index, descIndex, e.target.value)}
                                  className="editable-input description-input"
                                  placeholder="Description line"
                                />
                                <button 
                                  onClick={() => removeDescriptionLine('education', index, descIndex)}
                                  className="remove-line-button"
                                  disabled={(editableData?.education[index]?.description || []).length <= 1}
                                >
                                  <Trash2 className="button-icon" />
                                </button>
                              </div>
                            ))}
                            <button onClick={() => addDescriptionLine('education', index)} className="add-line-button">
                              <Plus className="button-icon" />
                              Add Line
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="empty-section">
                    {isEditing ? 'No education entries yet. Click "Add Education" to add one.' : 'No education information available.'}
                  </div>
                )}
              </div>

              {/* Technical Skills Section */}
              <div className="resume-section">
                <div className="section-header-with-actions">
                  <h2 className="resume-section-title">TECHNICAL SKILLS</h2>
                  {isEditing && (
                    <button onClick={handleAddSkill} className="add-item-button">
                      <Plus className="button-icon" />
                      Add Skill
                    </button>
                  )}
                </div>
                {((isEditing ? editableData?.skills : parsedData?.skills) || []).length > 0 ? (
                  <div className="resume-skills-text">
                    {isEditing ? (
                      <div className="skills-inputs">
                        {(isEditing ? editableData.skills : parsedData.skills).map((skill, index) => (
                          <div key={`skill-${index}-${skill}`} className="skill-input">
                            <input
                              type="text"
                              value={skill}
                              onChange={(e) => {
                                console.log(`Updating skill at index ${index} to:`, e.target.value);
                                setEditableData(prev => {
                                  const newData = JSON.parse(JSON.stringify(prev));
                                  if (!newData.skills) newData.skills = [];
                                  newData.skills[index] = e.target.value;
                                  return newData;
                                });
                              }}
                              onInput={(e) => {
                                // Safari sometimes needs onInput for immediate updates
                                console.log(`Input event - updating skill at index ${index} to:`, e.target.value);
                                setEditableData(prev => {
                                  const newData = JSON.parse(JSON.stringify(prev));
                                  if (!newData.skills) newData.skills = [];
                                  newData.skills[index] = e.target.value;
                                  return newData;
                                });
                              }}
                              className="editable-input skill-input-field"
                              placeholder="Skill"
                            />
                            <button 
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                console.log('Remove skill button clicked for index:', index);
                                handleRemoveSkill(index);
                              }}
                              onMouseDown={(e) => {
                                // Safari-specific event handling
                                e.preventDefault();
                                console.log('Mouse down on remove skill button for index:', index);
                              }}
                              className="remove-skill-button"
                              type="button"
                              style={{
                                // Safari-specific styles
                                WebkitAppearance: 'none',
                                WebkitUserSelect: 'none',
                                WebkitTapHighlightColor: 'transparent',
                                WebkitTouchCallout: 'none',
                                WebkitTransform: 'translateZ(0)',
                                transform: 'translateZ(0)',
                                position: 'relative',
                                zIndex: 1
                              }}
                            >
                              <Trash2 className="button-icon" />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      (isEditing ? editableData.skills : parsedData.skills).join(' | ')
                    )}
                  </div>
                ) : (
                  <div className="empty-section">
                    {isEditing ? 'No skills yet. Click "Add Skill" to add one.' : 'No skills information available.'}
                  </div>
                )}
              </div>

              {/* Projects Section */}
              <div className="resume-section">
                <div className="section-header-with-actions">
                  <h2 className="resume-section-title">KEY PROJECTS</h2>
                  {isEditing && (
                    <button onClick={handleAddProject} className="add-item-button">
                      <Plus className="button-icon" />
                      Add Project
                    </button>
                  )}
                </div>
                {((isEditing ? editableData?.projects : parsedData?.projects) || []).length > 0 ? (
                  (isEditing ? editableData.projects : parsedData.projects).map((project, index) => (
                    <div key={index} className="resume-entry">
                      {isEditing && (
                        <div className="entry-actions">
                          <button onClick={() => removeItem('projects', index)} className="remove-item-button">
                            <Trash2 className="button-icon" />
                          </button>
                        </div>
                      )}
                      <div className="resume-project-title">
                        {isEditing ? (
                          <input
                            type="text"
                            value={editableData?.projects[index]?.title || ''}
                            onChange={(e) => updateEditableData('projects', 'title', e.target.value, index)}
                            className="editable-input project-title-input"
                            placeholder="Project Title"
                          />
                        ) : (
                          <strong>{project.title || 'Project Title'}</strong>
                        )}
                      </div>
                      <div className="description-section">
                        {isEditing ? (
                          <div className="description-inputs">
                            {(editableData?.projects[index]?.description || []).map((desc, descIndex) => (
                              <div key={descIndex} className="description-line">
                                <input
                                  type="text"
                                  value={desc}
                                  onChange={(e) => updateDescriptionLine('projects', index, descIndex, e.target.value)}
                                  className="editable-input description-input"
                                  placeholder="Description line"
                                />
                                <button 
                                  onClick={() => removeDescriptionLine('projects', index, descIndex)}
                                  className="remove-line-button"
                                  disabled={(editableData?.projects[index]?.description || []).length <= 1}
                                >
                                  <Trash2 className="button-icon" />
                                </button>
                              </div>
                            ))}
                            <button onClick={() => addDescriptionLine('projects', index)} className="add-line-button">
                              <Plus className="button-icon" />
                              Add Line
                            </button>
                          </div>
                        ) : (
                          project.description && Array.isArray(project.description) && project.description.length > 0 && (
                            <ul className="resume-bullet-list">
                              {project.description.map((desc, descIndex) => (
                                <li key={descIndex}>{desc}</li>
                              ))}
                            </ul>
                          )
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="empty-section">
                    {isEditing ? 'No projects yet. Click "Add Project" to add one.' : 'No projects information available.'}
                  </div>
                )}
              </div>

              {/* Achievements Section */}
              <div className="resume-section">
                <div className="section-header-with-actions">
                  <h2 className="resume-section-title">ACHIEVEMENTS & AWARDS</h2>
                  {isEditing && (
                    <button onClick={handleAddAchievement} className="add-item-button">
                      <Plus className="button-icon" />
                      Add Achievement
                    </button>
                  )}
                </div>
                {((isEditing ? editableData?.achievements : parsedData?.achievements) || []).length > 0 ? (
                  (isEditing ? editableData.achievements : parsedData.achievements).map((achievement, index) => (
                    <div key={index} className="resume-entry">
                      {isEditing && (
                        <div className="entry-actions">
                          <button onClick={() => removeItem('achievements', index)} className="remove-item-button">
                            <Trash2 className="button-icon" />
                          </button>
                        </div>
                      )}
                      <div className="resume-project-title">
                        {isEditing ? (
                          <input
                            type="text"
                            value={editableData?.achievements[index]?.title || ''}
                            onChange={(e) => updateEditableData('achievements', 'title', e.target.value, index)}
                            className="editable-input achievement-title-input"
                            placeholder="Achievement Title"
                          />
                        ) : (
                          <strong>{achievement.title || 'Achievement Title'}</strong>
                        )}
                      </div>
                      <div className="description-section">
                        {isEditing ? (
                          <div className="description-inputs">
                            {(editableData?.achievements[index]?.description || []).map((desc, descIndex) => (
                              <div key={descIndex} className="description-line">
                                <input
                                  type="text"
                                  value={desc}
                                  onChange={(e) => updateDescriptionLine('achievements', index, descIndex, e.target.value)}
                                  className="editable-input description-input"
                                  placeholder="Description line"
                                />
                                <button 
                                  onClick={() => removeDescriptionLine('achievements', index, descIndex)}
                                  className="remove-line-button"
                                  disabled={(editableData?.achievements[index]?.description || []).length <= 1}
                                >
                                  <Trash2 className="button-icon" />
                                </button>
                              </div>
                            ))}
                            <button onClick={() => addDescriptionLine('achievements', index)} className="add-line-button">
                              <Plus className="button-icon" />
                              Add Line
                            </button>
                          </div>
                        ) : (
                          achievement.description && Array.isArray(achievement.description) && achievement.description.length > 0 && (
                            <ul className="resume-bullet-list">
                              {achievement.description.map((desc, descIndex) => (
                                <li key={descIndex}>{desc}</li>
                              ))}
                            </ul>
                          )
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="empty-section">
                    {isEditing ? 'No achievements yet. Click "Add Achievement" to add one.' : 'No achievements information available.'}
                  </div>
                )}
              </div>

              {/* Certificates Section */}
              <div className="resume-section">
                <div className="section-header-with-actions">
                  <h2 className="resume-section-title">CERTIFICATIONS & COURSEWORK</h2>
                  {isEditing && (
                    <button onClick={handleAddCertificate} className="add-item-button">
                      <Plus className="button-icon" />
                      Add Certificate
                    </button>
                  )}
                </div>
                {((isEditing ? editableData?.certificates : parsedData?.certificates) || []).length > 0 ? (
                  <div className="resume-skills-text">
                    {isEditing ? (
                      <div className="certificates-inputs">
                        {(isEditing ? editableData.certificates : parsedData.certificates).map((cert, index) => (
                          <div key={`cert-${index}-${cert.title}`} className="certificate-input">
                            <input
                              type="text"
                              value={editableData?.certificates[index]?.title || ''}
                              onChange={(e) => {
                                console.log(`Updating cert title at index ${index} to:`, e.target.value);
                                updateEditableData('certificates', 'title', e.target.value, index);
                              }}
                              onInput={(e) => {
                                // Safari sometimes needs onInput for immediate updates
                                console.log(`Input event - updating cert title at index ${index} to:`, e.target.value);
                                updateEditableData('certificates', 'title', e.target.value, index);
                              }}
                              className="editable-input cert-title-input"
                              placeholder="Certificate Title"
                            />
                            <span className="separator">(</span>
                            <input
                              type="text"
                              value={editableData?.certificates[index]?.issuer || ''}
                              onChange={(e) => {
                                console.log(`Updating cert issuer at index ${index} to:`, e.target.value);
                                updateEditableData('certificates', 'issuer', e.target.value, index);
                              }}
                              onInput={(e) => {
                                // Safari sometimes needs onInput for immediate updates
                                console.log(`Input event - updating cert issuer at index ${index} to:`, e.target.value);
                                updateEditableData('certificates', 'issuer', e.target.value, index);
                              }}
                              className="editable-input cert-issuer-input"
                              placeholder="Issuer"
                            />
                            <span className="separator">)</span>
                            <button 
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                console.log('Remove certificate button clicked for index:', index);
                                handleRemoveCertificate(index);
                              }}
                              onMouseDown={(e) => {
                                // Safari-specific event handling
                                e.preventDefault();
                                console.log('Mouse down on remove certificate button for index:', index);
                              }}
                              className="remove-cert-button"
                              type="button"
                              style={{
                                // Safari-specific styles
                                WebkitAppearance: 'none',
                                WebkitUserSelect: 'none',
                                WebkitTapHighlightColor: 'transparent',
                                WebkitTouchCallout: 'none',
                                WebkitTransform: 'translateZ(0)',
                                transform: 'translateZ(0)',
                                position: 'relative',
                                zIndex: 1
                              }}
                            >
                              <Trash2 className="button-icon" />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      (isEditing ? editableData.certificates : parsedData.certificates).map(cert => `${cert.title} (${cert.issuer || 'Provider'})`).join(' | ')
                    )}
                  </div>
                ) : (
                  <div className="empty-section">
                    {isEditing ? 'No certificates yet. Click "Add Certificate" to add one.' : 'No certificates information available.'}
                  </div>
                )}
              </div>

              {/* Additional Information Section */}
              <div className="resume-section">
                <div className="section-header-with-actions">
                  <h2 className="resume-section-title">ADDITIONAL INFORMATION</h2>
                  {isEditing && (
                    <button onClick={handleAddAdditionalInfo} className="add-item-button">
                      <Plus className="button-icon" />
                      Add Info
                    </button>
                  )}
                </div>
                {((isEditing ? editableData?.additionalInformation : parsedData?.additionalInformation) || []).length > 0 ? (
                  <div className="resume-skills-text">
                    {isEditing ? (
                      <div className="additional-info-inputs">
                        {(isEditing ? editableData.additionalInformation : parsedData.additionalInformation).map((info, index) => (
                          <div key={index} className="additional-info-input">
                            <input
                              type="text"
                              value={info}
                              onChange={(e) => {
                                setEditableData(prev => {
                                  const newData = JSON.parse(JSON.stringify(prev));
                                  newData.additionalInformation[index] = e.target.value;
                                  return newData;
                                });
                              }}
                              className="editable-input additional-info-input-field"
                              placeholder="Additional information"
                            />
                            <button 
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                console.log('Remove additional info button clicked for index:', index);
                                handleRemoveAdditionalInfo(index);
                              }}
                              onMouseDown={(e) => {
                                // Safari-specific event handling
                                e.preventDefault();
                                console.log('Mouse down on remove additional info button for index:', index);
                              }}
                              className="remove-info-button"
                              type="button"
                              style={{
                                // Safari-specific styles
                                WebkitAppearance: 'none',
                                WebkitUserSelect: 'none',
                                WebkitTapHighlightColor: 'transparent',
                                WebkitTouchCallout: 'none',
                                WebkitTransform: 'translateZ(0)',
                                transform: 'translateZ(0)',
                                position: 'relative',
                                zIndex: 1
                              }}
                            >
                              <Trash2 className="button-icon" />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      (isEditing ? editableData.additionalInformation : parsedData.additionalInformation).join(' | ')
                    )}
                  </div>
                ) : (
                  <div className="empty-section">
                    {isEditing ? 'No additional information yet. Click "Add Info" to add one.' : 'No additional information available.'}
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons - Only Download */}
            <div className="resume-actions">
              <div className="view-actions">
                <button onClick={downloadTemplate} className="download-button">
                  <Download className="button-icon" />
                  Download PDF
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResumeParser;