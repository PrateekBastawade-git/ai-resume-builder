/**
 * geminiService.js — COMPATIBILITY SHIM
 *
 * All Gemini SDK code has been removed. This file now re-exports
 * from aiService.js (Groq backend) so that every existing import
 * of geminiService continues to work without modification.
 *
 * DO NOT add any new code here — use aiService.js directly.
 */
export {
  callAI,
  callAI as callGemini,
  isAIConfigured,
  isAIConfigured as isGeminiConfigured,
  getGeminiApiKey,
} from './aiService.js';
