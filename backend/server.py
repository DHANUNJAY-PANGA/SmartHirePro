from fastapi import FastAPI, APIRouter, HTTPException, UploadFile, File
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime
import PyPDF2
import docx
import io
import re
import json
from emergentintegrations.llm.chat import LlmChat, UserMessage
import textstat
import asyncio

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# AI Integration
GEMINI_API_KEY = os.environ.get('GEMINI_API_KEY')

# Models
class PersonalInfo(BaseModel):
    full_name: str = ""
    email: str = ""
    phone: str = ""
    location: str = ""
    linkedin: str = ""
    github: str = ""
    website: str = ""

class Education(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    degree: str = ""
    institution: str = ""
    location: str = ""
    start_date: str = ""
    end_date: str = ""
    gpa: str = ""
    relevant_coursework: str = ""

class Experience(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str = ""
    company: str = ""
    location: str = ""
    start_date: str = ""
    end_date: str = ""
    description: str = ""
    is_current: bool = False

class Project(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str = ""
    description: str = ""
    technologies: str = ""
    github_link: str = ""
    live_link: str = ""

class Skill(BaseModel):
    category: str = ""
    skills: List[str] = []

class Certification(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str = ""
    issuer: str = ""
    date: str = ""
    credential_id: str = ""

class Resume(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    personal_info: PersonalInfo = PersonalInfo()
    education: List[Education] = []
    experience: List[Experience] = []
    projects: List[Project] = []
    skills: List[Skill] = []
    certifications: List[Certification] = []
    summary: str = ""
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class ATSAnalysis(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    resume_id: str
    ats_score: int
    matched_keywords: List[str] = []
    missing_keywords: List[str] = []
    section_scores: Dict[str, int] = {}
    recommendations: List[str] = []
    job_description: str = ""
    created_at: datetime = Field(default_factory=datetime.utcnow)

class ResumeAnalysis(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    resume_id: str
    pros: List[str] = []
    cons: List[str] = []
    suggestions: List[str] = []
    readability_score: float = 0.0
    word_count: int = 0
    created_at: datetime = Field(default_factory=datetime.utcnow)

class InterviewQuestion(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    question: str
    category: str  # "HR", "Behavioral", "Technical"
    difficulty: str  # "Easy", "Medium", "Hard"

class QuizQuestion(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    question: str
    options: List[str]
    correct_answer: int
    explanation: str
    skill_category: str

class JobRoleSuggestion(BaseModel):
    job_role: str

class ResumeCreate(BaseModel):
    personal_info: PersonalInfo
    education: List[Education] = []
    experience: List[Experience] = []
    projects: List[Project] = []
    skills: List[Skill] = []
    certifications: List[Certification] = []
    summary: str = ""

# Helper Functions
def parse_pdf(file_content: bytes) -> str:
    """Extract text from PDF file"""
    try:
        pdf_file = io.BytesIO(file_content)
        pdf_reader = PyPDF2.PdfReader(pdf_file)
        text = ""
        for page in pdf_reader.pages:
            text += page.extract_text() + "\n"
        return text
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error parsing PDF: {str(e)}")

def parse_docx(file_content: bytes) -> str:
    """Extract text from DOCX file"""
    try:
        doc_file = io.BytesIO(file_content)
        doc = docx.Document(doc_file)
        text = ""
        for paragraph in doc.paragraphs:
            text += paragraph.text + "\n"
        return text
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error parsing DOCX: {str(e)}")

async def get_ai_suggestions(prompt: str) -> str:
    """Get AI suggestions using Gemini"""
    try:
        chat = LlmChat(
            api_key=GEMINI_API_KEY,
            session_id=str(uuid.uuid4()),
            system_message="You are an expert career counselor and resume writer. Provide helpful, professional advice."
        ).with_model("gemini", "gemini-2.0-flash")
        
        user_message = UserMessage(text=prompt)
        response = await chat.send_message(user_message)
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI service error: {str(e)}")

def calculate_ats_score(resume_text: str, job_description: str = "") -> Dict[str, Any]:
    """Calculate ATS compatibility score"""
    score = 60  # Base score
    recommendations = []
    matched_keywords = []
    missing_keywords = []
    
    # Check for contact information
    if re.search(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b', resume_text):
        score += 5
    else:
        recommendations.append("Add email address")
    
    if re.search(r'\b\d{3}[-.]?\d{3}[-.]?\d{4}\b', resume_text):
        score += 5
    else:
        recommendations.append("Add phone number")
    
    # Check for sections
    sections = ['experience', 'education', 'skills', 'summary']
    section_scores = {}
    
    for section in sections:
        if section.lower() in resume_text.lower():
            score += 7
            section_scores[section] = 85
        else:
            recommendations.append(f"Add {section} section")
            section_scores[section] = 0
    
    # Job description keyword matching
    if job_description:
        job_keywords = re.findall(r'\b[A-Za-z]+\b', job_description.lower())
        job_keywords = [kw for kw in job_keywords if len(kw) > 3]
        resume_keywords = re.findall(r'\b[A-Za-z]+\b', resume_text.lower())
        
        for keyword in set(job_keywords):
            if keyword in resume_keywords:
                matched_keywords.append(keyword)
                score += 1
            else:
                missing_keywords.append(keyword)
    
    return {
        "ats_score": min(score, 100),
        "matched_keywords": matched_keywords[:10],
        "missing_keywords": missing_keywords[:10],
        "section_scores": section_scores,
        "recommendations": recommendations
    }

# API Routes
@api_router.get("/")
async def root():
    return {"message": "SmartHirePro API is running"}

@api_router.post("/resume", response_model=Resume)
async def create_resume(resume_data: ResumeCreate):
    """Create a new resume"""
    resume = Resume(**resume_data.dict())
    resume.updated_at = datetime.utcnow()
    
    result = await db.resumes.insert_one(resume.dict())
    return resume

@api_router.get("/resume/{resume_id}", response_model=Resume)
async def get_resume(resume_id: str):
    """Get resume by ID"""
    resume = await db.resumes.find_one({"id": resume_id})
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")
    return Resume(**resume)

@api_router.put("/resume/{resume_id}", response_model=Resume)
async def update_resume(resume_id: str, resume_data: ResumeCreate):
    """Update existing resume"""
    resume = await db.resumes.find_one({"id": resume_id})
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")
    
    updated_data = resume_data.dict()
    updated_data["updated_at"] = datetime.utcnow()
    
    await db.resumes.update_one({"id": resume_id}, {"$set": updated_data})
    
    updated_resume = await db.resumes.find_one({"id": resume_id})
    return Resume(**updated_resume)

@api_router.post("/resume/upload")
async def upload_resume(file: UploadFile = File(...)):
    """Upload and parse resume file"""
    if not file.filename.lower().endswith(('.pdf', '.docx')):
        raise HTTPException(status_code=400, detail="Only PDF and DOCX files are supported")
    
    file_content = await file.read()
    
    if file.filename.lower().endswith('.pdf'):
        text = parse_pdf(file_content)
    else:
        text = parse_docx(file_content)
    
    # Use AI to parse the resume text into structured data
    prompt = f"""
    Parse the following resume text and extract structured information. Return a JSON object with the following structure:
    {{
        "personal_info": {{
            "full_name": "",
            "email": "",
            "phone": "",
            "location": "",
            "linkedin": "",
            "github": "",
            "website": ""
        }},
        "summary": "",
        "experience": [
            {{
                "title": "",
                "company": "",
                "location": "",
                "start_date": "",
                "end_date": "",
                "description": "",
                "is_current": false
            }}
        ],
        "education": [
            {{
                "degree": "",
                "institution": "",
                "location": "",
                "start_date": "",
                "end_date": "",
                "gpa": "",
                "relevant_coursework": ""
            }}
        ],
        "skills": [
            {{
                "category": "",
                "skills": []
            }}
        ],
        "projects": [
            {{
                "name": "",
                "description": "",
                "technologies": "",
                "github_link": "",
                "live_link": ""
            }}
        ],
        "certifications": [
            {{
                "name": "",
                "issuer": "",
                "date": "",
                "credential_id": ""
            }}
        ]
    }}
    
    Resume text:
    {text}
    
    Please extract and structure the information accurately. If any information is not available, leave the field empty.
    """
    
    try:
        ai_response = await get_ai_suggestions(prompt)
        # Extract JSON from AI response
        json_match = re.search(r'\{.*\}', ai_response, re.DOTALL)
        if json_match:
            parsed_data = json.loads(json_match.group())
            return {"parsed_data": parsed_data, "raw_text": text}
        else:
            return {"parsed_data": None, "raw_text": text, "error": "Could not parse resume structure"}
    except Exception as e:
        return {"parsed_data": None, "raw_text": text, "error": str(e)}

@api_router.post("/resume/{resume_id}/ats-analysis", response_model=ATSAnalysis)
async def analyze_ats_score(resume_id: str, job_description: str = ""):
    """Analyze resume for ATS compatibility"""
    resume = await db.resumes.find_one({"id": resume_id})
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")
    
    # Convert resume to text for analysis
    resume_text = f"""
    {resume.get('personal_info', {}).get('full_name', '')}
    {resume.get('personal_info', {}).get('email', '')}
    {resume.get('personal_info', {}).get('phone', '')}
    {resume.get('summary', '')}
    """
    
    for exp in resume.get('experience', []):
        resume_text += f"{exp.get('title', '')} {exp.get('company', '')} {exp.get('description', '')} "
    
    for edu in resume.get('education', []):
        resume_text += f"{edu.get('degree', '')} {edu.get('institution', '')} "
    
    for skill_group in resume.get('skills', []):
        resume_text += " ".join(skill_group.get('skills', []))
    
    # Calculate ATS score
    ats_data = calculate_ats_score(resume_text, job_description)
    
    analysis = ATSAnalysis(
        resume_id=resume_id,
        job_description=job_description,
        **ats_data
    )
    
    await db.ats_analyses.insert_one(analysis.dict())
    return analysis

@api_router.post("/resume/{resume_id}/analysis", response_model=ResumeAnalysis)
async def analyze_resume(resume_id: str):
    """Analyze resume for pros, cons, and suggestions"""
    resume = await db.resumes.find_one({"id": resume_id})
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")
    
    # Convert resume to text
    resume_text = json.dumps(resume, default=str)
    
    prompt = f"""
    Analyze the following resume and provide detailed feedback. Return a JSON object with:
    {{
        "pros": ["list of strengths"],
        "cons": ["list of weaknesses"],
        "suggestions": ["specific improvement recommendations"]
    }}
    
    Resume data: {resume_text}
    
    Focus on:
    1. Content quality and relevance
    2. Formatting and structure
    3. Keyword optimization
    4. Quantifiable achievements
    5. Professional language usage
    """
    
    try:
        ai_response = await get_ai_suggestions(prompt)
        json_match = re.search(r'\{.*\}', ai_response, re.DOTALL)
        
        if json_match:
            feedback = json.loads(json_match.group())
            
            # Calculate readability score
            text_for_analysis = " ".join([
                resume.get('summary', ''),
                " ".join([exp.get('description', '') for exp in resume.get('experience', [])]),
                " ".join([proj.get('description', '') for proj in resume.get('projects', [])])
            ])
            
            readability_score = textstat.flesch_reading_ease(text_for_analysis) if text_for_analysis else 0
            word_count = len(text_for_analysis.split()) if text_for_analysis else 0
            
            analysis = ResumeAnalysis(
                resume_id=resume_id,
                pros=feedback.get('pros', []),
                cons=feedback.get('cons', []),
                suggestions=feedback.get('suggestions', []),
                readability_score=readability_score,
                word_count=word_count
            )
            
            await db.resume_analyses.insert_one(analysis.dict())
            return analysis
        else:
            raise HTTPException(status_code=500, detail="Could not parse AI analysis")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

@api_router.post("/resume/{resume_id}/interview-questions")
async def generate_interview_questions(resume_id: str):
    """Generate interview questions based on resume"""
    resume = await db.resumes.find_one({"id": resume_id})
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")
    
    resume_text = json.dumps(resume, default=str)
    
    prompt = f"""
    Based on the following resume, generate interview questions in three categories.
    Return a JSON object with:
    {{
        "hr_questions": [
            {{"question": "question text", "category": "HR", "difficulty": "Easy|Medium|Hard"}}
        ],
        "behavioral_questions": [
            {{"question": "question text", "category": "Behavioral", "difficulty": "Easy|Medium|Hard"}}
        ],
        "technical_questions": [
            {{"question": "question text", "category": "Technical", "difficulty": "Easy|Medium|Hard"}}
        ]
    }}
    
    Generate 5 questions for each category. Make them relevant to the candidate's experience and skills.
    
    Resume: {resume_text}
    """
    
    try:
        ai_response = await get_ai_suggestions(prompt)
        json_match = re.search(r'\{.*\}', ai_response, re.DOTALL)
        
        if json_match:
            questions = json.loads(json_match.group())
            return questions
        else:
            raise HTTPException(status_code=500, detail="Could not generate questions")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Question generation failed: {str(e)}")

@api_router.post("/resume/{resume_id}/quiz")
async def generate_technical_quiz(resume_id: str):
    """Generate technical quiz based on resume skills"""
    resume = await db.resumes.find_one({"id": resume_id})
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")
    
    skills = []
    for skill_group in resume.get('skills', []):
        skills.extend(skill_group.get('skills', []))
    
    if not skills:
        raise HTTPException(status_code=400, detail="No skills found in resume")
    
    prompt = f"""
    Create a technical quiz with 15 multiple choice questions based on these skills: {', '.join(skills[:10])}
    
    Return a JSON object with:
    {{
        "questions": [
            {{
                "question": "question text",
                "options": ["option1", "option2", "option3", "option4"],
                "correct_answer": 0,
                "explanation": "explanation text",
                "skill_category": "relevant skill"
            }}
        ]
    }}
    
    Make questions practical and relevant to the skills. Include a mix of difficulty levels.
    """
    
    try:
        ai_response = await get_ai_suggestions(prompt)
        json_match = re.search(r'\{.*\}', ai_response, re.DOTALL)
        
        if json_match:
            quiz = json.loads(json_match.group())
            return quiz
        else:
            raise HTTPException(status_code=500, detail="Could not generate quiz")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Quiz generation failed: {str(e)}")

@api_router.post("/ai-suggestions")
async def get_job_suggestions(job_role_input: JobRoleSuggestion):
    """Get AI-powered suggestions for resume content based on job role"""
    prompt = f"""
    Provide comprehensive resume content suggestions for a {job_role_input.job_role} position.
    Return a JSON object with:
    {{
        "summary_suggestions": ["suggestion1", "suggestion2", "suggestion3"],
        "skills_suggestions": {{
            "technical": ["skill1", "skill2"],
            "soft": ["skill1", "skill2"],
            "tools": ["tool1", "tool2"]
        }},
        "experience_keywords": ["keyword1", "keyword2"],
        "project_ideas": ["project1", "project2"],
        "certification_recommendations": ["cert1", "cert2"]
    }}
    
    Make suggestions specific and relevant to the {job_role_input.job_role} role.
    """
    
    try:
        ai_response = await get_ai_suggestions(prompt)
        json_match = re.search(r'\{.*\}', ai_response, re.DOTALL)
        
        if json_match:
            suggestions = json.loads(json_match.group())
            return suggestions
        else:
            raise HTTPException(status_code=500, detail="Could not generate suggestions")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Suggestion generation failed: {str(e)}")

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()