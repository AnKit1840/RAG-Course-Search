# 🎬 Video-RAG: Full-Stack Semantic Search & Video Q&A Assistant

An end-to-end **Retrieval-Augmented Generation (RAG)** system designed for video course playlists. The application transcribes spoken Hindi video lectures, translates them into English, extracts semantic vector embeddings, and enables students to ask questions and receive instant answers with exact timestamps and video references.

Featuring a full-stack architecture with a **React (Vite) frontend**, a **Node.js/Express backend**, **PostgreSQL** authentication & session management, and a **Python/Ollama/Whisper** AI ingestion pipeline.

---

## 🚀 Key Features

- **Automated Video Ingestion**: Instructors upload lectures through the Admin Portal. The backend runs an asynchronous ingestion pipeline with live progress reporting.
- **Speech Recognition & Translation**: Uses OpenAI **Whisper** to transcribe Hindi audio lectures and translate them into timestamped English segments.
- **Context-Aware Semantic Chunking**: Merges contiguous segments into minimum 15-second contextual chunks, preserving tutorial number, video title, and start/end timestamps.
- **Local Vector Embeddings**: Generates 768-dimensional embeddings using local **Nomic Embeddings (`nomic-embed-text` via Ollama)** — zero cloud API costs.
- **Instant Semantic Search & Cosine Matching**: Matches student questions against lecture content using vector similarity.
- **Contextual Answer Synthesis**: Synthesizes clear, conversational answers with hyperlinked timestamps using local LLMs (**Llama 3.2** via Ollama).
- **Interactive Video Player**: Jump directly to relevant lecture moments at the exact second.
- **Role-Based Authentication**: Secure session-based authentication backed by **PostgreSQL** (`admin` vs `user` roles, bcrypt password hashing).

---

## 📐 System Architecture

```mermaid
flowchart TD
    %% Clients
    subgraph Client["Frontend (React + Vite :5173)"]
        UI_User["Student Search Portal"]
        UI_Admin["Instructor Admin Portal"]
        UI_Auth["Auth Modal (Login/Register)"]
    end

    %% Backend
    subgraph Server["Backend (Node.js & Express :5000)"]
        API_Auth["/api/auth/*"]
        API_Search["/api/search (RAG)"]
        API_Admin["/api/admin/upload & /jobs"]
        API_Video["/videos (Static Stream)"]
        CosSim["In-Memory Cosine Similarity"]
    end

    %% Database
    subgraph DB["PostgreSQL Database (:5432)"]
        T_Users["users (Roles & Password Hashes)"]
        T_Sessions["session (connect-pg-simple)"]
    end

    %% AI & Ingestion Pipeline
    subgraph AI["AI Ingestion & Inference"]
        PyIngest["ingest_single.py (Child Process)"]
        FFmpeg["FFmpeg Audio Extractor"]
        Whisper["OpenAI Whisper (Speech-to-Text & Translation)"]
        Ollama["Ollama API (:11434)"]
        Model_Embed["nomic-embed-text"]
        Model_LLM["llama3.2"]
        Filesystem[("embeddings/*.json")]
    end

    %% Interactions
    UI_Auth <-->|Session Cookies| API_Auth
    API_Auth <--> DB
    UI_User -->|Query| API_Search
    API_Search -->|Query Vector| Ollama
    API_Search --> CosSim
    CosSim <--> Filesystem
    API_Search -->|Top-K Context| Model_LLM
    Model_LLM -->|Answer + Timestamps| API_Search

    UI_Admin -->|Video File| API_Admin
    API_Admin -->|"spawn()"| PyIngest
    PyIngest --> FFmpeg --> Whisper --> Ollama --> Model_Embed --> Filesystem
    PyIngest -.->|stdout PROGRESS logs| API_Admin
    API_Admin -.->|Poll Progress| UI_Admin
    UI_User -->|Play Video| API_Video
```

---

## 🛠️ Tech Stack

| Domain | Technologies |
| :--- | :--- |
| **Frontend** | React 19, Vite, Modern CSS, Responsive Design |
| **Backend** | Node.js, Express, Multer (file upload), Axios, `child_process` |
| **Database & Auth** | PostgreSQL, `pg`, `connect-pg-simple`, `express-session`, `bcrypt` |
| **AI / Machine Learning** | OpenAI Whisper (`small`), Ollama (`nomic-embed-text`, `llama3.2`) |
| **Media & Audio** | FFmpeg, Python 3.8+ |

