const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: (origin, callback) => {
    const allowed = [
      process.env.FRONTEND_URL || 'http://localhost:3000',
      'http://localhost:3000',
      'http://localhost:5173'
    ];
    if (!origin || allowed.includes(origin)) return callback(null, true);
    return callback(null, false);
  },
  credentials: true,
  optionsSuccessStatus: 200
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// MongoDB Connection
const connectDB = async () => {
  try {
    // Updated connection options for newer Mongoose versions
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/resume_parser');
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('❌ Error connecting to MongoDB:', error.message);
    process.exit(1);
  }
};

// User Schema
const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
}, { timestamps: true, collection: 'users' });

userSchema.index({ email: 1 }, { unique: true });

const User = mongoose.model('User', userSchema);

// Resume Schema
const resumeSchema = new mongoose.Schema({
  // Link to user (one-to-one)
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', unique: true, sparse: true },
  // Personal Information
  personalInfo: {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, trim: true, default: '' },
    location: { type: String, trim: true, default: '' },
    bio: { type: String, trim: true, default: '' },
    currentSalary: { type: String, trim: true, default: '' },
    linkedinLink: { type: String, trim: true, default: '' },
    githubLink: { type: String, trim: true, default: '' },
    hometown: { type: String, trim: true, default: '' },
    currentLocation: { type: String, trim: true, default: '' },
    hobbies: { type: [String], default: [] }
  },
  
  // Professional Experience
  experience: {
    type: [{
      position: { type: String, trim: true, default: '' },
      company: { type: String, trim: true, default: '' },
      duration: { type: String, trim: true, default: '' },
      description: { type: [String], default: [] }
    }],
    default: []
  },
  
  // Education
  education: {
    type: [{
      degree: { type: String, trim: true, default: '' },
      institution: { type: String, trim: true, default: '' },
      year: { type: String, trim: true, default: '' },
      description: { type: [String], default: [] }
    }],
    default: []
  },
  
  // Projects
  projects: {
    type: [{
      title: { type: String, trim: true, default: '' },
      description: { type: [String], default: [] }
    }],
    default: []
  },
  
  // Achievements
  achievements: {
    type: [{
      title: { type: String, trim: true, default: '' },
      description: { type: [String], default: [] }
    }],
    default: []
  },
  
  // Certificates
  certificates: {
    type: [{
      title: { type: String, trim: true, default: '' },
      issuer: { type: String, trim: true, default: '' },
      year: { type: String, trim: true, default: '' },
      description: { type: [String], default: [] }
    }],
    default: []
  },
  
  // Skills
  skills: { type: [String], default: [] },
  
  // Additional Information
  additionalInformation: { type: [String], default: [] },
  
  // Metadata
  uploadedAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  source: { type: String, enum: ['upload', 'manual'], default: 'upload' },
  ipAddress: { type: String, default: '' },
  userAgent: { type: String, default: '' }
}, {
  timestamps: true,
  collection: 'resumes'
});

// Add indexes for better query performance
resumeSchema.index({ 'personalInfo.email': 1 });
resumeSchema.index({ 'personalInfo.name': 1 });
resumeSchema.index({ uploadedAt: -1 });
resumeSchema.index({ 'personalInfo.email': 1, uploadedAt: -1 });
resumeSchema.index({ user: 1 }, { unique: true, sparse: true });

const Resume = mongoose.model('Resume', resumeSchema);

// Validation middleware
const validateResumeData = [
  body('personalInfo.name')
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  
  body('personalInfo.email')
    .isEmail()
    .withMessage('Valid email is required')
    .normalizeEmail(),
  
  body('personalInfo.phone')
    .optional()
    .isLength({ max: 20 })
    .withMessage('Phone number too long'),
  
  body('personalInfo.location')
    .optional()
    .isLength({ max: 200 })
    .withMessage('Location too long')
];

