/**
 * Skill Prediction Prompt — Context-aware AI skill recommender.
 * Analyzes full resume context to predict role-specific, ranked skills.
 */
export const getSkillPredictionPrompt = (jobRole, resumeData = null) => {
  const existingSkills = resumeData?.skills || [];
  const currentTitle = resumeData?.personalInfo?.title || '';
  const summary = resumeData?.summary || '';
  const experience = (resumeData?.experience || []).slice(0, 3).map(
    e => `${e.role} at ${e.company}`
  ).join(', ');
  const education = (resumeData?.education || []).map(
    e => `${e.degree} from ${e.institution}`
  ).join(', ');

  return `You are a specialized Technical Skills Intelligence System trained on millions of job postings, LinkedIn profiles, and hiring data for the role of "${jobRole}".

YOUR TASK: Predict the most relevant, high-demand skills for a candidate targeting the role: "${jobRole}".

CANDIDATE CONTEXT:
- Current Title: ${currentTitle || 'Not specified'}
- Professional Summary: ${summary ? summary.substring(0, 200) : 'Not specified'}
- Recent Experience: ${experience || 'Not specified'}
- Education: ${education || 'Not specified'}
- Already Has Skills: ${existingSkills.join(', ') || 'None listed yet'}

SKILL PREDICTION RULES:
1. ONLY suggest skills directly relevant to "${jobRole}" — no generic or unrelated skills.
2. Predict from these 5 specific categories:
   a) Required Technical Skills (languages, frameworks core to this role)
   b) Relevant Frameworks & Libraries (ecosystem-specific tools)
   c) Developer Tools & Platforms (build tools, CI/CD, cloud platforms used in this role)
   d) Soft Skills (communication, leadership — only 2-3 relevant to this specific role level)
   e) Industry/Domain Skills (domain-specific knowledge for this role)
3. Rank skills by market demand in 2024 — most in-demand first.
4. DO NOT suggest skills the candidate already has: [${existingSkills.join(', ')}]
5. If role is "Frontend Developer": suggest React, TypeScript, Next.js, CSS-in-JS, Webpack, Vite, Accessibility, Web Performance, Testing (Jest, Cypress).
6. If role is "Backend Developer": suggest Node.js, Express, REST/GraphQL APIs, PostgreSQL, Redis, Docker, Microservices, Authentication/OAuth.
7. If role is "Data Scientist": suggest Python, pandas, scikit-learn, TensorFlow/PyTorch, SQL, Tableau, statistical modeling, A/B testing.
8. Suggest 12-16 skills total across all categories.

RESPOND ONLY with valid JSON (no markdown, no explanation):
{
  "targetRole": "${jobRole}",
  "categories": {
    "technicalSkills": ["skill1", "skill2", "skill3"],
    "frameworks": ["framework1", "framework2"],
    "tools": ["tool1", "tool2"],
    "softSkills": ["skill1", "skill2"],
    "industrySkills": ["skill1", "skill2"]
  },
  "rankedSkills": ["skill1", "skill2", "skill3"],
  "justification": "Brief explanation of why these skills are critical for ${jobRole} in 2024."
}`;
};
