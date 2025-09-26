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
    // Allow requests with no origin (mobile apps, etc.)
    if (!origin) return callback(null, true);
    if (allowed.includes(origin)) return callback(null, true);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// MongoDB Connection
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/resume_parser');
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('❌ Error connecting to MongoDB:', error.message);
    process.exit(1);
  }
};

// Generate unique user ID
const generateUserId = () => {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substr(2, 8); // Longer random string
  const counter = Math.floor(Math.random() * 1000); // Additional entropy
  return `USER-${timestamp}-${randomStr}-${counter}`.toUpperCase();
};

// User Schema with unique ID
const userSchema = new mongoose.Schema({
  userId: { 
    type: String, 
    unique: true, 
    required: true,
    default: generateUserId
  },
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  // Profile information
  profileInfo: {
    joinedDate: { type: Date, default: Date.now },
    lastLoginDate: { type: Date, default: Date.now },
    resumeCount: { type: Number, default: 0 },
    profileCompleteness: { type: Number, default: 0 } // Percentage
  },
  // Verification information
  verification: {
    isVerified: { type: Boolean, default: false },
    verifiedAt: { type: Date, default: null },
    verificationMethod: { type: String, default: null }, // 'photo_aadhar', 'email', etc.
    aadharNumber: { type: String, default: null },
    verificationPhoto: { 
      data: { type: Buffer, default: null },
      contentType: { type: String, default: null },
      size: { type: Number, default: null }
    },
    verificationStatus: { 
      type: String, 
      enum: ['pending', 'approved', 'rejected'], 
      default: 'pending' 
    },
    verificationNotes: { type: String, default: null }
  }
}, { timestamps: true, collection: 'users' });

// Ensure unique indexes
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ userId: 1 }, { unique: true });

// Pre-save middleware to generate userId if not exists
userSchema.pre('save', function(next) {
  if (!this.userId) {
    this.userId = generateUserId();
  }
  next();
});

const User = mongoose.model('User', userSchema);

// Resume Schema (keeping existing structure)
const resumeSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', unique: true, sparse: true },
  personalInfo: {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, trim: true, default: '' },
    location: { type: String, trim: true, default: '' },
    bio: { type: String, trim: true, default: '' },
    currentSalary: { type: String, trim: true, default: '' },
    salaryExpectation: { type: String, trim: true, default: '' },
    linkedinLink: { type: String, trim: true, default: '' },
    githubLink: { type: String, trim: true, default: '' },
    hometown: { type: String, trim: true, default: '' },
    currentLocation: { type: String, trim: true, default: '' },
    hobbies: { type: [String], default: [] }
  },
  experience: {
    type: [{
      position: { type: String, trim: true, default: '' },
      company: { type: String, trim: true, default: '' },
      duration: { type: String, trim: true, default: '' },
      description: { type: [String], default: [] }
    }],
    default: []
  },
  education: {
    type: [{
      degree: { type: String, trim: true, default: '' },
      institution: { type: String, trim: true, default: '' },
      year: { type: String, trim: true, default: '' },
      description: { type: [String], default: [] }
    }],
    default: []
  },
  projects: {
    type: [{
      title: { type: String, trim: true, default: '' },
      description: { type: [String], default: [] }
    }],
    default: []
  },
  achievements: {
    type: [{
      title: { type: String, trim: true, default: '' },
      description: { type: [String], default: [] }
    }],
    default: []
  },
  certificates: {
    type: [{
      title: { type: String, trim: true, default: '' },
      issuer: { type: String, trim: true, default: '' },
      year: { type: String, trim: true, default: '' },
      description: { type: [String], default: [] }
    }],
    default: []
  },
  skills: { type: [String], default: [] },
  additionalInformation: { type: [String], default: [] },
  uploadedAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  source: { type: String, enum: ['upload', 'manual'], default: 'upload' },
  ipAddress: { type: String, default: '' },
  userAgent: { type: String, default: '' }
}, {
  timestamps: true,
  collection: 'resumes'
});

