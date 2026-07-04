export const getKeywordPrompt = (jobDescription, currentKeywords = []) => {
  return `You are an ATS SEO strategist. Analyze the following Job Description and identify the most important technical keywords, methodologies, software, and soft skills required.

JOB DESCRIPTION:
"""
${jobDescription}
"""
CURRENT RESUME KEYWORDS: ${currentKeywords.join(', ')}

CONSTRAINTS:
1. Extract 10-15 key industry-standard terms.
2. Group them by category: Technical Skills, Soft Skills, Tools & Platforms.
3. Compare with candidate's current keywords and flag missing ones.

You MUST respond ONLY with a JSON object in this format (do not include markdown code block formatting, do not include explanations, just raw JSON):
{
  "extractedKeywords": {
    "technical": ["React", "Typescript", "Node.js"],
    "soft": ["Agile", "Team Leadership"],
    "tools": ["Git", "Docker", "Jira"]
  },
  "missingKeywords": ["Typescript", "Docker"]
}`;
};
