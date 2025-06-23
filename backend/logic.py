import smtplib
from email.mime.text import MIMEText
from dotenv import load_dotenv
import os

load_dotenv()

def handle_category(category):
    if category == "Fraud":
        print("Alert: Fraud detected - Flagging for security team")
        return "Resolved"
    elif category == "General Inquiry":
        print("No action needed - Auto-resolving general inquiry")
        return "Resolved"
    elif category == "Account Access":
        print("Action: Notify support team for login issue")
        return "Pending"
    elif category == "Verification":
        print("Action: Queue for manual verification review")
        return "Pending"
    return "Pending"

def send_email_notification(email, message):
    sender = os.getenv("EMAIL_USER")
    password = os.getenv("EMAIL_PASS")
    if not sender or not password:
        print("Email credentials not configured in .env")
        return
    msg = MIMEText(message)
    msg["Subject"] = "Case Update Notification"
    msg["From"] = sender
    msg["To"] = email
    try:
        with smtplib.SMTP("smtp.gmail.com", 587) as server:
            server.starttls()
            server.login(sender, password)
            server.send_message(msg)
        print("Email sent successfully")
    except Exception as e:
        print(f"Failed to send email: {e}")