resumeSchema.index({ 'personalInfo.email': 1 });
resumeSchema.index({ 'personalInfo.name': 1 });
resumeSchema.index({ uploadedAt: -1 });
resumeSchema.index({ user: 1 }, { unique: true, sparse: true });

const Resume = mongoose.model('Resume', resumeSchema);

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
    .notEmpty()
    .withMessage('Phone number is required')
    .isLength({ min: 10, max: 20 })
    .withMessage('Phone number must be between 10 and 20 characters'),
  
  body('personalInfo.salaryExpectation')
    .notEmpty()
    .withMessage('Salary expectation is required'),
    
  body('personalInfo.currentLocation')
    .notEmpty()
    .withMessage('Current location is required'),
    
  body('education')
    .isArray({ min: 1 })
    .withMessage('At least one education entry is required'),
    
  body('education.*.degree')
    .notEmpty()
    .withMessage('Degree is required for each education entry'),
    
  body('education.*.institution')
    .notEmpty()
    .withMessage('Institution is required for each education entry')
];

const cleanResumeData = (data) => {
  const cleaned = { ...data };
  
  const cleanArray = (arr) => {
    if (!Array.isArray(arr)) return [];
    return arr.filter(item => {
      if (typeof item === 'string') return item.trim().length > 0;
      if (typeof item === 'object' && item !== null) {
        return Object.values(item).some(val => {
          if (typeof val === 'string') return val.trim().length > 0;
          if (Array.isArray(val)) return val.length > 0;
          return val !== null && val !== undefined;
        });
      }
      return false;
    });
  };
  
  if (cleaned.personalInfo && cleaned.personalInfo.hobbies) {
    cleaned.personalInfo.hobbies = cleanArray(cleaned.personalInfo.hobbies);
  }
  if (cleaned.personalInfo) {
    Object.keys(cleaned.personalInfo).forEach(key => {
      if (typeof cleaned.personalInfo[key] === 'string') {
        cleaned.personalInfo[key] = cleaned.personalInfo[key].trim();
      }
    });
  }
  
  ['experience', 'education', 'projects', 'achievements', 'certificates', 'skills', 'additionalInformation'].forEach(field => {
    if (cleaned[field]) {
      cleaned[field] = cleanArray(cleaned[field]);
    }
  });
  
  return cleaned;
};

  const calculateProfileCompleteness = (user, resume) => {
  const sections = {
    basicInfo: { weight: 25, items: [] },
    contactInfo: { weight: 15, items: [] },
    professional: { weight: 35, items: [] },
    education: { weight: 15, items: [] },
    additional: { weight: 10, items: [] }
  };

  // Basic Info (25%)
  if (user && user.name && user.name.trim().length > 0) {
    sections.basicInfo.items.push({ name: 'Full Name', completed: true });
  } else {
    sections.basicInfo.items.push({ name: 'Full Name', completed: false });
  }

  if (user && user.email && user.email.trim().length > 0) {
    sections.basicInfo.items.push({ name: 'Email', completed: true });
  } else {
    sections.basicInfo.items.push({ name: 'Email', completed: false });
  }

  if (resume && resume.personalInfo && resume.personalInfo.bio && resume.personalInfo.bio.trim().length > 20) {
    sections.basicInfo.items.push({ name: 'Professional Bio', completed: true });
  } else {
    sections.basicInfo.items.push({ name: 'Professional Bio (20+ characters)', completed: false });
  }

  // Contact Info (15%)
  if (resume && resume.personalInfo && resume.personalInfo.phone && resume.personalInfo.phone.trim().length > 0) {
    sections.contactInfo.items.push({ name: 'Phone Number', completed: true });
  } else {
    sections.contactInfo.items.push({ name: 'Phone Number', completed: false });
  }

  if (resume && resume.personalInfo && resume.personalInfo.location && resume.personalInfo.location.trim().length > 0) {
    sections.contactInfo.items.push({ name: 'Location', completed: true });
  } else {
    sections.contactInfo.items.push({ name: 'Location', completed: false });
  }

  if (resume && resume.personalInfo && resume.personalInfo.linkedinLink && resume.personalInfo.linkedinLink.trim().length > 0) {
    sections.contactInfo.items.push({ name: 'LinkedIn Profile', completed: true });
  } else {
    sections.contactInfo.items.push({ name: 'LinkedIn Profile', completed: false });
  }

  // Professional Experience (35%)
  if (resume?.experience?.length >= 2) {
    sections.professional.items.push({ name: 'Work Experience (2+ positions)', completed: true });
  } else if (resume?.experience?.length === 1) {
    sections.professional.items.push({ name: 'Work Experience (2+ recommended)', completed: true, partial: true });
  } else {
    sections.professional.items.push({ name: 'Work Experience', completed: false });
  }
  
  if (resume?.skills?.length >= 5) {
    sections.professional.items.push({ name: 'Skills (5+ skills)', completed: true });
  } else if (resume?.skills?.length >= 3) {
    sections.professional.items.push({ name: 'Skills (5+ recommended)', completed: true, partial: true });
  } else {
    sections.professional.items.push({ name: 'Technical Skills', completed: false });
  }
  
  if (resume?.projects?.length >= 1) sections.professional.items.push({ name: 'Projects', completed: true });
  else sections.professional.items.push({ name: 'Projects', completed: false });

  // Education (15%)
  if (resume?.education?.length >= 1) sections.education.items.push({ name: 'Education Background', completed: true });
  else sections.education.items.push({ name: 'Education Background', completed: false });
  
  if (resume?.certificates?.length >= 1) sections.education.items.push({ name: 'Certifications', completed: true });
  else sections.education.items.push({ name: 'Certifications', completed: false });

  // Additional (10%)
  if (resume?.personalInfo?.githubLink) sections.additional.items.push({ name: 'GitHub Profile', completed: true });
  else sections.additional.items.push({ name: 'GitHub Profile', completed: false });
  
  if (resume?.achievements?.length >= 1) sections.additional.items.push({ name: 'Achievements', completed: true });
  else sections.additional.items.push({ name: 'Achievements', completed: false });

  // Add salary expectation to additional section
  if (resume?.personalInfo?.salaryExpectation && resume.personalInfo.salaryExpectation.trim().length > 0) {
    sections.additional.items.push({ name: 'Salary Expectation', completed: true });
  } else {
    sections.additional.items.push({ name: 'Salary Expectation', completed: false });
  }

  // Calculate weighted score
  let totalScore = 0;
  const completionDetails = {};

  Object.keys(sections).forEach(sectionKey => {
    const section = sections[sectionKey];
    const completed = section.items.filter(item => item.completed).length;
    const partial = section.items.filter(item => item.partial).length;
    const total = section.items.length;
    
    // Calculate section percentage (partial items count as 0.5)
    const sectionPercentage = total > 0 ? ((completed + (partial * 0.5)) / total) * 100 : 0;
    const weightedScore = (sectionPercentage / 100) * section.weight;
    
    totalScore += weightedScore;
    
    completionDetails[sectionKey] = {
      percentage: Math.round(sectionPercentage),
      completed: completed,
      total: total,
      items: section.items,
      weight: section.weight
    };
  });
  return {
    overall: Math.round(totalScore),
    sections: completionDetails
  };
};

