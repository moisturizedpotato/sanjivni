# otp_login/utils.py
import random
# from twilio.rest import Client
from .models import OTP



def generate_and_send_sms_otp(user, phone_number):
    # Generate the 6-digit random number
    otp_code = str(random.randint(100000, 999999))
    
    # Save it to the database
    OTP.objects.update_or_create(user=user, defaults={'otp_code': otp_code})
    
    # Print the code to your Django terminal window for testing
    print("\n" + "="*40)
    print(f"🚨 AROGYA HEALTH LOCAL TEST 🚨")
    print(f"Sending OTP to {phone_number}")
    print(f"Your login code is: {otp_code}")
    print("="*40 + "\n")