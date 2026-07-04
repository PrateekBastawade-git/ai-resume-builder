/**
 * Experience / Bullet Optimization Prompt — Rewrites job description bullets to be
 * action-oriented, ATS-friendly, and metrics-driven.
 */
export const getExperiencePrompt = (description, jobRole = '', companyContext = '') => {
  return `You are a Senior Resume Strategist and ATS Optimization Expert. Your task is to transform weak job description text into powerful, metrics-driven, ATS-optimized bullet points.

CURRENT DESCRIPTION TO REWRITE:
"""
${description}
"""

TARGET ROLE: ${jobRole || 'Not specified'}
${companyContext ? `COMPANY CONTEXT: ${companyContext}` : ''}

TRANSFORMATION RULES:
1. START every bullet with a HIGH-IMPACT action verb (e.g., Engineered, Orchestrated, Spearheaded, Optimized, Architected, Implemented, Accelerated, Reduced, Increased, Delivered).
2. QUANTIFY every achievement. Add realistic metrics: percentages (e.g., "by 35%"), dollar amounts, time savings, team sizes, user counts. If no data exists in the original, create plausible and credible metrics based on context.
3. FOLLOW the PAR formula: Problem → Action → Result. Each bullet = what was the challenge + what you did + what the outcome was.
4. ATS KEYWORDS: Include industry-standard technical terms, methodologies, and tools relevant to "${jobRole || 'the role'}".
5. CONCISENESS: Each bullet max 20 words. No fluff. Every word earns its place.
6. DO NOT duplicate bullets. Each bullet should cover a different aspect of the work.
7. Generate EXACTLY 4-5 bullets.

EXAMPLE TRANSFORMATION:
Input: "Worked on React project"
Output: "Engineered responsive React dashboard serving 50K+ monthly users, reducing page load time by 40% through lazy loading and code splitting."

RESPOND ONLY with valid JSON (no markdown, no explanation):
{
  "bullets": [
    "Bullet 1 starting with action verb with metrics.",
    "Bullet 2 starting with action verb with metrics.",
    "Bullet 3 starting with action verb with metrics.",
    "Bullet 4 starting with action verb with metrics.",
    "Bullet 5 starting with action verb with metrics."
  ],
  "paragraph": "Combined bullets separated by newlines."
}`;
};
