import { callAI, isAIConfigured } from '../services/aiService';
import { retryWithValidation } from '../services/retryService';
import { cacheService } from '../services/cacheService';
import { getAtsPrompt } from '../prompts/atsPrompt';
import { calculateLocalAtsScore } from '../../utils/atsCalculator';

const atsSchema = {
  required: ['scores', 'strengths', 'weaknesses', 'missingKeywords', 'suggestions'],
  properties: {
    scores: { type: 'object' },
    strengths: { type: 'array' },
    weaknesses: { type: 'array' },
    missingKeywords: { type: 'array' },
    suggestions: { type: 'array' }
  }
};

export const atsAgent = {
  analyze: async (resumeData, jobDescription) => {
    // If not configured, use local rule-based fallback
    if (!isAIConfigured()) {
      console.log("AI service not configured, using local rule-based ATS analysis fallback");
      await new Promise(resolve => setTimeout(resolve, 800)); // Simulate minor latency
      return calculateLocalAtsScore(resumeData, jobDescription);
    }

    const prompt = getAtsPrompt(resumeData, jobDescription);
    
    // Check Cache
    const cachedResponse = cacheService.get(prompt, { id: resumeData.id });
    if (cachedResponse) {
      console.log("ATS Agent: Loaded response from cache");
      return cachedResponse;
    }

    try {
      const apiCall = () => callAI(prompt, {
        systemInstruction: "You are a professional Applicant Tracking System (ATS) auditor. Output strictly structured JSON only."
      });
      
      const parsed = await retryWithValidation(apiCall, atsSchema, 3);
      
      // Save Cache
      cacheService.set(prompt, parsed, { id: resumeData.id });
      return parsed;
    } catch (error) {
      console.error("ATS Agent error, falling back to local calculation:", error);
      return calculateLocalAtsScore(resumeData, jobDescription);
    }
  }
};
