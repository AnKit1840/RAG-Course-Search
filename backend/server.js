import express from 'express';
import cors from 'cors';
import multer from 'multer';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';
import axios from 'axios';

// Load config
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Resolve paths
const videosDir = path.resolve(__dirname, process.env.VIDEOS_DIR || '../Videos');
const dbDir = path.resolve(__dirname, process.env.DB_DIR || '../embeddings');

// Ensure directories exist
if (!fs.existsSync(videosDir)) {
  fs.mkdirSync(videosDir, { recursive: true });
}
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// Serve videos statically
app.use('/videos', express.static(videosDir));
console.log(`Serving videos from: ${videosDir}`);

// In-memory embeddings database cache
let embeddingsDb = [];

function loadDatabase() {
  try {
    const files = fs.readdirSync(dbDir).filter(f => f.endsWith('.json'));
    let tempDb = [];

    for (const file of files) {
      const filePath = path.join(dbDir, file);
      const fileContent = fs.readFileSync(filePath, 'utf8');
      const chunks = JSON.parse(fileContent);
      if (Array.isArray(chunks)) {
        tempDb.push(...chunks);
      }
    }

    // Dynamically assign global sequential chunk IDs in RAM
    embeddingsDb = tempDb.map((chunk, index) => ({
      ...chunk,
      chunk_id: index
    }));

    console.log(`Database loaded: ${embeddingsDb.length} text chunks available across ${files.length} video files.`);
  } catch (err) {
    console.error('Error loading modular database directory:', err.message);
    embeddingsDb = [];
  }
}

// Load initially
loadDatabase();

// In-memory job state tracking
const jobs = {};

// Multer disk storage config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, videosDir);
  },
  filename: (req, file, cb) => {
    // Preserve original filename
    cb(null, file.originalname);
  }
});
const upload = multer({ storage });

// Cosine Similarity Functions in pure JS
function dotProduct(vecA, vecB) {
  let product = 0;
  for (let i = 0; i < vecA.length; i++) {
    product += vecA[i] * vecB[i];
  }
  return product;
}

function magnitude(vec) {
  let sum = 0;
  for (let i = 0; i < vec.length; i++) {
    sum += vec[i] * vec[i];
  }
  return Math.sqrt(sum);
}

function getCosineSimilarity(vecA, vecB) {
  const magA = magnitude(vecA);
  const magB = magnitude(vecB);
  if (magA === 0 || magB === 0) return 0;
  return dotProduct(vecA, vecB) / (magA * magB);
}

// --- API Endpoints ---

// 1. Search Query (Student RAG)
app.post('/api/search', async (req, res) => {
  const { query } = req.body;
  if (!query || query.trim() === '') {
    return res.status(400).json({ error: 'Query text is required' });
  }

  try {
    console.log(`Generating embedding for: "${query}"`);
    // Create embedding via Ollama
    const embedResponse = await axios.post(`${process.env.OLLAMA_BASE_URL}/api/embed`, {
      model: 'nomic-embed-text',
      input: query
    });

    if (!embedResponse.data || !embedResponse.data.embeddings) {
      throw new Error('Failed to get embeddings from Ollama');
    }

    const queryVector = embedResponse.data.embeddings[0];
    // embeddings vector stored in this form...can check into link of Ollama.

    // Compute similarities
    if (embeddingsDb.length === 0) {
      return res.json({
        answer: "The video database is currently empty. Please log in as an instructor to upload lectures first!",
        sources: []
      });
    }

    console.log('Calculating similarity matches...');
    const scoredChunks = embeddingsDb.map(chunk => {
      // Safety check in case chunk embedding is malformed
      if (!chunk.embedding || !Array.isArray(chunk.embedding)) {
        return { ...chunk, similarity: 0 };
      }
      const similarity = getCosineSimilarity(chunk.embedding, queryVector);
      return { ...chunk, similarity };
    });

    // Sort and retrieve top 3
    const topResults = scoredChunks
      .filter(chunk => chunk.similarity > 0)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 3);

    if (topResults.length === 0 || topResults[0].similarity < 0.1) {
      return res.json({
        answer: `I couldn't find any relevant video lectures matching your question: "${query}". Please check your phrasing or upload matching lectures.`,
        sources: []
      });
    }

    // Assembly Context Prompt
    const contextPrompt = `I am teaching web development in my course. Here are subtitle chunks from my video lectures in JSON format:
${JSON.stringify(topResults.map(r => ({
      title: r.title,
      number: r.number,
      start: r.start,
      end: r.end,
      text: r.text
    })))} 
---------------------------------
User Question: "${query}"

Instructions: Answer the user's question clearly in a natural human tone. Based on the provided video chunks, explain what was taught and guide the user by referencing which video (title and number) and at what exact timestamp (minutes and seconds) they should check. Do not reference JSON formats in your response. If the question is completely unrelated to the provided video contexts, politely tell them you can only answer course-related questions.`;

    console.log('Querying LLM context...');
    const generateResponse = await axios.post(`${process.env.OLLAMA_BASE_URL}/api/generate`, {
      model: 'llama3.2',
      prompt: contextPrompt,
      stream: false
    });

    res.json({
      answer: generateResponse.data.response,
      sources: topResults
    });

  } catch (error) {
    console.error('Search error:', error.message);
    res.status(500).json({ error: 'Search failed', details: error.message });
  }
});

