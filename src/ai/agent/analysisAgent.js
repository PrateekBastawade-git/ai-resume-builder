import { callAI, isAIConfigured } from '../services/aiService';
import { retryService } from '../services/retryService';
import { parserService } from '../services/parserService';
import { getSkillPredictionPrompt } from '../prompts/skillPredictionPrompt';

// Fallback skill database per common roles
const ROLE_SKILL_MAP = {
  'frontend': ['React.js', 'TypeScript', 'Next.js', 'CSS/Tailwind', 'JavaScript', 'Redux', 'Webpack/Vite', 'REST APIs', 'Testing (Jest/Cypress)', 'Accessibility (a11y)', 'Web Performance', 'Git'],
  'backend': ['Node.js', 'Express.js', 'PostgreSQL', 'MongoDB', 'REST APIs', 'Docker', 'Redis', 'GraphQL', 'Authentication/OAuth', 'CI/CD', 'Microservices', 'AWS/GCP'],
  'fullstack': ['React.js', 'Node.js', 'TypeScript', 'PostgreSQL', 'Docker', 'REST APIs', 'AWS', 'Redis', 'Next.js', 'Git', 'CI/CD'],
  'data scientist': ['Python', 'pandas', 'scikit-learn', 'TensorFlow', 'SQL', 'Tableau', 'Statistical Modeling', 'A/B Testing', 'Feature Engineering', 'Data Visualization', 'Machine Learning'],
  'ui/ux': ['Figma', 'User Research', 'Wireframing', 'Prototyping', 'Design Systems', 'A/B Testing', 'User Journey Mapping', 'Accessibility', 'Adobe XD', 'Information Architecture'],
  'devops': ['Docker', 'Kubernetes', 'CI/CD', 'AWS/GCP/Azure', 'Terraform', 'Ansible', 'Linux', 'Monitoring (Prometheus/Grafana)', 'GitOps', 'Shell Scripting'],
  'android': ['Kotlin', 'Java', 'Android SDK', 'Jetpack Compose', 'MVVM', 'Retrofit', 'Room DB', 'Firebase', 'Google Play Console', 'Material Design'],
  'ios': ['Swift', 'SwiftUI', 'UIKit', 'Xcode', 'Core Data', 'MVVM', 'CocoaPods', 'App Store Connect', 'Combine Framework', 'REST APIs'],
  'product manager': ['Product Roadmap', 'Agile/Scrum', 'User Research', 'Data Analysis', 'SQL', 'Jira', 'Stakeholder Management', 'A/B Testing', 'OKRs', 'Competitive Analysis'],
};

const getFallbackSkills = (jobRole) => {
  const roleLower = jobRole.toLowerCase();
  for (const [key, skills] of Object.entries(ROLE_SKILL_MAP)) {
    if (roleLower.includes(key)) return skills;
  }
  // Generic fallback
  return ['Communication', 'Problem Solving', 'Team Collaboration', 'Project Management', 'Analytical Thinking', 'Critical Thinking'];
};

export const analysisAgent = {
  /**
   * Predict skills for a target job role using the resume as context.
   * @param {string} jobRole - Target job role title
   * @param {object} resumeData - Current resume data for context
   * @returns {string[]} Array of predicted skill names (flat list, ranked by relevance)
   */
  predictSkills: async (jobRole, resumeData = null) => {
    if (!isAIConfigured()) {
      await new Promise(resolve => setTimeout(resolve, 600));
      return getFallbackSkills(jobRole);
    }

    const prompt = getSkillPredictionPrompt(jobRole, resumeData);
    try {
      const apiCall = () => callAI(prompt, {
        systemInstruction: `You are a Technical Skills Intelligence System. Output only valid JSON.`
      });
      const rawText = await retryService(apiCall, 3);
      const parsed = parserService.cleanAndParse(rawText);

      // Extract flat skill list from response
      if (Array.isArray(parsed?.rankedSkills) && parsed.rankedSkills.length > 0) {
        return parsed.rankedSkills;
      }

      // Fallback: flatten categories
      if (parsed?.categories) {
        const all = [
          ...(parsed.categories.technicalSkills || []),
          ...(parsed.categories.frameworks || []),
          ...(parsed.categories.tools || []),
          ...(parsed.categories.softSkills || []),
          ...(parsed.categories.industrySkills || []),
        ];
        return all.filter(Boolean);
      }

      throw new Error('Unexpected skill prediction format');
    } catch (error) {
      console.error('Skill prediction agent error:', error);
      return getFallbackSkills(jobRole);
    }
  }
};
