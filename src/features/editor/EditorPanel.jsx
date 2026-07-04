import React, { useState } from 'react';
import { useResume } from '../../context/ResumeContext';
import { useResumeAI } from '../../hooks/useResumeAI';
import { analysisAgent } from '../../ai/agent/analysisAgent';
import { Input, Textarea } from '../../components/Input';
import { Button } from '../../components/Button';
import { Modal } from '../../components/Modal';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Plus, Trash2, Sparkles, User, FileText, Briefcase, GraduationCap, Award, Check } from 'lucide-react';

export const EditorPanel = () => {
  const { currentResume, updateCurrentResume, saveStatus, pushHistorySnapshot } = useResume();
  const { generateSummaryAction, optimizeExperienceAction } = useResumeAI();
  const [activeSection, setActiveSection] = useState('personal'); // 'personal' | 'summary' | 'experience' | 'education' | 'skills'
  
  // Local states for AI helpers
  const [aiRole, setAiRole] = useState('');
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  
  const [optimizingIndex, setOptimizingIndex] = useState(null);
  
  // Bullet Selection Modal States
  const [isBulletModalOpen, setIsBulletModalOpen] = useState(false);
  const [bulletOptions, setBulletOptions] = useState([]);
  const [selectedBullets, setSelectedBullets] = useState({});
  const [activeExpId, setActiveExpId] = useState(null);
  const [activeExpIndex, setActiveExpIndex] = useState(null);

  const [skillPredictorRole, setSkillPredictorRole] = useState('');
  const [isPredictingSkills, setIsPredictingSkills] = useState(false);
  const [predictedSkills, setPredictedSkills] = useState([]);

  const [skillInput, setSkillInput] = useState('');
  const [certInput, setCertInput] = useState('');

  if (!currentResume) return null;

  const { personalInfo = {}, summary = '', experience = [], education = [], skills = [], certifications = [] } = currentResume;

  // Generic updater helpers
  const updatePersonalInfo = (field, value) => {
    updateCurrentResume({
      personalInfo: {
        ...personalInfo,
        [field]: value
      }
    });
  };

  // 1. Summary updates
  const handleSummaryChange = (e) => {
    updateCurrentResume({ summary: e.target.value });
  };

  const handleAISummary = async () => {
    const role = aiRole || personalInfo.title || '';
    if (!role) {
      alert("Please provide a target Job Role to generate a summary.");
      return;
    }
    setIsGeneratingSummary(true);
    try {
      await generateSummaryAction(role);
    } catch (e) {
      alert(e.message || "Failed to generate summary");
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  // 2. Experience updates
  const handleAddExperience = () => {
    const newExp = {
      id: crypto.randomUUID(),
      company: '',
      role: '',
      startDate: '',
      endDate: '',
      location: '',
      description: ''
    };
    updateCurrentResume({ experience: [...experience, newExp] });
  };

  const handleUpdateExperience = (id, field, value) => {
    const updated = experience.map(exp => {
      if (exp.id === id) {
        return { ...exp, [field]: value };
      }
      return exp;
    });
    updateCurrentResume({ experience: updated });
  };

  const handleDeleteExperience = (id) => {
    updateCurrentResume({ experience: experience.filter(exp => exp.id !== id) });
  };

  const handleAIEnhanceExperience = async (id, index) => {
    const expItem = experience.find(exp => exp.id === id);
    if (!expItem || !expItem.description.trim()) {
      alert("Please write a draft description first, then click optimize.");
      return;
    }
    
    setOptimizingIndex(index);
    try {
      const result = await optimizeExperienceAction(id, expItem.description, personalInfo.title);
      if (result && Array.isArray(result.bullets)) {
        // Clean bullet list prefix (- or * or •) if present
        const cleanedBullets = result.bullets.map(b => b.replace(/^[-*•]\s*/, '').trim());
        setBulletOptions(cleanedBullets);
        // Pre-select all
        const initialSelection = {};
        cleanedBullets.forEach((_, idx) => {
          initialSelection[idx] = true;
        });
        setSelectedBullets(initialSelection);
        setActiveExpId(id);
        setActiveExpIndex(index);
        setIsBulletModalOpen(true);
      } else {
        throw new Error("No bullets returned from AI agent.");
      }
    } catch (e) {
      alert(e.message || "Failed to optimize description");
    } finally {
      setOptimizingIndex(null);
    }
  };

  const handleApplySelectedBullets = () => {
    if (!activeExpId) return;
    
    // Filter and format selected bullets
    const chosen = bulletOptions
      .filter((_, idx) => !!selectedBullets[idx])
      .map(b => `- ${b}`)
      .join('\n');
      
    if (!chosen.trim()) {
      alert("Please select at least one bullet point.");
      return;
    }

    pushHistorySnapshot();
    const updated = experience.map(exp => {
      if (exp.id === activeExpId) {
        return { ...exp, description: chosen };
      }
      return exp;
    });
    updateCurrentResume({ experience: updated });
    setIsBulletModalOpen(false);
  };

  // 3. Education updates
  const handleAddEducation = () => {
    const newEdu = {
      id: crypto.randomUUID(),
      institution: '',
      degree: '',
      startDate: '',
      endDate: '',
      scoreType: 'cgpa',
      scoreValue: ''
    };
    updateCurrentResume({ education: [...education, newEdu] });
  };

  const handleUpdateEducation = (id, field, value) => {
    const updated = education.map(edu => {
      if (edu.id === id) {
        return { ...edu, [field]: value };
      }
      return edu;
    });
    updateCurrentResume({ education: updated });
  };

  const handleDeleteEducation = (id) => {
    updateCurrentResume({ education: education.filter(edu => edu.id !== id) });
  };

  // 4. Skills tags
  const handleAddSkill = (e) => {
    if (e.key === 'Enter' || e.type === 'blur') {
      e.preventDefault();
      const val = skillInput.trim();
      if (val && !skills.includes(val)) {
        updateCurrentResume({ skills: [...skills, val] });
        setSkillInput('');
      }
    }
  };

  const handleDeleteSkill = (skillToDelete) => {
    updateCurrentResume({ skills: skills.filter(s => s !== skillToDelete) });
  };

  const handleAddPredictedSkill = (skill) => {
    if (!skills.includes(skill)) {
      updateCurrentResume({ skills: [...skills, skill] });
    }
  };

  const handlePredictSkillsAction = async () => {
    const role = skillPredictorRole || personalInfo.title || '';
    if (!role) {
      alert("Please enter a target job title to predict skills.");
      return;
    }
    setIsPredictingSkills(true);
    try {
      // Pass full currentResume for context-aware skill prediction
      const predicted = await analysisAgent.predictSkills(role, currentResume);
      setPredictedSkills(predicted);
    } catch (e) {
      alert(e.message || "Failed to predict skills");
    } finally {
      setIsPredictingSkills(false);
    }
  };

  // 5. Certifications tags
  const handleAddCert = (e) => {
    if (e.key === 'Enter' || e.type === 'blur') {
      e.preventDefault();
      const val = certInput.trim();
      if (val && !certifications.includes(val)) {
        updateCurrentResume({ certifications: [...certifications, val] });
        setCertInput('');
      }
    }
  };

  const handleDeleteCert = (certToDelete) => {
    updateCurrentResume({ certifications: certifications.filter(c => c !== certToDelete) });
  };

  // Accordion Header component
  const AccordionHeader = ({ id, label, icon: Icon }) => {
    const isOpen = activeSection === id;
    return (
      <button
        onClick={() => setActiveSection(isOpen ? '' : id)}
        className="w-full flex items-center justify-between py-4 px-5 bg-slate-50 dark:bg-slate-800/20 hover:bg-slate-100/50 dark:hover:bg-slate-800/40 border-b border-slate-200/60 dark:border-slate-800/50 transition duration-150 select-none text-left"
      >
        <div className="flex items-center gap-3">
          <div className={`p-1.5 rounded-lg ${isOpen ? 'bg-primary-100 dark:bg-primary-950 text-primary-600 dark:text-primary-400' : 'bg-slate-200/50 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`}>
            <Icon className="w-4 h-4" />
          </div>
          <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{label}</span>
        </div>
        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isOpen ? 'transform rotate-180 text-primary-500' : ''}`} />
      </button>
    );
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-sm divide-y divide-slate-200/80 dark:divide-slate-800 overflow-hidden font-sans">
      
      {/* Save status badge in the editor header */}
      <div className="bg-slate-50/50 dark:bg-slate-900 px-5 py-3.5 flex items-center justify-between border-b border-slate-200/60 dark:border-slate-800/50">
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Editing Layout</span>
        <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${
          saveStatus === 'saving' ? 'text-amber-500' : saveStatus === 'saved' ? 'text-green-500' : 'text-slate-400'
        }`}>
          {saveStatus === 'saving' && (
            <>
              <svg className="animate-spin h-3.5 w-3.5 text-amber-500" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Saving changes...
            </>
          )}
          {saveStatus === 'saved' && (
            <>
              <Check className="w-3.5 h-3.5" />
              Saved to profile
            </>
          )}
          {saveStatus === 'idle' && 'No pending edits'}
        </span>
      </div>

      {/* 1. Personal Info Section */}
      <div>
        <AccordionHeader id="personal" label="Personal Information" icon={User} />
        <AnimatePresence initial={false}>
          {activeSection === 'personal' && (
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: 'auto' }}
              exit={{ height: 0 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              className="overflow-hidden"
            >
              <div className="p-5 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Full Name"
                    id="name"
                    value={personalInfo.name || ''}
                    onChange={(e) => updatePersonalInfo('name', e.target.value)}
                    placeholder="Jane Doe"
                  />
                  <Input
                    label="Professional Title"
                    id="title"
                    value={personalInfo.title || ''}
                    onChange={(e) => updatePersonalInfo('title', e.target.value)}
                    placeholder="Senior Full Stack Engineer"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Email Address"
                    id="email"
                    type="email"
                    value={personalInfo.email || ''}
                    onChange={(e) => updatePersonalInfo('email', e.target.value)}
                    placeholder="jane.doe@example.com"
                  />
                  <Input
                    label="Phone Number"
                    id="phone"
                    value={personalInfo.phone || ''}
                    onChange={(e) => updatePersonalInfo('phone', e.target.value)}
                    placeholder="+1 (555) 019-2834"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Personal Website / Portfolio"
                    id="website"
                    value={personalInfo.website || ''}
                    onChange={(e) => updatePersonalInfo('website', e.target.value)}
                    placeholder="https://janedoe.dev"
                  />
                  <Input
                    label="LinkedIn URL"
                    id="linkedin"
                    value={personalInfo.linkedin || ''}
                    onChange={(e) => updatePersonalInfo('linkedin', e.target.value)}
                    placeholder="https://linkedin.com/in/janedoe"
                  />
                </div>
                <Input
                  label="Profile Picture URL"
                  id="photoUrl"
                  value={personalInfo.photoUrl || ''}
                  onChange={(e) => updatePersonalInfo('photoUrl', e.target.value)}
                  placeholder="https://images.unsplash.com/photo-..."
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 2. Professional Summary Section */}
      <div>
        <AccordionHeader id="summary" label="Professional Summary" icon={FileText} />
        <AnimatePresence initial={false}>
          {activeSection === 'summary' && (
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: 'auto' }}
              exit={{ height: 0 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              className="overflow-hidden"
            >
              <div className="p-5 space-y-4">
                {/* AI Summary Generator Helper */}
                <div className="p-4 bg-primary-50/40 dark:bg-primary-950/10 border border-primary-100/50 dark:border-primary-900/20 rounded-xl space-y-3">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-primary-700 dark:text-primary-400">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>AI Summary Writer</span>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={aiRole}
                      onChange={(e) => setAiRole(e.target.value)}
                      placeholder="Enter target job role (e.g. Lead Frontend Architect)"
                      className="flex-1 px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-slate-800 dark:text-slate-100"
                    />
                    <Button
                      onClick={handleAISummary}
                      loading={isGeneratingSummary}
                      size="sm"
                      className="text-xs"
                    >
                      Write Summary
                    </Button>
                  </div>
                </div>

                <Textarea
                  label="Professional Summary"
                  id="summaryText"
                  rows={5}
                  value={summary}
                  onChange={handleSummaryChange}
                  placeholder="Summarize your professional qualifications, experience highlights, and core career values here..."
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Project Summary Section */}
      <div>
        <AccordionHeader id="projectSummary" label="Project Summary" icon={Briefcase} />
        <AnimatePresence initial={false}>
          {activeSection === 'projectSummary' && (
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: 'auto' }}
              exit={{ height: 0 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              className="overflow-hidden"
            >
              <div className="p-5 space-y-4">
                <Textarea
                  label="Project Summary"
                  id="projectSummaryText"
                  rows={5}
                  value={personalInfo.projectSummary || ''}
                  onChange={(e) => updatePersonalInfo('projectSummary', e.target.value)}
                  placeholder="Describe your key projects, technical stacks used, and individual contributions here..."
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 3. Work Experience Section */}
      <div>
        <AccordionHeader id="experience" label="Work Experience" icon={Briefcase} />
        <AnimatePresence initial={false}>
          {activeSection === 'experience' && (
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: 'auto' }}
              exit={{ height: 0 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              className="overflow-hidden"
            >
              <div className="p-5 space-y-6">
                {experience.map((exp, index) => (
                  <div
                    key={exp.id}
                    className="p-5 bg-slate-50/50 dark:bg-slate-800/10 border border-slate-200/60 dark:border-slate-800/60 rounded-xl relative space-y-4"
                  >
                    {/* Delete item button */}
                    <button
                      onClick={() => handleDeleteExperience(exp.id)}
                      className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition"
                      title="Delete experience"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    <div className="pr-8 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Position #{index + 1}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Input
                        label="Company Name"
                        value={exp.company}
                        onChange={(e) => handleUpdateExperience(exp.id, 'company', e.target.value)}
                        placeholder="Acme Corporation"
                      />
                      <Input
                        label="Role / Title"
                        value={exp.role}
                        onChange={(e) => handleUpdateExperience(exp.id, 'role', e.target.value)}
                        placeholder="Frontend Team Lead"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <Input
                        label="Start Date"
                        value={exp.startDate}
                        onChange={(e) => handleUpdateExperience(exp.id, 'startDate', e.target.value)}
                        placeholder="Jan 2022"
                      />
                      <Input
                        label="End Date"
                        value={exp.endDate}
                        onChange={(e) => handleUpdateExperience(exp.id, 'endDate', e.target.value)}
                        placeholder="Present"
                      />
                      <Input
                        label="Location"
                        value={exp.location}
                        onChange={(e) => handleUpdateExperience(exp.id, 'location', e.target.value)}
                        placeholder="San Francisco, CA (Hybrid)"
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <label className="text-xs font-semibold tracking-wide text-slate-600 dark:text-slate-400">
                          Description & Action Bullets
                        </label>
                        <Button
                          onClick={() => handleAIEnhanceExperience(exp.id, index)}
                          loading={optimizingIndex === index}
                          variant="ghost"
                          size="sm"
                          className="text-xs text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-950/20 py-1"
                        >
                          <Sparkles className="w-3.5 h-3.5 mr-1" />
                          Optimize Bullets (AI)
                        </Button>
                      </div>
                      <Textarea
                        rows={4}
                        value={exp.description}
                        onChange={(e) => handleUpdateExperience(exp.id, 'description', e.target.value)}
                        placeholder="Use bullet list formatting:&#10;- Led development of a web application scaling to 10k users.&#10;- Optimized loading speed by 25%."
                      />
                    </div>
                  </div>
                ))}

                <Button
                  onClick={handleAddExperience}
                  variant="outline"
                  className="w-full flex items-center justify-center gap-1.5 border-dashed"
                >
                  <Plus className="w-4 h-4" />
                  Add Work Experience
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 4. Education Section */}
      <div>
        <AccordionHeader id="education" label="Education" icon={GraduationCap} />
        <AnimatePresence initial={false}>
          {activeSection === 'education' && (
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: 'auto' }}
              exit={{ height: 0 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              className="overflow-hidden"
            >
              <div className="p-5 space-y-6">
                {education.map((edu, index) => (
                  <div
                    key={edu.id}
                    className="p-5 bg-slate-50/50 dark:bg-slate-800/10 border border-slate-200/60 dark:border-slate-800/60 rounded-xl relative space-y-4"
                  >
                    <button
                      onClick={() => handleDeleteEducation(edu.id)}
                      className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition"
                      title="Delete education"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    <div className="pr-8 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Education #{index + 1}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Input
                        label="Institution"
                        value={edu.institution}
                        onChange={(e) => handleUpdateEducation(edu.id, 'institution', e.target.value)}
                        placeholder="Stanford University"
                      />
                      <Input
                        label="Degree / Field of Study"
                        value={edu.degree}
                        onChange={(e) => handleUpdateEducation(edu.id, 'degree', e.target.value)}
                        placeholder="Bachelor of Science in Computer Science"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Input
                        label="Start Date"
                        value={edu.startDate}
                        onChange={(e) => handleUpdateEducation(edu.id, 'startDate', e.target.value)}
                        placeholder="Sep 2018"
                      />
                      <Input
                        label="End Date"
                        value={edu.endDate}
                        onChange={(e) => handleUpdateEducation(edu.id, 'endDate', e.target.value)}
                        placeholder="Jun 2022"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold tracking-wide text-slate-600 dark:text-slate-400 mb-1">Score Type</label>
                        <select
                          value={edu.scoreType || 'cgpa'}
                          onChange={(e) => handleUpdateEducation(edu.id, 'scoreType', e.target.value)}
                          className="w-full text-xs px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-slate-850 dark:text-slate-100"
                        >
                          <option value="cgpa">CGPA</option>
                          <option value="percentage">Percentage</option>
                        </select>
                      </div>
                      <Input
                        label={`${(edu.scoreType || 'cgpa') === 'percentage' ? 'Percentage' : 'CGPA'} Value *`}
                        value={edu.scoreValue || ''}
                        onChange={(e) => handleUpdateEducation(edu.id, 'scoreValue', e.target.value)}
                        placeholder={(edu.scoreType || 'cgpa') === 'percentage' ? 'e.g. 85%' : 'e.g. 8.5/10'}
                        required
                      />
                    </div>
                  </div>
                ))}

                <Button
                  onClick={handleAddEducation}
                  variant="outline"
                  className="w-full flex items-center justify-center gap-1.5 border-dashed"
                >
                  <Plus className="w-4 h-4" />
                  Add Education Item
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 5. Core Skills & Certifications Section */}
      <div>
        <AccordionHeader id="skills" label="Core Skills & Certifications" icon={Award} />
        <AnimatePresence initial={false}>
          {activeSection === 'skills' && (
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: 'auto' }}
              exit={{ height: 0 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              className="overflow-hidden"
            >
              <div className="p-5 space-y-6">
                {/* 5A. Core Skills Tag Input */}
                <div className="space-y-3">
                  <label className="text-xs font-semibold tracking-wide text-slate-600 dark:text-slate-400">
                    Core Skills
                  </label>
                  
                  {/* Tag List */}
                  <div className="flex flex-wrap gap-1.5 p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg min-h-[46px]">
                    {skills.map((skill, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-primary-50 dark:bg-primary-950/40 text-primary-700 dark:text-primary-300 border border-primary-100 dark:border-primary-900/30"
                      >
                        {skill}
                        <button
                          type="button"
                          onClick={() => handleDeleteSkill(skill)}
                          className="hover:bg-primary-100 dark:hover:bg-primary-900 p-0.5 rounded transition"
                        >
                          &times;
                        </button>
                      </span>
                    ))}
                    <input
                      type="text"
                      value={skillInput}
                      onChange={(e) => setSkillInput(e.target.value)}
                      onKeyDown={handleAddSkill}
                      onBlur={handleAddSkill}
                      placeholder="Type a skill and hit Enter..."
                      className="flex-1 bg-transparent px-2 py-0.5 text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none min-w-[120px]"
                    />
                  </div>

                  {/* AI Skill Predictor Suggestion Bar */}
                  <div className="p-4 bg-primary-50/40 dark:bg-primary-950/10 border border-primary-100/50 dark:border-primary-900/20 rounded-xl space-y-3">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-primary-700 dark:text-primary-400">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>AI Skill Predictor</span>
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={skillPredictorRole}
                        onChange={(e) => setSkillPredictorRole(e.target.value)}
                        placeholder="Enter target job title (e.g. Sales Executive)"
                        className="flex-1 px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-slate-800 dark:text-slate-100"
                      />
                      <Button
                        onClick={handlePredictSkillsAction}
                        loading={isPredictingSkills}
                        size="sm"
                        className="text-xs"
                      >
                        Predict Skills
                      </Button>
                    </div>

                    {/* Predicted Tag Suggestions */}
                    {predictedSkills.length > 0 && (
                      <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800/40">
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold tracking-wider uppercase block">AI Recommended (Click to add):</span>
                        <div className="flex flex-wrap gap-1.5">
                          {predictedSkills.map((ps, index) => {
                            const isAdded = skills.includes(ps);
                            return (
                              <button
                                key={index}
                                type="button"
                                onClick={() => handleAddPredictedSkill(ps)}
                                disabled={isAdded}
                                className={`px-2 py-0.5 rounded text-[11px] font-semibold border transition ${
                                  isAdded
                                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700 cursor-not-allowed opacity-50'
                                    : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-primary-500 dark:hover:border-primary-400 hover:text-primary-600 dark:hover:text-primary-400'
                                }`}
                              >
                                {ps} {isAdded && '✓'}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* 5B. Certifications Tag Input */}
                <div className="space-y-3">
                  <label className="text-xs font-semibold tracking-wide text-slate-600 dark:text-slate-400">
                    Certifications & Coursework
                  </label>
                  <div className="flex flex-wrap gap-1.5 p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg min-h-[46px]">
                    {certifications.map((cert, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-violet-50 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300 border border-violet-100 dark:border-violet-900/30"
                      >
                        {cert}
                        <button
                          type="button"
                          onClick={() => handleDeleteCert(cert)}
                          className="hover:bg-violet-100 dark:hover:bg-violet-900 p-0.5 rounded transition"
                        >
                          &times;
                        </button>
                      </span>
                    ))}
                    <input
                      type="text"
                      value={certInput}
                      onChange={(e) => setCertInput(e.target.value)}
                      onKeyDown={handleAddCert}
                      onBlur={handleAddCert}
                      placeholder="Type a certification and hit Enter..."
                      className="flex-1 bg-transparent px-2 py-0.5 text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none min-w-[120px]"
                    />
                  </div>
                </div>

              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* AI Bullet Optimization Selection Modal */}
      <Modal
        isOpen={isBulletModalOpen}
        onClose={() => setIsBulletModalOpen(false)}
        title="Select AI-Optimized Bullets"
        size="lg"
      >
        <div className="space-y-4 font-sans text-slate-800 dark:text-slate-200">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            We analyzed your description and generated professional, ATS-optimized, and action-verb initiated alternatives. Select the ones you want to include in your description, and edit them inline if needed:
          </p>

          <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
            {bulletOptions.map((bullet, idx) => (
              <div
                key={idx}
                className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 rounded-xl hover:border-slate-200/60 dark:hover:border-slate-700/60 transition"
              >
                <input
                  type="checkbox"
                  checked={!!selectedBullets[idx]}
                  onChange={() => setSelectedBullets(prev => ({ ...prev, [idx]: !prev[idx] }))}
                  className="mt-1 w-4 h-4 text-primary-600 border-slate-300 rounded focus:ring-primary-500"
                />
                <textarea
                  value={bullet}
                  rows={2}
                  onChange={(e) => {
                    const newVal = e.target.value;
                    setBulletOptions(prev => {
                      const updated = [...prev];
                      updated[idx] = newVal;
                      return updated;
                    });
                  }}
                  className="flex-1 text-xs px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-slate-800 dark:text-slate-100"
                />
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsBulletModalOpen(false)}
            >
              Cancel
            </Button>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  const nextSel = {};
                  bulletOptions.forEach((_, idx) => { nextSel[idx] = true; });
                  setSelectedBullets(nextSel);
                }}
                className="text-xs"
              >
                Select All
              </Button>
              <Button
                type="button"
                variant="primary"
                onClick={handleApplySelectedBullets}
              >
                Apply Selected Bullets
              </Button>
            </div>
          </div>
        </div>
      </Modal>

    </div>
  );
};