// Helper function to clean and validate data
const cleanResumeData = (data) => {
  const cleaned = { ...data };
  
  // Clean arrays - remove empty strings and null values
  const cleanArray = (arr) => {
    if (!Array.isArray(arr)) return [];
    return arr.filter(item => {
      if (typeof item === 'string') return item.trim().length > 0;
      if (typeof item === 'object' && item !== null) {
        // For objects, check if they have any non-empty values
        return Object.values(item).some(val => {
          if (typeof val === 'string') return val.trim().length > 0;
          if (Array.isArray(val)) return val.length > 0;
          return val !== null && val !== undefined;
        });
      }
      return false;
    });
  };
  
  // Clean personal info hobbies
  if (cleaned.personalInfo && cleaned.personalInfo.hobbies) {
    cleaned.personalInfo.hobbies = cleanArray(cleaned.personalInfo.hobbies);
  }
  // Trim personalInfo string fields including bio
  if (cleaned.personalInfo) {
    Object.keys(cleaned.personalInfo).forEach(key => {
      if (typeof cleaned.personalInfo[key] === 'string') {
        cleaned.personalInfo[key] = cleaned.personalInfo[key].trim();
      }
    });
  }
  
  // Clean other arrays
  ['experience', 'education', 'projects', 'achievements', 'certificates', 'skills', 'additionalInformation'].forEach(field => {
    if (cleaned[field]) {
      cleaned[field] = cleanArray(cleaned[field]);
    }
  });
  
  return cleaned;
};

// Auth helpers
const signToken = (user) => {
  const payload = { id: user._id, email: user.email, name: user.name };
  return jwt.sign(payload, process.env.JWT_SECRET || 'dev_secret', { expiresIn: '7d' });
};

const authMiddleware = (req, res, next) => {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev_secret');
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
};

// Routes
// Auth routes
app.post('/api/auth/register', [
  body('name').isLength({ min: 2 }).withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() });
    }

    const { name, email, password } = req.body;
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Email already in use' });
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, passwordHash });
    const token = signToken(user);
    return res.status(201).json({ success: true, message: 'Registered successfully', data: { token, user: { id: user._id, name: user.name, email: user.email } } });
  } catch (err) {
    console.error('Register error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

app.post('/api/auth/login', [
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() });
    }
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ success: false, message: 'Invalid credentials' });
    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) return res.status(401).json({ success: false, message: 'Invalid credentials' });
    const token = signToken(user);
    return res.json({ success: true, message: 'Login successful', data: { token, user: { id: user._id, name: user.name, email: user.email } } });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

app.get('/api/auth/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('name email');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    return res.json({ success: true, data: { id: user._id, name: user.name, email: user.email } });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Resume Parser Backend is running',
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// Save resume data
app.post('/api/resumes', authMiddleware, validateResumeData, async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    // Clean the incoming data
    const cleanedData = cleanResumeData(req.body);
    
    // Add metadata
    cleanedData.ipAddress = req.ip || req.connection?.remoteAddress || 'unknown';
    cleanedData.userAgent = req.get('User-Agent') || 'unknown';
    cleanedData.updatedAt = new Date();

    // Attach user id
    cleanedData.user = req.user.id;

    // Check if resume for this user already exists
    const existingResume = await Resume.findOne({ user: req.user.id });

    let savedResume;
    
    if (existingResume) {
      // Update existing resume
      Object.assign(existingResume, cleanedData);
      savedResume = await existingResume.save();
      
      res.status(200).json({
        success: true,
        message: 'Resume updated successfully',
        data: {
          id: savedResume._id,
          email: savedResume.personalInfo.email,
          name: savedResume.personalInfo.name,
          updatedAt: savedResume.updatedAt,
          isUpdate: true
        }
      });
    } else {
      // Create new resume
      const newResume = new Resume(cleanedData);
      savedResume = await newResume.save();
      
      res.status(201).json({
        success: true,
        message: 'Resume saved successfully',
        data: {
          id: savedResume._id,
          email: savedResume.personalInfo.email,
          name: savedResume.personalInfo.name,
          createdAt: savedResume.createdAt,
          isUpdate: false
        }
      });
    }

  } catch (error) {
    console.error('Error saving resume:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: Object.values(error.errors).map(e => ({
          field: e.path,
          message: e.message
        }))
      });
    }
    
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'Duplicate data detected',
        error: 'A resume with this information already exists'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
  }
});

