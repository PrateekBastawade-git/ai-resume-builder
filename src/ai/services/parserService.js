// Cleans and parses JSON responses from the AI API, stripping markdown and raw formatting

export const parserService = {
  cleanAndParse: (text) => {
    if (!text || typeof text !== 'string') return null;
    
    let cleaned = text.trim();
    
    // Strip code fence formatting (e.g. ```json ... ```)
    if (cleaned.includes('```')) {
      // Look for JSON block patterns
      const jsonMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (jsonMatch && jsonMatch[1]) {
        cleaned = jsonMatch[1].trim();
      } else {
        cleaned = cleaned.replace(/^```[a-zA-Z]*\n?/, '').replace(/\n?```$/, '').trim();
      }
    }
    
    try {
      return JSON.parse(cleaned);
    } catch (e) {
      console.warn("Direct JSON parsing failed, attempting substring extraction...", e);
      
      const startIdx = cleaned.indexOf('{');
      const endIdx = cleaned.lastIndexOf('}');
      
      if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
        const jsonSub = cleaned.substring(startIdx, endIdx + 1);
        try {
          return JSON.parse(jsonSub);
        } catch (subErr) {
          console.error("Failed to parse substring JSON:", subErr);
        }
      }
      
      // If it's a bracketed array instead
      const arrStart = cleaned.indexOf('[');
      const arrEnd = cleaned.lastIndexOf(']');
      if (arrStart !== -1 && arrEnd !== -1 && arrEnd > arrStart) {
        const arrSub = cleaned.substring(arrStart, arrEnd + 1);
        try {
          return JSON.parse(arrSub);
        } catch (arrErr) {
          console.error("Failed to parse array JSON:", arrErr);
        }
      }
      
      throw new Error(`Failed to parse response from AI: ${cleaned.substring(0, 100)}...`);
    }
  }
};
