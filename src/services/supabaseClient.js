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

// Custom backend API wrapper client mapping exactly to Supabase client signature
const customBackendClient = {
  auth: {
    signUp: async ({ email, password }) => {
      try {
        const res = await fetch('/api/auth/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Signup failed');
        
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
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Login failed');
        
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
        const res = await fetch('/api/auth/me', {
          method: 'GET',
          headers: { ...getAuthHeaders() }
        });
        if (!res.ok) {
          // Token expired or invalid
          localStorage.removeItem('resume_builder_jwt_token');
          localStorage.removeItem('resume_builder_user_profile');
          return { data: { user: null }, error: new Error('Session expired') };
        }
        const data = await res.json();
        return { data: { user: data.user }, error: null };
      } catch (err) {
        // Fallback to local profile if offline/network error
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
  
  // Express backend endpoint adapter for tables
  from: (table) => {
    if (table !== 'resumes') {
      throw new Error(`Table '${table}' not supported by custom API client.`);
    }

    return {
      select: () => {
        const fetchPromise = (async () => {
          try {
            const res = await fetch('/api/resumes', {
              method: 'GET',
              headers: { ...getAuthHeaders() }
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to fetch resumes');
            return { data, error: null };
          } catch (err) {
            return { data: [], error: err };
          }
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
          try {
            const rowToInsert = Array.isArray(rows) ? rows[0] : rows;
            const res = await fetch('/api/resumes', {
              method: 'POST',
              headers: { 
                'Content-Type': 'application/json',
                ...getAuthHeaders() 
              },
              body: JSON.stringify(rowToInsert)
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to insert resume');
            return { data: Array.isArray(rows) ? [data] : data, error: null };
          } catch (err) {
            return { data: null, error: err };
          }
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
              try {
                // If eq filters by id, we extract it from target value
                const resumeId = field === 'id' ? value : updates.id;
                const res = await fetch(`/api/resumes/${resumeId}`, {
                  method: 'PUT',
                  headers: {
                    'Content-Type': 'application/json',
                    ...getAuthHeaders()
                  },
                  body: JSON.stringify(updates)
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.error || 'Failed to update resume');
                return { data: [data], error: null };
              } catch (err) {
                return { data: null, error: err };
              }
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
              try {
                const res = await fetch(`/api/resumes/${value}`, {
                  method: 'DELETE',
                  headers: { ...getAuthHeaders() }
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.error || 'Failed to delete resume');
                return { data: null, error: null };
              } catch (err) {
                return { data: null, error: err };
              }
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
