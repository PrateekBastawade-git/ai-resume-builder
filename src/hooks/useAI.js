import { useState } from 'react';

/**
 * Manages loading progressions, stages, and error states for AI agent requests.
 */
export const useAI = () => {
  const [loading, setLoading] = useState(false);
  const [stage, setStage] = useState('');
  const [error, setError] = useState(null);

  const runAgent = async (operation, stages = ["Analyzing...", "Processing..."]) => {
    setLoading(true);
    setError(null);
    setStage(stages[0]);

    let stageIndex = 0;
    const timer = setInterval(() => {
      if (stageIndex < stages.length - 1) {
        stageIndex++;
        setStage(stages[stageIndex]);
      }
    }, 1500); // Transition steps every 1.5 seconds

    try {
      const result = await operation();
      return result;
    } catch (e) {
      console.error("AI Hook Error:", e);
      const friendlyError = e?.message || "An unexpected error occurred during AI processing. Please check your credentials and internet connection.";
      setError(friendlyError);
      throw new Error(friendlyError);
    } finally {
      clearInterval(timer);
      setLoading(false);
      setStage('');
    }
  };

  return {
    loading,
    stage,
    error,
    runAgent,
    setError
  };
};
