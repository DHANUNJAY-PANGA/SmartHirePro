# SmartHirePro

SmartHirePro is a full-stack, AI-powered resume builder and career enhancement platform. It provides modern tools for job seekers to create optimized resumes, analyze ATS scores, receive AI-driven suggestions, and prepare for interviews with automated question generation and technical quizzes.

---

## Features

- **AI Resume Builder**: Create, read, update, and manage resumes using a dynamic React form builder with support for experiences, education, projects, skills, and certifications. Integrates AI suggestions for improved content.
- **File Upload & Parsing**: Upload PDF/DOCX resumes via drag-and-drop. Files are parsed and form fields auto-populated using AI-powered backend (Gemini model, PyPDF2, python-docx).
- **ATS Score Analyzer**: Analyze resume compatibility with Applicant Tracking Systems. Provides section-wise scoring, keyword matching, and actionable recommendations.
- **Resume Analysis**: Get detailed pros, cons, and suggestions for improvement. Includes readability scoring and feedback using AI and textstat.
- **AI Interview Preparation**: Generate HR, behavioral, and technical interview questions tailored to resume content.
- **Technical Quiz Generation**: Create skill-based multiple choice quizzes to help users self-assess and prepare for interviews.
- **Dashboard & Analysis Views**: Interactive dashboard for users to view stats, quiz results, and resume analysis.

---

## Tech Stack

- **Frontend**: React, Tailwind CSS, react-hook-form, react-dropzone
- **Backend**: FastAPI, Python, Pydantic, MongoDB, emergentintegrations (Gemini AI), PyPDF2, python-docx, textstat

---

## Getting Started

### Prerequisites

- Node.js and npm
- Python 3.8+
- MongoDB server

### Frontend Setup

```bash
cd frontend
npm install
npm start
```
Runs the app in development mode at [http://localhost:3000](http://localhost:3000).

Other scripts:
- `npm test`: Run tests
- `npm run build`: Build for production
- `npm run eject`: Eject config (irreversible)

See [Create React App docs](https://facebook.github.io/create-react-app/docs/getting-started).

### Backend Setup

```bash
cd backend
pip install -r requirements.txt
uvicorn server:app --reload
```
API available at `/api/`

---

## API Endpoints (Backend)

- `POST /api/resume`: Create resume
- `GET /api/resume/{id}`: Retrieve resume
- `PUT /api/resume/{id}`: Update resume
- `POST /api/resume/upload`: Upload & parse resume file
- `POST /api/ai-suggestions`: Get AI content suggestions
- `POST /api/resume/{id}/ats-analysis`: ATS score analysis
- `POST /api/resume/{id}/analysis`: Resume analysis (pros/cons/suggestions)
- `POST /api/resume/{id}/interview-questions`: Generate interview questions
- `POST /api/resume/{id}/quiz`: Generate technical quiz

---

## Status

- All major backend and frontend features are implemented and tested.
- Gemini AI integration working for suggestions, analysis, interview prep, and quizzes.
- Dashboard and UX are production-ready.
- Minor intermittent issues may occur due to external API limits (Gemini).

---

## License

*This repository currently does not specify a license. Please add a license for collaboration and usage guidelines.*

---

## Contributing

Pull requests and suggestions are welcome! Please open issues for bugs, feature requests, or improvements.

---

## Author

[DHANUNJAY-PANGA](https://github.com/DHANUNJAY-PANGA)