// Get all resumes (with pagination)
app.get('/api/resumes', authMiddleware, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    // Search functionality
    const search = req.query.search;
    let query = { user: req.user.id };
    
    if (search) {
      query = {
        $or: [
          { 'personalInfo.name': { $regex: search, $options: 'i' } },
          { 'personalInfo.email': { $regex: search, $options: 'i' } },
          { 'experience.company': { $regex: search, $options: 'i' } },
          { 'experience.position': { $regex: search, $options: 'i' } }
        ]
      };
    }

    const resumes = await Resume.find(query)
      .select('personalInfo.name personalInfo.email personalInfo.location experience.company experience.position createdAt updatedAt')
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Resume.countDocuments(query);
    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      data: resumes,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount: total,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('Error fetching resumes:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching resumes',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
  }
});

// Get single resume by ID
app.get('/api/resumes/:id', authMiddleware, async (req, res) => {
  try {
    const resume = await Resume.findOne({ _id: req.params.id, user: req.user.id });
    
    if (!resume) {
      return res.status(404).json({
        success: false,
        message: 'Resume not found'
      });
    }

    res.json({
      success: true,
      data: resume
    });

  } catch (error) {
    console.error('Error fetching resume:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid resume ID'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error fetching resume',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
  }
});

// Delete resume by ID
app.delete('/api/resumes/:id', authMiddleware, async (req, res) => {
  try {
    const resume = await Resume.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    
    if (!resume) {
      return res.status(404).json({
        success: false,
        message: 'Resume not found'
      });
    }

    res.json({
      success: true,
      message: 'Resume deleted successfully',
      data: {
        id: resume._id,
        name: resume.personalInfo.name,
        email: resume.personalInfo.email
      }
    });

  } catch (error) {
    console.error('Error deleting resume:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid resume ID'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error deleting resume',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
  }
});

// Analytics endpoint
app.get('/api/analytics', async (req, res) => {
  try {
    const totalResumes = await Resume.countDocuments();
    const resumesThisMonth = await Resume.countDocuments({
      createdAt: { $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) }
    });
    
    const topSkills = await Resume.aggregate([
      { $unwind: '$skills' },
      { $group: { _id: '$skills', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);
    
    const topCompanies = await Resume.aggregate([
      { $unwind: '$experience' },
      { $group: { _id: '$experience.company', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    res.json({
      success: true,
      data: {
        totalResumes,
        resumesThisMonth,
        topSkills,
        topCompanies
      }
    });

  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching analytics',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
  }
});

// Basic catch-all route handler (fixes the path-to-regexp issue)
app.get('/', (req, res) => {
  res.json({
    message: 'Resume Parser Backend API',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      health: '/api/health',
      resumes: '/api/resumes',
      analytics: '/api/analytics'
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler (simplified to avoid path-to-regexp issues)
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.path}`,
    availableRoutes: [
      'GET /api/health',
      'POST /api/resumes',
      'GET /api/resumes',
      'GET /api/resumes/:id',
      'DELETE /api/resumes/:id',
      'GET /api/analytics'
    ]
  });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  try {
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  } catch (error) {
    console.error('Error closing MongoDB connection:', error);
  }
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully');
  try {
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  } catch (error) {
    console.error('Error closing MongoDB connection:', error);
  }
  process.exit(0);
});

// Start server
const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔗 API Base URL: http://localhost:${PORT}/api`);
      console.log(`📝 Health Check: http://localhost:${PORT}/api/health`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();