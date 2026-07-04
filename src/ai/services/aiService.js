/**
 * aiService.js
 * Universal frontend AI client — communicates securely with the
 * Express backend (/api/ai). The actual Groq API key is NEVER
 * exposed to the browser.
 */

export const isAIConfigured = () => true; // Key is always on the backend

/**
 * @deprecated Use isAIConfigured() — kept for backwards compatibility
 */
export const isGeminiConfigured = isAIConfigured;

/**
 * Call the backend AI service (Groq llama-3.3-70b-versatile).
 *
 * @param {string} prompt - User / task prompt
 * @param {object} options
 * @param {string} [options.systemInstruction] - System role instruction
 * @param {string} [options.model]             - Override model (default: llama-3.3-70b-versatile)
 * @param {number} [options.temperature]       - 0–2, default 0.7
 * @param {number} [options.maxTokens]         - Max output tokens, default 4096
 * @returns {Promise<string>} Raw text response from the AI
 */
// In production (Vercel), VITE_API_URL points to the Render backend.
// In local dev, it's empty and Vite proxy handles /api -> localhost:3001.
const API_BASE = import.meta.env.VITE_API_URL || '';

export const callAI = async (prompt, options = {}) => {
  try {
    const response = await fetch(`${API_BASE}/api/ai`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt,
        systemInstruction: options.systemInstruction,
        model: options.model,
        temperature: options.temperature,
        maxTokens: options.maxTokens,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      const errMsg = data.error || `HTTP error ${response.status}`;

      if (response.status === 401) {
        throw new Error('Invalid API Key configured on the backend. Please verify the GROQ_API_KEY in your .env file.');
      }
      if (response.status === 429) {
        throw new Error('Rate limit exceeded. Please wait a moment and try again.');
      }
      if (errMsg.toLowerCase().includes('safety') || errMsg.toLowerCase().includes('block')) {
        throw new Error('Request blocked by safety filters. Please modify your input.');
      }

      throw new Error(errMsg);
    }

    if (!data.text) {
      throw new Error('Received an empty response from the AI service.');
    }

    return data.text;
  } catch (error) {
    // Re-throw network-level errors with a friendly message
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error('Cannot reach the backend server. Make sure it is running on port 3001.');
    }
    throw error;
  }
};

/**
 * @deprecated Use callAI() — kept for backwards compatibility
 */
export const callGemini = callAI;

/**
 * @deprecated Use callAI() — kept for backwards compatibility
 */
export const getGeminiApiKey = () => 'backend-configured';
