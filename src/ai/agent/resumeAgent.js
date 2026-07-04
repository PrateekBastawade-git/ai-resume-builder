import { callAI, isAIConfigured } from '../services/aiService';
import { retryWithValidation } from '../services/retryService';
import { cacheService } from '../services/cacheService';
import { getSummaryPrompt } from '../prompts/summaryPrompt';
import { getExperiencePrompt } from '../prompts/experiencePrompt';
import { getProjectPrompt } from '../prompts/projectPrompt';

const summarySchema = {
  required: ['summary']
};

const experienceSchema = {
  required: ['bullets']
};

const projectSchema = {
  required: ['bullets', 'paragraph']
};

export const resumeAgent = {
  // Generate a professional profile summary
  generateSummary: async (jobRole, currentSkills = [], resumeData = null) => {
    if (!isAIConfigured()) {
      await new Promise(resolve => setTimeout(resolve, 800));
      return `Results-driven and highly motivated ${jobRole || 'Professional'} offering a strong foundation in core skills${currentSkills.length ? `: ${currentSkills.slice(0, 4).join(', ')}` : ''}. Proven ability to implement efficient workflows, collaborate with cross-functional teams, and solve complex problems to support team objectives.`;
    }

    const prompt = getSummaryPrompt(jobRole, currentSkills, resumeData);
    try {
      const apiCall = () => callAI(prompt);
      const parsed = await retryWithValidation(apiCall, summarySchema, 3);
      return parsed.summary;
    } catch (error) {
      console.error("Summary generation agent error:", error);
      throw error;
    }
  },

  // Optimize work experience descriptions or action points
  optimizeBullets: async (description, jobRole = '') => {
    if (!isAIConfigured()) {
      await new Promise(resolve => setTimeout(resolve, 800));
      const lines = description.split('\n').filter(l => l.trim() !== '');
      const bullets = lines.length > 0 
        ? lines.map(line => `- Completed tasks related to: "${line.replace(/^-\s*/, '').trim()}", improving delivery efficiency by 18%.`)
        : ["- Spearheaded development of core web features, boosting engagement by 15%."];
      return {
        bullets,
        paragraph: bullets.join('\n')
      };
    }

    const prompt = getExperiencePrompt(description, jobRole);
    try {
      const apiCall = () => callAI(prompt);
      const parsed = await retryWithValidation(apiCall, experienceSchema, 3);
      return {
        bullets: Array.isArray(parsed.bullets) ? parsed.bullets : [parsed.paragraph || rawText],
        paragraph: parsed.paragraph || (Array.isArray(parsed.bullets) ? parsed.bullets.join('\n') : '')
      };
    } catch (error) {
      console.error("Experience bullet optimization agent error:", error);
      throw error;
    }
  },

  // Optimize project descriptions
  optimizeProject: async (projectName, description, technologies = '') => {
    if (!isAIConfigured()) {
      await new Promise(resolve => setTimeout(resolve, 800));
      return `- Designed and engineered "${projectName}" utilizing ${technologies || 'modern stacks'} to solve performance limitations.\n- Optimized data fetching logic, resulting in a 20% reduction in overall API load times.`;
    }

    const prompt = getProjectPrompt(projectName, description, technologies);
    try {
      const apiCall = () => callAI(prompt);
      const parsed = await retryWithValidation(apiCall, projectSchema, 3);
      return parsed.paragraph || (Array.isArray(parsed.bullets) ? parsed.bullets.join('\n') : '');
    } catch (error) {
      console.error("Project optimization agent error:", error);
      throw error;
    }
  },

  // Full-resume optimization matching a Job Description (One-Click Optimize)
  optimizeResumeForJob: async (resumeData, jobDescription) => {
    if (!isAIConfigured()) {
      throw new Error("AI service is not configured. Make sure the backend server is running.");
    }

    const prompt = `You are a premium career strategist and ATS optimizer. Your task is to rewrite key sections of the resume to align perfectly with the target job description. Do NOT alter personal names, contact info, emails, company names, or school names. Focus on optimizing the Summary, Work Experience descriptions, Project descriptions, and adding required Skills.

RESUME DATA:
${JSON.stringify(resumeData, null, 2)}

TARGET JOB DESCRIPTION:
"""
${jobDescription}
"""

CONSTRAINTS:
1. Rephrase work experience descriptions and projects to highlight accomplishments matching the key requirements of the Job Description. Use strong action verbs and include metrics of impact.
2. Incorporate important missing keywords and technical skills from the Job Description into the skills array.
3. Keep the overall resume length, formatting, and integrity intact.
4. Output should match the JSON schema below.

You MUST respond ONLY with a JSON object in this format (do not include markdown code block formatting, do not include explanations, just raw JSON):
{
  "summary": "Optimized professional summary",
  "skills": ["Skill1", "Skill2", "Skill3", ...],
  "experience": [
    {
      "id": "original-exp-id",
      "company": "Original Company",
      "role": "Original Role or slightly optimized title",
      "startDate": "Original date",
      "endDate": "Original date",
      "location": "Original location",
      "description": "Optimized description containing bullet points starting with action verbs and metrics"
    }
  ],
  "education": [
    {
      "id": "original-edu-id",
      "institution": "Original School",
      "degree": "Original Degree",
      "startDate": "Original date",
      "endDate": "Original date"
    }
  ]
}`;

    const resumeOptimizeSchema = {
      required: ['summary', 'skills', 'experience']
    };

    try {
      const apiCall = () => callAI(prompt, {
        systemInstruction: "You are a senior ATS resume consultant. Return only the valid JSON document conforming to the request."
      });
      const parsed = await retryWithValidation(apiCall, resumeOptimizeSchema, 3);
      return parsed;
    } catch (error) {
      console.error("Full resume optimization agent failed:", error);
      throw error;
    }
  }
};
