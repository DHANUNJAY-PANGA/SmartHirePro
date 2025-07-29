import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useDropzone } from 'react-dropzone';
import { useForm, useFieldArray } from 'react-hook-form';
import { 
  DocumentArrowUpIcon, 
  SparklesIcon, 
  ChartBarIcon,
  LightBulbIcon,
  ChatBubbleLeftRightIcon,
  AcademicCapIcon,
  PlusIcon,
  TrashIcon,
  EyeIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadialBarChart, RadialBar } from 'recharts';
import './App.css';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const SmartHirePro = () => {
  const [currentView, setCurrentView] = useState('home');
  const [resume, setResume] = useState(null);
  const [atsAnalysis, setAtsAnalysis] = useState(null);
  const [resumeAnalysis, setResumeAnalysis] = useState(null);
  const [interviewQuestions, setInterviewQuestions] = useState(null);
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [jobDescription, setJobDescription] = useState('');
  const [activeTab, setActiveTab] = useState('ats');
  const [quizAnswers, setQuizAnswers] = useState({});
  const [showQuizResults, setShowQuizResults] = useState(false);
  const [showInterviewAnswers, setShowInterviewAnswers] = useState({});

  const { register, control, handleSubmit, setValue, watch, reset } = useForm({
    defaultValues: {
      personal_info: {
        full_name: '',
        email: '',
        phone: '',
        location: '',
        linkedin: '',
        github: '',
        website: ''
      },
      summary: '',
      experience: [],
      education: [],
      projects: [],
      skills: [],
      certifications: []
    }
  });

  const { fields: experienceFields, append: appendExperience, remove: removeExperience } = useFieldArray({
    control,
    name: 'experience'
  });

  const { fields: educationFields, append: appendEducation, remove: removeEducation } = useFieldArray({
    control,
    name: 'education'
  });

  const { fields: projectFields, append: appendProject, remove: removeProject } = useFieldArray({
    control,
    name: 'projects'
  });

  const { fields: skillFields, append: appendSkill, remove: removeSkill } = useFieldArray({
    control,
    name: 'skills'
  });

  const { fields: certificationFields, append: appendCertification, remove: removeCertification } = useFieldArray({
    control,
    name: 'certifications'
  });

  // File upload handler
  const onDrop = async (acceptedFiles) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setLoading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post(`${API}/resume/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.data.parsed_data) {
        const parsedData = response.data.parsed_data;
        
        // Populate form with parsed data
        Object.keys(parsedData).forEach(key => {
          if (parsedData[key]) {
            setValue(key, parsedData[key]);
          }
        });
        
        setUploadedFile(file.name);
        setCurrentView('builder');
        alert(`Successfully uploaded and parsed: ${file.name}`);
      } else {
        alert('File uploaded but could not be parsed automatically. You can still fill the form manually.');
        setCurrentView('builder');
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload file. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    },
    multiple: false
  });

  // Handle quiz answer selection
  const handleQuizAnswer = (questionIndex, answerIndex) => {
    setQuizAnswers(prev => ({
      ...prev,
      [questionIndex]: answerIndex
    }));
  };

  // Calculate quiz score
  const calculateQuizScore = () => {
    if (!quiz?.questions) return 0;
    let correct = 0;
    quiz.questions.forEach((q, index) => {
      if (quizAnswers[index] === q.correct_answer) {
        correct++;
      }
    });
    return Math.round((correct / quiz.questions.length) * 100);
  };

  // Toggle interview answer visibility
  const toggleInterviewAnswer = (category, index) => {
    const key = `${category}_${index}`;
    setShowInterviewAnswers(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // AI Suggestions
  const getAISuggestions = async (jobRole) => {
    if (!jobRole) return;
    
    setLoading(true);
    try {
      const response = await axios.post(`${API}/ai-suggestions`, { job_role: jobRole });
      const suggestions = response.data;
      
      // Apply suggestions to form
      if (suggestions.summary_suggestions && suggestions.summary_suggestions.length > 0) {
        setValue('summary', suggestions.summary_suggestions[0]);
      }
      
      if (suggestions.skills_suggestions) {
        const skillsData = [];
        Object.keys(suggestions.skills_suggestions).forEach(category => {
          skillsData.push({
            category: category,
            skills: suggestions.skills_suggestions[category]
          });
        });
        setValue('skills', skillsData);
      }
      
      alert('AI suggestions applied! Review and customize as needed.');
    } catch (error) {
      console.error('AI suggestions error:', error);
      alert('Failed to get AI suggestions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Submit resume
  const onSubmit = async (data) => {
    setLoading(true);
    try {
      let response;
      if (resume) {
        response = await axios.put(`${API}/resume/${resume.id}`, data);
      } else {
        response = await axios.post(`${API}/resume`, data);
      }
      
      setResume(response.data);
      setCurrentView('dashboard');
      alert('Resume saved successfully!');
    } catch (error) {
      console.error('Save error:', error);
      alert('Failed to save resume. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ATS Analysis
  const runATSAnalysis = async () => {
    if (!resume) return;
    
    setLoading(true);
    try {
      const response = await axios.post(`${API}/resume/${resume.id}/ats-analysis?job_description=${encodeURIComponent(jobDescription)}`);
      setAtsAnalysis(response.data);
    } catch (error) {
      console.error('ATS analysis error:', error);
      alert('Failed to run ATS analysis. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Resume Analysis
  const runResumeAnalysis = async () => {
    if (!resume) return;
    
    setLoading(true);
    try {
      const response = await axios.post(`${API}/resume/${resume.id}/analysis`);
      setResumeAnalysis(response.data);
    } catch (error) {
      console.error('Resume analysis error:', error);
      alert('Failed to analyze resume. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Interview Questions
  const generateInterviewQuestions = async () => {
    if (!resume) return;
    
    setLoading(true);
    try {
      const response = await axios.post(`${API}/resume/${resume.id}/interview-questions`);
      setInterviewQuestions(response.data);
    } catch (error) {
      console.error('Interview questions error:', error);
      alert('Failed to generate interview questions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Technical Quiz
  const generateQuiz = async () => {
    if (!resume) return;
    
    setLoading(true);
    try {
      const response = await axios.post(`${API}/resume/${resume.id}/quiz`);
      setQuiz(response.data);
    } catch (error) {
      console.error('Quiz generation error:', error);
      alert('Failed to generate quiz. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Home View
  const HomeView = () => (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                Smart<span className="text-indigo-600">Hire</span>Pro
              </h1>
              <p className="mt-6 text-xl text-gray-600 leading-relaxed">
                AI-powered resume builder and career enhancement platform. Create, analyze, and optimize your resume for maximum ATS compatibility and interview success.
              </p>
              <div className="mt-10 flex flex-col sm:flex-row gap-4">
                <button
                  onClick={() => setCurrentView('builder')}
                  className="px-8 py-4 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition duration-300 shadow-lg hover:shadow-xl"
                >
                  <SparklesIcon className="h-5 w-5 inline mr-2" />
                  Build Resume with AI
                </button>
                <div
                  {...getRootProps()}
                  className="px-8 py-4 border-2 border-indigo-200 text-indigo-600 font-semibold rounded-xl hover:bg-indigo-50 transition duration-300 cursor-pointer text-center"
                >
                  <input {...getInputProps()} />
                  <DocumentArrowUpIcon className="h-5 w-5 inline mr-2" />
                  Upload Existing Resume
                </div>
              </div>
            </div>
            <div className="relative">
              <img 
                src="https://images.unsplash.com/photo-1752118464988-2914fb27d0f0?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1ODB8MHwxfHNlYXJjaHw0fHxBSSUyMGNhcmVlciUyMHByb2Zlc3Npb25hbHxlbnwwfHx8fDE3NTM3OTQxMTd8MA&ixlib=rb-4.1.0&q=85"
                alt="Professional Success"
                className="rounded-2xl shadow-2xl"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Complete Career Enhancement Suite
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              From AI-powered resume building to interview preparation - everything you need to land your dream job.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="p-8 bg-gradient-to-br from-indigo-50 to-blue-50 rounded-2xl shadow-lg hover:shadow-xl transition duration-300">
              <SparklesIcon className="h-12 w-12 text-indigo-600 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-3">AI Resume Builder</h3>
              <p className="text-gray-600">
                Smart suggestions based on your target job role. Auto-fill sections with AI-generated content tailored to your industry.
              </p>
            </div>

            <div className="p-8 bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl shadow-lg hover:shadow-xl transition duration-300">
              <ChartBarIcon className="h-12 w-12 text-green-600 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-3">ATS Score Analyzer</h3>
              <p className="text-gray-600">
                Get detailed ATS compatibility scores with keyword matching and optimization recommendations.
              </p>
            </div>

            <div className="p-8 bg-gradient-to-br from-orange-50 to-red-50 rounded-2xl shadow-lg hover:shadow-xl transition duration-300">
              <LightBulbIcon className="h-12 w-12 text-orange-600 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Smart Analysis</h3>
              <p className="text-gray-600">
                Comprehensive pros, cons, and improvement suggestions powered by advanced AI analysis.
              </p>
            </div>

            <div className="p-8 bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl shadow-lg hover:shadow-xl transition duration-300">
              <ChatBubbleLeftRightIcon className="h-12 w-12 text-purple-600 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Interview Prep</h3>
              <p className="text-gray-600">
                AI-generated mock interview questions based on your resume content and target role.
              </p>
            </div>

            <div className="p-8 bg-gradient-to-br from-cyan-50 to-blue-50 rounded-2xl shadow-lg hover:shadow-xl transition duration-300">
              <AcademicCapIcon className="h-12 w-12 text-cyan-600 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Technical Testing</h3>
              <p className="text-gray-600">
                Dynamic skill-based quizzes to test and improve your technical knowledge.
              </p>
            </div>

            <div className="p-8 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-2xl shadow-lg hover:shadow-xl transition duration-300">
              <DocumentArrowUpIcon className="h-12 w-12 text-yellow-600 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Resume Upload</h3>
              <p className="text-gray-600">
                Upload existing PDF or DOCX resumes for instant parsing and optimization suggestions.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Technology Section */}
      <div className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <img 
              src="https://images.unsplash.com/photo-1706759755782-62bc9a0b32e1?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2Njd8MHwxfHNlYXJjaHwxfHxyZXN1bWUlMjB0ZWNobm9sb2d5fGVufDB8fHx8MTc1Mzc5NDEyNnww&ixlib=rb-4.1.0&q=85"
              alt="Resume Technology"
              className="mx-auto rounded-2xl shadow-2xl max-w-2xl w-full"
            />
            <h2 className="text-4xl font-bold text-gray-900 mt-12 mb-4">
              Powered by Advanced AI Technology
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Leveraging cutting-edge AI models to provide intelligent career guidance and resume optimization.
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  // Builder View
  const BuilderView = () => (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">AI Resume Builder</h1>
            <div className="flex gap-4">
              <button
                onClick={() => setCurrentView('home')}
                className="px-4 py-2 text-gray-600 hover:text-gray-900 transition duration-300"
              >
                ← Back
              </button>
              {resume && (
                <button
                  onClick={() => setCurrentView('dashboard')}
                  className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition duration-300"
                >
                  <EyeIcon className="h-4 w-4 inline mr-2" />
                  View Dashboard
                </button>
              )}
            </div>
          </div>

          {/* AI Job Role Input */}
          <div className="mb-8 p-6 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              <SparklesIcon className="h-5 w-5 inline mr-2 text-indigo-600" />
              Get AI-Powered Suggestions
            </h3>
            <div className="flex gap-4">
              <input
                type="text"
                placeholder="Enter your target job role (e.g., Software Engineer, Data Analyst)"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    getAISuggestions(e.target.value);
                  }
                }}
              />
              <button
                onClick={(e) => {
                  const input = e.target.previousElementSibling;
                  getAISuggestions(input.value);
                }}
                disabled={loading}
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition duration-300 disabled:opacity-50"
              >
                {loading ? 'Loading...' : 'Get Suggestions'}
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            {/* Personal Information */}
            <div className="bg-gray-50 p-6 rounded-xl">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Personal Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  {...register('personal_info.full_name')}
                  placeholder="Full Name"
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
                <input
                  {...register('personal_info.email')}
                  placeholder="Email"
                  type="email"
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
                <input
                  {...register('personal_info.phone')}
                  placeholder="Phone"
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
                <input
                  {...register('personal_info.location')}
                  placeholder="Location"
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
                <input
                  {...register('personal_info.linkedin')}
                  placeholder="LinkedIn URL"
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
                <input
                  {...register('personal_info.github')}
                  placeholder="GitHub URL"
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Summary */}
            <div className="bg-gray-50 p-6 rounded-xl">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Professional Summary</h3>
              <textarea
                {...register('summary')}
                placeholder="Write a compelling professional summary..."
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            {/* Experience */}
            <div className="bg-gray-50 p-6 rounded-xl">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-gray-900">Work Experience</h3>
                <button
                  type="button"
                  onClick={() => appendExperience({
                    title: '',
                    company: '',
                    location: '',
                    start_date: '',
                    end_date: '',
                    description: '',
                    is_current: false
                  })}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition duration-300"
                >
                  <PlusIcon className="h-4 w-4 inline mr-2" />
                  Add Experience
                </button>
              </div>
              {experienceFields.map((field, index) => (
                <div key={field.id} className="bg-white p-4 rounded-lg mb-4 border">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="font-semibold text-gray-900">Experience {index + 1}</h4>
                    <button
                      type="button"
                      onClick={() => removeExperience(index)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <input
                      {...register(`experience.${index}.title`)}
                      placeholder="Job Title"
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                    <input
                      {...register(`experience.${index}.company`)}
                      placeholder="Company"
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                    <input
                      {...register(`experience.${index}.location`)}
                      placeholder="Location"
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                    <div className="flex gap-2">
                      <input
                        {...register(`experience.${index}.start_date`)}
                        placeholder="Start Date"
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      />
                      <input
                        {...register(`experience.${index}.end_date`)}
                        placeholder="End Date"
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  <textarea
                    {...register(`experience.${index}.description`)}
                    placeholder="Describe your responsibilities and achievements..."
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
              ))}
            </div>

            {/* Education */}
            <div className="bg-gray-50 p-6 rounded-xl">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-gray-900">Education</h3>
                <button
                  type="button"
                  onClick={() => appendEducation({
                    degree: '',
                    institution: '',
                    location: '',
                    start_date: '',
                    end_date: '',
                    gpa: '',
                    relevant_coursework: ''
                  })}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition duration-300"
                >
                  <PlusIcon className="h-4 w-4 inline mr-2" />
                  Add Education
                </button>
              </div>
              {educationFields.map((field, index) => (
                <div key={field.id} className="bg-white p-4 rounded-lg mb-4 border">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="font-semibold text-gray-900">Education {index + 1}</h4>
                    <button
                      type="button"
                      onClick={() => removeEducation(index)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                      {...register(`education.${index}.degree`)}
                      placeholder="Degree"
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                    <input
                      {...register(`education.${index}.institution`)}
                      placeholder="Institution"
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                    <input
                      {...register(`education.${index}.location`)}
                      placeholder="Location"
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                    <input
                      {...register(`education.${index}.gpa`)}
                      placeholder="GPA (optional)"
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Skills */}
            <div className="bg-gray-50 p-6 rounded-xl">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-gray-900">Skills</h3>
                <button
                  type="button"
                  onClick={() => appendSkill({ category: '', skills: [] })}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition duration-300"
                >
                  <PlusIcon className="h-4 w-4 inline mr-2" />
                  Add Skill Category
                </button>
              </div>
              {skillFields.map((field, index) => (
                <div key={field.id} className="bg-white p-4 rounded-lg mb-4 border">
                  <div className="flex justify-between items-center mb-4">
                    <input
                      {...register(`skills.${index}.category`)}
                      placeholder="Skill Category (e.g., Programming Languages)"
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent mr-4"
                    />
                    <button
                      type="button"
                      onClick={() => removeSkill(index)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                  <input
                    {...register(`skills.${index}.skills`)}
                    placeholder="Skills (comma-separated)"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
              ))}
            </div>

            {/* Submit Button */}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="px-8 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition duration-300 disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Save Resume'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );

  // Dashboard View
  const DashboardView = () => (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900">Resume Dashboard</h1>
            <div className="flex gap-4">
              <button
                onClick={() => setCurrentView('builder')}
                className="px-4 py-2 text-indigo-600 hover:text-indigo-800 transition duration-300"
              >
                ← Edit Resume
              </button>
              <button
                onClick={() => setCurrentView('home')}
                className="px-4 py-2 text-gray-600 hover:text-gray-900 transition duration-300"
              >
                Home
              </button>
            </div>
          </div>
          {resume && (
            <p className="text-gray-600 mt-2">
              Resume for: <span className="font-semibold">{resume.personal_info?.full_name || 'Unknown'}</span>
            </p>
          )}
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-xl shadow-lg mb-8">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('ats')}
                className={`py-4 px-2 border-b-2 font-medium text-sm ${
                  activeTab === 'ats'
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <ChartBarIcon className="h-5 w-5 inline mr-2" />
                ATS Analysis
              </button>
              <button
                onClick={() => setActiveTab('analysis')}
                className={`py-4 px-2 border-b-2 font-medium text-sm ${
                  activeTab === 'analysis'
                    ? 'border-orange-500 text-orange-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <LightBulbIcon className="h-5 w-5 inline mr-2" />
                Resume Analysis
              </button>
              <button
                onClick={() => setActiveTab('interview')}
                className={`py-4 px-2 border-b-2 font-medium text-sm ${
                  activeTab === 'interview'
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <ChatBubbleLeftRightIcon className="h-5 w-5 inline mr-2" />
                Interview Prep
              </button>
              <button
                onClick={() => setActiveTab('quiz')}
                className={`py-4 px-2 border-b-2 font-medium text-sm ${
                  activeTab === 'quiz'
                    ? 'border-cyan-500 text-cyan-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <AcademicCapIcon className="h-5 w-5 inline mr-2" />
                Technical Quiz
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-8">
            {/* ATS Analysis Tab */}
            {activeTab === 'ats' && (
              <div>
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">ATS Compatibility Analysis</h2>
                  <p className="text-gray-600 mb-6">
                    Analyze your resume's compatibility with Applicant Tracking Systems
                  </p>
                  
                  {!atsAnalysis && (
                    <div className="bg-gray-50 p-6 rounded-lg mb-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Job Description (Optional)</h3>
                      <textarea
                        value={jobDescription}
                        onChange={(e) => setJobDescription(e.target.value)}
                        placeholder="Paste the job description here for better ATS keyword matching..."
                        rows={4}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent mb-4"
                      />
                    </div>
                  )}
                  
                  <button
                    onClick={runATSAnalysis}
                    disabled={loading}
                    className="px-8 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition duration-300 disabled:opacity-50"
                  >
                    {loading ? 'Analyzing...' : atsAnalysis ? 'Re-run Analysis' : 'Run ATS Analysis'}
                  </button>
                </div>

                {atsAnalysis && (
                  <div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                      <div>
                        <div className="flex items-center mb-4">
                          <div className="relative w-32 h-32">
                            <ResponsiveContainer width="100%" height="100%">
                              <RadialBarChart cx="50%" cy="50%" innerRadius="60%" outerRadius="90%" data={[{score: atsAnalysis.ats_score, fill: atsAnalysis.ats_score >= 70 ? '#10B981' : atsAnalysis.ats_score >= 50 ? '#F59E0B' : '#EF4444'}]}>
                                <RadialBar dataKey="score" cornerRadius={10} />
                              </RadialBarChart>
                            </ResponsiveContainer>
                            <div className="absolute inset-0 flex items-center justify-center">
                              <span className="text-2xl font-bold text-gray-900">{atsAnalysis.ats_score}</span>
                            </div>
                          </div>
                          <div className="ml-6">
                            <h3 className="text-xl font-semibold text-gray-900">ATS Score</h3>
                            <p className="text-gray-600">
                              {atsAnalysis.ats_score >= 70 ? 'Excellent' : atsAnalysis.ats_score >= 50 ? 'Good' : 'Needs Improvement'}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-semibold text-gray-900 mb-3">Section Scores</h4>
                        <div className="space-y-2">
                          {Object.entries(atsAnalysis.section_scores || {}).map(([section, score]) => (
                            <div key={section} className="flex justify-between items-center">
                              <span className="capitalize text-gray-700">{section}</span>
                              <div className="flex items-center">
                                <div className="w-24 bg-gray-200 rounded-full h-2 mr-3">
                                  <div 
                                    className="bg-indigo-600 h-2 rounded-full" 
                                    style={{width: `${score}%`}}
                                  ></div>
                                </div>
                                <span className="text-sm font-medium text-gray-900">{score}%</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-3 text-green-600">Matched Keywords</h4>
                        <div className="flex flex-wrap gap-2">
                          {(atsAnalysis.matched_keywords || []).map((keyword, index) => (
                            <span key={index} className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                              {keyword}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h4 className="font-semibold text-gray-900 mb-3 text-red-600">Missing Keywords</h4>
                        <div className="flex flex-wrap gap-2">
                          {(atsAnalysis.missing_keywords || []).map((keyword, index) => (
                            <span key={index} className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm">
                              {keyword}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {atsAnalysis.recommendations && atsAnalysis.recommendations.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-3">Recommendations</h4>
                        <ul className="space-y-2">
                          {atsAnalysis.recommendations.map((rec, index) => (
                            <li key={index} className="flex items-start">
                              <span className="text-indigo-600 mr-2">•</span>
                              <span className="text-gray-700">{rec}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Resume Analysis Tab */}
            {activeTab === 'analysis' && (
              <div>
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">Resume Analysis</h2>
                  <p className="text-gray-600 mb-6">
                    Get detailed feedback on your resume's strengths and areas for improvement
                  </p>
                  <button
                    onClick={runResumeAnalysis}
                    disabled={loading}
                    className="px-8 py-3 bg-orange-600 text-white font-semibold rounded-lg hover:bg-orange-700 transition duration-300 disabled:opacity-50"
                  >
                    {loading ? 'Analyzing...' : resumeAnalysis ? 'Re-analyze Resume' : 'Analyze Resume'}
                  </button>
                </div>

                {resumeAnalysis && (
                  <div>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                      <div>
                        <h4 className="font-semibold text-green-600 mb-4 text-lg">Strengths</h4>
                        <ul className="space-y-2">
                          {(resumeAnalysis.pros || []).map((pro, index) => (
                            <li key={index} className="flex items-start">
                              <CheckCircleIcon className="h-5 w-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                              <span className="text-gray-700">{pro}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <h4 className="font-semibold text-red-600 mb-4 text-lg">Areas for Improvement</h4>
                        <ul className="space-y-2">
                          {(resumeAnalysis.cons || []).map((con, index) => (
                            <li key={index} className="flex items-start">
                              <XCircleIcon className="h-5 w-5 text-red-600 mr-2 mt-0.5 flex-shrink-0" />
                              <span className="text-gray-700">{con}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <h4 className="font-semibold text-indigo-600 mb-4 text-lg">Suggestions</h4>
                        <ul className="space-y-2">
                          {(resumeAnalysis.suggestions || []).map((suggestion, index) => (
                            <li key={index} className="flex items-start">
                              <LightBulbIcon className="h-5 w-5 text-indigo-600 mr-2 mt-0.5 flex-shrink-0" />
                              <span className="text-gray-700">{suggestion}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="text-center bg-indigo-50 p-6 rounded-lg">
                        <h4 className="font-semibold text-gray-900 mb-2">Readability Score</h4>
                        <div className="text-3xl font-bold text-indigo-600">{resumeAnalysis.readability_score?.toFixed(1) || 0}</div>
                        <p className="text-gray-600 text-sm">Flesch Reading Ease</p>
                      </div>
                      <div className="text-center bg-cyan-50 p-6 rounded-lg">
                        <h4 className="font-semibold text-gray-900 mb-2">Word Count</h4>
                        <div className="text-3xl font-bold text-cyan-600">{resumeAnalysis.word_count || 0}</div>
                        <p className="text-gray-600 text-sm">Total words</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Interview Prep Tab */}
            {activeTab === 'interview' && (
              <div>
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">Interview Preparation</h2>
                  <p className="text-gray-600 mb-6">
                    Get AI-generated interview questions based on your resume content
                  </p>
                  <button
                    onClick={generateInterviewQuestions}
                    disabled={loading}
                    className="px-8 py-3 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition duration-300 disabled:opacity-50"
                  >
                    {loading ? 'Generating...' : interviewQuestions ? 'Generate New Questions' : 'Generate Questions'}
                  </button>
                </div>

                {interviewQuestions && (
                  <div className="space-y-8">
                    {Object.entries(interviewQuestions).map(([category, questions]) => (
                      <div key={category}>
                        <h3 className="text-xl font-semibold text-gray-900 mb-4 capitalize">
                          {category.replace('_', ' ')}
                        </h3>
                        <div className="space-y-4">
                          {questions.map((q, index) => (
                            <div key={index} className="bg-gray-50 p-6 rounded-lg">
                              <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-3">
                                  <span className="text-sm font-medium text-purple-600">{q.category}</span>
                                  <span className={`text-xs px-2 py-1 rounded-full ${
                                    q.difficulty === 'Easy' ? 'bg-green-100 text-green-800' :
                                    q.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-red-100 text-red-800'
                                  }`}>
                                    {q.difficulty}
                                  </span>
                                </div>
                                <button
                                  onClick={() => toggleInterviewAnswer(category, index)}
                                  className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
                                >
                                  {showInterviewAnswers[`${category}_${index}`] ? 'Hide Sample Answer' : 'Show Sample Answer'}
                                </button>
                              </div>
                              <p className="text-gray-900 font-medium mb-4">{q.question}</p>
                              
                              {showInterviewAnswers[`${category}_${index}`] && (
                                <div className="mt-4 p-4 bg-white rounded-lg border-l-4 border-purple-500">
                                  <h5 className="font-semibold text-purple-700 mb-2">Sample Answer:</h5>
                                  <p className="text-gray-700 text-sm">
                                    {/* Generate sample answers based on question type */}
                                    {category === 'hr_questions' && 
                                      "Focus on your achievements, align your answer with the company's values, and be specific about your contributions. Use the STAR method (Situation, Task, Action, Result) to structure your response."
                                    }
                                    {category === 'behavioral_questions' && 
                                      "Use the STAR method to structure your answer. Describe a specific situation, explain the task you needed to accomplish, detail the actions you took, and highlight the positive results. Be honest and choose examples that showcase your skills."
                                    }
                                    {category === 'technical_questions' && 
                                      "Provide a clear, structured answer demonstrating your technical knowledge. Explain your thinking process, mention best practices, and if applicable, discuss trade-offs or alternative approaches. Don't hesitate to ask clarifying questions."
                                    }
                                  </p>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Technical Quiz Tab */}
            {activeTab === 'quiz' && (
              <div>
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">Technical Skills Quiz</h2>
                  <p className="text-gray-600 mb-6">
                    Test your technical knowledge with questions based on your resume skills
                  </p>
                  {!quiz && (
                    <button
                      onClick={generateQuiz}
                      disabled={loading}
                      className="px-8 py-3 bg-cyan-600 text-white font-semibold rounded-lg hover:bg-cyan-700 transition duration-300 disabled:opacity-50"
                    >
                      {loading ? 'Generating...' : 'Generate Quiz'}
                    </button>
                  )}
                  
                  {quiz && !showQuizResults && (
                    <div className="flex gap-4 justify-center">
                      <button
                        onClick={() => {
                          setShowQuizResults(true);
                        }}
                        disabled={Object.keys(quizAnswers).length !== quiz.questions?.length}
                        className="px-8 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition duration-300 disabled:opacity-50"
                      >
                        Submit Quiz ({Object.keys(quizAnswers).length}/{quiz.questions?.length || 0})
                      </button>
                      <button
                        onClick={() => {
                          setQuiz(null);
                          setQuizAnswers({});
                          setShowQuizResults(false);
                        }}
                        className="px-8 py-3 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-700 transition duration-300"
                      >
                        Generate New Quiz
                      </button>
                    </div>
                  )}
                  
                  {showQuizResults && (
                    <div className="bg-indigo-50 p-6 rounded-lg mb-6">
                      <h3 className="text-2xl font-bold text-indigo-600 mb-2">Quiz Results</h3>
                      <p className="text-3xl font-bold text-indigo-800">{calculateQuizScore()}%</p>
                      <p className="text-gray-600">
                        You got {Object.entries(quizAnswers).filter(([index, answer]) => 
                          quiz.questions[parseInt(index)]?.correct_answer === answer
                        ).length} out of {quiz.questions?.length || 0} questions correct
                      </p>
                      <button
                        onClick={() => {
                          setQuiz(null);
                          setQuizAnswers({});
                          setShowQuizResults(false);
                        }}
                        className="mt-4 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition duration-300"
                      >
                        Take New Quiz
                      </button>
                    </div>
                  )}
                </div>

                {quiz && (
                  <div className="space-y-6">
                    {(quiz.questions || []).map((q, index) => (
                      <div key={index} className="bg-white p-6 rounded-lg shadow-lg">
                        <div className="flex justify-between items-start mb-4">
                          <h4 className="font-semibold text-gray-900">Question {index + 1}</h4>
                          <span className="text-sm text-cyan-600 font-medium">{q.skill_category}</span>
                        </div>
                        <p className="text-gray-900 mb-4 font-medium">{q.question}</p>
                        
                        <div className="space-y-2">
                          {q.options.map((option, optIndex) => {
                            const isSelected = quizAnswers[index] === optIndex;
                            const isCorrect = optIndex === q.correct_answer;
                            const showAnswer = showQuizResults;
                            
                            return (
                              <button
                                key={optIndex}
                                onClick={() => !showQuizResults && handleQuizAnswer(index, optIndex)}
                                disabled={showQuizResults}
                                className={`w-full text-left p-3 rounded-lg border transition duration-200 ${
                                  showAnswer
                                    ? isCorrect
                                      ? 'bg-green-50 border-green-200 text-green-800'
                                      : isSelected && !isCorrect
                                      ? 'bg-red-50 border-red-200 text-red-800'
                                      : 'bg-gray-50 border-gray-200 text-gray-700'
                                    : isSelected
                                    ? 'bg-cyan-50 border-cyan-300 text-cyan-800'
                                    : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center">
                                    <span className="font-medium mr-3">{String.fromCharCode(65 + optIndex)}.</span>
                                    <span>{option}</span>
                                  </div>
                                  {showAnswer && isCorrect && (
                                    <CheckCircleIcon className="h-5 w-5 text-green-600" />
                                  )}
                                  {showAnswer && isSelected && !isCorrect && (
                                    <XCircleIcon className="h-5 w-5 text-red-600" />
                                  )}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                        
                        {showQuizResults && q.explanation && (
                          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                            <p className="text-blue-800 text-sm">
                              <span className="font-medium">Explanation:</span> {q.explanation}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  // Main Render
  return (
    <div className="App">
      {currentView === 'home' && <HomeView />}
      {currentView === 'builder' && <BuilderView />}
      {currentView === 'dashboard' && <DashboardView />}
      
      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-2xl shadow-2xl flex items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mr-4"></div>
            <span className="text-lg font-medium text-gray-900">Processing...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default SmartHirePro;