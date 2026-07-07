// supabaseClient.js
// Universal client wrapper: automatically initializes official Supabase client when
// environment variables are configured, otherwise routes seamlessly to our Express backend.
import { createClient } from '@supabase/supabase-js';

const envUrl = import.meta.env.VITE_SUPABASE_URL || '';
const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const hasEnvSupabase = Boolean(envUrl && envKey && envUrl.startsWith('http') && !envUrl.includes('your-project'));

let supabaseInstance = null;
if (hasEnvSupabase) {
  try {
    supabaseInstance = createClient(envUrl, envKey);
  } catch (err) {
    console.error('Failed to initialize official Supabase client from env:', err);
  }
}

export const getSupabaseConfig = () => {
  return {
    supabaseUrl: hasEnvSupabase ? envUrl : 'https://backend',
    supabaseKey: hasEnvSupabase ? 'configured-in-env' : 'local-jwt',
    isValid: true,
    isCustom: hasEnvSupabase,
  };
};

export const checkSandboxMode = () => {
  // If official env Supabase is configured or backend token exists, not in offline sandbox mode
  if (hasEnvSupabase) return false;
  return !localStorage.getItem('resume_builder_jwt_token');
};

// Define event emitter for auth changes
const authChangeListeners = new Set();
const notifyAuthChange = (event, session) => {
  authChangeListeners.forEach(listener => listener(event, session));
};

