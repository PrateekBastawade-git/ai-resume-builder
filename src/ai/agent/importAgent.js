import { callAI, isAIConfigured } from '../services/aiService';
import { retryService } from '../services/retryService';
import { parserService } from '../services/parserService';

/**
 * Heuristic fallback parser when AI is unavailable or unconfigured.
 */
const fallbackParseResume = (text = '', fileName = '') => {
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const title = fileName ? fileName.replace(/\.[^/.]+$/, "") : "Imported Resume";
  
  const emailMatch = text.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/);
  const phoneMatch = text.match(/(\+?\d{1,3}[-.\s]??\(?\d{3}\)?[-.\s]??\d{3}[-.\s]??\d{4})/);
  const linkedinMatch = text.match(/(https?:\/\/)?(www\.)?linkedin\.com\/in\/[a-zA-Z0-9_-]+/i);
  const githubMatch = text.match(/(https?:\/\/)?(www\.)?github\.com\/[a-zA-Z0-9_-]+/i);
  const websiteMatch = text.match(/(https?:\/\/)?(www\.)?[a-zA-Z0-9_-]+\.(com|org|net|io|dev|app)/i);

  const name = lines.length > 0 && lines[0].length < 40 ? lines[0] : "";
  const professionalTitle = lines.length > 1 && lines[1].length < 60 ? lines[1] : "";

  return {
    title,
    template: 'professional',
    customLayout: {
      type: 'Professional',
      fontFamily: 'Inter',
      headingStyle: 'bold-underline',
      columns: 1,
      accentColor: '#2563eb',
      sectionOrder: ['summary', 'experience', 'projects', 'education', 'skills', 'certifications', 'languages', 'links']
    },
    personalInfo: {
      name,
      title: professionalTitle,
      email: emailMatch ? emailMatch[0] : '',
      phone: phoneMatch ? phoneMatch[0] : '',
      address: '',
      linkedin: linkedinMatch ? linkedinMatch[0] : '',
      github: githubMatch ? githubMatch[0] : '',
      website: websiteMatch && (!emailMatch || websiteMatch[0] !== emailMatch[0]) ? websiteMatch[0] : '',
      photoUrl: '',
      projectSummary: ''
    },
    summary: lines.slice(2, 6).join(' '),
    experience: [],
    projects: [],
    education: [],
    skills: [],
    certifications: [],
    languages: [],
    links: []
  };
};

