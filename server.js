import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import Groq from 'groq-sdk';
import { initDb, createUser, findUserByEmail, createResume, getResumesByUserId, updateResume, deleteResume } from './server/db.js';
import { hashPassword, comparePassword, generateToken, requireAuth } from './server/auth.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// ─── CORS ─────────────────────────────────────────────────────────────────────
// Allow localhost in dev + any Vercel/Render deployment.
// Add your Vercel URL to ALLOWED_ORIGINS env var (comma-separated) if needed.
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  ...(process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim()) : []),
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (curl, Postman, same-origin)
    if (!origin) return callback(null, true);
    if (
      allowedOrigins.some(o => origin === o) ||
      origin.endsWith('.vercel.app') ||
      origin.endsWith('.onrender.com')
    ) {
      return callback(null, true);
    }
    callback(new Error(`CORS blocked: ${origin}`));
  },
  credentials: true,
}));
app.use(express.json({ limit: '4mb' }));


// ─── Groq AI Endpoint ─────────────────────────────────────────────────────────
app.post('/api/ai', async (req, res) => {
  const {
    prompt,
    systemInstruction,
    model = 'llama-3.3-70b-versatile',
    temperature = 0.7,
    maxTokens = 4096,
  } = req.body;

  const key = process.env.GROQ_API_KEY;

  if (!key) {
    return res.status(500).json({ error: 'Groq API Key is not configured on the backend server.' });
  }

  if (!prompt) {
    return res.status(400).json({ error: 'Prompt is required.' });
  }

  try {
    const groq = new Groq({ apiKey: key });

    const messages = [];

    if (systemInstruction) {
      messages.push({ role: 'system', content: systemInstruction });
    }

    messages.push({ role: 'user', content: prompt });

    const completion = await groq.chat.completions.create({
      model,
      messages,
      temperature,
      max_tokens: maxTokens,
      top_p: 1,
      stream: false,
    });

    const responseText = completion.choices?.[0]?.message?.content;

    if (!responseText) {
      return res.status(500).json({ error: 'Received an empty response from Groq API.' });
    }

    res.json({ text: responseText });
  } catch (error) {
    console.error('Error calling Groq:', error);

    const status = error?.status || error?.statusCode || 500;
    const errMsg = error?.error?.message || error?.message || 'Unknown backend AI error';

    // Map known Groq errors to user-friendly messages
    if (status === 401) {
      return res.status(401).json({ error: 'Invalid Groq API Key. Please check your .env file.' });
    }
    if (status === 429) {
      return res.status(429).json({ error: 'Rate limit exceeded. Please wait a moment and try again.' });
    }
    if (status === 400) {
      return res.status(400).json({ error: `Invalid request to Groq: ${errMsg}` });
    }

    res.status(500).json({ error: errMsg });
  }
});

// ─── Authentication Routes ───────────────────────────────────────────────────

// POST /api/auth/signup
app.post('/api/auth/signup', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
  }

  try {
    const existing = await findUserByEmail(email);
    if (existing) {
      return res.status(400).json({ error: 'An account with this email already exists.' });
    }

    const passwordHash = await hashPassword(password);
    const user = await createUser(email, passwordHash);
    const token = generateToken(user.id);

    res.status(201).json({ user, token });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Server error during signup process.' });
  }
});

// POST /api/auth/login
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  try {
    const user = await findUserByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = generateToken(user.id);
    const { password: _, ...userWithoutPassword } = user;

    res.json({ user: userWithoutPassword, token });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error during login process.' });
  }
});

// GET /api/auth/me
app.get('/api/auth/me', requireAuth, (req, res) => {
  res.json({ user: req.user });
});

// ─── Resume Routes ───────────────────────────────────────────────────────────

// GET /api/resumes
app.get('/api/resumes', requireAuth, async (req, res) => {
  try {
    const resumes = await getResumesByUserId(req.user.id);
    res.json(resumes);
  } catch (error) {
    console.error('Fetch resumes error:', error);
    res.status(500).json({ error: 'Server error fetching resumes.' });
  }
});

// POST /api/resumes
app.post('/api/resumes', requireAuth, async (req, res) => {
  try {
    const newResume = await createResume(req.user.id, req.body);
    res.status(201).json(newResume);
  } catch (error) {
    console.error('Create resume error:', error);
    res.status(500).json({ error: 'Server error creating resume.' });
  }
});

// PUT /api/resumes/:id
app.put('/api/resumes/:id', requireAuth, async (req, res) => {
  try {
    const updated = await updateResume(req.params.id, req.user.id, req.body);
    if (!updated) {
      return res.status(404).json({ error: 'Resume not found or unauthorized.' });
    }
    res.json(updated);
  } catch (error) {
    console.error('Update resume error:', error);
    res.status(500).json({ error: 'Server error updating resume.' });
  }
});

// DELETE /api/resumes/:id
app.delete('/api/resumes/:id', requireAuth, async (req, res) => {
  try {
    const success = await deleteResume(req.params.id, req.user.id);
    if (!success) {
      return res.status(404).json({ error: 'Resume not found or unauthorized.' });
    }
    res.json({ success: true });
  } catch (error) {
    console.error('Delete resume error:', error);
    res.status(500).json({ error: 'Server error deleting resume.' });
  }
});

// Legacy /api/gemini alias — keeps any leftover clients working
app.post('/api/gemini', (req, res, next) => {
  req.url = '/api/ai';
  app._router.handle(req, res, next);
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    provider: 'Groq',
    model: 'llama-3.3-70b-versatile',
    keyConfigured: !!process.env.GROQ_API_KEY,
  });
});

// Start server after database initialization
initDb().then(() => {
  app.listen(PORT, () => {
    console.log(`✅ Backend server running on http://localhost:${PORT}`);
    console.log(`🤖 AI Provider: Groq (llama-3.3-70b-versatile)`);
    console.log(`🔑 API Key configured: ${!!process.env.GROQ_API_KEY}`);
  });
}).catch(err => {
  console.error('❌ Failed to initialize server database:', err);
  process.exit(1);
});
