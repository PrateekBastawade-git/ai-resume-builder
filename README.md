# ResumeCraft AI — Multi-Agent AI Resume Builder

A premium, production-ready AI Resume Builder powered by **Groq AI** (llama-3.3-70b-versatile) and **Supabase**. Build, optimize, and export professional ATS-ready resumes with real-time AI assistance.

---

## ✨ Features

- **AI Profile Summary Writer** — Generate tailored professional summaries based on your target role
- **AI Bullet Point Optimizer** — Transform raw work experience into metrics-driven achievements
- **AI Skill Predictor** — Predict role-specific skills to fill resume gaps
- **ATS Score Analyzer** — Compare resume against job descriptions with actionable feedback
- **AI Cover Letter Generator** — Context-aware, ATS-optimized cover letters
- **Interview Question Generator** — Role-specific questions with sample answers
- **AI Chat Assistant** — Real-time resume editing with conversation memory
- **Project Summary** — Dedicated section for showcasing key projects in AI context
- **CGPA / Percentage Display** — Per-education score rendering on PDF templates
- **Dark Mode** — Full dark/light theme support
- **PDF/DOCX Export** — Download resume in multiple formats

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite, Tailwind CSS |
| Backend | Node.js + Express |
| AI Provider | Groq API (llama-3.3-70b-versatile) |
| Database | Supabase (PostgreSQL + Auth) |
| State | React Context API |
| Animations | Framer Motion |

---

## 🚀 Getting Started

### 1. Clone & Install

```bash
git clone https://github.com/your-username/ai-resume-builder.git
cd ai-resume-builder
npm install
```

### 2. Configure Environment Variables

Copy the environment template and fill in your API keys:

```bash
cp .env.example .env
```

Edit `.env` with your actual values:

```env
GROQ_API_KEY=your_groq_api_key_here
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
PORT=3001
```

- **Groq API Key**: Get yours free at [console.groq.com/keys](https://console.groq.com/keys)
- **Supabase**: Create a project at [supabase.com](https://supabase.com/dashboard)

> ⚠️ Never commit your `.env` file. It is listed in `.gitignore`.

### 3. Start the Application

You need **two terminal windows** — one for the backend AI server, one for the frontend:

**Terminal 1 — Backend (AI API proxy)**:
```bash
node server.js
# ✅ Backend server running on http://localhost:3001
```

**Terminal 2 — Frontend (Vite dev server)**:
```bash
npm run dev
# ✅ Frontend running on http://localhost:5173
```

---

## 📁 Project Structure

```
├── server.js              # Express backend — Groq AI proxy
├── src/
│   ├── ai/
│   │   ├── agent/         # AI agents (ATS, Resume, Interview, etc.)
│   │   ├── prompts/       # Prompt engineering templates
│   │   └── services/      # AI service layer (Groq adapter, retry, cache)
│   ├── context/           # React Context (ResumeContext, ThemeContext)
│   ├── features/          # Page components (dashboard, editor, templates)
│   ├── components/        # Shared UI components
│   ├── hooks/             # Custom hooks (useResumeAI)
│   └── utils/             # ATS calculator, keyword extractor
├── .env.example           # Environment variable template
└── .gitignore             # Git exclusion rules
```

---

## ☁️ Deployment Notes

- Keep `GROQ_API_KEY` on the backend **only** — it is never sent to the frontend
- The frontend communicates with the backend via `/api/ai` proxy endpoint
- Supabase handles authentication and cloud resume storage

---

## 📄 License

MIT License © 2024