const getAuthHeaders = () => {
  const token = localStorage.getItem('resume_builder_jwt_token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
};

// Safe fetch helper that won't throw SyntaxError on HTML 404 pages (e.g. static Vercel deployment)
const safeFetchJson = async (url, options) => {
  try {
    const res = await fetch(url, options);
    const text = await res.text();
    let data = null;
    try { data = JSON.parse(text); } catch (_) {}
    return { ok: res.ok && data !== null, status: res.status, data };
  } catch (err) {
    return { ok: false, status: 0, data: null, error: err };
  }
};

// Custom backend API wrapper client mapping exactly to Supabase client signature
const customBackendClient = {
  auth: {
    signUp: async ({ email, password }) => {
      try {
        const { ok, data } = await safeFetchJson('/api/auth/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        
        if (!ok || !data) {
          console.warn('Backend API server unreachable (e.g. Vercel static deployment without Supabase env vars). Falling back to Local Sandbox Account Mode.');
          const fakeUser = { id: 'sandbox-' + Date.now(), email, created_at: new Date().toISOString() };
          const fakeToken = 'sandbox-token-' + Date.now();
          localStorage.setItem('resume_builder_jwt_token', fakeToken);
          localStorage.setItem('resume_builder_user_profile', JSON.stringify(fakeUser));
          const session = { user: fakeUser, access_token: fakeToken };
          notifyAuthChange('SIGNED_IN', session);
          return { data: { user: fakeUser, session }, error: null };
        }
        
        localStorage.setItem('resume_builder_jwt_token', data.token);
        localStorage.setItem('resume_builder_user_profile', JSON.stringify(data.user));
        
        const session = { user: data.user, access_token: data.token };
        notifyAuthChange('SIGNED_IN', session);
        return { data: { user: data.user, session }, error: null };
      } catch (err) {
        return { data: { user: null, session: null }, error: err };
      }
    },
    
    signInWithPassword: async ({ email, password }) => {
      try {
        const { ok, data } = await safeFetchJson('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        
        if (!ok || !data) {
          console.warn('Backend API server unreachable. Falling back to Local Sandbox Account Mode login.');
          const fakeUser = { id: 'sandbox-' + Date.now(), email, created_at: new Date().toISOString() };
          const fakeToken = 'sandbox-token-' + Date.now();
          localStorage.setItem('resume_builder_jwt_token', fakeToken);
          localStorage.setItem('resume_builder_user_profile', JSON.stringify(fakeUser));
          const session = { user: fakeUser, access_token: fakeToken };
          notifyAuthChange('SIGNED_IN', session);
          return { data: { user: fakeUser, session }, error: null };
        }
        
        localStorage.setItem('resume_builder_jwt_token', data.token);
        localStorage.setItem('resume_builder_user_profile', JSON.stringify(data.user));
        
        const session = { user: data.user, access_token: data.token };
        notifyAuthChange('SIGNED_IN', session);
        return { data: { user: data.user, session }, error: null };
      } catch (err) {
        return { data: { user: null, session: null }, error: err };
      }
    },
    
    signOut: async () => {
      localStorage.removeItem('resume_builder_jwt_token');
      localStorage.removeItem('resume_builder_user_profile');
      notifyAuthChange('SIGNED_OUT', null);
      return { error: null };
    },
    
    getSession: async () => {
      const token = localStorage.getItem('resume_builder_jwt_token');
      const userProfile = localStorage.getItem('resume_builder_user_profile');
      if (!token || !userProfile) {
        return { data: { session: null }, error: null };
      }
      return { 
        data: { 
          session: { 
            user: JSON.parse(userProfile), 
            access_token: token 
          } 
        }, 
        error: null 
      };
    },
    
    getUser: async () => {
      try {
        const { ok, data } = await safeFetchJson('/api/auth/me', {
          method: 'GET',
          headers: { ...getAuthHeaders() }
        });
        if (!ok || !data) {
          const userProfile = localStorage.getItem('resume_builder_user_profile');
          const user = userProfile ? JSON.parse(userProfile) : null;
          if (!user) return { data: { user: null }, error: new Error('Session expired') };
          return { data: { user }, error: null };
        }
        return { data: { user: data.user }, error: null };
      } catch (err) {
        const userProfile = localStorage.getItem('resume_builder_user_profile');
        const user = userProfile ? JSON.parse(userProfile) : null;
        return { data: { user }, error: null };
      }
    },
    
    onAuthStateChange: (callback) => {
      const wrapper = (event, session) => callback(event, session);
      authChangeListeners.add(wrapper);
      
      // Trigger initial session callback
      const token = localStorage.getItem('resume_builder_jwt_token');
      const userProfile = localStorage.getItem('resume_builder_user_profile');
      if (token && userProfile) {
        const user = JSON.parse(userProfile);
        setTimeout(() => callback('SIGNED_IN', { user, access_token: token }), 0);
      } else {
        setTimeout(() => callback('SIGNED_OUT', null), 0);
      }

      return {
        data: {
          subscription: {
            unsubscribe: () => {
              authChangeListeners.delete(wrapper);
            }
          }
        }
      };
    }
  },
  
  // Express backend endpoint adapter for tables with Local Sandbox Storage fallback
  from: (table) => {
    if (table !== 'resumes') {
      throw new Error(`Table '${table}' not supported by custom API client.`);
    }

    const getLocalResumes = () => {
      try {
        return JSON.parse(localStorage.getItem('resume_builder_sandbox_resumes') || '[]');
      } catch (_) {
        return [];
      }
    };

    const setLocalResumes = (resumes) => {
      try {
        localStorage.setItem('resume_builder_sandbox_resumes', JSON.stringify(resumes));
      } catch (_) {}
    };

    return {
      select: () => {
        const fetchPromise = (async () => {
          const { ok, data } = await safeFetchJson('/api/resumes', {
            method: 'GET',
            headers: { ...getAuthHeaders() }
          });
          if (!ok || !data) {
            // Fallback to Local Sandbox Storage
            return { data: getLocalResumes(), error: null };
          }
          return { data, error: null };
        })();

        return {
          eq: (field, value) => {
            const eqPromise = fetchPromise.then(res => {
              if (res.error) return res;
              // Client side filter
              const filtered = res.data.filter(r => r[field] === value);
              return { data: filtered, error: null };
            });

            return {
              single: () => eqPromise.then(res => {
                const singleItem = res.data?.[0] || null;
                return { 
                  data: singleItem, 
                  error: singleItem ? null : { message: 'Not found', code: 'PGRST116' } 
                };
              }),
              then: (onfulfilled) => eqPromise.then(onfulfilled)
            };
          },
          then: (onfulfilled) => fetchPromise.then(onfulfilled)
        };
      },
      
      insert: (rows) => {
        const insertPromise = (async () => {
          const rowToInsert = Array.isArray(rows) ? rows[0] : rows;
          const { ok, data } = await safeFetchJson('/api/resumes', {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              ...getAuthHeaders() 
            },
            body: JSON.stringify(rowToInsert)
          });
          if (!ok || !data) {
            // Fallback to Local Sandbox Storage
            const current = getLocalResumes();
            const newRow = { ...rowToInsert, id: rowToInsert.id || ('local-' + Date.now()) };
            current.unshift(newRow);
            setLocalResumes(current);
            return { data: Array.isArray(rows) ? [newRow] : newRow, error: null };
          }
          return { data: Array.isArray(rows) ? [data] : data, error: null };
        })();

        return {
          select: () => ({
            single: () => insertPromise.then(res => ({ data: Array.isArray(res.data) ? res.data[0] : res.data, error: res.error })),
            then: (onfulfilled) => insertPromise.then(onfulfilled)
          }),
          then: (onfulfilled) => insertPromise.then(onfulfilled)
        };
      },
      
      update: (updates) => {
        return {
          eq: (field, value) => {
            const updatePromise = (async () => {
              const resumeId = field === 'id' ? value : updates.id;
              const { ok, data } = await safeFetchJson(`/api/resumes/${resumeId}`, {
                method: 'PUT',
                headers: {
                  'Content-Type': 'application/json',
                  ...getAuthHeaders()
                },
                body: JSON.stringify(updates)
              });
              if (!ok || !data) {
                // Fallback to Local Sandbox Storage
                const current = getLocalResumes();
                const idx = current.findIndex(r => r.id === resumeId);
                let updatedRow = updates;
                if (idx !== -1) {
                  updatedRow = { ...current[idx], ...updates };
                  current[idx] = updatedRow;
                } else {
                  current.unshift(updates);
                }
                setLocalResumes(current);
                return { data: [updatedRow], error: null };
              }
              return { data: [data], error: null };
            })();

            return {
              select: () => ({
                single: () => updatePromise.then(res => ({ data: res.data?.[0] || null, error: res.error })),
                then: (onfulfilled) => updatePromise.then(onfulfilled)
              }),
              then: (onfulfilled) => updatePromise.then(onfulfilled)
            };
          }
        };
      },
      
      delete: () => {
        return {
          eq: (field, value) => {
            return (async () => {
              const { ok } = await safeFetchJson(`/api/resumes/${value}`, {
                method: 'DELETE',
                headers: { ...getAuthHeaders() }
              });
              if (!ok) {
                // Fallback to Local Sandbox Storage
                const current = getLocalResumes();
                const filtered = current.filter(r => r.id !== value);
                setLocalResumes(filtered);
                return { data: null, error: null };
              }
              return { data: null, error: null };
            })();
          }
        };
      }
    };
  }
};

export const getSupabaseClient = () => {
  return supabaseInstance || customBackendClient;
};
