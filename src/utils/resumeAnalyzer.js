// Evaluates layout formatting, content densities, and general spelling rules of a resume

export const analyzeResumeStructure = (resumeData) => {
  const { personalInfo = {}, summary = '', experience = [], education = [], skills = [], certifications = [] } = resumeData;
  const warnings = [];
  const checks = {
    contactPopulated: false,
    emailFormatValid: false,
    phoneFormatValid: false,
    hasLinkedin: false,
    summaryLengthOk: false,
    hasExperience: false,
    hasBulletFormat: false,
    hasEducation: false,
    hasSkills: false,
    hasCertifications: false
  };

  // Personal Info
  if (personalInfo.name && personalInfo.email && personalInfo.phone) {
    checks.contactPopulated = true;
    
    // Simple Email check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (emailRegex.test(personalInfo.email)) {
      checks.emailFormatValid = true;
    } else {
      warnings.push("Email address format is invalid.");
    }
    
    // Simple Phone check
    if (personalInfo.phone.replace(/[^0-9]/g, '').length >= 7) {
      checks.phoneFormatValid = true;
    } else {
      warnings.push("Phone number seems incomplete.");
    }
  } else {
    warnings.push("Personal details are incomplete. Add a name, email, and phone number.");
  }

  if (personalInfo.linkedin) {
    checks.hasLinkedin = true;
    if (!personalInfo.linkedin.includes('linkedin.com/')) {
      warnings.push("Verify that the LinkedIn URL is a valid linkedin.com profile link.");
    }
  }

  // Summary
  if (summary) {
    const wordCount = summary.trim().split(/\s+/).length;
    if (wordCount >= 30 && wordCount <= 120) {
      checks.summaryLengthOk = true;
    } else if (wordCount < 30) {
      warnings.push("Professional summary is too brief. Try to expand to 2-3 detailed sentences.");
    } else {
      warnings.push("Professional summary is too long. Keep it concise (under 120 words).");
    }
  }

  // Experience
  if (experience && experience.length > 0) {
    checks.hasExperience = true;
    
    let bulletPointsCount = 0;
    experience.forEach(exp => {
      if (exp.description) {
        const bullets = exp.description.split('\n').filter(l => l.trim().startsWith('-'));
        bulletPointsCount += bullets.length;
      }
    });

    if (bulletPointsCount > 0) {
      checks.hasBulletFormat = true;
    } else {
      warnings.push("Format job descriptions with hyphen bullet lists (starting with '- ') for professional layout.");
    }
  } else {
    warnings.push("Add at least one work experience history item.");
  }

  // Education
  if (education && education.length > 0) {
    checks.hasEducation = true;
  } else {
    warnings.push("Include an education section to document degrees or certificates.");
  }

  // Skills
  if (skills && skills.length > 0) {
    checks.hasSkills = true;
    if (skills.length < 5) {
      warnings.push("List at least 5 core technical or soft skills.");
    }
  } else {
    warnings.push("Add core skills to match keywords automatically.");
  }

  if (certifications && certifications.length > 0) {
    checks.hasCertifications = true;
  }

  return {
    checks,
    warnings
  };
};