---

## 📁 Project Structure

```text
Rag Project/
├── backend/
│   ├── migrations/
│   │   └── 001_auth_tables.sql  # PostgreSQL schema (users, sessions, seed admin)
│   ├── auth.js                  # Authentication routes & session middleware
│   ├── db.js                    # PostgreSQL connection pool & query helpers
│   ├── server.js                # Express API server & static video streaming
│   ├── .env.example             # Backend environment template
│   └── package.json             # Backend dependencies
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── AdminPortal.jsx  # Video upload & live ingestion tracker
│   │   │   ├── UserPortal.jsx   # Student RAG search & video playback
│   │   │   └── LoginPortal.jsx  # Login/Register modal
│   │   ├── services/
│   │   │   └── api.js           # Centralized API fetch client with credentials
│   │   ├── App.jsx              # Main shell with navigation & role routing
│   │   └── main.jsx
│   └── package.json             # Frontend dependencies
├── Videos/                      # Stored video files (gitignored)
├── audios/                      # Extracted audio tracks (.mp3) (gitignored)
├── jsons/                       # Raw Whisper transcription outputs (gitignored)
├── embeddings/                  # Processed chunk vectors (.json) (gitignored)
├── ingest_single.py             # Single-video ingestion pipeline script
├── requirements.txt             # Python dependencies
├── .gitignore
└── README.md
```

---

## 🏃‍♂️ Getting Started

### 1. Prerequisites

Make sure the following are installed and added to your system `PATH`:
- **Node.js** (v18+)
- **Python** (v3.8+)
- **PostgreSQL** (v14+)
- **FFmpeg** (accessible in command line as `ffmpeg`)
- **Ollama** ([Download Ollama](https://ollama.com/))

Pull the required local AI models:
```bash
ollama pull nomic-embed-text
ollama pull llama3.2
```

---

### 2. Database Setup

1. Create a PostgreSQL database (e.g., `rag_db`):
   ```sql
   CREATE DATABASE rag_db;
   ```
2. Run the migration script located at `backend/migrations/001_auth_tables.sql` against `rag_db`:
   ```bash
   psql -U postgres -d rag_db -f backend/migrations/001_auth_tables.sql
   ```
   *(This creates the `users` and `session` tables and seeds a default admin account).*

---

### 3. Python Environment Setup

Install Python dependencies for audio processing and Whisper transcription:
```bash
pip install -r requirements.txt
```

---

### 4. Backend Setup

1. Navigate to the `backend` folder:
   ```bash
   cd backend
   npm install
   ```
2. Create your `.env` file from the provided example:
   ```bash
   cp .env.example .env
   ```
3. Update `.env` with your PostgreSQL credentials:
   ```env
   PORT=5000
   OLLAMA_BASE_URL=http://localhost:11434
   VIDEOS_DIR=../Videos
   DB_DIR=../embeddings
   SESSION_SECRET=your_super_secret_session_key
   DATABASE_URL=postgres://postgres:postgres@localhost:5432/rag_db
   ```
4. Start the backend development server:
   ```bash
   npm run dev
   ```
   The server will start on `http://localhost:5000` and confirm the PostgreSQL connection.

---

### 5. Frontend Setup

1. Open a new terminal and navigate to `frontend`:
   ```bash
   cd frontend
   npm install
   ```
2. Start the Vite development server:
   ```bash
   npm run dev
   ```
3. Open `http://localhost:5173` in your browser.

---
## 📡 API Overview

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Register new user account | Public |
| `POST` | `/api/auth/login` | Log in and receive session cookie | Public |
| `POST` | `/api/auth/logout` | Terminate session | Authenticated |
| `GET` | `/api/auth/me` | Fetch active user session profile | Public |
| `POST` | `/api/search` | Query RAG engine for answer & sources | Public |
| `POST` | `/api/admin/upload` | Upload video lecture & start ingestion | Admin Only |
| `GET` | `/api/admin/jobs` | Get real-time ingestion job statuses | Admin Only |
| `GET` | `/api/admin/videos` | List all processed videos | Admin Only |
| `GET` | `/videos/:filename` | Stream video file directly | Public |
| `GET` | `/api/health/db` | PostgreSQL connectivity healthcheck | Public |

---

