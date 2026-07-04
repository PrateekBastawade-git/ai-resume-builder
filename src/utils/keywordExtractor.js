// Client-side utility to extract and intersect technical keywords from text

export const extractKeywordsLocal = (resumeData, jobDescription = '') => {
  if (!jobDescription) {
    return { found: [], missing: [], matchPercentage: 100 };
  }

  const jdText = jobDescription.toLowerCase();
  
  // Combine all resume fields into a single searchable text string
  const resumeContent = [
    resumeData.personalInfo?.title,
    resumeData.summary,
    ...(resumeData.skills || []),
    ...(resumeData.certifications || []),
    ...(resumeData.experience || []).map(exp => `${exp.role} ${exp.company} ${exp.description}`),
    ...(resumeData.education || []).map(edu => `${edu.degree} ${edu.institution}`)
  ].filter(Boolean).join(' ').toLowerCase();

  // A comprehensive dictionary of key technical terms, methodologies, and frameworks
  const dictionary = [
    'react', 'react.js', 'angular', 'vue', 'vue.js', 'next.js', 'svelte', 'typescript', 'javascript',
    'html5', 'css3', 'tailwind', 'sass', 'webpack', 'vite', 'redux', 'context api', 'graphql',
    'node.js', 'express', 'nest.js', 'spring boot', 'spring', 'django', 'flask', 'fastapi',
    'python', 'java', 'kotlin', 'swift', 'objective-c', 'flutter', 'react native', 'golang', 'rust',
    'c++', 'c#', '.net', 'php', 'laravel', 'sql', 'postgresql', 'mysql', 'mongodb', 'redis', 'cassandra',
    'elasticsearch', 'firebase', 'supabase', 'aws', 'amazon web services', 'azure', 'gcp', 'google cloud',
    'docker', 'kubernetes', 'terraform', 'jenkins', 'github actions', 'ci/cd', 'agile', 'scrum',
    'jira', 'confluence', 'rest api', 'restful', 'microservices', 'serverless', 'machine learning',
    'deep learning', 'tensorflow', 'pytorch', 'scikit-learn', 'pandas', 'numpy', 'data analytics',
    'tableau', 'power bi', 'figma', 'ui/ux', 'seo', 'sem', 'salesforce', 'project management',
    'product management', 'product strategy', 'business analysis', 'software architecture',
    'system design', 'jest', 'cypress', 'playwright', 'tdd', 'unit testing', 'ci-cd'
  ];

  const found = [];
  const missing = [];

  dictionary.forEach(term => {
    // Escape dots and special chars for regexp safety
    const escapedTerm = term.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    const regex = new RegExp(`\\b${escapedTerm}\\b`, 'i');
    
    if (regex.test(jdText)) {
      if (regex.test(resumeContent)) {
        found.push(term);
      } else {
        missing.push(term);
      }
    }
  });

  const total = found.length + missing.length;
  const matchPercentage = total > 0 ? (found.length / total) * 100 : 100;

  return {
    found,
    missing,
    matchPercentage
  };
};
