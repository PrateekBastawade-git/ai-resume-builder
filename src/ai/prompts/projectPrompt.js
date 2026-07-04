export const getProjectPrompt = (projectName, description, technologies = '') => {
  return `You are a technical resume consultant. Your task is to rewrite the project description to highlight technical challenges, implementation details, and overall impact.

PROJECT NAME: ${projectName}
TECHNOLOGIES USED: ${technologies}
CURRENT DESCRIPTION:
"""
${description}
"""

CONSTRAINTS:
1. Emphasize technical problem-solving, design patterns, and engineering decisions.
2. Structure the description into 2-3 highly impactful bullet points.
3. Start each point with a strong action verb and quantify results where possible.

You MUST respond ONLY with a JSON object in this format (do not include markdown code block formatting, do not include explanations, just raw JSON):
{
  "bullets": [
    "First optimized project bullet point.",
    "Second optimized project bullet point..."
  ],
  "paragraph": "Combined project bullets separated by newlines."
}`;
};
