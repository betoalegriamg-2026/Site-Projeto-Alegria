import requests
import sys
import json
from datetime import datetime

class ProjetoAlegraAPITester:
    def __init__(self, base_url="https://last-checkpoint-5.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.admin_user = None
        self.test_student_id = None
        self.test_class_id = None
        self.test_enrollment_id = None

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        
        if self.token:
            test_headers['Authorization'] = f'Bearer {self.token}'
        
        if headers:
            test_headers.update(headers)

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers, timeout=10)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    return success, response.json() if response.content else {}
                except:
                    return success, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_data = response.json() if response.content else {}
                    print(f"   Error: {error_data}")
                except:
                    print(f"   Response: {response.text[:200]}")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_root_endpoint(self):
        """Test root API endpoint"""
        return self.run_test("Root API", "GET", "", 200)

    def test_admin_login(self):
        """Test admin login"""
        success, response = self.run_test(
            "Admin Login",
            "POST",
            "auth/login",
            200,
            data={"email": "admin@projetoalegria.org", "password": "admin123"}
        )
        if success and 'access_token' in response:
            self.token = response['access_token']
            self.admin_user = response.get('user')
            print(f"   Token obtained for user: {self.admin_user.get('name', 'Unknown')}")
            return True
        return False

    def test_auth_me(self):
        """Test getting current user info"""
        return self.run_test("Get Current User", "GET", "auth/me", 200)

    def test_public_stats(self):
        """Test public stats endpoint"""
        return self.run_test("Public Stats", "GET", "public/stats", 200)

    def test_public_classes(self):
        """Test public classes endpoint"""
        return self.run_test("Public Classes", "GET", "public/classes", 200)

    def test_public_testimonials(self):
        """Test public testimonials endpoint"""
        return self.run_test("Public Testimonials", "GET", "public/testimonials", 200)

    def test_contact_submission(self):
        """Test contact form submission"""
        contact_data = {
            "name": "Test User",
            "email": "test@example.com",
            "phone": "11999999999",
            "subject": "Test Message",
            "message": "This is a test message from automated testing."
        }
        return self.run_test("Contact Submission", "POST", "public/contact", 200, data=contact_data)

    def test_dashboard_stats(self):
        """Test dashboard stats (requires auth)"""
        return self.run_test("Dashboard Stats", "GET", "dashboard/stats", 200)

    def test_create_student(self):
        """Test creating a student"""
        student_data = {
            "name": "João Silva Test",
            "birth_date": "2010-05-15",
            "cpf": "12345678901",
            "mother_name": "Maria Silva",
            "father_name": "José Silva",
            "phone": "11987654321",
            "whatsapp": "11987654321",
            "email": "joao.test@email.com",
            "address": "Rua Test, 123",
            "city": "São Paulo",
            "state": "SP",
            "status": "active"
        }
        success, response = self.run_test("Create Student", "POST", "students", 200, data=student_data)
        if success and 'id' in response:
            self.test_student_id = response['id']
            print(f"   Created student with ID: {self.test_student_id}")
            return True
        return False

    def test_list_students(self):
        """Test listing students"""
        return self.run_test("List Students", "GET", "students", 200)

    def test_get_student(self):
        """Test getting specific student"""
        if not self.test_student_id:
            print("❌ No test student ID available")
            return False
        return self.run_test("Get Student", "GET", f"students/{self.test_student_id}", 200)

    def test_update_student(self):
        """Test updating student"""
        if not self.test_student_id:
            print("❌ No test student ID available")
            return False
        
        update_data = {
            "name": "João Silva Test Updated",
            "birth_date": "2010-05-15",
            "cpf": "12345678901",
            "mother_name": "Maria Silva",
            "father_name": "José Silva",
            "phone": "11987654321",
            "whatsapp": "11987654321",
            "email": "joao.updated@email.com",
            "address": "Rua Test Updated, 456",
            "city": "São Paulo",
            "state": "SP",
            "status": "active"
        }
        return self.run_test("Update Student", "PUT", f"students/{self.test_student_id}", 200, data=update_data)

    def test_list_classes(self):
        """Test listing classes"""
        success, response = self.run_test("List Classes", "GET", "classes", 200)
        if success and response and len(response) > 0:
            self.test_class_id = response[0]['id']
            print(f"   Found class with ID: {self.test_class_id}")
            return True
        return success

    def test_get_class(self):
        """Test getting specific class"""
        if not self.test_class_id:
            print("❌ No test class ID available")
            return False
        return self.run_test("Get Class", "GET", f"classes/{self.test_class_id}", 200)

    def test_create_enrollment(self):
        """Test creating enrollment"""
        if not self.test_student_id or not self.test_class_id:
            print("❌ Missing student or class ID for enrollment")
            return False
        
        enrollment_data = {
            "student_id": self.test_student_id,
            "class_id": self.test_class_id,
            "status": "active"
        }
        success, response = self.run_test("Create Enrollment", "POST", "enrollments", 200, data=enrollment_data)
        if success and 'id' in response:
            self.test_enrollment_id = response['id']
            print(f"   Created enrollment with ID: {self.test_enrollment_id}")
            return True
        return False

    def test_list_enrollments(self):
        """Test listing enrollments"""
        return self.run_test("List Enrollments", "GET", "enrollments", 200)

    def test_create_payment(self):
        """Test creating payment"""
        if not self.test_student_id or not self.test_class_id:
            print("❌ Missing student or class ID for payment")
            return False
        
        payment_data = {
            "student_id": self.test_student_id,
            "class_id": self.test_class_id,
            "amount": 50.0,
            "payment_date": datetime.now().strftime("%Y-%m-%d"),
            "reference_month": datetime.now().strftime("%Y-%m"),
            "payment_method": "cash",
            "status": "paid"
        }
        return self.run_test("Create Payment", "POST", "payments", 200, data=payment_data)

    def test_list_payments(self):
        """Test listing payments"""
        return self.run_test("List Payments", "GET", "payments", 200)

    def test_create_cashflow(self):
        """Test creating cash flow entry"""
        cashflow_data = {
            "type": "income",
            "category": "Mensalidades",
            "description": "Pagamento de mensalidade - Teste",
            "amount": 100.0,
            "due_date": datetime.now().strftime("%Y-%m-%d"),
            "status": "paid"
        }
        return self.run_test("Create Cash Flow", "POST", "cashflow", 200, data=cashflow_data)

    def test_list_cashflow(self):
        """Test listing cash flow entries"""
        return self.run_test("List Cash Flow", "GET", "cashflow", 200)

    def test_attendance_bulk(self):
        """Test bulk attendance creation"""
        if not self.test_enrollment_id or not self.test_class_id:
            print("❌ Missing enrollment or class ID for attendance")
            return False
        
        attendance_data = {
            "class_id": self.test_class_id,
            "date": datetime.now().strftime("%Y-%m-%d"),
            "records": [
                {
                    "enrollment_id": self.test_enrollment_id,
                    "status": "P",
                    "notes": "Presente - Teste automatizado"
                }
            ]
        }
        return self.run_test("Bulk Attendance", "POST", "attendance/bulk", 200, data=attendance_data)

    def test_list_attendance(self):
        """Test listing attendance"""
        return self.run_test("List Attendance", "GET", "attendance", 200)

    def test_class_report(self):
        """Test class report generation"""
        if not self.test_class_id:
            print("❌ No test class ID available for report")
            return False
        return self.run_test("Class Report", "GET", f"reports/class/{self.test_class_id}", 200)

    def cleanup_test_data(self):
        """Clean up test data"""
        print("\n🧹 Cleaning up test data...")
        
        # Delete test student (this should cascade delete enrollments, payments, etc.)
        if self.test_student_id:
            success, _ = self.run_test("Delete Test Student", "DELETE", f"students/{self.test_student_id}", 200)
            if success:
                print("   Test student deleted successfully")

