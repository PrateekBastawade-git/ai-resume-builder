import fs from 'fs/promises';
import path from 'path';
import pg from 'pg';

const isProduction = process.env.NODE_ENV === 'production';
const databaseUrl = process.env.DATABASE_URL;

let pgPool = null;
const JSON_DB_PATH = path.resolve('db.json');

// Initialize database
export const initDb = async () => {
  if (databaseUrl) {
    console.log('🔌 Connecting to PostgreSQL Database...');
    pgPool = new pg.Pool({
      connectionString: databaseUrl,
      ssl: isProduction ? { rejectUnauthorized: false } : false
    });

    // Create Postgres Tables if not exists
    const client = await pgPool.connect();
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS users (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          email VARCHAR(255) UNIQUE NOT NULL,
          password VARCHAR(255) NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS resumes (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID REFERENCES users(id) ON DELETE CASCADE,
          title VARCHAR(255) NOT NULL,
          template VARCHAR(50) NOT NULL,
          personal_info JSONB,
          summary TEXT,
          experience JSONB,
          education JSONB,
          skills JSONB,
          certifications JSONB,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `);
      console.log('✅ PostgreSQL database tables verified/created successfully.');
    } catch (err) {
      console.error('❌ Error initializing PostgreSQL tables:', err);
      throw err;
    } finally {
      client.release();
    }
  } else {
    console.log(`📂 Using Local JSON Database fallback at: ${JSON_DB_PATH}`);
    try {
      await fs.access(JSON_DB_PATH);
    } catch {
      // Create empty db structures
      const initialDb = { users: [], resumes: [] };
      await fs.writeFile(JSON_DB_PATH, JSON.stringify(initialDb, null, 2), 'utf-8');
      console.log('✅ Initialized empty db.json file.');
    }
  }
};

// Utility to read JSON database
const readJsonDb = async () => {
  const data = await fs.readFile(JSON_DB_PATH, 'utf-8');
  return JSON.parse(data);
};

// Utility to write JSON database
const writeJsonDb = async (data) => {
  await fs.writeFile(JSON_DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
};

// User Operations
export const createUser = async (email, passwordHash) => {
  if (databaseUrl) {
    const result = await pgPool.query(
      'INSERT INTO users (email, password) VALUES ($1, $2) RETURNING id, email, created_at',
      [email.toLowerCase(), passwordHash]
    );
    return result.rows[0];
  } else {
    const db = await readJsonDb();
    const existing = db.users.find(u => u.email === email.toLowerCase());
    if (existing) {
      throw new Error('User already exists');
    }
    const newUser = {
      id: crypto.randomUUID(),
      email: email.toLowerCase(),
      password: passwordHash,
      created_at: new Date().toISOString()
    };
    db.users.push(newUser);
    await writeJsonDb(db);
    // Don't return password in response
    const { password, ...userWithoutPassword } = newUser;
    return userWithoutPassword;
  }
};

export const findUserByEmail = async (email) => {
  if (databaseUrl) {
    const result = await pgPool.query(
      'SELECT id, email, password, created_at FROM users WHERE email = $1',
      [email.toLowerCase()]
    );
    return result.rows[0] || null;
  } else {
    const db = await readJsonDb();
    return db.users.find(u => u.email === email.toLowerCase()) || null;
  }
};

export const findUserById = async (id) => {
  if (databaseUrl) {
    const result = await pgPool.query(
      'SELECT id, email, created_at FROM users WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  } else {
    const db = await readJsonDb();
    const user = db.users.find(u => u.id === id);
    if (!user) return null;
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
};

// Resume Operations
export const createResume = async (userId, resumeData) => {
  if (databaseUrl) {
    const result = await pgPool.query(
      `INSERT INTO resumes (
        user_id, title, template, personal_info, summary, experience, education, skills, certifications
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [
        userId,
        resumeData.title || 'Untitled Resume',
        resumeData.template || 'professional',
        JSON.stringify(resumeData.personalInfo || {}),
        resumeData.summary || '',
        JSON.stringify(resumeData.experience || []),
        JSON.stringify(resumeData.education || []),
        JSON.stringify(resumeData.skills || []),
        JSON.stringify(resumeData.certifications || [])
      ]
    );
    // Format return to match front-end camelCase structure
    const row = result.rows[0];
    return {
      id: row.id,
      user_id: row.user_id,
      title: row.title,
      template: row.template,
      personalInfo: row.personal_info,
      summary: row.summary,
      experience: row.experience,
      education: row.education,
      skills: row.skills,
      certifications: row.certifications,
      created_at: row.created_at,
      updated_at: row.updated_at
    };
  } else {
    const db = await readJsonDb();
    const newResume = {
      id: resumeData.id || crypto.randomUUID(),
      user_id: userId,
      title: resumeData.title || 'Untitled Resume',
      template: resumeData.template || 'professional',
      personalInfo: resumeData.personalInfo || {},
      summary: resumeData.summary || '',
      experience: resumeData.experience || [],
      education: resumeData.education || [],
      skills: resumeData.skills || [],
      certifications: resumeData.certifications || [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    db.resumes.push(newResume);
    await writeJsonDb(db);
    return newResume;
  }
};

export const getResumesByUserId = async (userId) => {
  if (databaseUrl) {
    const result = await pgPool.query(
      'SELECT * FROM resumes WHERE user_id = $1 ORDER BY updated_at DESC',
      [userId]
    );
    return result.rows.map(row => ({
      id: row.id,
      user_id: row.user_id,
      title: row.title,
      template: row.template,
      personalInfo: row.personal_info,
      summary: row.summary,
      experience: row.experience,
      education: row.education,
      skills: row.skills,
      certifications: row.certifications,
      created_at: row.created_at,
      updated_at: row.updated_at
    }));
  } else {
    const db = await readJsonDb();
    return db.resumes
      .filter(r => r.user_id === userId)
      .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
  }
};

export const updateResume = async (id, userId, resumeData) => {
  if (databaseUrl) {
    const result = await pgPool.query(
      `UPDATE resumes SET
        title = $1,
        template = $2,
        personal_info = $3,
        summary = $4,
        experience = $5,
        education = $6,
        skills = $7,
        certifications = $8,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $9 AND user_id = $10 RETURNING *`,
      [
        resumeData.title,
        resumeData.template,
        JSON.stringify(resumeData.personalInfo || {}),
        resumeData.summary,
        JSON.stringify(resumeData.experience || []),
        JSON.stringify(resumeData.education || []),
        JSON.stringify(resumeData.skills || []),
        JSON.stringify(resumeData.certifications || []),
        id,
        userId
      ]
    );
    if (result.rows.length === 0) return null;
    const row = result.rows[0];
    return {
      id: row.id,
      user_id: row.user_id,
      title: row.title,
      template: row.template,
      personalInfo: row.personal_info,
      summary: row.summary,
      experience: row.experience,
      education: row.education,
      skills: row.skills,
      certifications: row.certifications,
      created_at: row.created_at,
      updated_at: row.updated_at
    };
  } else {
    const db = await readJsonDb();
    const index = db.resumes.findIndex(r => r.id === id && r.user_id === userId);
    if (index === -1) return null;
    
    const updatedResume = {
      ...db.resumes[index],
      title: resumeData.title,
      template: resumeData.template,
      personalInfo: resumeData.personalInfo || {},
      summary: resumeData.summary,
      experience: resumeData.experience || [],
      education: resumeData.education || [],
      skills: resumeData.skills || [],
      certifications: resumeData.certifications || [],
      updated_at: new Date().toISOString()
    };
    db.resumes[index] = updatedResume;
    await writeJsonDb(db);
    return updatedResume;
  }
};

export const deleteResume = async (id, userId) => {
  if (databaseUrl) {
    const result = await pgPool.query(
      'DELETE FROM resumes WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, userId]
    );
    return result.rows.length > 0;
  } else {
    const db = await readJsonDb();
    const initialLen = db.resumes.length;
    db.resumes = db.resumes.filter(r => !(r.id === id && r.user_id === userId));
    await writeJsonDb(db);
    return db.resumes.length < initialLen;
  }
};
