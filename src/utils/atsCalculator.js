// Client-side rule-based local ATS score calculations
import { extractKeywordsLocal } from './keywordExtractor';
import { analyzeResumeStructure } from './resumeAnalyzer';

export const calculateLocalAtsScore = (resumeData, jobDescription = '') => {
  const { personalInfo = {}, summary = '', experience = [], education = [], skills = [], certifications = [] } = resumeData;

  // 1. Structure Score (formatting & section completeness)
  let formattingScore = 0;
  const structureIssues = [];
  const strengths = [];

  if (personalInfo.name && personalInfo.email && personalInfo.phone) {
    formattingScore += 20;
    strengths.push("Essential contact details (name, email, phone) are populated.");
  } else {
    structureIssues.push("Missing primary contact details (name, email, or phone).");
  }

  if (personalInfo.linkedin) {
    formattingScore += 10;
    strengths.push("LinkedIn profile link included.");
  } else {
    structureIssues.push("Consider adding a professional LinkedIn profile URL.");
  }

  if (summary && summary.length > 50) {
    formattingScore += 20;
    strengths.push("Professional summary section is well-written.");
  } else {
    structureIssues.push("Summary section is empty or too short (aim for 50+ characters).");
  }

  if (experience && experience.length > 0) {
    formattingScore += 25;
    strengths.push("Work experience section contains items.");
    
    // Check if bullets exist
    const hasBullets = experience.every(exp => exp.description && exp.description.includes('-'));
    if (hasBullets) {
      formattingScore += 10;
      strengths.push("Work experience experiences use bullet points.");
    } else {
      structureIssues.push("Format work experience descriptions using bullet points (starting with '- ').");
    }
  } else {
    structureIssues.push("Add at least one relevant work experience item.");
  }

  if (skills && skills.length >= 5) {
    formattingScore += 15;
    strengths.push(`Core skills are well represented (${skills.length} listed).`);
  } else {
    structureIssues.push("Add at least 5 core professional skills in tags.");
  }

  // 2. Keyword & Match score (if JD provided)
  let keywordScore = 100;
  let missingKeywords = [];
  
  if (jobDescription) {
    const { found, missing, matchPercentage } = extractKeywordsLocal(resumeData, jobDescription);
    keywordScore = matchPercentage;
    missingKeywords = missing;
    
    if (matchPercentage > 80) {
      strengths.push("High keyword alignment with target Job Description.");
    } else if (matchPercentage < 50) {
      structureIssues.push("Low keyword match. Use 'One Click Optimize' or add missing skills.");
    }
  }

  // Readability & completeness estimation
  const totalLength = JSON.stringify(resumeData).length;
  let readabilityScore = 85;
  if (totalLength > 8000) {
    readabilityScore = 70;
    structureIssues.push("Resume data density is high. Ensure it prints cleanly to a single page.");
  } else if (totalLength < 1500) {
    readabilityScore = 60;
    structureIssues.push("Resume content is sparse. Add more details about achievements and technologies.");
  }

  const grammarScore = 95; // Local baseline
  const experienceScore = experience.length > 0 ? Math.min(60 + (experience.length * 10), 100) : 30;
  const skillsScore = skills.length > 0 ? Math.min(50 + (skills.length * 5), 100) : 35;

  const overallScore = Math.round(
    (formattingScore * 0.25) + 
    (keywordScore * 0.35) + 
    (readabilityScore * 0.15) + 
    (experienceScore * 0.15) + 
    (skillsScore * 0.10)
  );

  const suggestions = structureIssues.map(issue => `Action: ${issue}`);

  return {
    scores: {
      overall: Math.min(overallScore, 100),
      keywords: Math.round(keywordScore),
      skills: Math.round(skillsScore),
      formatting: Math.round(formattingScore),
      experience: Math.round(experienceScore),
      grammar: grammarScore
    },
    strengths: strengths.slice(0, 4),
    weaknesses: structureIssues.slice(0, 4),
    missingKeywords: missingKeywords.slice(0, 10),
    suggestions: suggestions.slice(0, 4)
  };
};
