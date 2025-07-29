#!/usr/bin/env python3
"""
Comprehensive Backend API Testing for SmartHirePro
Tests all AI-powered resume builder and career enhancement features
"""

import requests
import json
import sys
import os
from datetime import datetime
import time

# Get backend URL from frontend .env
BACKEND_URL = "https://958e4720-5ac6-408e-8f21-b71e357d8148.preview.emergentagent.com/api"

class SmartHireProTester:
    def __init__(self):
        self.base_url = BACKEND_URL
        self.session = requests.Session()
        self.test_resume_id = None
        self.results = {
            "passed": 0,
            "failed": 0,
            "errors": []
        }
    
    def log_result(self, test_name, success, message="", response_data=None):
        """Log test results"""
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status}: {test_name}")
        if message:
            print(f"   {message}")
        if not success:
            self.results["failed"] += 1
            self.results["errors"].append(f"{test_name}: {message}")
        else:
            self.results["passed"] += 1
        print()
    
    def test_server_health(self):
        """Test basic server health endpoint"""
        try:
            response = self.session.get(f"{self.base_url}/")
            if response.status_code == 200:
                data = response.json()
                if "message" in data and "SmartHirePro" in data["message"]:
                    self.log_result("Server Health Check", True, f"Server is running: {data['message']}")
                    return True
                else:
                    self.log_result("Server Health Check", False, f"Unexpected response: {data}")
                    return False
            else:
                self.log_result("Server Health Check", False, f"HTTP {response.status_code}: {response.text}")
                return False
        except Exception as e:
            self.log_result("Server Health Check", False, f"Connection error: {str(e)}")
            return False
    
    def test_create_resume(self):
        """Test creating a new resume"""
        resume_data = {
            "personal_info": {
                "full_name": "Sarah Johnson",
                "email": "sarah.johnson@email.com",
                "phone": "+1-555-0123",
                "location": "San Francisco, CA",
                "linkedin": "https://linkedin.com/in/sarahjohnson",
                "github": "https://github.com/sarahjohnson",
                "website": "https://sarahjohnson.dev"
            },
            "summary": "Experienced Full Stack Developer with 5+ years of expertise in React, Node.js, and cloud technologies. Passionate about building scalable web applications and leading development teams.",
            "experience": [
                {
                    "title": "Senior Full Stack Developer",
                    "company": "TechCorp Inc",
                    "location": "San Francisco, CA",
                    "start_date": "2022-01",
                    "end_date": "Present",
                    "description": "Led development of microservices architecture serving 1M+ users. Built React applications with 99.9% uptime. Mentored 3 junior developers.",
                    "is_current": True
                },
                {
                    "title": "Software Developer",
                    "company": "StartupXYZ",
                    "location": "San Francisco, CA",
                    "start_date": "2020-06",
                    "end_date": "2021-12",
                    "description": "Developed REST APIs using Node.js and Express. Implemented CI/CD pipelines reducing deployment time by 60%.",
                    "is_current": False
                }
            ],
            "education": [
                {
                    "degree": "Bachelor of Science in Computer Science",
                    "institution": "University of California, Berkeley",
                    "location": "Berkeley, CA",
                    "start_date": "2016-08",
                    "end_date": "2020-05",
                    "gpa": "3.8",
                    "relevant_coursework": "Data Structures, Algorithms, Database Systems, Software Engineering"
                }
            ],
            "skills": [
                {
                    "category": "Programming Languages",
                    "skills": ["JavaScript", "Python", "TypeScript", "Java"]
                },
                {
                    "category": "Frameworks & Libraries",
                    "skills": ["React", "Node.js", "Express", "Django", "Next.js"]
                },
                {
                    "category": "Tools & Technologies",
                    "skills": ["AWS", "Docker", "Kubernetes", "MongoDB", "PostgreSQL"]
                }
            ],
            "projects": [
                {
                    "name": "E-commerce Platform",
                    "description": "Full-stack e-commerce application with payment integration and real-time inventory management",
                    "technologies": "React, Node.js, MongoDB, Stripe API",
                    "github_link": "https://github.com/sarahjohnson/ecommerce-platform",
                    "live_link": "https://ecommerce-demo.sarahjohnson.dev"
                }
            ],
            "certifications": [
                {
                    "name": "AWS Certified Solutions Architect",
                    "issuer": "Amazon Web Services",
                    "date": "2023-03",
                    "credential_id": "AWS-SAA-123456"
                }
            ]
        }
        
        try:
            response = self.session.post(f"{self.base_url}/resume", json=resume_data)
            if response.status_code == 200:
                data = response.json()
                if "id" in data and data["personal_info"]["full_name"] == "Sarah Johnson":
                    self.test_resume_id = data["id"]
                    self.log_result("Create Resume", True, f"Resume created with ID: {self.test_resume_id}")
                    return True
                else:
                    self.log_result("Create Resume", False, f"Invalid response structure: {data}")
                    return False
            else:
                self.log_result("Create Resume", False, f"HTTP {response.status_code}: {response.text}")
                return False
        except Exception as e:
            self.log_result("Create Resume", False, f"Error: {str(e)}")
            return False
    
    def test_get_resume(self):
        """Test retrieving a resume by ID"""
        if not self.test_resume_id:
            self.log_result("Get Resume", False, "No resume ID available from create test")
            return False
        
        try:
            response = self.session.get(f"{self.base_url}/resume/{self.test_resume_id}")
            if response.status_code == 200:
                data = response.json()
                if data["id"] == self.test_resume_id and data["personal_info"]["full_name"] == "Sarah Johnson":
                    self.log_result("Get Resume", True, "Resume retrieved successfully")
                    return True
                else:
                    self.log_result("Get Resume", False, f"Data mismatch: {data}")
                    return False
            else:
                self.log_result("Get Resume", False, f"HTTP {response.status_code}: {response.text}")
                return False
        except Exception as e:
            self.log_result("Get Resume", False, f"Error: {str(e)}")
            return False
    
    def test_update_resume(self):
        """Test updating an existing resume"""
        if not self.test_resume_id:
            self.log_result("Update Resume", False, "No resume ID available")
            return False
        
        update_data = {
            "personal_info": {
                "full_name": "Sarah Johnson",
                "email": "sarah.johnson@email.com",
                "phone": "+1-555-0123",
                "location": "San Francisco, CA",
                "linkedin": "https://linkedin.com/in/sarahjohnson",
                "github": "https://github.com/sarahjohnson",
                "website": "https://sarahjohnson.dev"
            },
            "summary": "UPDATED: Senior Full Stack Developer with 5+ years of expertise in React, Node.js, and cloud technologies.",
            "experience": [
                {
                    "title": "Senior Full Stack Developer",
                    "company": "TechCorp Inc",
                    "location": "San Francisco, CA",
                    "start_date": "2022-01",
                    "end_date": "Present",
                    "description": "Led development of microservices architecture serving 1M+ users.",
                    "is_current": True
                }
            ],
            "education": [
                {
                    "degree": "Bachelor of Science in Computer Science",
                    "institution": "University of California, Berkeley",
                    "location": "Berkeley, CA",
                    "start_date": "2016-08",
                    "end_date": "2020-05",
                    "gpa": "3.8",
                    "relevant_coursework": "Data Structures, Algorithms"
                }
            ],
            "skills": [
                {
                    "category": "Programming Languages",
                    "skills": ["JavaScript", "Python", "TypeScript", "Java"]
                },
                {
                    "category": "Frameworks",
                    "skills": ["React", "Node.js", "Express", "Django"]
                }
            ],
            "projects": [
                {
                    "name": "E-commerce Platform",
                    "description": "Full-stack e-commerce application",
                    "technologies": "React, Node.js, MongoDB",
                    "github_link": "https://github.com/sarahjohnson/ecommerce",
                    "live_link": "https://ecommerce-demo.sarahjohnson.dev"
                }
            ],
            "certifications": [
                {
                    "name": "AWS Certified Solutions Architect",
                    "issuer": "Amazon Web Services",
                    "date": "2023-03",
                    "credential_id": "AWS-SAA-123456"
                }
            ]
        }
        
        try:
            response = self.session.put(f"{self.base_url}/resume/{self.test_resume_id}", json=update_data)
            if response.status_code == 200:
                data = response.json()
                if "UPDATED:" in data["summary"]:
                    self.log_result("Update Resume", True, "Resume updated successfully")
                    return True
                else:
                    self.log_result("Update Resume", False, f"Update not reflected: {data}")
                    return False
            else:
                self.log_result("Update Resume", False, f"HTTP {response.status_code}: {response.text}")
                return False
        except Exception as e:
            self.log_result("Update Resume", False, f"Error: {str(e)}")
            return False
    
    def test_ai_suggestions(self):
        """Test AI-powered job role suggestions"""
        job_role_data = {"job_role": "Senior Software Engineer"}
        
        try:
            response = self.session.post(f"{self.base_url}/ai-suggestions", json=job_role_data)
            if response.status_code == 200:
                data = response.json()
                required_keys = ["summary_suggestions", "skills_suggestions", "experience_keywords"]
                if all(key in data for key in required_keys):
                    if isinstance(data["summary_suggestions"], list) and len(data["summary_suggestions"]) > 0:
                        self.log_result("AI Suggestions", True, f"Generated {len(data['summary_suggestions'])} suggestions")
                        return True
                    else:
                        self.log_result("AI Suggestions", False, "Empty or invalid suggestions")
                        return False
                else:
                    self.log_result("AI Suggestions", False, f"Missing required keys: {data}")
                    return False
            else:
                self.log_result("AI Suggestions", False, f"HTTP {response.status_code}: {response.text}")
                return False
        except Exception as e:
            self.log_result("AI Suggestions", False, f"Error: {str(e)}")
            return False
    
    def test_ats_analysis(self):
        """Test ATS score analysis"""
        if not self.test_resume_id:
            self.log_result("ATS Analysis", False, "No resume ID available")
            return False
        
        job_description = "We are looking for a Senior Software Engineer with experience in React, Node.js, and AWS. The candidate should have strong problem-solving skills and experience with microservices architecture."
        
        try:
            response = self.session.post(
                f"{self.base_url}/resume/{self.test_resume_id}/ats-analysis",
                params={"job_description": job_description}
            )
            if response.status_code == 200:
                data = response.json()
                required_keys = ["ats_score", "matched_keywords", "missing_keywords", "recommendations"]
                if all(key in data for key in required_keys):
                    if isinstance(data["ats_score"], int) and 0 <= data["ats_score"] <= 100:
                        self.log_result("ATS Analysis", True, f"ATS Score: {data['ats_score']}, Matched: {len(data['matched_keywords'])} keywords")
                        return True
                    else:
                        self.log_result("ATS Analysis", False, f"Invalid ATS score: {data['ats_score']}")
                        return False
                else:
                    self.log_result("ATS Analysis", False, f"Missing required keys: {data}")
                    return False
            else:
                self.log_result("ATS Analysis", False, f"HTTP {response.status_code}: {response.text}")
                return False
        except Exception as e:
            self.log_result("ATS Analysis", False, f"Error: {str(e)}")
            return False
    
    def test_resume_analysis(self):
        """Test AI-powered resume analysis"""
        if not self.test_resume_id:
            self.log_result("Resume Analysis", False, "No resume ID available")
            return False
        
        try:
            response = self.session.post(f"{self.base_url}/resume/{self.test_resume_id}/analysis")
            if response.status_code == 200:
                data = response.json()
                required_keys = ["pros", "cons", "suggestions", "readability_score", "word_count"]
                if all(key in data for key in required_keys):
                    if (isinstance(data["pros"], list) and isinstance(data["cons"], list) and 
                        isinstance(data["suggestions"], list) and len(data["pros"]) > 0):
                        self.log_result("Resume Analysis", True, 
                                      f"Analysis complete: {len(data['pros'])} pros, {len(data['cons'])} cons, {len(data['suggestions'])} suggestions")
                        return True
                    else:
                        self.log_result("Resume Analysis", False, "Empty or invalid analysis data")
                        return False
                else:
                    self.log_result("Resume Analysis", False, f"Missing required keys: {data}")
                    return False
            else:
                self.log_result("Resume Analysis", False, f"HTTP {response.status_code}: {response.text}")
                return False
        except Exception as e:
            self.log_result("Resume Analysis", False, f"Error: {str(e)}")
            return False
    
    def test_interview_questions(self):
        """Test AI-generated interview questions"""
        if not self.test_resume_id:
            self.log_result("Interview Questions", False, "No resume ID available")
            return False
        
        try:
            response = self.session.post(f"{self.base_url}/resume/{self.test_resume_id}/interview-questions")
            if response.status_code == 200:
                data = response.json()
                required_categories = ["hr_questions", "behavioral_questions", "technical_questions"]
                if all(category in data for category in required_categories):
                    total_questions = sum(len(data[category]) for category in required_categories)
                    if total_questions > 0:
                        self.log_result("Interview Questions", True, 
                                      f"Generated {total_questions} questions across 3 categories")
                        return True
                    else:
                        self.log_result("Interview Questions", False, "No questions generated")
                        return False
                else:
                    self.log_result("Interview Questions", False, f"Missing question categories: {data}")
                    return False
            else:
                self.log_result("Interview Questions", False, f"HTTP {response.status_code}: {response.text}")
                return False
        except Exception as e:
            self.log_result("Interview Questions", False, f"Error: {str(e)}")
            return False
    
    def test_technical_quiz(self):
        """Test AI-generated technical quiz"""
        if not self.test_resume_id:
            self.log_result("Technical Quiz", False, "No resume ID available")
            return False
        
        try:
            response = self.session.post(f"{self.base_url}/resume/{self.test_resume_id}/quiz")
            if response.status_code == 200:
                data = response.json()
                if "questions" in data and isinstance(data["questions"], list):
                    if len(data["questions"]) > 0:
                        # Validate question structure
                        first_question = data["questions"][0]
                        required_fields = ["question", "options", "correct_answer", "explanation"]
                        if all(field in first_question for field in required_fields):
                            self.log_result("Technical Quiz", True, 
                                          f"Generated {len(data['questions'])} quiz questions")
                            return True
                        else:
                            self.log_result("Technical Quiz", False, f"Invalid question structure: {first_question}")
                            return False
                    else:
                        self.log_result("Technical Quiz", False, "No quiz questions generated")
                        return False
                else:
                    self.log_result("Technical Quiz", False, f"Invalid response structure: {data}")
                    return False
            else:
                self.log_result("Technical Quiz", False, f"HTTP {response.status_code}: {response.text}")
                return False
        except Exception as e:
            self.log_result("Technical Quiz", False, f"Error: {str(e)}")
            return False
    
    def test_file_upload(self):
        """Test file upload functionality (simulated)"""
        # Note: We can't test actual file upload without files, but we can test the endpoint
        try:
            # Test with invalid file type first
            response = self.session.post(f"{self.base_url}/resume/upload")
            # This should fail due to missing file, which is expected
            if response.status_code in [400, 422]:  # Bad request or validation error
                self.log_result("File Upload Endpoint", True, "Endpoint correctly rejects invalid requests")
                return True
            else:
                self.log_result("File Upload Endpoint", False, f"Unexpected response: HTTP {response.status_code}")
                return False
        except Exception as e:
            self.log_result("File Upload Endpoint", False, f"Error: {str(e)}")
            return False
    
    def run_all_tests(self):
        """Run all backend API tests"""
        print("🚀 Starting SmartHirePro Backend API Tests")
        print(f"Testing against: {self.base_url}")
        print("=" * 60)
        
        # Test in logical order
        tests = [
            ("Server Health", self.test_server_health),
            ("Create Resume", self.test_create_resume),
            ("Get Resume", self.test_get_resume),
            ("Update Resume", self.test_update_resume),
            ("AI Suggestions", self.test_ai_suggestions),
            ("ATS Analysis", self.test_ats_analysis),
            ("Resume Analysis", self.test_resume_analysis),
            ("Interview Questions", self.test_interview_questions),
            ("Technical Quiz", self.test_technical_quiz),
            ("File Upload", self.test_file_upload)
        ]
        
        for test_name, test_func in tests:
            try:
                test_func()
                time.sleep(1)  # Brief pause between tests
            except Exception as e:
                self.log_result(test_name, False, f"Test execution error: {str(e)}")
        
        # Print summary
        print("=" * 60)
        print("📊 TEST SUMMARY")
        print(f"✅ Passed: {self.results['passed']}")
        print(f"❌ Failed: {self.results['failed']}")
        print(f"📈 Success Rate: {(self.results['passed'] / (self.results['passed'] + self.results['failed']) * 100):.1f}%")
        
        if self.results['errors']:
            print("\n🔍 FAILED TESTS:")
            for error in self.results['errors']:
                print(f"   • {error}")
        
        return self.results['failed'] == 0

if __name__ == "__main__":
    tester = SmartHireProTester()
    success = tester.run_all_tests()
    sys.exit(0 if success else 1)