import requests
import time
import sys

BASE_URL = "http://localhost:3000/api"

def print_step(msg):
    print(f"\n[STEP] {msg}")

def check_health():
    print_step("Checking Server Health...")
    try:
        resp = requests.get(f"{BASE_URL}/health")
        if resp.status_code == 200:
            print("✅ Server is up!")
            return True
    except requests.exceptions.ConnectionError:
        pass
    print("❌ Server not ready")
    return False

def verify_flow():
    # 1. Register
    print_step("Registering User...")
    user_data = {
        "firstName": "Test",
        "lastName": "User",
        "patientId": "RESET-TEST-001",
        "password": "oldpassword123",
        "phone": "1234567890",
        "email": "test@example.com"
    }
    resp = requests.post(f"{BASE_URL}/auth/register/patient", json=user_data)
    if resp.status_code != 201:
        print(f"FAILED to register: {resp.text}")
        return False
    print("✅ User registered")

    # 2. Forgot Password
    print_step("Requesting Password Reset...")
    resp = requests.post(f"{BASE_URL}/auth/forgot-password", json={"userId": "RESET-TEST-001"})
    data = resp.json()
    if not data.get("success"):
        print(f"FAILED to request reset: {data}")
        return False
    
    reset_link = data.get("resetLink")
    if not reset_link:
        print("FAILED: No reset link in response (dev mode expectation)")
        return False
    
    print(f"✅ Reset link received: {reset_link}")
    
    # Extract token
    token = reset_link.split("token=")[1]
    print(f"Token: {token}")

    # 3. Reset Password
    print_step("Resetting Password...")
    new_password = "newpassword456"
    resp = requests.post(f"{BASE_URL}/auth/reset-password", json={
        "token": token,
        "newPassword": new_password
    })
    
    if resp.json().get("success"):
        print("✅ Password reset successful")
    else:
        print(f"FAILED to reset password: {resp.text}")
        return False

    # 4. Login with OLD password (should fail)
    print_step("Verifying OLD password fails...")
    resp = requests.post(f"{BASE_URL}/auth/login", json={
        "userId": "RESET-TEST-001",
        "password": "oldpassword123",
        "role": "patient"
    })
    if resp.status_code == 401:
        print("✅ Old password rejected")
    else:
        print(f"FAILED: Old password should not work! Status: {resp.status_code}")
        return False

    # 5. Login with NEW password (should succeed)
    print_step("Verifying NEW password works...")
    resp = requests.post(f"{BASE_URL}/auth/login", json={
        "userId": "RESET-TEST-001",
        "password": "newpassword456",
        "role": "patient"
    })
    if resp.status_code == 200:
        print("✅ New password accepted. Flow Verified!")
        return True
    else:
        print(f"FAILED: New password did not work! Status: {resp.status_code}")
        return False

if __name__ == "__main__":
    # Wait for server
    for i in range(10):
        if check_health():
            break
        time.sleep(1)
        if i == 9:
            print("Server failed to start in time.")
            sys.exit(1)
            
    if verify_flow():
        sys.exit(0)
    else:
        sys.exit(1)
