# QP Generator — AI Exam Builder

An AI-powered question paper generation platform for Indian educators. Upload your syllabus and previous year question papers, and generate structured exam papers using Google Gemini.

---

## Features

- **Template Management** — Create templates by uploading syllabus PDFs. AI extracts course structure, modules, and topics automatically.
- **PYQ Processing** — Upload previous year question papers. AI extracts every question with marks.
- **AI Generation** — Gemini 2.5 Flash generates a fresh question paper based on your syllabus, PYQs, and custom instructions.
- **Custom Instructions** — Control exam type, difficulty, sections, and question distribution before generating.
- **Paper Preview** — View the full generated question paper and download/print as PDF.
- **Generated History** — Each template stores all previously generated papers, viewable anytime.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, Tailwind CSS |
| Backend | FastAPI, Python |
| AI | Google Gemini 2.5 Flash (`google-genai`) |
| Database | MongoDB |
| Auth | JWT (PyJWT) |

---

## Project Structure

```
QP-Generator/
├── backend/
│   ├── ai_pipeline_service/        # Syllabus PDF processor
│   ├── ai_pipeline_service_qp/     # Question paper PDF processor
│   ├── question_paper_generation/  # Gemini generation engine + prompt builder
│   ├── database/                   # MongoDB connection and operations
│   ├── server.py                   # FastAPI app and all API routes
│   ├── test.py                     # Gemini API test script
│   └── .env                        # Backend environment variables
├── frontend/
│   ├── src/
│   │   ├── pages/                  # AuthPage, DashboardPage, TemplatesPage, GeneratePage, PaperPreviewPage
│   │   ├── components/             # Sidebar, SourceCard, QuestionMatrix, SectionBuilder
│   │   ├── context/                # AuthContext (JWT auth state)
│   │   └── utils/                  # api.js (all API calls), storage.js
│   └── .env                        # Frontend environment variables
```

---

## Setup

### Prerequisites

- Python 3.11+
- Node.js 18+
- MongoDB (local or Atlas)
- Google Gemini API key — get one at [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)

---

### Backend

```bash
cd QP-Generator/backend

# Install dependencies (using uv)
uv sync

# Or using pip
pip install -r requirements.txt
```

Create a `.env` file in the `backend/` folder:

```env
MONGO_URI=mongodb://localhost:27017/
SECRET_KEY=your-secret-key-here
GOOGLE_GEMINI_API_KEY=AIzaSyYourRealKeyHere
```

Start the server:

```bash
uv run server.py
# or
uvicorn server:app --reload --port 8000

### Frontend

```bash
cd QP-Generator/frontend

npm install
```

Create a `.env` file in the `frontend/` folder:

```env
VITE_API_URL=http://localhost:8000
```

Start the dev server:

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

---

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/signup` | Register a new user |
| POST | `/api/login` | Login, returns JWT token |
| POST | `/api/templates` | Create a template (multipart/form-data with PDFs) |
| GET | `/api/templates/{user_id}` | Get all templates for a user |
| POST | `/api/process-template/{template_id}` | Extract syllabus from uploaded PDFs |
| GET | `/api/template-results/{template_id}` | Get extracted syllabus data |
| POST | `/api/upload-question-papers` | Upload and auto-process PYQ PDFs |
| GET | `/api/question-paper-results/{template_id}` | Get extracted PYQ questions |
| POST | `/api/generate` | Generate a new question paper using Gemini |
| GET | `/generated/{template_id}` | Get all generated papers for a template |
| GET | `/generated/paper/{generation_id}` | Get one specific generated paper |

---

## How It Works

```
1. Create Template
   └── Upload syllabus PDFs → Gemini extracts modules & topics → saved to MongoDB

2. Upload PYQs
   └── Upload previous year papers → Gemini extracts all questions with marks → saved to MongoDB

3. Generate Paper
   └── Select template → configure exam (type, difficulty, sections, instructions)
       → Prompt is built from syllabus + PYQs + your config
       → Gemini generates a fresh question paper JSON
       → Displayed in the preview page → download/print as PDF
```

---

## Environment Variables

### Backend `.env`

| Variable | Description |
|----------|-------------|
| `MONGO_URI` | MongoDB connection string |
| `SECRET_KEY` | JWT signing secret |
| `GOOGLE_GEMINI_API_KEY` | Gemini API key (must start with `AIza`) |

### Frontend `.env`

| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | Backend base URL (default: `http://localhost:8000`) |

---

## Notes

- The Gemini API key must start with `AIza`. Keys starting with `AQ.` are OAuth tokens and will not work.
- The `google-genai` package is used (not the deprecated `google-generativeai`).
- All PDF processing uses `genai.Client(api_key=...).files.upload()` which requires the Files API to be enabled for your key.
