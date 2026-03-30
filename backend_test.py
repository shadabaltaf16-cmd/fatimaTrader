#!/usr/bin/env python3
"""
Backend API Testing for Fatima Trader
Tests all backend endpoints with proper data flow
"""

import requests
import json
import sys
from datetime import datetime

# Use the backend URL from environment - the external URL that frontend uses
BACKEND_URL = "https://trader-bills.preview.emergentagent.com/api"

class FatimaTraderAPITest:
    def __init__(self):
        self.base_url = BACKEND_URL
        self.customer_id = None
        self.test_results = []
        
    def log_test(self, test_name, success, details=""):
        """Log test results"""
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}")
        if details:
            print(f"   Details: {details}")
        self.test_results.append({
            "test": test_name,
            "success": success,
            "details": details
        })
        
    def test_api_root(self):
        """Test GET /api/ - Check API root"""
        try:
            response = requests.get(f"{self.base_url}/")
            if response.status_code == 200:
                data = response.json()
                if "message" in data and "Fatima Trader API" in data["message"]:
                    self.log_test("API Root", True, f"Response: {data}")
                    return True
                else:
                    self.log_test("API Root", False, f"Unexpected response: {data}")
                    return False
            else:
                self.log_test("API Root", False, f"Status: {response.status_code}, Response: {response.text}")
                return False
        except Exception as e:
            self.log_test("API Root", False, f"Exception: {str(e)}")
            return False
            
    def test_create_customer(self):
        """Test POST /api/customers - Create a customer"""
        try:
            customer_data = {
                "name": "Ahmed",
                "phone": "9876543210"
            }
            response = requests.post(f"{self.base_url}/customers", json=customer_data)
            if response.status_code == 200:
                data = response.json()
                if "id" in data and data["name"] == "Ahmed" and data["phone"] == "9876543210":
                    self.customer_id = data["id"]
                    self.log_test("Create Customer", True, f"Customer ID: {self.customer_id}")
                    return True
                else:
                    self.log_test("Create Customer", False, f"Invalid response: {data}")
                    return False
            else:
                self.log_test("Create Customer", False, f"Status: {response.status_code}, Response: {response.text}")
                return False
        except Exception as e:
            self.log_test("Create Customer", False, f"Exception: {str(e)}")
            return False
            
    def test_get_customers(self):
        """Test GET /api/customers - List all customers"""
        try:
            response = requests.get(f"{self.base_url}/customers")
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list) and len(data) > 0:
                    # Check if our created customer is in the list
                    ahmed_found = any(c["name"] == "Ahmed" and c["phone"] == "9876543210" for c in data)
                    if ahmed_found:
                        self.log_test("Get Customers", True, f"Found {len(data)} customers including Ahmed")
                        return True
                    else:
                        self.log_test("Get Customers", False, "Ahmed customer not found in list")
                        return False
                else:
                    self.log_test("Get Customers", False, f"Empty or invalid response: {data}")
                    return False
            else:
                self.log_test("Get Customers", False, f"Status: {response.status_code}, Response: {response.text}")
                return False
        except Exception as e:
            self.log_test("Get Customers", False, f"Exception: {str(e)}")
            return False
            
    def test_create_entry_1(self):
        """Test POST /api/entries - Create first entry"""
        if not self.customer_id:
            self.log_test("Create Entry 1", False, "No customer_id available")
            return False
            
        try:
            entry_data = {
                "customer_id": self.customer_id,
                "customer_name": "Ahmed",
                "date": "2026-03-26",
                "nos": 5,
                "weight": 124.7,
                "rate": 158,
                "total": 19702.6
            }
            response = requests.post(f"{self.base_url}/entries", json=entry_data)
            if response.status_code == 200:
                data = response.json()
                if ("id" in data and data["customer_id"] == self.customer_id and 
                    data["date"] == "2026-03-26" and data["total"] == 19702.6):
                    self.log_test("Create Entry 1", True, f"Entry ID: {data['id']}")
                    return True
                else:
                    self.log_test("Create Entry 1", False, f"Invalid response: {data}")
                    return False
            else:
                self.log_test("Create Entry 1", False, f"Status: {response.status_code}, Response: {response.text}")
                return False
        except Exception as e:
            self.log_test("Create Entry 1", False, f"Exception: {str(e)}")
            return False
            
    def test_create_entry_2(self):
        """Test POST /api/entries - Create second entry"""
        if not self.customer_id:
            self.log_test("Create Entry 2", False, "No customer_id available")
            return False
            
        try:
            entry_data = {
                "customer_id": self.customer_id,
                "customer_name": "Ahmed",
                "date": "2026-03-28",
                "nos": 3,
                "weight": 98.2,
                "rate": 160,
                "total": 15712
            }
            response = requests.post(f"{self.base_url}/entries", json=entry_data)
            if response.status_code == 200:
                data = response.json()
                if ("id" in data and data["customer_id"] == self.customer_id and 
                    data["date"] == "2026-03-28" and data["total"] == 15712):
                    self.log_test("Create Entry 2", True, f"Entry ID: {data['id']}")
                    return True
                else:
                    self.log_test("Create Entry 2", False, f"Invalid response: {data}")
                    return False
            else:
                self.log_test("Create Entry 2", False, f"Status: {response.status_code}, Response: {response.text}")
                return False
        except Exception as e:
            self.log_test("Create Entry 2", False, f"Exception: {str(e)}")
            return False
            
    def test_get_entries(self):
        """Test GET /api/entries - List all entries"""
        try:
            response = requests.get(f"{self.base_url}/entries")
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list) and len(data) >= 2:
                    # Check if our entries are in the list
                    ahmed_entries = [e for e in data if e.get("customer_id") == self.customer_id]
                    if len(ahmed_entries) >= 2:
                        self.log_test("Get Entries", True, f"Found {len(data)} total entries, {len(ahmed_entries)} for Ahmed")
                        return True
                    else:
                        self.log_test("Get Entries", False, f"Expected 2+ Ahmed entries, found {len(ahmed_entries)}")
                        return False
                else:
                    self.log_test("Get Entries", False, f"Expected list with 2+ entries, got: {data}")
                    return False
            else:
                self.log_test("Get Entries", False, f"Status: {response.status_code}, Response: {response.text}")
                return False
        except Exception as e:
            self.log_test("Get Entries", False, f"Exception: {str(e)}")
            return False
            
    def test_get_current_week_bills(self):
        """Test GET /api/bills/current-week - Get current week bills"""
        try:
            response = requests.get(f"{self.base_url}/bills/current-week")
            if response.status_code == 200:
                data = response.json()
                if ("week_start" in data and "week_end" in data and "bills" in data):
                    bills = data["bills"]
                    if isinstance(bills, list):
                        self.log_test("Get Current Week Bills", True, f"Week: {data['week_start']} to {data['week_end']}, {len(bills)} bills")
                        return True
                    else:
                        self.log_test("Get Current Week Bills", False, f"Bills should be a list: {bills}")
                        return False
                else:
                    self.log_test("Get Current Week Bills", False, f"Missing required fields: {data}")
                    return False
            else:
                self.log_test("Get Current Week Bills", False, f"Status: {response.status_code}, Response: {response.text}")
                return False
        except Exception as e:
            self.log_test("Get Current Week Bills", False, f"Exception: {str(e)}")
            return False
            
    def test_create_payment(self):
        """Test POST /api/payments - Create a payment"""
        if not self.customer_id:
            self.log_test("Create Payment", False, "No customer_id available")
            return False
            
        try:
            payment_data = {
                "customer_id": self.customer_id,
                "customer_name": "Ahmed",
                "amount": 10000,
                "date": "2026-03-29"
            }
            response = requests.post(f"{self.base_url}/payments", json=payment_data)
            if response.status_code == 200:
                data = response.json()
                if ("id" in data and data["customer_id"] == self.customer_id and 
                    data["amount"] == 10000 and data["date"] == "2026-03-29"):
                    self.log_test("Create Payment", True, f"Payment ID: {data['id']}")
                    return True
                else:
                    self.log_test("Create Payment", False, f"Invalid response: {data}")
                    return False
            else:
                self.log_test("Create Payment", False, f"Status: {response.status_code}, Response: {response.text}")
                return False
        except Exception as e:
            self.log_test("Create Payment", False, f"Exception: {str(e)}")
            return False
            
    def test_get_payments(self):
        """Test GET /api/payments - List all payments"""
        try:
            response = requests.get(f"{self.base_url}/payments")
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list) and len(data) > 0:
                    # Check if our payment is in the list
                    ahmed_payments = [p for p in data if p.get("customer_id") == self.customer_id]
                    if len(ahmed_payments) >= 1:
                        self.log_test("Get Payments", True, f"Found {len(data)} total payments, {len(ahmed_payments)} for Ahmed")
                        return True
                    else:
                        self.log_test("Get Payments", False, f"Expected 1+ Ahmed payments, found {len(ahmed_payments)}")
                        return False
                else:
                    self.log_test("Get Payments", False, f"Expected list with 1+ payments, got: {data}")
                    return False
            else:
                self.log_test("Get Payments", False, f"Status: {response.status_code}, Response: {response.text}")
                return False
        except Exception as e:
            self.log_test("Get Payments", False, f"Exception: {str(e)}")
            return False
            
    def test_get_past_bills(self):
        """Test GET /api/bills/past - List past bills"""
        try:
            response = requests.get(f"{self.base_url}/bills/past")
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    self.log_test("Get Past Bills", True, f"Found {len(data)} past bills")
                    return True
                else:
                    self.log_test("Get Past Bills", False, f"Expected list, got: {data}")
                    return False
            else:
                self.log_test("Get Past Bills", False, f"Status: {response.status_code}, Response: {response.text}")
                return False
        except Exception as e:
            self.log_test("Get Past Bills", False, f"Exception: {str(e)}")
            return False
            
    def run_all_tests(self):
        """Run all tests in sequence"""
        print(f"🚀 Starting Fatima Trader API Tests")
        print(f"Backend URL: {self.base_url}")
        print("=" * 60)
        
        # Test sequence as requested
        tests = [
            self.test_api_root,
            self.test_create_customer,
            self.test_get_customers,
            self.test_create_entry_1,
            self.test_create_entry_2,
            self.test_get_entries,
            self.test_get_current_week_bills,
            self.test_create_payment,
            self.test_get_payments,
            self.test_get_past_bills
        ]
        
        passed = 0
        failed = 0
        
        for test in tests:
            success = test()
            if success:
                passed += 1
            else:
                failed += 1
            print()  # Add spacing between tests
            
        print("=" * 60)
        print(f"📊 Test Summary: {passed} passed, {failed} failed")
        
        if failed > 0:
            print("\n❌ Failed Tests:")
            for result in self.test_results:
                if not result["success"]:
                    print(f"  - {result['test']}: {result['details']}")
                    
        return failed == 0

if __name__ == "__main__":
    tester = FatimaTraderAPITest()
    success = tester.run_all_tests()
    sys.exit(0 if success else 1)