def main():
    print("🚀 Starting Projeto Alegria API Testing...")
    print("=" * 60)
    
    tester = ProjetoAlegraAPITester()
    
    # Test sequence
    test_sequence = [
        # Basic connectivity
        ("Root API", tester.test_root_endpoint),
        
        # Public endpoints (no auth required)
        ("Public Stats", tester.test_public_stats),
        ("Public Classes", tester.test_public_classes),
        ("Public Testimonials", tester.test_public_testimonials),
        ("Contact Submission", tester.test_contact_submission),
        
        # Authentication
        ("Admin Login", tester.test_admin_login),
        ("Auth Me", tester.test_auth_me),
        
        # Dashboard
        ("Dashboard Stats", tester.test_dashboard_stats),
        
        # Students management
        ("Create Student", tester.test_create_student),
        ("List Students", tester.test_list_students),
        ("Get Student", tester.test_get_student),
        ("Update Student", tester.test_update_student),
        
        # Classes management
        ("List Classes", tester.test_list_classes),
        ("Get Class", tester.test_get_class),
        
        # Enrollments
        ("Create Enrollment", tester.test_create_enrollment),
        ("List Enrollments", tester.test_list_enrollments),
        
        # Payments
        ("Create Payment", tester.test_create_payment),
        ("List Payments", tester.test_list_payments),
        
        # Cash Flow
        ("Create Cash Flow", tester.test_create_cashflow),
        ("List Cash Flow", tester.test_list_cashflow),
        
        # Attendance
        ("Bulk Attendance", tester.test_attendance_bulk),
        ("List Attendance", tester.test_list_attendance),
        
        # Reports
        ("Class Report", tester.test_class_report),
    ]
    
    # Run all tests
    for test_name, test_func in test_sequence:
        try:
            test_func()
        except Exception as e:
            print(f"❌ {test_name} failed with exception: {str(e)}")
    
    # Cleanup
    tester.cleanup_test_data()
    
    # Print results
    print("\n" + "=" * 60)
    print(f"📊 Test Results: {tester.tests_passed}/{tester.tests_run} tests passed")
    success_rate = (tester.tests_passed / tester.tests_run * 100) if tester.tests_run > 0 else 0
    print(f"📈 Success Rate: {success_rate:.1f}%")
    
    if tester.tests_passed == tester.tests_run:
        print("🎉 All tests passed!")
        return 0
    else:
        print("⚠️  Some tests failed. Check the output above for details.")
        return 1

if __name__ == "__main__":
    sys.exit(main())