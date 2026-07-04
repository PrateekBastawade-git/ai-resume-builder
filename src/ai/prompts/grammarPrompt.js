export const getGrammarPrompt = (text) => {
  return `You are a professional editor. Analyze the following text block for spelling, grammar, readability, and action verb impact.

TEXT TO EVALUATE:
"""
${text}
"""

CONSTRAINTS:
1. Identify all grammar or spelling issues.
2. Provide a list of direct improvements.
3. Suggest better action verbs for key actions.
4. Provide a fully rewritten, error-free version of the text.

You MUST respond ONLY with a JSON object in this format (do not include markdown code block formatting, do not include explanations, just raw JSON):
{
  "hasErrors": true,
  "errors": [
    {
      "original": "incorrect word",
      "correction": "correct word",
      "explanation": "Brief explanation of why it is incorrect."
    }
  ],
  "suggestedVerbs": [
    {
      "original": "made",
      "suggestions": ["Orchestrated", "Engineered", "Formulated"]
    }
  ],
  "correctedText": "The fully corrected text block goes here."
}`;
};
