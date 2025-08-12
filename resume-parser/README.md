# Smart Resume Parser

A powerful AI-powered resume parsing application that extracts information from PDF and DOCX files and allows users to edit and enhance the parsed data.

## Features

### Core Functionality
- **Multi-format Support**: Upload and parse PDF and DOCX resume files
- **AI-Powered Parsing**: Uses Ollama with Qwen2.5:1.5b model for intelligent text extraction
- **Professional Output**: Generates clean, formatted resume templates
- **PDF Export**: Download your resume as a professional PDF

### New: Editable Resume Functionality
- **Edit Mode**: Toggle between view and edit modes
- **Real-time Editing**: Make changes to any field in real-time
- **Add Missing Information**: Add new sections, entries, and details
- **Dynamic Content Management**: Add/remove experience, education, projects, skills, and more
- **Smart Validation**: Maintains data structure integrity
- **Responsive Design**: Works seamlessly on desktop and mobile devices

## Setup Requirements

### Prerequisites
- Node.js (v14 or higher)
- Ollama installed and running locally

### Installation
1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Install and start Ollama:
   ```bash
   # Download Ollama from https://ollama.ai
   ollama pull qwen2.5:1.5b
   ollama serve
   ```
4. Start the development server:
   ```bash
   npm start
   ```

## Usage

### Basic Resume Parsing
1. Upload your resume (PDF or DOCX)
2. Wait for AI processing
3. Review the parsed results
4. Download as PDF

### Editing Your Resume
1. Click "Edit Resume" button
2. Make changes to any field:
   - **Personal Info**: Name, email, phone, location
   - **Experience**: Add/edit job positions, companies, durations, descriptions
   - **Education**: Modify institutions, degrees, years
   - **Skills**: Add/remove technical skills
   - **Projects**: Edit project titles and descriptions
   - **Achievements**: Modify awards and accomplishments
   - **Certificates**: Update certifications and issuers
   - **Additional Info**: Add any extra information
3. Click "Save Changes" to apply modifications
4. Use "Cancel" to discard changes

### Adding New Content
- **Add New Entry**: Click the "+" button next to any section header
- **Add Description Lines**: Use "Add Line" button for multi-line descriptions
- **Remove Content**: Click the trash icon to delete entries or lines

## Technical Details

### Architecture
- **Frontend**: React.js with modern hooks and functional components
- **AI Integration**: Ollama API for natural language processing
- **File Processing**: PDF.js for PDF extraction, Mammoth.js for DOCX
- **Styling**: CSS3 with CSS variables and responsive design

### Data Structure
The application maintains a structured data format for resumes:
```javascript
{
  personalInfo: { name, email, phone, location },
  experience: [{ position, company, duration, description: [] }],
  education: [{ degree, institution, year, description: [] }],
  projects: [{ title, description: [] }],
  achievements: [{ title, description: [] }],
  certificates: [{ title, issuer, year, description: [] }],
  skills: [],
  additionalInformation: []
}
```

## Browser Support
- Chrome (recommended)
- Firefox
- Safari
- Edge

## Troubleshooting

### AI Service Issues
- Ensure Ollama is running: `ollama serve`
- Verify model is installed: `ollama list`
- Check if port 11434 is accessible

### File Upload Issues
- Ensure file is not password-protected
- Check file format (PDF or DOCX only)
- Verify file contains readable text (not scanned images)

### Performance Tips
- Use smaller files for faster processing
- Close other browser tabs during AI processing
- Ensure stable internet connection for library loading

## Contributing

Feel free to submit issues and enhancement requests!

## License

This project is open source and available under the MIT License.