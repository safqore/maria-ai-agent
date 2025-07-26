#!/usr/bin/env python3
"""
Test script for sending emails from noreply@safqore.com
This script tests the Google Workspace email configuration using SMTP.
"""

import smtplib
import os
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime
from dotenv import load_dotenv

# Load environment variables
load_dotenv()


def send_test_email(recipient_email: str, test_type: str = "basic"):
    """
    Send a test email from noreply@safqore.com
    
    Args:
        recipient_email (str): Email address to send the test email to
        test_type (str): Type of test email ("basic", "pin", "html")
    """
    
    # Email configuration from environment variables
    smtp_server = os.getenv('SMTP_SERVER', 'smtp.gmail.com')
    smtp_port = int(os.getenv('SMTP_PORT', 587))
    sender_email = os.getenv('SENDER_EMAIL', 'noreply@safqore.com')
    sender_name = os.getenv('SENDER_NAME', 'Maria AI Agent')
    smtp_username = os.getenv('SMTP_USERNAME')
    smtp_password = os.getenv('SMTP_PASSWORD')
    
    if not smtp_username or not smtp_password:
        raise ValueError("SMTP_USERNAME and SMTP_PASSWORD must be set in .env file")
    
    # Create message
    message = MIMEMultipart("alternative")
    message["Subject"] = f"Test Email from {sender_name} - {test_type.title()}"
    message["From"] = f"{sender_name} <{sender_email}>"
    message["To"] = recipient_email
    message["Reply-To"] = sender_email
    
    # Create email content based on test type
    if test_type == "basic":
        text_content = f"""
Hello!

This is a basic test email from {sender_name}.

If you received this email, the SMTP configuration is working correctly.

Sent at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

Best regards,
The Maria AI Team
        """.strip()
        
        html_content = f"""
<html>
<body>
    <h2>Test Email from {sender_name}</h2>
    <p>Hello!</p>
    <p>This is a basic test email from <strong>{sender_name}</strong>.</p>
    <p>If you received this email, the SMTP configuration is working correctly.</p>
    <p><em>Sent at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</em></p>
    <hr>
    <p>Best regards,<br>The Maria AI Team</p>
</body>
</html>
        """.strip()
    
    elif test_type == "pin":
        # Simulate a PIN verification email
        pin_code = "123456"  # In real use, this would be randomly generated
        text_content = f"""
Email Verification Required

Hello!

Please verify your email address by entering the following 6-digit PIN code:

PIN: {pin_code}

This PIN will expire in 10 minutes for security reasons.

If you didn't request this verification, please ignore this email.

Sent at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

Best regards,
The Maria AI Team
        """.strip()
        
        html_content = f"""
<html>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #2c3e50;">Email Verification Required</h2>
        <p>Hello!</p>
        <p>Please verify your email address by entering the following 6-digit PIN code:</p>
        
        <div style="background-color: #f8f9fa; border: 2px dashed #dee2e6; padding: 20px; text-align: center; margin: 20px 0;">
            <h1 style="font-size: 32px; letter-spacing: 8px; margin: 0; color: #495057;">{pin_code}</h1>
        </div>
        
        <p><strong>Important:</strong> This PIN will expire in 10 minutes for security reasons.</p>
        <p>If you didn't request this verification, please ignore this email.</p>
        
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #dee2e6;">
        <p style="font-size: 12px; color: #6c757d;">
            Sent at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}<br>
            Best regards,<br>The Maria AI Team
        </p>
    </div>
</body>
</html>
        """.strip()
    
    else:  # html test
        text_content = f"""
HTML Test Email from {sender_name}

This is a test of HTML email formatting capabilities.

Features tested:
- HTML formatting
- Inline styles
- Responsive design
- Fallback text content

Sent at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

Best regards,
The Maria AI Team
        """.strip()
        
        html_content = f"""
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
        <header style="background-color: #007bff; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="margin: 0;">HTML Test Email</h1>
            <p style="margin: 10px 0 0 0;">from {sender_name}</p>
        </header>
        
        <main style="background-color: white; padding: 30px; border-radius: 0 0 8px 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h2 style="color: #2c3e50;">Email Formatting Test</h2>
            <p>This is a test of HTML email formatting capabilities.</p>
            
            <div style="background-color: #e8f5e8; border-left: 4px solid #28a745; padding: 15px; margin: 20px 0;">
                <h3 style="margin-top: 0; color: #155724;">✅ Features Tested:</h3>
                <ul style="margin-bottom: 0;">
                    <li>HTML formatting</li>
                    <li>Inline styles</li>
                    <li>Responsive design</li>
                    <li>Fallback text content</li>
                </ul>
            </div>
            
            <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; margin: 20px 0; border-radius: 4px;">
                <p style="margin: 0;"><strong>⚠️ Note:</strong> This is a test email to verify SMTP configuration.</p>
            </div>
            
            <p style="text-align: center; margin: 30px 0;">
                <a href="https://safqore.com" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">Visit Safqore</a>
            </p>
        </main>
        
        <footer style="text-align: center; padding: 20px; font-size: 12px; color: #6c757d;">
            <p>Sent at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</p>
            <p>Best regards,<br>The Maria AI Team</p>
        </footer>
    </div>
</body>
</html>
        """.strip()
    
    # Create text and HTML parts
    text_part = MIMEText(text_content, "plain")
    html_part = MIMEText(html_content, "html")
    
    # Add parts to message
    message.attach(text_part)
    message.attach(html_part)
    
    try:
        print(f"Connecting to SMTP server: {smtp_server}:{smtp_port}")
        print(f"Authenticating as: {smtp_username}")
        print(f"Sending from: {sender_name} <{sender_email}>")
        print(f"Sending to: {recipient_email}")
        print(f"Test type: {test_type}")
        print("-" * 50)
        
        # Create SMTP session
        with smtplib.SMTP(smtp_server, smtp_port) as server:
            server.starttls()  # Enable TLS encryption
            server.login(smtp_username, smtp_password)
            
            # Send email
            text = message.as_string()
            server.sendmail(sender_email, recipient_email, text)
            
        print("✅ Email sent successfully!")
        print(f"Subject: {message['Subject']}")
        print(f"From: {message['From']}")
        print(f"To: {message['To']}")
        
    except smtplib.SMTPAuthenticationError as e:
        print(f"❌ SMTP Authentication failed: {e}")
        print("Check your SMTP_USERNAME and SMTP_PASSWORD in .env file")
    except smtplib.SMTPRecipientsRefused as e:
        print(f"❌ Recipient refused: {e}")
        print("Check the recipient email address")
    except smtplib.SMTPServerDisconnected as e:
        print(f"❌ SMTP server disconnected: {e}")
        print("Check your SMTP_SERVER and SMTP_PORT settings")
    except Exception as e:
        print(f"❌ Error sending email: {e}")
        print("Check your SMTP configuration and network connection")


