import { parserService } from './parserService';
import { validationService } from './validationService';

// Retries failed asynchronous operations using exponential backoff

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const retryService = async (operation, maxRetries = 3, baseDelay = 1000) => {
  let attempt = 0;
  
  while (attempt < maxRetries) {
    try {
      return await operation();
    } catch (error) {
      attempt++;
      const errorMessage = error?.message || '';
      
      console.warn(`AI request failed (attempt ${attempt}/${maxRetries}): ${errorMessage}`);
      
      // Determine if error is retryable (timeout, rate limit 429, server error 500/503)
      const isRateLimit = errorMessage.includes('429') || errorMessage.includes('RESOURCE_EXHAUSTED');
      const isServerError = errorMessage.includes('500') || errorMessage.includes('503') || errorMessage.includes('Server error');
      const isTimeoutOrNetwork = errorMessage.includes('timeout') || errorMessage.includes('fetch') || errorMessage.includes('NetworkError');
      
      const shouldRetry = isRateLimit || isServerError || isTimeoutOrNetwork;
      
      if (attempt >= maxRetries || !shouldRetry) {
        throw error;
      }
      
      // Calculate delay with exponential backoff and jitter
      const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 200;
      console.log(`Retrying in ${Math.round(delay)}ms...`);
      await wait(delay);
    }
  }
};

/**
 * Retries a structured JSON generation operation, validating the schema.
 * Re-runs the operation if JSON parsing fails or schema validation fails.
 */
export const retryWithValidation = async (apiCall, schema = null, maxRetries = 3, baseDelay = 1000) => {
  let attempt = 0;
  
  while (attempt < maxRetries) {
    try {
      const rawText = await apiCall();
      if (!rawText || !rawText.trim()) {
        throw new Error("Received an empty response from AI API.");
      }
      
      // Remove code fences, parse JSON
      const parsed = parserService.cleanAndParse(rawText);
      
      // Validate schema and check required fields
      if (schema) {
        validationService.validate(parsed, schema);
      }
      
      return parsed; // Successfully parsed and validated!
    } catch (error) {
      attempt++;
      console.warn(`Validation/AI Attempt ${attempt}/${maxRetries} failed: ${error.message}`);
      
      if (attempt >= maxRetries) {
        throw error;
      }
      
      const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 200;
      await wait(delay);
    }
  }
};
