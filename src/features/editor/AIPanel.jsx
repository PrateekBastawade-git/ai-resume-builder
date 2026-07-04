import React, { useState, useEffect } from 'react';
import { useResumeAI } from '../../hooks/useResumeAI';
import { useResume } from '../../context/ResumeContext';
import { Button } from '../../components/Button';
import { callAI, isAIConfigured } from '../../ai/services/aiService';
import { parserService } from '../../ai/services/parserService';
import { Sparkles, Brain, Award, Briefcase, FileText, CheckCircle, AlertTriangle, Send, RefreshCw, Undo2, Download, HelpCircle, MessageSquare } from 'lucide-react';

export const AIPanel = ({ forcedTab, fullPage = false }) => {
  const { currentResume, updateCurrentResume, pushHistorySnapshot } = useResume();
  const {
    loading: aiLoading,
    stage: aiStage,
    error: aiError,
    atsReport,
    coverLetter,
    interviewData,
    activityLog,
    analyzeAtsMatch,
    optimizeFullResumeAction,
    generateCoverLetterAction,
    generateInterviewQuestionsAction,
    triggerUndo,
    setError
  } = useResumeAI();

  const [activeTab, setActiveTab] = useState(forcedTab || 'ats'); // 'ats' | 'chat' | 'cover' | 'interview'

  useEffect(() => {
    if (forcedTab) {
      setActiveTab(forcedTab);
    }
  }, [forcedTab]);

  const [jdText, setJdText] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [roleTitle, setRoleTitle] = useState('');

  // Chat Assistant states
  const [chatMessages, setChatMessages] = useState([
    { id: '1', sender: 'assistant', text: "Hello! I am your AI Resume Craft Assistant. Ask me to make edits to your resume, such as 'Make the professional summary sound more senior', 'Optimize my experience for a React Role', or 'Add technical keywords'." }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  // JSON Resume Export
  const handleExportJSON = () => {
    if (!currentResume) return;
    const blob = new Blob([JSON.stringify(currentResume, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentResume.title || 'resume'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Basic DOCX Word layout export (Compatible HTML wrapper method)
  const handleExportDOCX = () => {
    if (!currentResume) return;
    
    // Create basic styled document content
    const htmlString = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head><title>Resume</title><style>
        body { font-family: Arial, sans-serif; font-size: 11pt; line-height: 1.4; }
        h1 { font-size: 22pt; margin-bottom: 2pt; font-weight: bold; text-align: center; text-transform: uppercase; }
        h2 { font-size: 12pt; border-bottom: 1px solid #333; margin-top: 15pt; margin-bottom: 6pt; font-weight: bold; text-transform: uppercase; }
        .subtitle { text-align: center; font-style: italic; margin-bottom: 12pt; color: #555; }
        .item-title { font-weight: bold; }
        .item-meta { display: flex; justify-content: space-between; font-style: italic; color: #666; margin-bottom: 4pt; }
        .bullets { margin-left: 15pt; }
      </style></head>
      <body>
        <h1>${currentResume.personalInfo?.name || 'Name'}</h1>
        <div class="subtitle">
          ${currentResume.personalInfo?.title || ''} | ${currentResume.personalInfo?.email || ''} | ${currentResume.personalInfo?.phone || ''}
          ${currentResume.personalInfo?.website ? ` | ${currentResume.personalInfo.website}` : ''}
        </div>
        
        ${currentResume.summary ? `<h2>Professional Summary</h2><p>${currentResume.summary}</p>` : ''}
        
        <h2>Experience</h2>
        ${(currentResume.experience || []).map(exp => `
          <div>
            <div class="item-title">${exp.role || 'Role'} - ${exp.company || 'Company'}</div>
            <div class="item-meta"><span>${exp.location || ''}</span> <span>${exp.startDate || ''} - ${exp.endDate || ''}</span></div>
            <p>${(exp.description || '').replace(/\n/g, '<br/>')}</p>
          </div>
        `).join('')}

        <h2>Education</h2>
        ${(currentResume.education || []).map(edu => `
          <div>
            <div class="item-title">${edu.degree || 'Degree'}</div>
            <div class="item-meta"><span>${edu.institution || ''}</span> <span>${edu.startDate || ''} - ${edu.endDate || ''}</span></div>
          </div>
        `).join('')}

        <h2>Skills</h2>
        <p>${(currentResume.skills || []).join(' • ')}</p>
      </body>
      </html>
    `;

    const blob = new Blob(['\ufeff' + htmlString], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentResume.title || 'resume'}.doc`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendChat(e);
    }
  };

  // Run the AI Chat agent with full context and conversation memory
  const handleSendChat = async (e) => {
    e.preventDefault();
    const promptText = chatInput.trim();
    if (!promptText) return;

    if (!isAIConfigured()) {
      alert("AI Chat requires the backend server to be running. Please start it with 'node server.js'.");
      return;
    }

    const userMessage = { id: crypto.randomUUID(), sender: 'user', text: promptText };
    setChatMessages(prev => [...prev, userMessage]);
    setChatInput('');
    setChatLoading(true);

    try {
      // Build conversation history for context memory (last 8 messages)
      const recentHistory = [...chatMessages].slice(-8).map(m => 
        `${m.sender === 'user' ? 'User' : 'Assistant'}: ${m.text}`
      ).join('\n');

      // Build ATS context if available
      const atsContext = atsReport 
        ? `\nCURRENT ATS SCORE: ${atsReport?.scores?.overall || 'N/A'}/100\nMISSING KEYWORDS: ${(atsReport?.missingKeywords || []).slice(0, 5).join(', ')}`
        : '';

      // Full context-aware AI resume editor prompt
      const aiPrompt = `You are an expert AI Resume Editing Assistant with deep expertise in ATS optimization, career strategy, and professional writing.

CURRENT RESUME DATA:
\`\`\`json
${JSON.stringify({
  personalInfo: currentResume?.personalInfo,
  summary: currentResume?.summary,
  skills: currentResume?.skills,
  experience: (currentResume?.experience || []).map(e => ({ 
    role: e.role, 
    company: e.company, 
    description: e.description?.substring(0, 300) 
  })),
  education: currentResume?.education,
}, null, 2)}
\`\`\`
${atsContext}

CONVERSATION HISTORY (for context):
${recentHistory}

CURRENT USER REQUEST: "${promptText}"

INSTRUCTIONS:
1. Analyze the user request carefully in context of the full resume.
2. If the request is to EDIT the resume (rewrite summary, optimize bullets, add skills, improve sections):
   - Apply the changes to the relevant resume fields
   - Use strong action verbs, ATS keywords, and quantified metrics
   - Return the FULL updated resume in "updatedResume" field
3. If the request is a QUESTION about the resume or career advice:
   - Answer directly and helpfully in "message" field
   - Do NOT return updatedResume (or return null for it)
4. Be SPECIFIC to this candidate's actual resume content — not generic.
5. For optimization: incorporate keywords for "${currentResume?.personalInfo?.title || 'their target role'}".

RESPOND ONLY with valid JSON:
{
  "updatedResume": null_or_full_resume_object,
  "message": "Friendly, specific explanation of what was done or your advice."
}`;

      const systemInstruction = "You are a professional AI resume editing assistant specializing in ATS optimization and career coaching. Return only valid JSON.";
      
      const rawResponse = await callAI(aiPrompt, { systemInstruction });
      const parsed = parserService.cleanAndParse(rawResponse);

      if (parsed?.updatedResume && typeof parsed.updatedResume === 'object' && Object.keys(parsed.updatedResume).length > 2) {
        pushHistorySnapshot();
        updateCurrentResume(parsed.updatedResume);
        setChatMessages(prev => [...prev, { 
          id: crypto.randomUUID(), 
          sender: 'assistant', 
          text: parsed.message || "✅ I've updated your resume based on your instructions. You can see the changes in real-time." 
        }]);
      } else if (parsed?.message) {
        setChatMessages(prev => [...prev, { 
          id: crypto.randomUUID(), 
          sender: 'assistant', 
          text: parsed.message 
        }]);
      } else {
        throw new Error("Unexpected response from AI assistant.");
      }
    } catch (err) {
      console.error(err);
      setChatMessages(prev => [...prev, { 
        id: crypto.randomUUID(), 
        sender: 'assistant', 
        text: `⚠️ ${err.message || "Something went wrong. Please try again."}` 
      }]);
    } finally {
      setChatLoading(false);
    }
  };

  const executeShortcutMessage = (text) => {
    setChatInput(text);
  };

  return (
    <div className={`bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl shadow-sm flex flex-col overflow-hidden font-sans ${
      fullPage ? 'h-[calc(100vh-10rem)]' : 'h-[calc(100vh-12rem)]'
    }`}>
      
      {/* Tab Navigation header */}
      {!forcedTab && (
        <div className="flex border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/60 p-1.5 gap-1">
          {[
            { id: 'ats', label: 'ATS & Optimization', icon: Brain },
            { id: 'chat', label: 'AI Chat Assistant', icon: MessageSquare },
            { id: 'cover', label: 'Cover Letter', icon: FileText },
            { id: 'interview', label: 'Interview Prep', icon: Award }
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-1 text-xs font-bold rounded-xl transition duration-150 ${
                  activeTab === tab.id
                    ? 'bg-white dark:bg-slate-800 text-primary-600 dark:text-primary-400 shadow-sm border border-slate-100 dark:border-slate-700/50'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Main Tab Content scroll section */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6 flex flex-col">
        
        {/* Loading display block */}
        {aiLoading && (
          <div className="p-4 bg-primary-50/50 dark:bg-primary-950/15 border border-primary-100 dark:border-primary-900/20 rounded-xl flex items-center gap-3.5 animate-pulse">
            <RefreshCw className="w-4 h-4 text-primary-600 dark:text-primary-400 animate-spin" />
            <div className="flex-1">
              <div className="text-xs font-bold text-primary-950 dark:text-primary-300">Agent Action Active</div>
              <div className="text-[11px] text-primary-600 dark:text-primary-400">{aiStage}...</div>
            </div>
          </div>
        )}

        {/* Global Error Banner */}
        {aiError && (
          <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 text-xs text-red-700 dark:text-red-400 rounded-xl relative">
            <button onClick={() => setError(null)} className="absolute top-2 right-2 text-slate-400 hover:text-red-500 font-bold">&times;</button>
            <div className="font-bold flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" />
              AI Error Alert
            </div>
            <p className="mt-1 leading-relaxed">{aiError}</p>
          </div>
        )}

        {/* TAB 1: ATS SCORE & OPTIMIZER */}
        {activeTab === 'ats' && (
          <div className="space-y-6">
            
            {/* ATS Score circle */}
            {atsReport && (
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-5 items-center p-4 bg-slate-50 dark:bg-slate-800/10 border border-slate-200/60 dark:border-slate-800/60 rounded-2xl">
                <div className="col-span-4 flex justify-center">
                  <div className="relative w-24 h-24">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                      <path
                        className="text-slate-200 dark:text-slate-800"
                        strokeWidth="3.5"
                        stroke="currentColor"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                      <path
                        className="text-primary-600 dark:text-primary-400 transition-all duration-500 ease-out"
                        strokeDasharray={`${atsReport.scores?.overall || 50}, 100`}
                        strokeWidth="3.5"
                        strokeLinecap="round"
                        stroke="currentColor"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-xl font-extrabold text-slate-900 dark:text-white">
                        {atsReport.scores?.overall || 0}
                      </span>
                      <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">ATS Score</span>
                    </div>
                  </div>
                </div>

                <div className="col-span-8 space-y-1.5">
                  <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">Live Resume Health Audit</h4>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                    <div className="flex justify-between border-b border-slate-100 dark:border-slate-800 py-0.5">
                      <span>Keywords:</span>
                      <span className="font-bold text-slate-700 dark:text-slate-200">{atsReport.scores?.keywords || 0}%</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-100 dark:border-slate-800 py-0.5">
                      <span>Formatting:</span>
                      <span className="font-bold text-slate-700 dark:text-slate-200">{atsReport.scores?.formatting || 0}%</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-100 dark:border-slate-800 py-0.5">
                      <span>Readability:</span>
                      <span className="font-bold text-slate-700 dark:text-slate-200">{atsReport.scores?.skills || 0}%</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-100 dark:border-slate-800 py-0.5">
                      <span>Grammar:</span>
                      <span className="font-bold text-slate-700 dark:text-slate-200">{atsReport.scores?.grammar || 0}%</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Job Description Matching section */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Target Job Description</h4>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => analyzeAtsMatch(jdText)}
                  disabled={!jdText.trim()}
                  className="text-xs"
                >
                  Analyze Match
                </Button>
              </div>
              <textarea
                value={jdText}
                onChange={(e) => setJdText(e.target.value)}
                placeholder="Paste the target job description here to check keyword alignment and score match percentage..."
                className="w-full text-xs p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-slate-700 dark:text-slate-200 h-28"
              />
            </div>

            {/* Optimize & Undo actions */}
            <div className="flex gap-2.5">
              <Button
                variant="primary"
                onClick={() => optimizeFullResumeAction(jdText)}
                disabled={!jdText.trim()}
                className="flex-1 text-xs shadow-md shadow-primary-500/10"
              >
                <Sparkles className="w-3.5 h-3.5 mr-1" />
                1-Click Optimize Resume
              </Button>
              
              <Button
                variant="outline"
                onClick={triggerUndo}
                title="Undo last AI modification"
                className="px-3 border-slate-200 dark:border-slate-800"
              >
                <Undo2 className="w-4 h-4 text-slate-500" />
              </Button>
            </div>

            {/* Missing Keywords display tags */}
            {atsReport?.missingKeywords && atsReport.missingKeywords.length > 0 && (
              <div className="space-y-2">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Missing Keywords:</span>
                <div className="flex flex-wrap gap-1.5">
                  {atsReport.missingKeywords.map((kw, i) => (
                    <span key={i} className="px-2 py-0.5 rounded text-[10px] font-semibold bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 border border-red-100/50 dark:border-red-900/30">
                      {kw}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Suggestions list */}
            {atsReport?.suggestions && atsReport.suggestions.length > 0 && (
              <div className="space-y-2.5">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Suggestions for Improvement:</span>
                <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
                  {atsReport.suggestions.map((suggestion, i) => (
                    <li key={i} className="flex items-start gap-1.5 leading-relaxed">
                      <CheckCircle className="w-3.5 h-3.5 text-primary-500 mt-0.5 flex-shrink-0" />
                      <span>{suggestion}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {/* Version Export panel */}
            <div className="border-t border-slate-100 dark:border-slate-800 pt-4 space-y-3">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Download Formats</span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleExportDOCX} className="flex-1 text-xs text-slate-700 dark:text-slate-300">
                  <Download className="w-3.5 h-3.5 mr-1" /> DOCX Word
                </Button>
                <Button variant="outline" size="sm" onClick={handleExportJSON} className="flex-1 text-xs text-slate-700 dark:text-slate-300">
                  <Download className="w-3.5 h-3.5 mr-1" /> JSON Resume
                </Button>
              </div>
            </div>

          </div>
        )}

        {/* TAB 2: AI CHAT ASSISTANT */}
        {activeTab === 'chat' && (
          <div className="flex-1 flex flex-col h-full overflow-hidden">
            
            {/* Message Area */}
            <div className="flex-1 overflow-y-auto space-y-3 pb-4">
              {chatMessages.map(msg => (
                <div
                  key={msg.id}
                  className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`p-3 rounded-2xl max-w-[85%] text-xs leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-primary-600 text-white shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200/40 dark:border-slate-700/50'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              {chatLoading && (
                <div className="flex justify-start">
                  <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded-2xl flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              )}
            </div>

            {/* Quick Actions Shortcuts */}
            <div className="border-t border-slate-100 dark:border-slate-800 py-3 space-y-1.5">
              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Quick Instructions:</span>
              <div className="flex flex-wrap gap-1">
                {[
                  "Optimize professional summary",
                  "Fix grammar issues",
                  "Make resume ATS friendly",
                  "Suggest stronger action verbs"
                ].map((txt, idx) => (
                  <button
                    key={idx}
                    onClick={() => executeShortcutMessage(txt)}
                    className="px-2.5 py-1 rounded-lg text-[10px] bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/40 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/50 dark:border-slate-700/50 transition"
                  >
                    {txt}
                  </button>
                ))}
              </div>
            </div>

            {/* Chat Input form */}
            <form onSubmit={handleSendChat} className="flex gap-2 border-t border-slate-100 dark:border-slate-800 pt-3 items-end">
              <textarea
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask AI to modify sections..."
                rows={1}
                className="flex-1 text-xs px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-slate-800 dark:text-slate-100 resize-none max-h-32 leading-relaxed"
              />
              <Button type="submit" disabled={!chatInput.trim() || chatLoading} className="px-3.5 py-2.5 flex-shrink-0">
                <Send className="w-4 h-4" />
              </Button>
            </form>

          </div>
        )}

        {/* TAB 3: COVER LETTER */}
        {activeTab === 'cover' && (
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Generate Cover Letter</h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Company Name</label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="e.g. Google"
                  className="w-full text-xs px-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Target Role</label>
                <input
                  type="text"
                  value={roleTitle}
                  onChange={(e) => setRoleTitle(e.target.value)}
                  placeholder="e.g. Frontend Engineer"
                  className="w-full text-xs px-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>
            
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Job Description context</label>
              <textarea
                value={jdText}
                onChange={(e) => setJdText(e.target.value)}
                placeholder="Paste Job Description text here..."
                className="w-full text-xs p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500 h-20"
              />
            </div>

            <Button
              onClick={() => generateCoverLetterAction(jdText, companyName, roleTitle)}
              disabled={!jdText.trim() || !companyName.trim() || !roleTitle.trim()}
              className="w-full text-xs"
            >
              Draft Cover Letter
            </Button>

            {coverLetter && (
              <div className="p-4 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl space-y-3 select-all">
                <div className="text-xs font-bold text-slate-900 dark:text-white border-b pb-2 border-slate-200 dark:border-slate-800">
                  {coverLetter.subject}
                </div>
                <div className="text-[11px] text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                  {coverLetter.salutation}\n\n{coverLetter.body}\n\n{coverLetter.signOff}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: INTERVIEW PREPARATION */}
        {activeTab === 'interview' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Interview Prep Questions</h4>
              <Button
                variant="outline"
                size="sm"
                onClick={() => generateInterviewQuestionsAction(jdText)}
                className="text-xs"
              >
                Generate Q&A
              </Button>
            </div>

            {interviewData ? (
              <div className="space-y-4">
                {interviewData.map((item, idx) => (
                  <div key={idx} className="p-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl space-y-2">
                    <div className="flex justify-between items-center text-[10px] font-bold">
                      <span className="text-primary-600 dark:text-primary-400 uppercase">{item.type}</span>
                      <span className={`px-2 py-0.5 rounded ${
                        item.difficulty === 'Hard' ? 'bg-red-50 text-red-600 border border-red-100' :
                        item.difficulty === 'Medium' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                        'bg-green-50 text-green-600 border border-green-100'
                      }`}>{item.difficulty}</span>
                    </div>
                    <div className="text-xs font-bold text-slate-950 dark:text-white">
                      Q: {item.question}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                      <strong className="text-slate-700 dark:text-slate-300">Answer Guide: </strong>
                      {item.sampleAnswer}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-xs text-slate-400">
                Click "Generate Q&A" to create customized questions and answers matching your experience.
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};
