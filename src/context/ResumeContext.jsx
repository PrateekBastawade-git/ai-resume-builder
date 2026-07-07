import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { getSupabaseClient, checkSandboxMode } from '../services/supabaseClient';

const ResumeContext = createContext(null);

const DEFAULT_RESUME_STATE = {
  title: 'My Professional Resume',
  template: 'professional',
  personalInfo: {
    name: '',
    title: '',
    email: '',
    phone: '',
    address: '',
    website: '',
    linkedin: '',
    github: '',
    photoUrl: '',
    projectSummary: ''
  },
  summary: '',
  experience: [],
  projects: [],
  education: [],
  skills: [],
  certifications: [],
  languages: [],
  links: [],
  customLayout: null
};

const tryParse = (val, fallback) => {
  if (!val) return fallback;
  if (typeof val === 'string') {
    try { return JSON.parse(val); } catch { return fallback; }
  }
  return val;
};

const unpackResume = (r) => {
  if (!r) return null;
  const pInfoRaw = r.personalInfo || r.personal_info || {};
  const pInfo = tryParse(pInfoRaw, {});
  const extra = pInfo._extra || {};
  const cleaned = {
    ...DEFAULT_RESUME_STATE,
    ...r,
    personalInfo: {
      ...DEFAULT_RESUME_STATE.personalInfo,
      ...pInfo
    },
    experience: tryParse(r.experience, []),
    education: tryParse(r.education, []),
    skills: tryParse(r.skills, []),
    certifications: tryParse(r.certifications, []),
    projects: tryParse(r.projects || extra.projects, []),
    languages: tryParse(r.languages || extra.languages, []),
    links: tryParse(r.links || extra.links, []),
    customLayout: tryParse(r.customLayout || extra.customLayout, null)
  };
  delete cleaned.personal_info;
  if (cleaned.personalInfo && cleaned.personalInfo._extra) {
    delete cleaned.personalInfo._extra;
  }
  return cleaned;
};

