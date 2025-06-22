#!/usr/bin/env python
"""
Simple script to test JWT authentication endpoints
"""

import os
import sys
import django
import requests
import json

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'pagemaker.settings')
django.setup()

def test_jwt_auth():
    """Test JWT authentication endpoints"""
    base_url = "http://127.0.0.1:8000"
    
    # Test data
    login_data = {
        "username": "admin",
        "password": "admin123"
    }
    
    try:
        # Test token obtain
        response = requests.post(f"{base_url}/api/v1/auth/token/", json=login_data)
        print(f"Token obtain status: {response.status_code}")
        
        if response.status_code == 200:
            tokens = response.json()
            print(f"Access token received: {tokens.get('access')[:50]}...")
            print(f"Refresh token received: {tokens.get('refresh')[:50]}...")
            
            # Test token refresh
            refresh_data = {"refresh": tokens.get('refresh')}
            refresh_response = requests.post(f"{base_url}/api/v1/auth/token/refresh/", json=refresh_data)
            print(f"Token refresh status: {refresh_response.status_code}")
            
            if refresh_response.status_code == 200:
                new_token = refresh_response.json()
                print(f"New access token: {new_token.get('access')[:50]}...")
                print("✅ JWT authentication working correctly!")
            else:
                print(f"❌ Token refresh failed: {refresh_response.text}")
        else:
            print(f"❌ Token obtain failed: {response.text}")
            
    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to Django server. Make sure it's running with: python manage.py runserver")
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    test_jwt_auth() 