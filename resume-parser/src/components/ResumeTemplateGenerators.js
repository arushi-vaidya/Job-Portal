export const generateClassicTemplate = (data, selectedColor = '#4285f4') => {
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
          ${exp.description?.length > 0 ? `
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
          ${project.description?.length > 0 ? `
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
          ${edu.description?.length > 0 ? `
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
          ${achievement.description?.length > 0 ? `
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
            border-bottom: 2px solid ${selectedColor};
            padding-bottom: 15px;
        }
        
        .name {
            font-size: 24pt;
            font-weight: bold;
            color: ${selectedColor};
            margin-bottom: 8px;
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
            font-size: 12pt;
            font-weight: bold;
            color: ${selectedColor};
            text-transform: uppercase;
            border-bottom: 1px solid ${selectedColor};
            padding-bottom: 3px;
            margin-bottom: 12px;
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
        
        .education-details, .achievement-title {
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

// Modern Sidebar Template
export const generateModernTemplate = (data, selectedColor = '#4285f4') => {
  const name = data.personalInfo?.name || 'Your Name';
  const email = data.personalInfo?.email || '';
  const phone = data.personalInfo?.phone || '';
  const location = data.personalInfo?.location || '';
  const linkedin = data.personalInfo?.linkedinLink || '';
  const github = data.personalInfo?.githubLink || '';

  const sidebarSkills = (data.skills && data.skills.length > 0) ? `
    <div class="sidebar-section">
      <h3 class="sidebar-title">SKILLS</h3>
      <div class="skills-list">
        ${data.skills.map(skill => `<div class="skill-item">${skill}</div>`).join('')}
      </div>
    </div>
  ` : '';

  const sidebarEducation = (data.education && data.education.length > 0) ? `
    <div class="sidebar-section">
      <h3 class="sidebar-title">EDUCATION</h3>
      ${data.education.map(edu => `
        <div class="sidebar-entry">
          <div class="sidebar-year">${edu.year || 'Year'}</div>
          <div class="sidebar-degree">${edu.degree || 'Degree'}</div>
          <div class="sidebar-institution">${edu.institution || 'Institution'}</div>
        </div>
      `).join('')}
    </div>
  ` : '';

  const sidebarCertificates = (data.certificates && data.certificates.length > 0) ? `
    <div class="sidebar-section">
      <h3 class="sidebar-title">CERTIFICATIONS</h3>
      ${data.certificates.map(cert => `
        <div class="sidebar-entry">
          <div class="sidebar-cert">${cert.title || 'Certificate'}</div>
          <div class="sidebar-issuer">${cert.issuer || 'Issuer'}</div>
        </div>
      `).join('')}
    </div>
  ` : '';

  const experienceSection = (data.experience && data.experience.length > 0) ? `
    <div class="main-section">
      <h2 class="main-title">PROFESSIONAL EXPERIENCE</h2>
      ${data.experience.map(exp => `
        <div class="main-entry">
          <div class="exp-header">
            <div class="exp-position">${exp.position || 'Position'}</div>
            <div class="exp-duration">${exp.duration || 'Duration'}</div>
          </div>
          <div class="exp-company">${exp.company || 'Company'}</div>
          ${exp.description?.length > 0 ? `
            <ul class="exp-list">
              ${exp.description.map(desc => `<li>${desc}</li>`).join('')}
            </ul>
          ` : ''}
        </div>
      `).join('')}
    </div>
  ` : '';

  const projectsSection = (data.projects && data.projects.length > 0) ? `
    <div class="main-section">
      <h2 class="main-title">KEY PROJECTS</h2>
      ${data.projects.map(project => `
        <div class="main-entry">
          <div class="project-title">${project.title || 'Project Title'}</div>
          ${project.description?.length > 0 ? `
            <ul class="exp-list">
              ${project.description.map(desc => `<li>${desc}</li>`).join('')}
            </ul>
          ` : ''}
        </div>
      `).join('')}
    </div>
  ` : '';

  const achievementsSection = (data.achievements && data.achievements.length > 0) ? `
    <div class="main-section">
      <h2 class="main-title">ACHIEVEMENTS</h2>
      ${data.achievements.map(achievement => `
        <div class="main-entry">
          <div class="project-title">${achievement.title || 'Achievement'}</div>
          ${achievement.description?.length > 0 ? `
            <ul class="exp-list">
              ${achievement.description.map(desc => `<li>${desc}</li>`).join('')}
            </ul>
          ` : ''}
        </div>
      `).join('')}
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
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 0;
            padding: 0;
            background: white;
            font-size: 10pt;
            line-height: 1.4;
            color: #333;
        }
        
        .container {
            display: flex;
            max-width: 8.5in;
            margin: 0 auto;
            min-height: 11in;
        }
        
        .sidebar {
            width: 35%;
            background: #f8f9fa;
            padding: 30px 20px;
            border-right: 4px solid ${selectedColor};
        }
        
        .main-content {
            width: 65%;
            padding: 30px 25px;
        }
        
        .header {
            margin-bottom: 25px;
        }
        
        .name {
            font-size: 22pt;
            font-weight: bold;
            color: ${selectedColor};
            margin-bottom: 8px;
            line-height: 1.1;
        }
        
        .contact-info {
            margin-bottom: 20px;
        }
        
        .contact-item {
            margin-bottom: 4px;
            font-size: 9pt;
            color: #555;
        }
        
        .sidebar-section {
            margin-bottom: 25px;
        }
        
        .sidebar-title {
            font-size: 11pt;
            font-weight: bold;
            color: ${selectedColor};
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 12px;
            border-bottom: 2px solid ${selectedColor};
            padding-bottom: 3px;
        }
        
        .skills-list {
            display: flex;
            flex-direction: column;
            gap: 6px;
        }
        
        .skill-item {
            background: white;
            padding: 6px 10px;
            border-radius: 4px;
            font-size: 9pt;
            border-left: 3px solid ${selectedColor};
        }
        
        .sidebar-entry {
            margin-bottom: 12px;
        }
        
        .sidebar-year {
            font-size: 9pt;
            color: ${selectedColor};
            font-weight: bold;
        }
        
        .sidebar-degree {
            font-size: 9pt;
            font-weight: bold;
            color: #333;
        }
        
        .sidebar-institution {
            font-size: 8pt;
            color: #666;
            margin-top: 2px;
        }
        
        .sidebar-cert {
            font-size: 9pt;
            font-weight: bold;
            color: #333;
        }
        
        .sidebar-issuer {
            font-size: 8pt;
            color: #666;
            margin-top: 2px;
        }
        
        .main-section {
            margin-bottom: 25px;
        }
        
        .main-title {
            font-size: 13pt;
            font-weight: bold;
            color: ${selectedColor};
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 15px;
            border-bottom: 2px solid ${selectedColor};
            padding-bottom: 3px;
        }
        
        .main-entry {
            margin-bottom: 18px;
        }
        
        .exp-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 3px;
        }
        
        .exp-position {
            font-size: 11pt;
            font-weight: bold;
            color: #333;
        }
        
        .exp-duration {
            font-size: 9pt;
            color: #666;
            font-style: italic;
        }
        
        .exp-company {
            font-size: 10pt;
            color: ${selectedColor};
            font-weight: 600;
            margin-bottom: 6px;
        }
        
        .project-title {
            font-size: 11pt;
            font-weight: bold;
            color: #333;
            margin-bottom: 6px;
        }
        
        .exp-list {
            margin: 6px 0 0 16px;
            padding: 0;
        }
        
        .exp-list li {
            font-size: 9pt;
            line-height: 1.4;
            margin-bottom: 3px;
            color: #444;
        }
        
        @media print {
            body {
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="sidebar">
            <div class="header">
                <div class="name">${name}</div>
                <div class="contact-info">
                    ${email ? `<div class="contact-item">📧 ${email}</div>` : ''}
                    ${phone ? `<div class="contact-item">📞 ${phone}</div>` : ''}
                    ${location ? `<div class="contact-item">📍 ${location}</div>` : ''}
                    ${linkedin ? `<div class="contact-item">💼 LinkedIn</div>` : ''}
                    ${github ? `<div class="contact-item">💻 GitHub</div>` : ''}
                </div>
            </div>
            
            ${sidebarSkills}
            ${sidebarEducation}
            ${sidebarCertificates}
        </div>
        
        <div class="main-content">
            ${experienceSection}
            ${projectsSection}
            ${achievementsSection}
        </div>
    </div>
</body>
</html>`;
};

// Executive Minimal Template
export const generateExecutiveTemplate = (data, selectedColor = '#4285f4') => {
  const name = data.personalInfo?.name || 'Your Name';
  const email = data.personalInfo?.email || '';
  const phone = data.personalInfo?.phone || '';
  const location = data.personalInfo?.location || '';
  const linkedin = data.personalInfo?.linkedinLink || '';
  const github = data.personalInfo?.githubLink || '';

  const contactInfo = [email, phone, location].filter(Boolean);

  const experienceSection = (data.experience && data.experience.length > 0) ? `
    <div class="section">
      <h2 class="section-title">Professional Experience</h2>
      ${data.experience.map(exp => `
        <div class="exp-entry">
          <div class="exp-header">
            <div class="exp-left">
              <div class="exp-position">${exp.position || 'Position'}</div>
              <div class="exp-company">${exp.company || 'Company'}</div>
            </div>
            <div class="exp-duration">${exp.duration || 'Duration'}</div>
          </div>
          ${exp.description?.length > 0 ? `
            <div class="exp-description">
              ${exp.description.map(desc => `<p class="exp-point">• ${desc}</p>`).join('')}
            </div>
          ` : ''}
        </div>
      `).join('')}
    </div>
  ` : '';

  const educationSkillsSection = `
    <div class="two-column-section">
      <div class="column">
        ${(data.education && data.education.length > 0) ? `
          <h3 class="sub-title">Education</h3>
          ${data.education.map(edu => `
            <div class="edu-entry">
              <div class="edu-degree">${edu.degree || 'Degree'}</div>
              <div class="edu-institution">${edu.institution || 'Institution'}</div>
              <div class="edu-year">${edu.year || 'Year'}</div>
            </div>
          `).join('')}
        ` : ''}
        
        ${(data.certificates && data.certificates.length > 0) ? `
          <h3 class="sub-title">Certifications</h3>
          ${data.certificates.map(cert => `
            <div class="cert-entry">
              <span class="cert-title">${cert.title || 'Certificate'}</span>
              ${cert.issuer ? ` - ${cert.issuer}` : ''}
            </div>
          `).join('')}
        ` : ''}
      </div>
      
      <div class="column">
        ${(data.skills && data.skills.length > 0) ? `
          <h3 class="sub-title">Core Competencies</h3>
          <div class="skills-grid">
            ${data.skills.map(skill => `<div class="skill-tag">${skill}</div>`).join('')}
          </div>
        ` : ''}
        
        ${(data.achievements && data.achievements.length > 0) ? `
          <h3 class="sub-title">Key Achievements</h3>
          ${data.achievements.map(achievement => `
            <div class="achievement-entry">
              <div class="achievement-title">${achievement.title || 'Achievement'}</div>
              ${achievement.description?.length > 0 ? `
                <div class="achievement-desc">${achievement.description[0]}</div>
              ` : ''}
            </div>
          `).join('')}
        ` : ''}
      </div>
    </div>
  `;

  const projectsSection = (data.projects && data.projects.length > 0) ? `
    <div class="section">
      <h2 class="section-title">Notable Projects</h2>
      <div class="projects-grid">
        ${data.projects.map(project => `
          <div class="project-card">
            <div class="project-title">${project.title || 'Project Title'}</div>
            ${project.description?.length > 0 ? `
              <div class="project-desc">${project.description[0]}</div>
            ` : ''}
          </div>
        `).join('')}
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
            font-family: 'Times New Roman', serif;
            font-size: 11pt;
            line-height: 1.5;
            color: #2c3e50;
            max-width: 8.5in;
            margin: 0 auto;
            padding: 0.75in;
            background: white;
        }
        
        .header {
            text-align: center;
            margin-bottom: 40px;
            padding-bottom: 20px;
            border-bottom: 3px solid ${selectedColor};
        }
        
        .name {
            font-size: 28pt;
            font-weight: 300;
            color: ${selectedColor};
            margin-bottom: 12px;
            letter-spacing: 1px;
            font-family: 'Georgia', serif;
        }
        
        .title {
            font-size: 14pt;
            color: #34495e;
            margin-bottom: 15px;
            font-style: italic;
        }
        
        .contact-grid {
            display: flex;
            justify-content: center;
            gap: 30px;
            flex-wrap: wrap;
            margin-top: 15px;
        }
        
        .contact-item {
            font-size: 10pt;
            color: #7f8c8d;
            display: flex;
            align-items: center;
            gap: 5px;
        }
        
        .section {
            margin-bottom: 35px;
        }
        
        .section-title {
            font-size: 14pt;
            font-weight: bold;
            color: ${selectedColor};
            margin-bottom: 20px;
            text-transform: uppercase;
            letter-spacing: 2px;
            position: relative;
            padding-bottom: 8px;
        }
        
        .section-title::after {
            content: '';
            position: absolute;
            bottom: 0;
            left: 0;
            width: 60px;
            height: 2px;
            background: ${selectedColor};
        }
        
        .exp-entry {
            margin-bottom: 25px;
            padding-bottom: 20px;
            border-bottom: 1px solid #ecf0f1;
        }
        
        .exp-entry:last-child {
            border-bottom: none;
        }
        
        .exp-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 10px;
        }
        
        .exp-position {
            font-size: 13pt;
            font-weight: bold;
            color: #2c3e50;
            margin-bottom: 3px;
        }
        
        .exp-company {
            font-size: 11pt;
            color: ${selectedColor};
            font-weight: 600;
        }
        
        .exp-duration {
            font-size: 10pt;
            color: #7f8c8d;
            font-style: italic;
            text-align: right;
            min-width: 120px;
        }
        
        .exp-description {
            margin-top: 10px;
        }
        
        .exp-point {
            font-size: 10pt;
            line-height: 1.6;
            margin: 0 0 6px 0;
            color: #34495e;
        }
        
        .two-column-section {
            display: flex;
            gap: 40px;
            margin-bottom: 35px;
        }
        
        .column {
            flex: 1;
        }
        
        .sub-title {
            font-size: 12pt;
            font-weight: bold;
            color: ${selectedColor};
            margin-bottom: 12px;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        
        .edu-entry, .cert-entry, .achievement-entry {
            margin-bottom: 12px;
        }
        
        .edu-degree {
            font-size: 11pt;
            font-weight: bold;
            color: #2c3e50;
        }
        
        .edu-institution {
            font-size: 10pt;
            color: ${selectedColor};
            font-style: italic;
        }
        
        .edu-year {
            font-size: 9pt;
            color: #7f8c8d;
        }
        
        .cert-entry {
            font-size: 10pt;
            color: #34495e;
            line-height: 1.4;
        }
        
        .cert-title {
            font-weight: 600;
        }
        
        .skills-grid {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
        }
        
        .skill-tag {
            background: #ecf0f1;
            color: #2c3e50;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 9pt;
            font-weight: 500;
            border-left: 3px solid ${selectedColor};
        }
        
        .achievement-title {
            font-size: 10pt;
            font-weight: bold;
            color: #2c3e50;
            margin-bottom: 3px;
        }
        
        .achievement-desc {
            font-size: 9pt;
            color: #34495e;
            line-height: 1.4;
        }
        
        .projects-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
        }
        
        .project-card {
            border: 1px solid #ecf0f1;
            border-radius: 8px;
            padding: 15px;
            border-left: 4px solid ${selectedColor};
        }
        
        .project-title {
            font-size: 11pt;
            font-weight: bold;
            color: #2c3e50;
            margin-bottom: 8px;
        }
        
        .project-desc {
            font-size: 9pt;
            color: #34495e;
            line-height: 1.5;
        }
        
        @media print {
            body {
                padding: 0.5in;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
            }
            
            .two-column-section {
                gap: 30px;
            }
            
            .projects-grid {
                grid-template-columns: 1fr 1fr;
            }
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="name">${name}</div>
        <div class="contact-grid">
            ${contactInfo.map(info => `<div class="contact-item">${info}</div>`).join('')}
            ${linkedin ? `<div class="contact-item">LinkedIn Profile</div>` : ''}
            ${github ? `<div class="contact-item">GitHub Profile</div>` : ''}
        </div>
    </div>

    ${experienceSection}
    ${educationSkillsSection}
    ${projectsSection}
</body>
</html>`;
};