# JobDekho - Smart Resume Parser

An intelligent AI-powered resume parsing application that extracts, processes, and enhances resume data from PDF and DOCX files with real-time editing capabilities and database integration.

## 🚀 Features

### Core Functionality
- **Multi-format Support**: Upload and parse PDF and DOCX resume files
- **AI-Powered Parsing**: Uses Ollama with Qwen2.5:1.5b model for intelligent text extraction
- **Database Integration**: MongoDB storage with automatic saving
- **Professional Output**: Generates clean, formatted resume templates
- **PDF Export**: Download your resume as a professional PDF

### Advanced Resume Editor
- **Real-time Editing**: Make changes to any field with live preview
- **Smart Data Management**: Add/remove sections dynamically
- **Enhanced Personal Info**: LinkedIn, GitHub, salary, location, hobbies
- **Comprehensive Sections**: Experience, education, projects, skills, achievements, certificates
- **Auto-save**: Automatic database saving when connected
- **Manual Entry**: Create resumes from scratch without file upload

### User Experience
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Modern UI**: Gradient-based design with smooth animations
- **Safari Optimized**: Enhanced compatibility for Safari browsers
- **Accessibility**: Full keyboard navigation and screen reader support
- **Error Handling**: Graceful fallbacks and helpful error messages

## 🛠️ Tech Stack

- **Frontend**: React 19+ with modern hooks and functional components
- **AI Integration**: Ollama API with Qwen2.5:1.5b model
- **Backend**: Node.js/Express with MongoDB
- **File Processing**: PDF.js for PDF extraction, Mammoth.js for DOCX
- **Styling**: Modern CSS3 with CSS variables and gradients
- **Database**: MongoDB with Mongoose ODM

## 📋 Prerequisites

- **Node.js** (v16 or higher)
- **Ollama** installed and running locally
- **MongoDB** (local or cloud instance)
- **Modern browser** (Chrome, Firefox, Safari, Edge)

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone https://github.com/arushi-vaidya/resume-parser.git
cd resume-parser
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Set Up AI Service (Ollama)
```bash
# Install Ollama from https://ollama.ai
# Download and start the AI model
ollama pull qwen2.5:1.5b
ollama serve
```

### 4. Set Up Database (Optional)
```bash
cd backend
npm install express mongoose cors dotenv express-validator helmet express-rate-limit compression
npm install --save-dev nodemon jest supertest eslint
```

Create .env file:
```bash
# Server Configuration
PORT=5000
NODE_ENV=development

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/resume_parser

# Frontend Configuration
FRONTEND_URL=http://localhost:3000

# Security (Optional)
JWT_SECRET=your_jwt_secret_here_change_in_production
BCRYPT_ROUNDS=12

# Rate Limiting (Optional)
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

Setup MongoDB
1. Install MongoDB Community Server
Start MongoDB service:
```bash
# On macOS with Homebrew
brew services start mongodb-community

# On Ubuntu/Debian
sudo systemctl start mongod

# On Windows
# Start MongoDB as a Windows service or run mongod.exe
```

### 5. Start Development Server
```bash
npm start #in root directory
cd backend
npm run dev 
```

Visit `http://localhost:3000` to access the application.

## 🎯 Usage Guide

### Basic Resume Parsing
1. **Upload Resume**: Drag and drop or select your PDF/DOCX file
2. **Complete Profile**: Add additional information when prompted
3. **Review Results**: AI will parse and structure your resume
4. **Download**: Export as professional PDF

### Advanced Editing
1. **Enter Edit Mode**: Click "Edit Resume" button
2. **Modify Sections**: Update any field with real-time preview
3. **Add New Content**:
   - **Personal Info**: LinkedIn, GitHub, salary details
   - **Experience**: Job positions with detailed descriptions
   - **Education**: Degrees, institutions, achievements
   - **Projects**: Technical projects and descriptions
   - **Skills**: Technical and soft skills
   - **Achievements**: Awards and accomplishments
   - **Certificates**: Professional certifications
   - **Additional Info**: Any extra relevant information
4. **Save Changes**: Automatic saving to database (if connected)

### Manual Resume Creation
1. **Click "Manual Entry"** on the homepage
2. **Fill in Information**: Add your details section by section
3. **Use Dynamic Forms**: Add/remove entries as needed
4. **Export**: Download your completed resume

## 🔧 Configuration

### Environment Variables
Create a `.env` file in the root directory:
```env
# API Configuration
REACT_APP_API_URL=http://localhost:5000/api

# AI Service Configuration
OLLAMA_HOST=http://localhost:11434

# Database Configuration (for backend)
MONGODB_URI=mongodb://localhost:27017/resumeparser
```

### AI Model Configuration
The application uses Qwen2.5:1.5b by default. To use a different model:
1. Pull the desired model: `ollama pull model-name`
2. Update the model name in `src/App.js` (search for `qwen2.5:1.5b`)

## 🏗️ Project Structure

```
resume-parser/
├── public/                 # Static files
├── src/
│   ├── services/
│   │   └── api.js         # Backend API integration
│   ├── App.js             # Main application component
│   ├── ResumeParser.css   # Styling and themes
│   └── index.js           # Application entry point
├── package.json           # Dependencies and scripts
└── README.md             # This file
```

## 🎨 Data Structure

The application maintains this resume structure:
```javascript
{
  personalInfo: {
    name: String,
    email: String,
    phone: String,
    location: String,
    currentSalary: String,
    linkedinLink: String,
    githubLink: String,
    hometown: String,
    currentLocation: String,
    hobbies: [String]
  },
  experience: [{
    position: String,
    company: String,
    duration: String,
    description: [String]
  }],
  education: [{
    degree: String,
    institution: String,
    year: String,
    description: [String]
  }],
  projects: [{
    title: String,
    description: [String]
  }],
  achievements: [{
    title: String,
    description: [String]
  }],
  certificates: [{
    title: String,
    issuer: String,
    year: String,
    description: [String]
  }],
  skills: [String],
  additionalInformation: [String]
}
```

## 🌐 Browser Support

- **Chrome** (recommended) - Full support
- **Firefox** - Full support  
- **Safari** - Enhanced compatibility with specific optimizations
- **Edge** - Full support
- **Mobile browsers** - Responsive design support

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