export const ResumeProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [resumes, setResumes] = useState([]);
  const [currentResume, setCurrentResume] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState('saved'); // 'saved' | 'saving' | 'error'
  const [sandboxMode, setSandboxMode] = useState(true);
  
  const supabase = getSupabaseClient();
  const currentResumeRef = useRef(null);

  // Sync currentResume to ref for debounce effects without re-triggering effects
  useEffect(() => {
    currentResumeRef.current = currentResume;
  }, [currentResume]);

  // Auth State Listener
  useEffect(() => {
    const activeSupabase = getSupabaseClient();
    setSandboxMode(checkSandboxMode());

    const { data: { subscription } } = activeSupabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
      if (session?.user) {
        fetchResumes(session.user.id);
      } else {
        setResumes([]);
        setCurrentResume(null);
        setLoading(false);
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  // Fetch Resumes for user
  const fetchResumes = async (userId) => {
    setLoading(true);
    try {
      const activeSupabase = getSupabaseClient();
      const { data, error } = await activeSupabase
        .from('resumes')
        .select('*')
        .eq('user_id', userId || user?.id || 'sandbox');

      if (error) throw error;
      setResumes((data || []).map(unpackResume));
    } catch (err) {
      console.error("Error fetching resumes:", err);
    } finally {
      setLoading(false);
    }
  };

  // Create a new resume
  const createResume = async (title = 'Untitled Resume', template = 'professional', initialData = {}) => {
    setSaveStatus('saving');
    try {
      const activeSupabase = getSupabaseClient();
      const packedPersonalInfo = {
        ...(initialData.personalInfo || DEFAULT_RESUME_STATE.personalInfo),
        _extra: {
          projects: initialData.projects || [],
          languages: initialData.languages || [],
          links: initialData.links || [],
          customLayout: initialData.customLayout || null
        }
      };
      const newResume = {
        title,
        template,
        personal_info: packedPersonalInfo,
        personalInfo: packedPersonalInfo,
        summary: initialData.summary || DEFAULT_RESUME_STATE.summary,
        experience: initialData.experience || DEFAULT_RESUME_STATE.experience,
        projects: initialData.projects || DEFAULT_RESUME_STATE.projects,
        education: initialData.education || DEFAULT_RESUME_STATE.education,
        skills: initialData.skills || DEFAULT_RESUME_STATE.skills,
        certifications: initialData.certifications || DEFAULT_RESUME_STATE.certifications,
        languages: initialData.languages || DEFAULT_RESUME_STATE.languages,
        links: initialData.links || DEFAULT_RESUME_STATE.links,
        customLayout: initialData.customLayout || null,
        user_id: user?.id || 'sandbox',
      };

      const { data, error } = await activeSupabase
        .from('resumes')
        .insert(newResume)
        .select()
        .single();

      if (error) throw error;

      const unpacked = unpackResume(data);
      setResumes(prev => [unpacked, ...prev]);
      setCurrentResume(unpacked);
      setSaveStatus('saved');
      return unpacked;
    } catch (err) {
      console.error("Error creating resume:", err);
      setSaveStatus('error');
      return null;
    }
  };

  // Duplicate an existing resume
  const copyResume = async (id) => {
    setSaveStatus('saving');
    try {
      const activeSupabase = getSupabaseClient();
      const resumeToCopy = resumes.find(r => r.id === id);
      if (!resumeToCopy) throw new Error("Resume not found");

      const packedPersonalInfo = {
        ...(resumeToCopy.personalInfo || {}),
        _extra: {
          projects: resumeToCopy.projects || [],
          languages: resumeToCopy.languages || [],
          links: resumeToCopy.links || [],
          customLayout: resumeToCopy.customLayout || null
        }
      };

      const clonedResume = {
        title: `${resumeToCopy.title} (Copy)`,
        template: resumeToCopy.template || 'professional',
        personal_info: packedPersonalInfo,
        personalInfo: packedPersonalInfo,
        summary: resumeToCopy.summary || '',
        experience: resumeToCopy.experience || [],
        projects: resumeToCopy.projects || [],
        education: resumeToCopy.education || [],
        skills: resumeToCopy.skills || [],
        certifications: resumeToCopy.certifications || [],
        languages: resumeToCopy.languages || [],
        links: resumeToCopy.links || [],
        customLayout: resumeToCopy.customLayout || null,
        user_id: resumeToCopy.user_id || user?.id || 'sandbox'
      };

      const { data, error } = await activeSupabase
        .from('resumes')
        .insert(clonedResume)
        .select()
        .single();

      if (error) throw error;

      const unpacked = unpackResume(data);
      setResumes(prev => [unpacked, ...prev]);
      setSaveStatus('saved');
      return unpacked;
    } catch (err) {
      console.error("Error duplicating resume:", err);
      setSaveStatus('error');
      return null;
    }
  };

  // Delete a resume
  const deleteResume = async (id) => {
    try {
      const activeSupabase = getSupabaseClient();
      const { error } = await activeSupabase
        .from('resumes')
        .delete()
        .eq('id', id);

      if (error && error.code !== 'PGRST116') throw error;
      setResumes(prev => prev.filter(r => r.id !== id));
      if (currentResume?.id === id) {
        setCurrentResume(null);
      }
      return true;
    } catch (err) {
      console.error("Error deleting resume:", err);
      return false;
    }
  };

  // Edit / Update resume fields in memory
  const updateCurrentResume = (updates) => {
    if (!currentResume) return;
    
    // Perform functional update
    setCurrentResume(prev => {
      const next = { ...prev, ...updates };
      // Sync list state immediately so dashboard/preview are updated
      setResumes(list => list.map(r => r.id === prev.id ? next : r));
      return next;
    });
    setSaveStatus('saving');
  };

  // Save specific resume to server
  const saveResumeToServer = async (resume) => {
    if (!resume) return;
    try {
      const activeSupabase = getSupabaseClient();
      const packedPersonalInfo = {
        ...(resume.personalInfo || {}),
        _extra: {
          projects: resume.projects || [],
          languages: resume.languages || [],
          links: resume.links || [],
          customLayout: resume.customLayout || null
        }
      };
      const { error } = await activeSupabase
        .from('resumes')
        .update({
          title: resume.title,
          template: resume.template,
          personal_info: packedPersonalInfo,
          personalInfo: packedPersonalInfo,
          summary: resume.summary,
          experience: resume.experience,
          projects: resume.projects || [],
          education: resume.education,
          skills: resume.skills,
          certifications: resume.certifications,
          languages: resume.languages || [],
          links: resume.links || [],
          customLayout: resume.customLayout || null
        })
        .eq('id', resume.id);

      if (error) throw error;
      setSaveStatus('saved');
    } catch (err) {
      console.error("Auto-save failed:", err);
      setSaveStatus('error');
    }
  };

  // Debounced auto-save effect
  useEffect(() => {
    if (!currentResume || saveStatus !== 'saving') return;

    const timer = setTimeout(() => {
      saveResumeToServer(currentResumeRef.current);
    }, 1500); // 1.5 second debounce for auto-save

    return () => clearTimeout(timer);
  }, [currentResume, saveStatus]);

  // Method to manually reload configurations (e.g. after adding custom keys)
  const reloadCredentials = () => {
    const activeSupabase = getSupabaseClient();
    const sandbox = checkSandboxMode();
    setSandboxMode(sandbox);
    
    // Refresh user state
    activeSupabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null);
      if (session?.user) {
        fetchResumes(session.user.id);
      } else {
        // sandbox loading
        fetchResumes('sandbox');
      }
    });
  };

  // Sandbox Mode signup / login simulations
  const mockAuthAction = async (action, email, password) => {
    setLoading(true);
    const activeSupabase = getSupabaseClient();
    try {
      let response;
      if (action === 'signup') {
        response = await activeSupabase.auth.signUp({ email, password });
      } else {
        response = await activeSupabase.auth.signInWithPassword({ email, password });
      }
      
      if (response.error) throw response.error;
      setUser(response.data.user);
      return { success: true };
    } catch (error) {
      return { success: false, message: error.message };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    const activeSupabase = getSupabaseClient();
    await activeSupabase.auth.signOut();
    setUser(null);
    setCurrentResume(null);
    setResumes([]);
  };

  // Run initial sandbox load if no auth exists
  useEffect(() => {
    if (sandboxMode && !user) {
      // In sandbox mode, load sandbox portfolios
      fetchResumes('sandbox');
    }
  }, [sandboxMode, user]);

  const historyRef = useRef([]);

  const pushHistorySnapshot = () => {
    if (currentResumeRef.current) {
      historyRef.current.push(JSON.parse(JSON.stringify(currentResumeRef.current)));
      if (historyRef.current.length > 20) {
        historyRef.current.shift();
      }
    }
  };

  const undoLastChange = () => {
    if (historyRef.current.length === 0) return false;
    const prevState = historyRef.current.pop();
    setCurrentResume(prevState);
    setResumes(list => list.map(r => r.id === prevState.id ? prevState : r));
    saveResumeToServer(prevState);
    return true;
  };

  return (
    <ResumeContext.Provider value={{
      user,
      resumes,
      currentResume,
      loading,
      saveStatus,
      sandboxMode,
      createResume,
      copyResume,
      deleteResume,
      updateCurrentResume,
      setCurrentResume,
      reloadCredentials,
      mockAuthAction,
      logout,
      pushHistorySnapshot,
      undoLastChange,
      hasUndoHistory: historyRef.current.length > 0
    }}>
      {children}
    </ResumeContext.Provider>
  );
};

export const useResume = () => {
  const context = useContext(ResumeContext);
  if (!context) {
    throw new Error('useResume must be used within a ResumeProvider');
  }
  return context;
};
