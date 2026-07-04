import { createClient } from '@supabase/supabase-js';

// Retrieve credentials from environment or localStorage overrides
export const getSupabaseConfig = () => {
  const envUrl = import.meta.env.VITE_SUPABASE_URL;
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  const localUrl = localStorage.getItem('resume_builder_supabase_url');
  const localKey = localStorage.getItem('resume_builder_supabase_anon_key');

  const supabaseUrl = localUrl || envUrl;
  const supabaseKey = localKey || envKey;

  const isValid = supabaseUrl && supabaseKey && supabaseUrl.startsWith('https://');

  return {
    supabaseUrl,
    supabaseKey,
    isValid,
    isCustom: !!(localUrl && localKey),
  };
};

let supabaseInstance = null;
let isSandboxMode = true;

const config = getSupabaseConfig();

if (config.isValid) {
  try {
    supabaseInstance = createClient(config.supabaseUrl, config.supabaseKey);
    isSandboxMode = false;
    console.log("Supabase Client initialized successfully.");
  } catch (error) {
    console.error("Failed to initialize Supabase Client, falling back to mock sandbox:", error);
  }
}

// Helper to check current state
export const checkSandboxMode = () => isSandboxMode;

// Fallback Mock Supabase client for Local-Only Sandbox Mode
const createMockSupabase = () => {
  console.warn("Running in Local-Only Sandbox Mode. Data will be saved to LocalStorage only.");

  // Helper for mock session management
  const getMockUser = () => {
    const session = localStorage.getItem('resume_builder_mock_session');
    return session ? JSON.parse(session) : null;
  };

  const setMockUser = (user) => {
    if (user) {
      localStorage.setItem('resume_builder_mock_session', JSON.stringify(user));
    } else {
      localStorage.removeItem('resume_builder_mock_session');
    }
    // Dispatch auth state change event
    window.dispatchEvent(new Event('mock_auth_change'));
  };

  return {
    auth: {
      signUp: async ({ email, password }) => {
        await new Promise(resolve => setTimeout(resolve, 800)); // Simulate network lag
        const mockUser = { id: 'mock-user-123', email, created_at: new Date().toISOString() };
        setMockUser(mockUser);
        return { data: { user: mockUser, session: { access_token: 'mock-token' } }, error: null };
      },
      signInWithPassword: async ({ email, password }) => {
        await new Promise(resolve => setTimeout(resolve, 800));
        if (password.length < 6) {
          return { data: { user: null }, error: { message: "Invalid password. Must be at least 6 characters." } };
        }
        const mockUser = { id: 'mock-user-123', email, created_at: new Date().toISOString() };
        setMockUser(mockUser);
        return { data: { user: mockUser, session: { access_token: 'mock-token' } }, error: null };
      },
      signOut: async () => {
        await new Promise(resolve => setTimeout(resolve, 500));
        setMockUser(null);
        return { error: null };
      },
      getSession: async () => {
        const user = getMockUser();
        return { data: { session: user ? { user, access_token: 'mock-token' } : null }, error: null };
      },
      getUser: async () => {
        const user = getMockUser();
        return { data: { user }, error: null };
      },
      onAuthStateChange: (callback) => {
        const handleAuthChange = () => {
          const user = getMockUser();
          const session = user ? { user, access_token: 'mock-token' } : null;
          callback(user ? 'SIGNED_IN' : 'SIGNED_OUT', session);
        };
        
        window.addEventListener('mock_auth_change', handleAuthChange);
        
        // Immediate invocation
        setTimeout(handleAuthChange, 0);

        return {
          data: {
            subscription: {
              unsubscribe: () => {
                window.removeEventListener('mock_auth_change', handleAuthChange);
              }
            }
          }
        };
      }
    },
    // Mock DB queries using localstorage
    from: (table) => {
      if (table !== 'resumes') {
        throw new Error(`Mock table '${table}' not supported`);
      }

      const getLocalResumes = () => {
        const user = getMockUser();
        const allResumes = JSON.parse(localStorage.getItem('resume_builder_resumes') || '[]');
        return allResumes.filter(r => r.user_id === (user?.id || 'sandbox'));
      };

      const saveLocalResumes = (resumes) => {
        const user = getMockUser();
        const userId = user?.id || 'sandbox';
        const allResumes = JSON.parse(localStorage.getItem('resume_builder_resumes') || '[]');
        
        // Remove current user's resumes and combine with new ones
        const otherResumes = allResumes.filter(r => r.user_id !== userId);
        localStorage.setItem('resume_builder_resumes', JSON.stringify([...otherResumes, ...resumes]));
      };

      return {
        select: (columns) => {
          return {
            eq: (field, value) => {
              // Usually field is user_id or id
              let data = getLocalResumes();
              if (field === 'user_id') {
                data = data.filter(r => r.user_id === value);
              } else if (field === 'id') {
                data = data.filter(r => r.id === value);
              }
              
              const promise = Promise.resolve({ data, error: null });
              
              return {
                single: () => Promise.resolve({ data: data[0] || null, error: data[0] ? null : { message: "Not found", code: "PGRST116" } }),
                then: (onfulfilled) => promise.then(onfulfilled)
              };
            },
            then: (onfulfilled) => {
              const data = getLocalResumes();
              return Promise.resolve({ data, error: null }).then(onfulfilled);
            }
          };
        },
        insert: (rows) => {
          const user = getMockUser();
          const userId = user?.id || 'sandbox';
          
          const newRows = (Array.isArray(rows) ? rows : [rows]).map(row => ({
            ...row,
            id: row.id || crypto.randomUUID(),
            user_id: userId,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }));

          const currentResumes = getLocalResumes();
          saveLocalResumes([...currentResumes, ...newRows]);

          const promise = Promise.resolve({ data: newRows, error: null });
          return {
            select: () => ({
              single: () => Promise.resolve({ data: newRows[0], error: null }),
              then: (onfulfilled) => promise.then(onfulfilled)
            }),
            then: (onfulfilled) => promise.then(onfulfilled)
          };
        },
        update: (updates) => {
          return {
            eq: (field, value) => {
              const currentResumes = getLocalResumes();
              let updatedData = [];
              const updatedResumes = currentResumes.map(r => {
                if (r[field] === value) {
                  const updatedObj = {
                    ...r,
                    ...updates,
                    updated_at: new Date().toISOString()
                  };
                  updatedData.push(updatedObj);
                  return updatedObj;
                }
                return r;
              });

              saveLocalResumes(updatedResumes);
              const promise = Promise.resolve({ data: updatedData, error: null });

              return {
                select: () => ({
                  single: () => Promise.resolve({ data: updatedData[0] || null, error: null }),
                  then: (onfulfilled) => promise.then(onfulfilled)
                }),
                then: (onfulfilled) => promise.then(onfulfilled)
              };
            }
          };
        },
        delete: () => {
          return {
            eq: (field, value) => {
              const currentResumes = getLocalResumes();
              const filteredResumes = currentResumes.filter(r => r[field] !== value);
              saveLocalResumes(filteredResumes);
              
              return Promise.resolve({ data: null, error: null });
            }
          };
        }
      };
    }
  };
};

export const getSupabaseClient = () => {
  // If config updated dynamically via UI settings, re-initialize
  const currentConfig = getSupabaseConfig();
  if (currentConfig.isValid && (!supabaseInstance || isSandboxMode)) {
    try {
      supabaseInstance = createClient(currentConfig.supabaseUrl, currentConfig.supabaseKey);
      isSandboxMode = false;
      console.log("Supabase Client dynamically re-initialized from custom credentials.");
    } catch (e) {
      console.error("Failed to dynamically initialize Supabase client:", e);
    }
  } else if (!currentConfig.isValid && !isSandboxMode) {
    // If credentials cleared
    supabaseInstance = null;
    isSandboxMode = true;
  }

  if (isSandboxMode) {
    if (!supabaseInstance) {
      supabaseInstance = createMockSupabase();
    }
  }

  return supabaseInstance;
};
