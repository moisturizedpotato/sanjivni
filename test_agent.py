# test_agent.py
import os
import django

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from otp_login.agent import format_agent_response

print("\n--- Testing Gemini Symptom Agent ---")
try:
    result = format_agent_response(
        user_text="I have a severe throbbing headache and light sensitivity", 
        phone_number="+919876543210"
    )
    print(" Agent Response Success:")
    print(result)
except Exception as e:
    print(" Agent Crashed with error:")
    print(e)