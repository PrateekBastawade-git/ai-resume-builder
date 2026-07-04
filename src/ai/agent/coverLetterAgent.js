import { callAI, isAIConfigured } from '../services/aiService';
import { retryWithValidation } from '../services/retryService';
import { getCoverLetterPrompt } from '../prompts/coverLetterPrompt';

const coverLetterSchema = {
  required: ['subject', 'salutation', 'body', 'signOff']
};

export const coverLetterAgent = {
  generate: async (resumeData, jobDescription, companyName = '', targetRole = '') => {
    if (!isAIConfigured()) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return {
        subject: `Cover Letter: ${resumeData.personalInfo?.name || 'Candidate'} - ${targetRole || 'Applicant'} at ${companyName || 'Target Company'}`,
        salutation: `Dear Hiring Team at ${companyName || 'Target Company'},`,
        body: `I am writing to express my interest in the ${targetRole || 'Position'} vacancy.`,
        signOff: `Best regards,\n\n${resumeData.personalInfo?.name || 'Candidate Name'}`
      };
    }

    const prompt = getCoverLetterPrompt(resumeData, jobDescription, companyName, targetRole);
    try {
      const apiCall = () => callAI(prompt, {
        systemInstruction: "You are a professional cover letter writer. Return JSON output only."
      });
      const parsed = await retryWithValidation(apiCall, coverLetterSchema, 3);
      return parsed;
    } catch (error) {
      console.error("Cover Letter Agent failed:", error);
      throw error;
    }
  }
};
