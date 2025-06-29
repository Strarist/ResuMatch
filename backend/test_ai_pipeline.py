#!/usr/bin/env python3
"""
Test script for the AI pipeline components
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.utils.resume_parser import resume_parser
from app.utils.job_parser import parse_job_description
from app.utils.skills_matcher import skills_matcher

def test_job_parser():
    """Test job description parsing"""
    print("🧪 Testing Job Parser...")
    
    sample_job_description = """
    Senior Software Engineer
    
    We are looking for a Senior Software Engineer to join our team.
    
    Requirements:
    - 5+ years of experience in software development
    - Proficiency in Python, JavaScript, and React
    - Experience with cloud platforms (AWS, Azure)
    - Knowledge of database systems (PostgreSQL, MongoDB)
    - Bachelor's degree in Computer Science or related field
    - Experience with Docker and Kubernetes
    - Strong problem-solving skills
    - Excellent communication abilities
    
    Responsibilities:
    - Develop and maintain web applications
    - Collaborate with cross-functional teams
    - Mentor junior developers
    - Participate in code reviews
    """
    
    try:
        result = parse_job_description(sample_job_description)
        print("✅ Job parsing successful!")
        print(f"   Skills found: {len(result.get('skills', []))}")
        print(f"   Education: {result.get('education', [])}")
        print(f"   Experience: {result.get('experience', [])}")
        return True
    except Exception as e:
        print(f"❌ Job parsing failed: {e}")
        return False

def test_skills_matcher():
    """Test skills matching"""
    print("\n🧪 Testing Skills Matcher...")
    
    resume_skills = ["Python", "JavaScript", "React", "Node.js", "MongoDB"]
    job_skills = ["Python", "JavaScript", "React", "AWS", "PostgreSQL", "Docker"]
    
    try:
        # Test basic similarity
        similarity = skills_matcher.calculate_similarity(resume_skills, job_skills)
        print(f"✅ Basic similarity calculation: {similarity:.3f}")
        
        # Test detailed matching
        detailed = skills_matcher.get_detailed_matching(resume_skills, job_skills)
        print(f"✅ Detailed matching successful!")
        print(f"   Overall score: {detailed['overall_score']:.3f}")
        print(f"   Match percentage: {detailed['match_percentage']:.1%}")
        print(f"   Missing skills: {len(detailed['missing_skills'])}")
        
        return True
    except Exception as e:
        print(f"❌ Skills matching failed: {e}")
        return False

def test_overall_pipeline():
    """Test the complete pipeline"""
    print("\n🧪 Testing Complete Pipeline...")
    
    # Mock resume data
    resume_data = {
        'skills': ['Python', 'JavaScript', 'React', 'Node.js', 'MongoDB'],
        'education': ['Bachelor of Science in Computer Science'],
        'experience': ['5 years of software development']
    }
    
    job_data = {
        'skills': ['Python', 'JavaScript', 'React', 'AWS', 'PostgreSQL'],
        'education': ['Bachelor degree in Computer Science'],
        'experience': ['5+ years of experience']
    }
    
    try:
        result = skills_matcher.calculate_overall_match_score(resume_data, job_data)
        print("✅ Complete pipeline successful!")
        print(f"   Overall score: {result['overall_score']:.3f}")
        print(f"   Skills score: {result['skills_score']:.3f}")
        print(f"   Experience score: {result['experience_score']:.3f}")
        print(f"   Education score: {result['education_score']:.3f}")
        return True
    except Exception as e:
        print(f"❌ Complete pipeline failed: {e}")
        return False

def test_model_loading():
    """Test if models load correctly"""
    print("\n🧪 Testing Model Loading...")
    
    try:
        # Test sentence transformer
        embeddings = skills_matcher.get_embeddings(["Python", "JavaScript"])
        print(f"✅ Sentence transformer loaded: {embeddings.shape}")
        
        # Test spaCy (if available)
        try:
            import spacy
            nlp = spacy.load("en_core_web_sm")
            doc = nlp("Python is a programming language")
            print(f"✅ spaCy model loaded: {len(doc)} tokens")
        except Exception as e:
            print(f"⚠️  spaCy model not available: {e}")
        
        return True
    except Exception as e:
        print(f"❌ Model loading failed: {e}")
        return False

def main():
    """Run all tests"""
    print("🚀 Starting AI Pipeline Tests...\n")
    
    tests = [
        test_model_loading,
        test_job_parser,
        test_skills_matcher,
        test_overall_pipeline
    ]
    
    passed = 0
    total = len(tests)
    
    for test in tests:
        if test():
            passed += 1
        print()
    
    print("📊 Test Results:")
    print(f"   Passed: {passed}/{total}")
    print(f"   Success rate: {(passed/total)*100:.1f}%")
    
    if passed == total:
        print("🎉 All tests passed! AI pipeline is ready.")
    else:
        print("⚠️  Some tests failed. Please check the errors above.")
    
    return passed == total

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1) 