export const importAgent = {
  /**
   * Parse raw text extracted from a PDF/DOC/DOCX document into a structured resume
   * model and dynamically detect original layout formatting and visual styles.
   *
   * @param {string} rawText - Extracted text from the imported document
   * @param {string} fileName - Original file name
   * @returns {Promise<object>} Structured resume object with detected customLayout
   */
  importAndDetectLayout: async (rawText, fileName = 'Imported Resume') => {
    if (!rawText || !rawText.trim()) {
      return fallbackParseResume(rawText, fileName);
    }

    if (!isAIConfigured()) {
      return fallbackParseResume(rawText, fileName);
    }

    const title = fileName ? fileName.replace(/\.[^/.]+$/, "") : "Imported Resume";

    const prompt = `You are an Expert AI Resume Parser and Layout Analysis Engine.
Analyze the following raw text extracted from an imported resume document ("${fileName}").

Your task is twofold:
1. EXTRACT all resume data cleanly into structured sections: Personal Info, Professional Summary, Work Experience, Projects, Education, Core Skills, Certifications, Languages, and External Links.
2. DETECT the original document's visual formatting, section order, structure, heading styles, and layout template.
   Classify the layout type into exactly ONE of the following 9 layout categories:
   - "Single Column"
   - "Two Column"
   - "ATS Optimized"
   - "Modern Minimal"
   - "Executive"
   - "Academic"
   - "Creative"
   - "Professional"
   - "Minimal"

Return ONLY a valid JSON object matching this exact schema:
{
  "title": "${title}",
  "template": "professional",
  "customLayout": {
    "type": "Professional",
    "fontFamily": "Inter",
    "headingStyle": "bold-underline",
    "columns": 1,
    "accentColor": "#2563eb",
    "sectionOrder": ["summary", "experience", "projects", "education", "skills", "certifications", "languages", "links"]
  },
  "personalInfo": {
    "name": "Full Name",
    "title": "Professional Title",
    "email": "email@example.com",
    "phone": "+1 ...",
    "address": "City, State / Country",
    "linkedin": "https://...",
    "github": "https://github.com/...",
    "website": "https://...",
    "projectSummary": "Brief overview of technical projects if mentioned"
  },
  "summary": "Full professional summary text...",
  "experience": [
    {
      "id": "exp-1",
      "company": "Company Name",
      "role": "Job Title",
      "location": "City, State",
      "startDate": "Jan 2020",
      "endDate": "Present",
      "description": "Bullet points or paragraph describing responsibilities and achievements..."
    }
  ],
  "projects": [
    {
      "id": "proj-1",
      "title": "Project Name",
      "role": "Role/Contribution",
      "technologies": "React, Node.js, etc.",
      "description": "Details of the project...",
      "duration": "3 months",
      "github": "https://github.com/...",
      "live": "https://..."
    }
  ],
  "education": [
    {
      "id": "edu-1",
      "institution": "University / College Name",
      "degree": "Degree and Field of Study",
      "startDate": "2016",
      "endDate": "2020",
      "scoreType": "cgpa",
      "scoreValue": "3.8/4.0"
    }
  ],
  "skills": ["Skill 1", "Skill 2", "Skill 3"],
  "certifications": ["Cert 1", "Cert 2"],
  "languages": ["English (Native)", "Spanish (Fluent)"],
  "links": [
    { "label": "GitHub", "url": "https://github.com/..." }
  ]
}

IMPORTANT: If any field cannot be extracted from the text, leave it as an empty string ("") or empty array ([]). Do NOT insert dummy values or placeholders.

RAW RESUME TEXT TO ANALYZE:
=========================================
${rawText.slice(0, 12000)}
=========================================`;

    try {
      const apiCall = () => callAI(prompt, {
        systemInstruction: `You are an AI Resume Parser and Layout Analyzer. Respond strictly with valid JSON without markdown fences.`
      });
      const responseText = await retryService(apiCall, 3);
      const parsed = parserService.cleanAndParse(responseText);

      if (parsed && typeof parsed === 'object' && parsed.personalInfo) {
        // Ensure required IDs and defaults without hardcoded dummy text
        const expList = Array.isArray(parsed.experience) ? parsed.experience.map((e, idx) => ({
          id: e.id || `exp-${idx + 1}-${Date.now()}`,
          company: e.company || '',
          role: e.role || '',
          location: e.location || '',
          startDate: e.startDate || '',
          endDate: e.endDate || '',
          description: e.description || ''
        })) : [];

        const projList = Array.isArray(parsed.projects) ? parsed.projects.map((p, idx) => ({
          id: p.id || `proj-${idx + 1}-${Date.now()}`,
          title: p.title || '',
          role: p.role || '',
          technologies: p.technologies || '',
          description: p.description || '',
          duration: p.duration || '',
          github: p.github || '',
          live: p.live || ''
        })) : [];

        const eduList = Array.isArray(parsed.education) ? parsed.education.map((e, idx) => ({
          id: e.id || `edu-${idx + 1}-${Date.now()}`,
          institution: e.institution || '',
          degree: e.degree || '',
          startDate: e.startDate || '',
          endDate: e.endDate || '',
          scoreType: e.scoreType || 'cgpa',
          scoreValue: e.scoreValue || ''
        })) : [];

        return {
          title: parsed.title || title,
          template: parsed.template || 'professional',
          customLayout: parsed.customLayout || {
            type: 'Professional',
            fontFamily: 'Inter',
            headingStyle: 'bold-underline',
            columns: 1,
            accentColor: '#2563eb',
            sectionOrder: ['summary', 'experience', 'projects', 'education', 'skills', 'certifications', 'languages', 'links']
          },
          personalInfo: {
            name: '',
            title: '',
            email: '',
            phone: '',
            address: '',
            linkedin: '',
            github: '',
            website: '',
            photoUrl: '',
            projectSummary: '',
            ...(parsed.personalInfo || {})
          },
          summary: parsed.summary || '',
          experience: expList,
          projects: projList,
          education: eduList,
          skills: Array.isArray(parsed.skills) ? parsed.skills : [],
          certifications: Array.isArray(parsed.certifications) ? parsed.certifications : [],
          languages: Array.isArray(parsed.languages) ? parsed.languages : [],
          links: Array.isArray(parsed.links) ? parsed.links : []
        };
      }
      return fallbackParseResume(rawText, fileName);
    } catch (error) {
      console.error("AI Import & Layout Detection failed, using heuristic fallback:", error);
      return fallbackParseResume(rawText, fileName);
    }
  }
};

export const importAndDetectLayout = importAgent.importAndDetectLayout;
