// API Service for Resume Parser Frontend

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.tokenKey = 'rp_auth_token';
  }

  // Helper method for making HTTP requests
  async makeRequest(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    
    const defaultOptions = {
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const requestOptions = {
      ...defaultOptions,
      ...options,
      headers: {
        ...defaultOptions.headers,
        ...options.headers,
      },
    };

    // Attach Authorization header if token exists
    const token = this.getToken();
    if (token) {
      requestOptions.headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      console.log(`Making ${requestOptions.method || 'GET'} request to:`, url);
      
      const response = await fetch(url, requestOptions);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('API Response:', data);
      return data;

    } catch (error) {
      console.error('API Request failed:', error);
      throw error;
    }
  }

  // Auth token helpers
  setToken(token) {
    try { localStorage.setItem(this.tokenKey, token); } catch (_) {}
  }

  getToken() {
    try { return localStorage.getItem(this.tokenKey); } catch (_) { return null; }
  }

  clearToken() {
    try { localStorage.removeItem(this.tokenKey); } catch (_) {}
  }

  // Auth endpoints
  async login(email, password) {
    const res = await this.makeRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    if (res?.data?.token) this.setToken(res.data.token);
    return res;
  }

  async register(name, email, password) {
    const res = await this.makeRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password })
    });
    if (res?.data?.token) this.setToken(res.data.token);
    return res;
  }

  async me() {
    return this.makeRequest('/auth/me');
  }

  // Profile endpoints
  async getProfile() {
    try {
      const response = await this.makeRequest('/profile');
      return response;
    } catch (error) {
      console.error('Error fetching profile:', error);
      throw new Error(`Failed to fetch profile: ${error.message}`);
    }
  }

  async getAnalytics() {
    try {
      const response = await this.makeRequest('/analytics');
      return response;
    } catch (error) {
      console.error('Error fetching analytics:', error);
      throw new Error(`Failed to fetch analytics: ${error.message}`);
    }
  }

  // Health check
  async checkHealth() {
    try {
      const response = await this.makeRequest('/health');
      return response;
    } catch (error) {
      console.error('Health check failed:', error);
      throw new Error('Backend service is not available');
    }
  }

  // Save resume data to MongoDB
  async saveResume(resumeData) {
    try {
      // Validate required fields
      if (!resumeData.personalInfo?.name) {
        throw new Error('Name is required');
      }
      if (!resumeData.personalInfo?.email) {
        throw new Error('Email is required');
      }

      // Clean the data before sending
      const cleanedData = this.cleanResumeData(resumeData);
      
      console.log('Saving resume data:', cleanedData);

      const response = await this.makeRequest('/resumes', {
        method: 'POST',
        body: JSON.stringify(cleanedData),
      });

      return response;

    } catch (error) {
      console.error('Error saving resume:', error);
      throw new Error(`Failed to save resume: ${error.message}`);
    }
  }

  // Get all resumes with optional search and pagination
  async getResumes(params = {}) {
    try {
      const queryParams = new URLSearchParams();
      
      if (params.page) queryParams.append('page', params.page);
      if (params.limit) queryParams.append('limit', params.limit);
      if (params.search) queryParams.append('search', params.search);

      const endpoint = `/resumes${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      
      const response = await this.makeRequest(endpoint);
      return response;

    } catch (error) {
      console.error('Error fetching resumes:', error);
      throw new Error(`Failed to fetch resumes: ${error.message}`);
    }
  }

  // Get single resume by ID
  async getResumeById(id) {
    try {
      if (!id) {
        throw new Error('Resume ID is required');
      }

      const response = await this.makeRequest(`/resumes/${id}`);
      return response;

    } catch (error) {
      console.error('Error fetching resume:', error);
      throw new Error(`Failed to fetch resume: ${error.message}`);
    }
  }

  // Delete resume by ID
  async deleteResume(id) {
    try {
      if (!id) {
        throw new Error('Resume ID is required');
      }

      const response = await this.makeRequest(`/resumes/${id}`, {
        method: 'DELETE',
      });

      return response;

    } catch (error) {
      console.error('Error deleting resume:', error);
      throw new Error(`Failed to delete resume: ${error.message}`);
    }
  }

  // Helper method to clean resume data
  cleanResumeData(data) {
    const cleaned = JSON.parse(JSON.stringify(data)); // Deep clone

    // Helper function to clean arrays
    const cleanArray = (arr) => {
      if (!Array.isArray(arr)) return [];
      return arr
        .map(item => {
          if (typeof item === 'string') {
            return item.trim();
          } else if (typeof item === 'object' && item !== null) {
            // Clean object properties
            const cleanedItem = {};
            Object.keys(item).forEach(key => {
              if (typeof item[key] === 'string') {
                const trimmed = item[key].trim();
                if (trimmed) cleanedItem[key] = trimmed;
              } else if (Array.isArray(item[key])) {
                const cleanedSubArray = cleanArray(item[key]);
                if (cleanedSubArray.length > 0) cleanedItem[key] = cleanedSubArray;
              } else if (item[key] !== null && item[key] !== undefined) {
                cleanedItem[key] = item[key];
              }
            });
            return cleanedItem;
          }
          return item;
        })
        .filter(item => {
          if (typeof item === 'string') {
            return item.length > 0;
          } else if (typeof item === 'object' && item !== null) {
            return Object.keys(item).length > 0;
          }
          return false;
        });
    };

    // Clean personal info
    if (cleaned.personalInfo) {
      Object.keys(cleaned.personalInfo).forEach(key => {
        if (typeof cleaned.personalInfo[key] === 'string') {
          cleaned.personalInfo[key] = cleaned.personalInfo[key].trim();
        } else if (Array.isArray(cleaned.personalInfo[key])) {
          cleaned.personalInfo[key] = cleanArray(cleaned.personalInfo[key]);
        }
      });
    }

    // Clean other sections
    ['experience', 'education', 'projects', 'achievements', 'certificates'].forEach(section => {
      if (cleaned[section]) {
        cleaned[section] = cleanArray(cleaned[section]);
      }
    });

    // Clean skills and additional information arrays
    if (cleaned.skills) {
      cleaned.skills = cleanArray(cleaned.skills);
    }
    
    if (cleaned.additionalInformation) {
      cleaned.additionalInformation = cleanArray(cleaned.additionalInformation);
    }

    return cleaned;
  }

  // Utility method to validate email
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Utility method to format errors for display
  formatError(error) {
    if (error.response?.data?.errors) {
      // Handle validation errors
      return error.response.data.errors.map(err => err.message).join(', ');
    } else if (error.response?.data?.message) {
      return error.response.data.message;
    } else if (error.message) {
      return error.message;
    } else {
      return 'An unexpected error occurred';
    }
  }

  // Utility method to generate a shareable profile link
  generateProfileLink(userId) {
    return `${window.location.origin}/profile/${userId}`;
  }

  // Utility method to format user ID for display
  formatUserId(userId) {
    if (!userId) return 'N/A';
    // Make it more readable by adding dashes
    return userId.replace(/([A-Z0-9]{4})([A-Z0-9]{8})([A-Z0-9]{5})/, '$1-$2-$3');
  }

  // Utility method to get profile completion tips
  getProfileCompletionTips(profileCompleteness, hasResume) {
    const tips = [];
    
    if (!hasResume) {
      tips.push({ icon: '✨', text: 'Upload or create your resume', priority: 'high' });
    }
    
    if (profileCompleteness < 100) {
      tips.push({ icon: '📝', text: 'Complete all resume sections', priority: 'medium' });
    }
    
    if (profileCompleteness < 80) {
      tips.push({ icon: '🔗', text: 'Add LinkedIn and GitHub links', priority: 'medium' });
    }
    
    if (profileCompleteness < 60) {
      tips.push({ icon: '💼', text: 'Add work experience details', priority: 'high' });
    }
    
    if (profileCompleteness < 40) {
      tips.push({ icon: '🎓', text: 'Add education information', priority: 'high' });
    }
    
    return tips;
  }

  // Utility method to get completion status text and color
  getCompletionStatus(percentage) {
    if (percentage >= 80) return { status: 'Complete', color: '#10b981' };
    if (percentage >= 60) return { status: 'Good', color: '#f59e0b' };
    if (percentage >= 40) return { status: 'Fair', color: '#f97316' };
    return { status: 'Needs Work', color: '#ef4444' };
  }

  // Utility method to format dates consistently
  formatDate(dateString, options = {}) {
    if (!dateString) return 'Unknown';
    
    const defaultOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    };
    
    const formatOptions = { ...defaultOptions, ...options };
    
    try {
      return new Date(dateString).toLocaleDateString('en-US', formatOptions);
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid Date';
    }
  }

  // Utility method to calculate days since joining
  calculateDaysActive(joinedDate) {
    if (!joinedDate) return 0;
    
    try {
      const joined = new Date(joinedDate);
      const now = new Date();
      const diffTime = Math.abs(now - joined);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays;
    } catch (error) {
      console.error('Error calculating days active:', error);
      return 0;
    }
  }

  // Utility method to get relative time (e.g., "2 days ago")
  getRelativeTime(dateString) {
    if (!dateString) return 'Unknown';
    
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffTime = now - date;
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 0) return 'Today';
      if (diffDays === 1) return 'Yesterday';
      if (diffDays < 7) return `${diffDays} days ago`;
      if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
      if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
      return `${Math.floor(diffDays / 365)} years ago`;
    } catch (error) {
      console.error('Error getting relative time:', error);
      return 'Unknown';
    }
  }
}

// Create singleton instance
const apiService = new ApiService();

// Export individual methods for easier usage
export const {
  checkHealth,
  saveResume,
  getResumes,
  getResumeById,
  deleteResume,
  getProfile,
  getAnalytics,
  cleanResumeData,
  isValidEmail,
  formatError,
  generateProfileLink,
  formatUserId,
  getProfileCompletionTips,
  getCompletionStatus,
  formatDate,
  calculateDaysActive,
  getRelativeTime
} = apiService;

// Export the class instance as default
export default apiService;