// 2. Upload video (Admin)
app.post('/api/admin/upload', upload.single('video'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No video file provided' });
  }

  const filename = req.file.originalname;
  const jobId = Date.now().toString();

  jobs[jobId] = {
    id: jobId,
    filename: filename,
    size: `${(req.file.size / (1024 * 1024)).toFixed(1)} MB`,
    status: 'processing',
    progress: 0,
    step: 'Uploaded file. Spawning transcription task...'
  };

  // Spawn ingestion python script at the root directory
  // We run python and point to ingest_single.py at the parent directory
  const rootPath = path.resolve(__dirname, '..');
  const pythonProcess = spawn('python', [
    '-u',
    'ingest_single.py',
    filename
  ], {
    cwd: rootPath
  });

  pythonProcess.stdout.on('data', (data) => {
    const output = data.toString().trim();
    console.log(`[Python Ingest ${jobId}]: ${output}`);

    // Parse progress if printed in format: PROGRESS:percent:stepText
    if (output.startsWith('PROGRESS:')) {
      const parts = output.split(':');
      if (parts.length >= 3) {
        const progressVal = parseInt(parts[1], 10);
        const stepText = parts.slice(2).join(':');
        jobs[jobId].progress = progressVal;
        jobs[jobId].step = stepText;
      }
    }
  });

  pythonProcess.stderr.on('data', (data) => {
    console.error(`[Python Ingest Error ${jobId}]: ${data.toString()}`);
  });

  pythonProcess.on('close', (code) => {
    console.log(`Ingest job ${jobId} finished with exit code ${code}`);
    if (code === 0) {
      jobs[jobId].status = 'completed';
      jobs[jobId].progress = 100;
      jobs[jobId].step = 'Ingestion complete!';
      // Reload vector database cache
      loadDatabase();
    } else {
      jobs[jobId].status = 'failed';
      jobs[jobId].progress = 0;
      jobs[jobId].step = `Ingestion failed (code ${code})`;
    }
  });

  res.json(jobs[jobId]);
});

// 3. Get all upload jobs statuses (Admin polling)
app.get('/api/admin/jobs', (req, res) => {
  res.json(Object.values(jobs));
});

// 4. Get list of processed lectures
app.get('/api/admin/videos', (req, res) => {
  try {
    if (!fs.existsSync(videosDir)) {
      return res.json([]);
    }
    const files = fs.readdirSync(videosDir).filter(f => {
      const ext = path.extname(f).toLowerCase();
      return ['.mp4', '.mkv', '.avi', '.mov'].includes(ext);
    });
    res.json(files);
  } catch (err) {
    res.status(500).json({ error: 'Failed to list videos', details: err.message });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server running locally on port ${PORT}`);
});
