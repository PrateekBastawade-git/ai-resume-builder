import { callAI, isAIConfigured } from '../services/aiService';
import { retryWithValidation } from '../services/retryService';
import { getInterviewPrompt } from '../prompts/interviewPrompt';

const interviewSchema = {
  required: ['questions']
};

export const interviewAgent = {
  generateQuestions: async (resumeData, jobDescription = '') => {
    if (!isAIConfigured()) {
      await new Promise(resolve => setTimeout(resolve, 800));
      return {
        questions: [
          {
            id: 'q1',
            question: `How have you used ${resumeData.skills?.[0] || 'your core skills'} in a real-world project to solve a complex engineering challenge?`,
            type: 'Technical',
            difficulty: 'Medium',
            sampleAnswer: 'Describe a specific challenge, the actions you took, and the quantifiable business outcomes (e.g. reduction in API latency).'
          },
          {
            id: 'q2',
            question: 'Tell me about a time you had a conflict with a team member. How did you resolve it?',
            type: 'Behavioral',
            difficulty: 'Easy',
            sampleAnswer: 'Use the STAR method. Keep it professional, focus on communication, active listening, and a collaborative outcome.'
          }
        ]
      };
    }

    const prompt = getInterviewPrompt(resumeData, jobDescription);
    try {
      const apiCall = () => callAI(prompt, {
        systemInstruction: "You are an elite corporate interviewer. Return JSON output only."
      });
      const parsed = await retryWithValidation(apiCall, interviewSchema, 3);
      return parsed;
    } catch (error) {
      console.error("Interview Agent failed:", error);
      throw error;
    }
  }
};
