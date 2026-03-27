#!/usr/bin/env python3

import requests
import sys
import json
from datetime import datetime

class ProjetoAlegriaAPITester:
    def __init__(self, base_url="https://last-checkpoint-5.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []
        self.admin_credentials = {
            "email": "admin@projetoalegria.org",
            "password": "admin123"
        }

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name}")
        else:
            print(f"❌ {name} - {details}")
            self.failed_tests.append({"test": name, "details": details})

    def make_request(self, method, endpoint, data=None, expected_status=200, auth_required=True):
        """Make HTTP request with proper headers"""
        url = f"{self.api_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        if auth_required and self.token:
            headers['Authorization'] = f'Bearer {self.token}'

        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=10)
            else:
                return False, {"error": f"Unsupported method: {method}"}

            success = response.status_code == expected_status
            try:
                response_data = response.json() if response.content else {}
            except:
                response_data = {"raw_response": response.text}

            return success, response_data

        except requests.exceptions.RequestException as e:
            return False, {"error": str(e)}

    def test_admin_login(self):
        """Test admin login and get token"""
        print("\n🔐 Testing Admin Authentication...")
        
        success, response = self.make_request(
            'POST', 'auth/login', 
            self.admin_credentials, 
            expected_status=200, 
            auth_required=False
        )
        
        if success and 'access_token' in response:
            self.token = response['access_token']
            self.log_test("Admin Login", True)
            return True
        else:
            self.log_test("Admin Login", False, f"Response: {response}")
            return False

    def test_site_settings(self):
        """Test site settings endpoints"""
        print("\n⚙️ Testing Site Settings...")
        
        # Test GET /api/settings (should return default settings)
        success, response = self.make_request('GET', 'settings', expected_status=200)
        self.log_test("GET /api/settings", success, "" if success else str(response))
        
        if success:
            # Test PUT /api/settings (requires admin auth)
            update_data = {
                "hero_title": "Test Updated Title",
                "hero_subtitle": "Test Updated Subtitle",
                "about_title": "Test About Title",
                "phone": "(11) 99999-9999",
                "email": "test@projetoalegria.org"
            }
            
            success, response = self.make_request('PUT', 'settings', update_data, expected_status=200)
            self.log_test("PUT /api/settings (admin auth)", success, "" if success else str(response))
        
        # Test GET /api/public/settings (no auth required)
        success, response = self.make_request('GET', 'public/settings', expected_status=200, auth_required=False)
        self.log_test("GET /api/public/settings (no auth)", success, "" if success else str(response))

    def test_gallery_management(self):
        """Test gallery endpoints"""
        print("\n🖼️ Testing Gallery Management...")
        
        # Test POST /api/gallery (requires admin)
        gallery_data = {
            "url": "https://example.com/test-image.jpg",
            "caption": "Test Image Caption",
            "category": "test",
            "order": 1
        }
        
        success, response = self.make_request('POST', 'gallery', gallery_data, expected_status=200)
        self.log_test("POST /api/gallery (admin)", success, "" if success else str(response))
        
        gallery_id = None
        if success and 'id' in response:
            gallery_id = response['id']
        
        # Test GET /api/gallery (list all images)
        success, response = self.make_request('GET', 'gallery', expected_status=200, auth_required=False)
        self.log_test("GET /api/gallery", success, "" if success else str(response))
        
        # Test DELETE /api/gallery/:id (requires admin)
        if gallery_id:
            success, response = self.make_request('DELETE', f'gallery/{gallery_id}', expected_status=200)
            self.log_test("DELETE /api/gallery/:id (admin)", success, "" if success else str(response))

    def test_projects_crud(self):
        """Test projects CRUD operations"""
        print("\n📋 Testing Projects CRUD...")
        
        # Test POST /api/projects (create)
        project_data = {
            "title": "Test Project",
            "description": "This is a test project description",
            "image_url": "https://example.com/project.jpg",
            "date": "2024-01-15",
            "status": "active"
        }
        
        success, response = self.make_request('POST', 'projects', project_data, expected_status=200)
        self.log_test("POST /api/projects (create)", success, "" if success else str(response))
        
        project_id = None
        if success and 'id' in response:
            project_id = response['id']
        
        # Test GET /api/projects (read all)
        success, response = self.make_request('GET', 'projects', expected_status=200)
        self.log_test("GET /api/projects (read)", success, "" if success else str(response))
        
        # Test PUT /api/projects/:id (update)
        if project_id:
            update_data = {
                "title": "Updated Test Project",
                "description": "Updated description",
                "status": "active"
            }
            success, response = self.make_request('PUT', f'projects/{project_id}', update_data, expected_status=200)
            self.log_test("PUT /api/projects/:id (update)", success, "" if success else str(response))
            
            # Test DELETE /api/projects/:id (delete)
            success, response = self.make_request('DELETE', f'projects/{project_id}', expected_status=200)
            self.log_test("DELETE /api/projects/:id (delete)", success, "" if success else str(response))

    def test_testimonials_crud(self):
        """Test testimonials CRUD operations"""
        print("\n💬 Testing Testimonials CRUD...")
        
        # Test POST /api/testimonials (create)
        testimonial_data = {
            "name": "Test User",
            "role": "Test Role",
            "content": "This is a test testimonial content",
            "avatar_url": "https://example.com/avatar.jpg",
            "status": "active"
        }
        
        success, response = self.make_request('POST', 'testimonials', testimonial_data, expected_status=200)
        self.log_test("POST /api/testimonials (create)", success, "" if success else str(response))
        
        testimonial_id = None
        if success and 'id' in response:
            testimonial_id = response['id']
        
        # Test GET /api/testimonials (read all)
        success, response = self.make_request('GET', 'testimonials', expected_status=200)
        self.log_test("GET /api/testimonials (read)", success, "" if success else str(response))
        
        # Test PUT /api/testimonials/:id (update)
        if testimonial_id:
            update_data = {
                "name": "Updated Test User",
                "role": "Updated Role",
                "content": "Updated testimonial content",
                "status": "active"
            }
            success, response = self.make_request('PUT', f'testimonials/{testimonial_id}', update_data, expected_status=200)
            self.log_test("PUT /api/testimonials/:id (update)", success, "" if success else str(response))
            
            # Test DELETE /api/testimonials/:id (delete)
            success, response = self.make_request('DELETE', f'testimonials/{testimonial_id}', expected_status=200)
            self.log_test("DELETE /api/testimonials/:id (delete)", success, "" if success else str(response))

    def test_contact_messages(self):
        """Test contact messages management"""
        print("\n📧 Testing Contact Messages...")
        
        # First create a contact message via public endpoint
        contact_data = {
            "name": "Test Contact",
            "email": "test@example.com",
            "phone": "(11) 99999-9999",
            "subject": "Test Subject",
            "message": "This is a test contact message"
        }
        
        success, response = self.make_request('POST', 'public/contact', contact_data, expected_status=200, auth_required=False)
        self.log_test("POST /api/public/contact (create message)", success, "" if success else str(response))
        
        # Test GET /api/messages (admin only)
        success, response = self.make_request('GET', 'messages', expected_status=200)
        self.log_test("GET /api/messages (admin only)", success, "" if success else str(response))
        
        # Test PUT /api/messages/:id/status (update message status)
        if success and response and len(response) > 0:
            message_id = response[0].get('id')
            if message_id:
                success, response = self.make_request('PUT', f'messages/{message_id}/status?status=read', expected_status=200)
                self.log_test("PUT /api/messages/:id/status", success, "" if success else str(response))

    def test_public_endpoints(self):
        """Test public endpoints that don't require authentication"""
        print("\n🌐 Testing Public Endpoints...")
        
        # Test public classes
        success, response = self.make_request('GET', 'public/classes', expected_status=200, auth_required=False)
        self.log_test("GET /api/public/classes", success, "" if success else str(response))
        
        # Test public stats
        success, response = self.make_request('GET', 'public/stats', expected_status=200, auth_required=False)
        self.log_test("GET /api/public/stats", success, "" if success else str(response))
        
        # Test public projects
        success, response = self.make_request('GET', 'public/projects', expected_status=200, auth_required=False)
        self.log_test("GET /api/public/projects", success, "" if success else str(response))
        
        # Test public testimonials
        success, response = self.make_request('GET', 'public/testimonials', expected_status=200, auth_required=False)
        self.log_test("GET /api/public/testimonials", success, "" if success else str(response))

    def run_all_tests(self):
        """Run all test suites"""
        print("🚀 Starting Projeto Alegria CMS API Tests...")
        print(f"Testing against: {self.base_url}")
        
        # Test authentication first
        if not self.test_admin_login():
            print("❌ Cannot proceed without admin authentication")
            return False
        
        # Run all test suites
        self.test_site_settings()
        self.test_gallery_management()
        self.test_projects_crud()
        self.test_testimonials_crud()
        self.test_contact_messages()
        self.test_public_endpoints()
        
        # Print summary
        print(f"\n📊 Test Summary:")
        print(f"Tests Run: {self.tests_run}")
        print(f"Tests Passed: {self.tests_passed}")
        print(f"Tests Failed: {len(self.failed_tests)}")
        print(f"Success Rate: {(self.tests_passed/self.tests_run*100):.1f}%")
        
        if self.failed_tests:
            print(f"\n❌ Failed Tests:")
            for test in self.failed_tests:
                print(f"  - {test['test']}: {test['details']}")
        
        return len(self.failed_tests) == 0

def main():
    tester = ProjetoAlegriaAPITester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())