/**
 * Cover Letter Prompt — Context-aware, job-specific cover letter generator.
 * Step 1: Extracts key info from JD. Step 2: Cross-references with resume. Step 3: Writes the letter.
 */
export const getCoverLetterPrompt = (resumeData, jobDescription, companyName = '', targetRole = '') => {
  const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  
  const candidateName = resumeData.personalInfo?.name || 'Candidate';
  const candidateTitle = resumeData.personalInfo?.title || 'Professional';
  const candidateEmail = resumeData.personalInfo?.email || '';
  const candidatePhone = resumeData.personalInfo?.phone || '';
  const topSkills = (resumeData.skills || []).slice(0, 8).join(', ');
  const topExperience = (resumeData.experience || []).slice(0, 2).map(
    e => `${e.role} at ${e.company} (${e.startDate || ''} - ${e.endDate || ''}): ${(e.description || '').substring(0, 150)}`
  ).join('\n');
  const topProject = resumeData.personalInfo?.projectSummary || (resumeData.certifications || [])[0] || '';

  return `You are an elite professional cover letter writer and career strategist. Your task is to write a powerful, personalized, ATS-optimized cover letter.

STEP 1 — EXTRACT FROM JOB DESCRIPTION:
Identify from the JD below:
- Company name (use provided if given: "${companyName || 'the company'}")
- Exact role title (use provided if given: "${targetRole || 'the position'}")
- Top 5 required skills/technologies
- Key responsibilities (top 3)
- Culture signals or values mentioned

TARGET JOB DESCRIPTION:
"""
${jobDescription}
"""

STEP 2 — CANDIDATE PROFILE TO MATCH:
Name: ${candidateName}
Current Title: ${candidateTitle}
Contact: ${candidateEmail}${candidatePhone ? ' | ' + candidatePhone : ''}
Core Skills: ${topSkills || 'See experience below'}
Recent Experience:
${topExperience || 'See resume attached'}
${topProject ? `Notable Project / Achievement: ${topProject}` : ''}

STEP 3 — WRITE THE COVER LETTER:
Requirements:
- Professional, confident, and specific tone (NOT generic)
- 3-4 paragraphs, 250-320 words in the body
- Paragraph 1: Hook — show genuine interest in THIS company/role specifically. Reference a company trait or product.
- Paragraph 2: Connect top 2-3 candidate strengths DIRECTLY to the JD's top 3 required skills. Use specific examples from experience. Include a metric.
- Paragraph 3: Highlight a specific project or achievement showing impact. Connect it to the role's needs.
- Paragraph 4: Strong close. Restate excitement. Call to action (interview request). Professional sign-off.
- Include date: ${today}
- No generic phrases like "I am excited to apply" or "I believe I would be a great fit"
- ATS-friendly: naturally use keywords from the JD

RESPOND ONLY with valid JSON (no markdown, no explanation):
{
  "date": "${today}",
  "subject": "Application for [Role] at [Company]",
  "salutation": "Dear [Hiring Manager Name or Hiring Team at Company],",
  "body": "Full cover letter body with paragraph breaks using \\n\\n",
  "signOff": "Sincerely,\\n\\n${candidateName}\\n${candidateTitle}\\n${candidateEmail}"
}`;
};
