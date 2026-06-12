import express from 'express';
import { Pool } from 'pg';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'dist')));

function isValidName(name) {
  const parts = name.trim().split(/\s+/)
  return parts.length >= 2 && /^[a-zA-Z'\- ]+$/.test(name.trim())
}

let pool = null;
if (process.env.DATABASE_URL) {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
}

const initDB = async () => {
  if (!pool) return;
  await pool.query(`
    CREATE TABLE IF NOT EXISTS quiz_scores (
      id SERIAL PRIMARY KEY,
      username VARCHAR(50) NOT NULL,
      score INTEGER NOT NULL,
      total INTEGER NOT NULL,
      accuracy DECIMAL(5,2) NOT NULL,
      category VARCHAR(50) DEFAULT 'ALL',
      mode VARCHAR(20) NOT NULL DEFAULT 'quiz',
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);
  await pool.query(`ALTER TABLE quiz_scores ADD COLUMN IF NOT EXISTS device_id VARCHAR(64)`);
  await pool.query(`CREATE UNIQUE INDEX IF NOT EXISTS idx_device_id ON quiz_scores(device_id)`);
  console.log('Database initialized');
};

app.post('/api/scores', async (req, res) => {
  if (!pool) return res.status(503).json({ error: 'Database not configured' });

  try {
    const { username, score, total, accuracy, category, mode, device_id } = req.body;

    if (!username || score == null || total == null || accuracy == null || !device_id) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    if (!isValidName(username)) {
      return res.status(400).json({ error: 'Full name required (letters only)' });
    }

    const result = await pool.query(
      `INSERT INTO quiz_scores (username, score, total, accuracy, category, mode, device_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (device_id) DO UPDATE SET
         username   = EXCLUDED.username,
         score      = EXCLUDED.score,
         total      = EXCLUDED.total,
         accuracy   = EXCLUDED.accuracy,
         category   = EXCLUDED.category,
         created_at = EXCLUDED.created_at
       WHERE EXCLUDED.accuracy >= quiz_scores.accuracy
       RETURNING *`,
      [
        String(username).slice(0, 50),
        parseInt(score),
        parseInt(total),
        parseFloat(accuracy),
        String(category || 'ALL').slice(0, 50),
        String(mode || 'quiz').slice(0, 20),
        String(device_id).slice(0, 64)
      ]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Score save error:', err.message);
    res.status(500).json({ error: 'Failed to save score' });
  }
});

app.get('/api/leaderboard', async (req, res) => {
  if (!pool) return res.json([]);

  try {
    const { mode } = req.query;
    const params = [];
    let whereClause = '';
    if (mode && mode !== 'all') {
      whereClause = 'WHERE mode = $1';
      params.push(mode);
    }
    const result = await pool.query(
      `SELECT * FROM (
         SELECT DISTINCT ON (username) *
         FROM quiz_scores
         ${whereClause}
         ORDER BY username, accuracy DESC, score DESC
       ) best
       ORDER BY accuracy DESC, score DESC
       LIMIT 20`,
      params
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Leaderboard error:', err.message);
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', db: !!pool });
});

app.get('*', (req, res) => {
  const indexPath = path.join(__dirname, 'dist', 'index.html');
  res.sendFile(indexPath, err => {
    if (err) res.status(404).send('Not found — run npm run build first');
  });
});

const PORT = process.env.PORT || 3001;
initDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Regents Ready running on port ${PORT}`);
  });
}).catch(err => {
  console.error('DB init error:', err.message);
  process.exit(1);
});
