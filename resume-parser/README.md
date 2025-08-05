# 📄 Resume Parser

A modern, AI-powered resume parser and formatter.  
Effortlessly extract, structure, and beautifully present resume data from PDFs and images — all in your browser.

---

## ✨ Features

- **AI-Powered Parsing:** Uses Gemini or Mistral LLM APIs for highly accurate extraction.
- **Supports PDF & Images:** Upload resumes as PDF or image (JPG, PNG).
- **Rich Data Extraction:** Pulls out personal info, experience, education, projects, achievements, certificates, skills, and more.
- **Beautiful UI:** Professional, responsive, and easy-to-use interface.
- **Instant Resume Formatting:** Download a clean, modern HTML resume template with one click.
- **No Backend Required:** All parsing happens client-side (except for LLM API calls).

---

## 🖼️ Screenshots

| Upload Resume                | Parsed Results                |
|:----------------------------:|:-----------------------------:|
| ![Upload Screen](public/photo1.png) | ![Parsed Results](public/photo2.png) |

---

## 🛠️ Getting Started

### 1. Clone the repo

```bash
git clone https://github.com/arushi-vaidya/Job-Portal.git
cd resume-parser
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up API Keys

Create a `.env` file in the root of `resume-parser/` and add:

```env
REACT_APP_GEMINI_API_KEY=your_gemini_api_key_here
REACT_APP_MISTRAL_API_KEY=your_mistral_api_key_here
```

- You can use either or both. If both are set, Gemini is preferred.

### 4. Start the app

```bash
npm start
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## ⚙️ Project Structure

```
resume-parser/
  ├── public/
  ├── src/
  │   ├── App.js
  │   ├── ResumeParser.css
  │   └── ...
  ├── .env.example
  ├── package.json
  └── README.md
```

---

## 🧠 How It Works

1. **Upload:** Drag & drop or select a PDF/image resume.
2. **Extract:** Text is extracted using PDF.js or Tesseract.js.
3. **Parse:** Resume text is sent to Gemini or Mistral LLM for structured JSON extraction.
4. **Display:** All sections (experience, education, projects, etc.) are shown in a beautiful, responsive UI.
5. **Download:** Instantly download a formatted HTML resume.

---

## 📝 Customization

- **API Models:** Easily switch or extend to other LLMs.
- **UI:** Tweak styles in `ResumeParser.css` for your brand.
- **Template:** Edit the HTML template in `App.js` for custom resume formats.

---

## 📦 Built With

- [React](https://reactjs.org/)
- [lucide-react](https://lucide.dev/)
- [PDF.js](https://mozilla.github.io/pdf.js/)
- [Tesseract.js](https://tesseract.projectnaptha.com/)
- [Gemini API](https://ai.google.dev/)
- [Mistral API](https://mistral.ai/)

---

## 🛡️ License

MIT

---

## 🙏 Acknowledgements

- [Create React App](https://create-react-app.dev/)
- [Lucide Icons](https://lucide.dev/)
- [Google Gemini](https://ai.google.dev/)
- [Mistral AI](https://mistral.ai/)

---

> _Feel free to star ⭐ this repo if you find it useful!_
