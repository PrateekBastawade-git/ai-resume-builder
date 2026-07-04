/**
 * ATS Analysis Prompt — Comprehensive job-description match analysis.
 * Analyzes resume vs job description and outputs actionable, specific feedback.
 */
export const getAtsPrompt = (resumeData, jobDescription) => {
  // Build a clean resume text summary for better LLM understanding
  const resumeSummary = {
    name: resumeData.personalInfo?.name || 'Candidate',
    title: resumeData.personalInfo?.title || '',
    summary: resumeData.summary || '',
    projectSummary: resumeData.personalInfo?.projectSummary || '',
    skills: resumeData.skills || [],
    experience: (resumeData.experience || []).map(e => ({
      role: e.role,
      company: e.company,
      description: e.description || '',
    })),
    education: (resumeData.education || []).map(e => ({
      degree: e.degree,
      institution: e.institution,
    })),
    certifications: resumeData.certifications || [],
  };

  return `You are an expert ATS (Applicant Tracking System) analyst and senior technical recruiter with deep knowledge of how Fortune 500 ATS systems evaluate resumes.

YOUR TASK: Perform a comprehensive ATS match analysis between the candidate's resume and the target job description.

CANDIDATE RESUME:
${JSON.stringify(resumeSummary, null, 2)}

TARGET JOB DESCRIPTION:
"""
${jobDescription}
"""

ANALYSIS INSTRUCTIONS:
Step 1 — Extract from Job Description:
  - Company name and role title
  - Top 15 required technical keywords and skills
  - Preferred experience level (years)
  - Key responsibilities
  - "Nice to have" items

Step 2 — Cross-reference with Resume:
  - Which required keywords/skills ARE present in the resume?
  - Which required keywords/skills are MISSING?
  - Does the experience level match?
  - Are achievements quantified?

Step 3 — Score each dimension from 0–100:
  - keywords: Presence of critical JD terms in resume text
  - skills: Match between JD required skills and resume skills section
  - formatting: Clarity, length, structure, bullet quality
  - experience: Role alignment, years, industry match
  - grammar: Language quality and professionalism
  - overall: Weighted average (keywords × 0.3 + skills × 0.25 + experience × 0.25 + formatting × 0.1 + grammar × 0.1)

Step 4 — Provide specific, actionable feedback (not generic advice).

RESPOND ONLY with valid JSON (no markdown, no explanation):
{
  "scores": {
    "overall": 0,
    "keywords": 0,
    "skills": 0,
    "formatting": 0,
    "experience": 0,
    "grammar": 0
  },
  "strengths": [
    "Specific strength referencing actual resume content"
  ],
  "weaknesses": [
    "Specific weakness explaining what is missing vs job requirements"
  ],
  "missingKeywords": [
    "keyword1", "keyword2", "keyword3"
  ],
  "suggestions": [
    "Specific, actionable suggestion with example wording"
  ]
}`;
};
