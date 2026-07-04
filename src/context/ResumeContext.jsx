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
    website: '',
    linkedin: '',
    photoUrl: '',
    projectSummary: ''
  },
  summary: '',
  experience: [],
  education: [],
  skills: [],
  certifications: []
};

export const ResumeProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [resumes, setResumes] = useState([]);
  const [currentResume, setCurrentResume] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState('idle'); // 'idle' | 'saving' | 'saved' | 'error'
  const [sandboxMode, setSandboxMode] = useState(checkSandboxMode());
  
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
      setResumes(data || []);
    } catch (err) {
      console.error("Error fetching resumes:", err);
    } finally {
      setLoading(false);
    }
  };

  // Create a new resume
  const createResume = async (title = 'Untitled Resume', template = 'professional') => {
    setSaveStatus('saving');
    try {
      const activeSupabase = getSupabaseClient();
      const newResume = {
        ...DEFAULT_RESUME_STATE,
        title,
        template,
        user_id: user?.id || 'sandbox',
      };

      const { data, error } = await activeSupabase
        .from('resumes')
        .insert(newResume)
        .select()
        .single();

      if (error) throw error;

      setResumes(prev => [data, ...prev]);
      setCurrentResume(data);
      setSaveStatus('saved');
      return data;
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

      const clonedResume = {
        ...resumeToCopy,
        id: undefined, // Let db generate a new UUID
        title: `${resumeToCopy.title} (Copy)`,
        created_at: undefined,
        updated_at: undefined
      };

      const { data, error } = await activeSupabase
        .from('resumes')
        .insert(clonedResume)
        .select()
        .single();

      if (error) throw error;

      setResumes(prev => [data, ...prev]);
      setSaveStatus('saved');
      return data;
    } catch (err) {
      console.error("Error cloning resume:", err);
      setSaveStatus('error');
      return null;
    }
  };

  // Delete resume
  const deleteResume = async (id) => {
    try {
      const activeSupabase = getSupabaseClient();
      const { error } = await activeSupabase
        .from('resumes')
        .delete()
        .eq('id', id);

      if (error) throw error;

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
      const { error } = await activeSupabase
        .from('resumes')
        .update({
          title: resume.title,
          template: resume.template,
          personal_info: resume.personalInfo,
          summary: resume.summary,
          experience: resume.experience,
          education: resume.education,
          skills: resume.skills,
          certifications: resume.certifications
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
