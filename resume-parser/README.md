# 📄 Resume Parser - Local AI Edition

A completely **free** and **private** resume parser that runs AI models locally on your computer.  
Extract, structure, and beautifully present resume data from PDFs and images — all without sending data to external services.

---

## ✨ Features

- **🤖 Local AI Parsing:** Uses Ollama for high-quality AI extraction with fallback to rule-based parsing
- **📁 Multiple Formats:** Supports PDF and image files (JPG, PNG)
- **📊 Rich Data Extraction:** Personal info, experience, education, projects, achievements, certificates, skills, and more

---

## 🖼️ Screenshots

| Upload & AI Status               | Parsed Results                |
|:--------------------------------:|:-----------------------------:|
| ![Upload Screen](public/photo1.png) | ![Parsed Results](public/photo2.png) |

---

## 🚀 Quick Start

###  Full AI Setup (Recommended)

#### 1. Install Ollama
- Visit [ollama.ai](https://ollama.ai) and download for your OS
- Install and start Ollama

#### 2. Pull an AI Model
```bash
# Recommended: Excellent for structured data extraction
ollama pull qwen2.5:1.5b
```

#### 3. Start the App
```bash
npm start
```

The app will automatically detect Ollama and show "Ollama Connected" status.

---

## ⚙️ Project Structure

```
resume-parser/
  ├── public/
  ├── src/
  │   ├── App.js              # Main component with Ollama integration
  │   ├── ResumeParser.css    # Styling
  │   └── ...
  ├── package.json            # No API dependencies!
  └── README.md
```

---

## 🧠 How It Works

1. **📤 Upload:** Drag & drop or select a PDF/image resume
2. **🔍 Extract:** Text extracted using PDF.js or Tesseract.js
3. **🤖 Parse:** 
   - **With Ollama:** AI model processes text for structured JSON
   - **Without Ollama:** Rule-based extraction finds key information
4. **📊 Display:** All sections shown in beautiful, responsive UI
5. **📥 Download:** Get formatted HTML resume template

---

## 🔧 Configuration Options

### Model Selection
When Ollama is connected, you can choose from available models in the dropdown.

### Fallback Mode
Without Ollama, the app automatically uses rule-based extraction that finds:
- Email addresses and phone numbers
- Basic name extraction
- Common skills and technologies
- Education institutions
- Company names

---

## 📦 Built With

- [React](https://reactjs.org/) - UI Framework
- [Ollama](https://ollama.ai/) - Local AI Models
- [PDF.js](https://mozilla.github.io/pdf.js/) - PDF Processing
- [Tesseract.js](https://tesseract.projectnaptha.com/) - OCR for Images
- [Lucide React](https://lucide.dev/) - Icons

---

## 📄 License

MIT License - feel free to use this project commercially or personally.

---

## 🙏 Acknowledgements

- [Ollama](https://ollama.ai/) for making local AI accessible
- [Meta](https://llama.meta.com/) for Llama models
- [Mistral AI](https://mistral.ai/) for open models
- PDF.js and Tesseract.js teams for text extraction

---