// Auth helpers
const signToken = (user) => {
  const payload = { 
    id: user._id, 
    email: user.email, 
    name: user.name,
    userId: user.userId // Include userId in token
  };
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
// Updated register route
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
    const user = await User.create({ 
      name, 
      email, 
      passwordHash,
      profileInfo: {
        joinedDate: new Date(),
        lastLoginDate: new Date(),
        resumeCount: 0,
        profileCompleteness: 20 // Basic completion for name + email
      }
    });
    
    const token = signToken(user);
    return res.status(201).json({ 
      success: true, 
      message: 'Registered successfully', 
      data: { 
        token, 
        user: { 
          id: user._id, 
          userId: user.userId,
          name: user.name, 
          email: user.email,
          profileInfo: user.profileInfo
        } 
      } 
    });
  } catch (err) {
    console.error('Register error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Updated login route
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
    
    // Update last login date
    user.profileInfo.lastLoginDate = new Date();
    await user.save();
    
    const token = signToken(user);
    return res.json({ 
      success: true, 
      message: 'Login successful', 
      data: { 
        token, 
        user: { 
          id: user._id, 
          userId: user.userId,
          name: user.name, 
          email: user.email,
          profileInfo: user.profileInfo
        } 
      } 
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

app.get('/api/auth/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('userId name email profileInfo');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    
    // Get user's resume for completeness calculation
    const resume = await Resume.findOne({ user: user._id });
    
    // Update profile completeness
    const completeness = calculateProfileCompleteness(user, resume);
    
    user.profileInfo.profileCompleteness = completeness.overall;
    if (resume) {
      user.profileInfo.resumeCount = 1;
    }
    await user.save();
    
    return res.json({ 
      success: true, 
      data: { 
        id: user._id, 
        userId: user.userId,
        name: user.name, 
        email: user.email,
        profileInfo: user.profileInfo
      } 
    });
  } catch (err) {
    console.error('Error in /api/auth/me:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Health check (existing)
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Resume Parser Backend is running',
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// Updated save resume route with profile completeness update
app.post('/api/resumes', authMiddleware, validateResumeData, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const cleanedData = cleanResumeData(req.body);
    cleanedData.ipAddress = req.ip || req.connection?.remoteAddress || 'unknown';
    cleanedData.userAgent = req.get('User-Agent') || 'unknown';
    cleanedData.updatedAt = new Date();
    cleanedData.user = req.user.id;

    const existingResume = await Resume.findOne({ user: req.user.id });
    let savedResume;
    
   if (existingResume) {
  Object.assign(existingResume, cleanedData);
  savedResume = await existingResume.save();
  
  // Force recalculation by getting fresh data
  const user = await User.findById(req.user.id);
  const completeness = calculateProfileCompleteness(user, savedResume);
  user.profileInfo.profileCompleteness = completeness.overall;
  user.profileInfo.resumeCount = 1;
  await user.save();
  
  res.status(200).json({
    success: true,
    message: 'Resume updated successfully',
    data: {
      id: savedResume._id,
      email: savedResume.personalInfo.email,
      name: savedResume.personalInfo.name,
      updatedAt: savedResume.updatedAt,
      isUpdate: true,
      profileCompleteness: completeness
    }
  });
    } else {
      const newResume = new Resume(cleanedData);
      savedResume = await newResume.save();
      
      // Update user profile completeness
      const user = await User.findById(req.user.id);
      const completeness = calculateProfileCompleteness(user, savedResume);
      user.profileInfo.profileCompleteness = completeness.overall;
      user.profileInfo.resumeCount = 1;
      await user.save();
      
      res.status(201).json({
        success: true,
        message: 'Resume saved successfully',
        data: {
          id: savedResume._id,
          email: savedResume.personalInfo.email,
          name: savedResume.personalInfo.name,
          createdAt: savedResume.createdAt,
          isUpdate: false,
          profileCompleteness: completeness
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

// Get all resumes (existing - keeping same functionality)
app.get('/api/resumes', authMiddleware, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const search = req.query.search;
    let query = { user: req.user.id };
    
    if (search) {
      query = {
        user: req.user.id,
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

// Get single resume by ID (existing)
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

// Delete resume by ID (existing)
app.delete('/api/resumes/:id', authMiddleware, async (req, res) => {
  try {
    const resume = await Resume.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    
    if (!resume) {
      return res.status(404).json({
        success: false,
        message: 'Resume not found'
      });
    }

    // Update user resume count
    const user = await User.findById(req.user.id);
    user.profileInfo.resumeCount = 0;
    user.profileInfo.profileCompleteness = calculateProfileCompleteness(user, null);
    await user.save();

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

// New route: Get user profile
app.get('/api/profile', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('userId name email profileInfo');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    
    const resume = await Resume.findOne({ user: user._id });
    const completionData = calculateProfileCompleteness(user, resume);
    
    user.profileInfo.profileCompleteness = completionData.overall;
    await user.save();
    
    res.json({
      success: true,
      data: {
        userId: user.userId,
        name: user.name,
        email: user.email,
        profileInfo: user.profileInfo,
        verification: user.verification,
        hasResume: !!resume,
        completionBreakdown: completionData.sections,
        nextSteps: getNextSteps(completionData.sections)
      }
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Get verification status endpoint
app.get('/api/profile/verification', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('verification');
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    // Don't send the actual photo data in the verification status response
    const verificationData = {
      ...user.verification.toObject(),
      verificationPhoto: user.verification.verificationPhoto?.data ? {
        hasPhoto: true,
        contentType: user.verification.verificationPhoto.contentType,
        size: user.verification.verificationPhoto.size
      } : null
    };

    res.json({
      success: true,
      data: {
        verification: verificationData
      }
    });
  } catch (error) {
    console.error('Error fetching verification status:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
});

// Get verification photo endpoint
app.get('/api/profile/verification/photo', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('verification.verificationPhoto');
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    if (!user.verification.verificationPhoto?.data) {
      return res.status(404).json({ 
        success: false, 
        message: 'Verification photo not found' 
      });
    }

    res.set({
      'Content-Type': user.verification.verificationPhoto.contentType || 'image/jpeg',
      'Content-Length': user.verification.verificationPhoto.size,
      'Cache-Control': 'private, max-age=3600'
    });

    res.send(user.verification.verificationPhoto.data);
  } catch (error) {
    console.error('Error fetching verification photo:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
});

// Profile verification endpoint
app.post('/api/profile/verify', authMiddleware, [
  body('isVerified').isBoolean().withMessage('isVerified must be a boolean'),
  body('verificationMethod').notEmpty().withMessage('verificationMethod is required'),
  body('aadharNumber').optional().isLength({ min: 12, max: 12 }).withMessage('Aadhar number must be 12 digits'),
  body('verificationPhoto').optional().isBase64().withMessage('verificationPhoto must be base64 encoded')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const { isVerified, verifiedAt, verificationMethod, aadharNumber, verificationPhoto } = req.body;
    
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    // Check if user is already verified and prevent re-verification
    if (user.verification.isVerified && user.verification.verificationStatus === 'approved') {
      return res.status(400).json({
        success: false,
        message: 'User is already verified. Re-verification is not allowed.',
        data: {
          verification: user.verification
        }
      });
    }

    // Update verification information
    user.verification.isVerified = isVerified;
    user.verification.verifiedAt = verifiedAt ? new Date(verifiedAt) : new Date();
    user.verification.verificationMethod = verificationMethod;
    user.verification.verificationStatus = isVerified ? 'approved' : 'pending';
    
    if (aadharNumber) {
      // Validate Aadhar number format
      const cleanAadhar = aadharNumber.replace(/\s/g, '');
      if (!/^\d{12}$/.test(cleanAadhar)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid Aadhar number format'
        });
      }
      user.verification.aadharNumber = cleanAadhar;
    }

    // Handle verification photo
    if (verificationPhoto) {
      try {
        // Extract base64 data and content type
        const matches = verificationPhoto.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        if (matches && matches.length === 3) {
          const contentType = matches[1];
          const base64Data = matches[2];
          const buffer = Buffer.from(base64Data, 'base64');
          
          // Validate file size (max 5MB)
          if (buffer.length > 5 * 1024 * 1024) {
            return res.status(400).json({
              success: false,
              message: 'Photo size too large. Maximum size is 5MB.'
            });
          }

          // Validate content type
          if (!contentType.startsWith('image/')) {
            return res.status(400).json({
              success: false,
              message: 'Invalid file type. Only images are allowed.'
            });
          }

          user.verification.verificationPhoto = {
            data: buffer,
            contentType: contentType,
            size: buffer.length
          };
        } else {
          return res.status(400).json({
            success: false,
            message: 'Invalid photo format. Please provide a valid base64 encoded image.'
          });
        }
      } catch (photoError) {
        console.error('Error processing verification photo:', photoError);
        return res.status(400).json({
          success: false,
          message: 'Error processing verification photo.'
        });
      }
    }

    await user.save();

    // Return verification data without the actual photo buffer
    const verificationData = {
      ...user.verification.toObject(),
      verificationPhoto: user.verification.verificationPhoto?.data ? {
        hasPhoto: true,
        contentType: user.verification.verificationPhoto.contentType,
        size: user.verification.verificationPhoto.size
      } : null
    };

    res.json({
      success: true,
      message: 'Verification status updated successfully',
      data: {
        userId: user.userId,
        verification: verificationData
      }
    });

  } catch (error) {
    console.error('Error updating verification:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
});

// Helper function to get next steps
const getNextSteps = (sections) => {
  const suggestions = [];
  
  Object.keys(sections).forEach(sectionKey => {
    const section = sections[sectionKey];
    const incompleteItems = section.items.filter(item => !item.completed);
    
    incompleteItems.forEach(item => {
      let priority = 'medium';
      if (sectionKey === 'basicInfo' || sectionKey === 'professional') priority = 'high';
      if (sectionKey === 'additional') priority = 'low';
      
      suggestions.push({
        item: item.name,
        section: sectionKey,
        priority: priority
      });
    });
  });
  
  return suggestions.sort((a, b) => {
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    return priorityOrder[b.priority] - priorityOrder[a.priority];
  }).slice(0, 5); // Top 5 suggestions
};

// Analytics endpoint (updated with user-specific data)
app.get('/api/analytics', authMiddleware, async (req, res) => {
  try {
    // Get user-specific stats
    const userResume = await Resume.findOne({ user: req.user.id });
    const user = await User.findById(req.user.id);
    
    // Global stats (admin-level, optional)
    const totalUsers = await User.countDocuments();
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
        // User-specific
        userStats: {
          userId: user.userId,
          profileCompleteness: user.profileInfo.profileCompleteness,
          hasResume: !!userResume,
          joinedDate: user.profileInfo.joinedDate,
          lastLoginDate: user.profileInfo.lastLoginDate
        },
        // Global stats
        globalStats: {
          totalUsers,
          totalResumes,
          resumesThisMonth,
          topSkills,
          topCompanies
        }
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

// Basic catch-all route handler
app.get('/', (req, res) => {
  res.json({
    message: 'Resume Parser Backend API',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth/*',
      resumes: '/api/resumes',
      profile: '/api/profile',
      profileVerify: '/api/profile/verify',
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

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.path}`,
    availableRoutes: [
      'GET /api/health',
      'POST /api/auth/register',
      'POST /api/auth/login',
      'GET /api/auth/me',
      'POST /api/resumes',
      'GET /api/resumes',
      'GET /api/resumes/:id',
      'DELETE /api/resumes/:id',
      'GET /api/profile',
      'POST /api/profile/verify',
      'GET /api/analytics'
    ]
  });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
    await mongoose.connection.close();
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
      console.log(`🔗 API Base URL: http://localhost:${PORT}/api`);
      console.log(`📝 Health Check: http://localhost:${PORT}/api/health`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();