def main():
    """Main function to run email tests"""
    print("=" * 60)
    print("Maria AI Agent - Email Sending Test")
    print("=" * 60)
    print()
    
    # Get recipient email
    recipient = input("Enter recipient email address: ").strip()
    if not recipient:
        print("❌ Recipient email is required")
        return
    
    # Get test type
    print("\nAvailable test types:")
    print("1. basic  - Simple text/HTML email")
    print("2. pin    - PIN verification email (like for user verification)")
    print("3. html   - Advanced HTML formatting test")
    print()
    
    test_choice = input("Enter test type (1-3) or name [default: basic]: ").strip().lower()
    
    # Map choices to test types
    test_types = {
        '1': 'basic',
        '2': 'pin', 
        '3': 'html',
        'basic': 'basic',
        'pin': 'pin',
        'html': 'html',
        '': 'basic'  # default
    }
    
    test_type = test_types.get(test_choice, 'basic')
    
    print(f"\nSending {test_type} test email to {recipient}...")
    print()
    
    try:
        send_test_email(recipient, test_type)
    except Exception as e:
        print(f"❌ Failed to send email: {e}")
        return
    
    print()
    print("=" * 60)
    print("Test completed! Check the recipient's inbox (and spam folder).")
    print("=" * 60)


if __name__ == "__main__":
    main()
