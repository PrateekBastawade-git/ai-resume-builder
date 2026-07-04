import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import Groq from 'groq-sdk';

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

app.listen(PORT, () => {
  console.log(`✅ Backend server running on http://localhost:${PORT}`);
  console.log(`🤖 AI Provider: Groq (llama-3.3-70b-versatile)`);
  console.log(`🔑 API Key configured: ${!!process.env.GROQ_API_KEY}`);
});
