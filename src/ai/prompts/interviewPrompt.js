/**
 * Interview Questions Prompt — Role-specific, resume-grounded question generator.
 * Analyzes JD and resume to generate highly targeted questions with model answers.
 */
export const getInterviewPrompt = (resumeData, jobDescription = '') => {
  const targetRole = resumeData.personalInfo?.title || 'Professional';
  const skills = (resumeData.skills || []).join(', ');
  const experienceSummary = (resumeData.experience || []).slice(0, 3).map(
    e => `${e.role} at ${e.company}: ${(e.description || '').substring(0, 150)}`
  ).join('\n');
  const projects = resumeData.personalInfo?.projectSummary || (resumeData.certifications || []).join(', ');

  return `You are an elite Senior Technical Interviewer and HR Director at a Fortune 500 company with 20+ years of experience hiring for roles like "${targetRole}".

YOUR TASK: Generate highly targeted, role-specific interview questions that would be asked in a real interview for this candidate.

CANDIDATE PROFILE:
- Target Role: ${targetRole}
- Skills: ${skills || 'Not specified'}
- Experience:
${experienceSummary || 'Not specified'}
- Project Summary / Certifications: ${projects || 'Not specified'}

${jobDescription ? `TARGET JOB DESCRIPTION:
"""
${jobDescription}
"""` : ''}

CRITICAL RULES:
1. Questions MUST be specific to the role "${targetRole}" — NOT generic interview questions.
2. If the role is Frontend/React Developer: Ask about React hooks, state management, performance optimization, component lifecycle.
3. If the role is Backend Developer: Ask about API design, database optimization, scalability, microservices.
4. If the role is Data Scientist: Ask about model selection, feature engineering, overfitting, evaluation metrics.
5. Reference the candidate's ACTUAL experience and projects in the questions.
6. For behavioral questions, use the STAR format (Situation, Task, Action, Result).
7. Vary difficulty: 2 Easy, 2 Medium, 1 Hard.
8. Generate EXACTLY 8 questions covering these types:
   - 3 Technical (specific to their tech stack)
   - 2 Behavioral (STAR method)
   - 1 Project-based (referencing their actual work)
   - 1 Scenario-based
   - 1 HR / Culture Fit
9. Each sample answer should be 60-100 words, practical, and specific.

RESPOND ONLY with valid JSON (no markdown, no explanation):
{
  "targetRole": "${targetRole}",
  "questions": [
    {
      "id": "q1",
      "question": "Specific question text here?",
      "type": "Technical",
      "difficulty": "Medium",
      "sampleAnswer": "A detailed, specific guideline for answering this question with what points to cover and how to structure the answer."
    }
  ]
}`;
};
