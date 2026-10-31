
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from email.message import EmailMessage
import smtplib
import os

load_dotenv()

app = Flask(__name__)
CORS(app)

@app.route("/")
def home():
    return "Aarosh Foods Backend is Running!"

@app.route("/send-message", methods=["POST"])
def send_message():

    data = request.get_json()

    name = data.get("name", "").strip()
    email = data.get("email", "").strip()
    phone = data.get("phone", "").strip()
    subject = data.get("subject", "").strip()
    message = data.get("message", "").strip()

    if not all([name, email, subject, message]):
        return jsonify({"error": "Please fill all required fields"}), 400

    msg = EmailMessage()
    msg["Subject"] = f"Website Enquiry: {subject}"
    msg["From"] = os.getenv("SMTP_USERNAME")
    msg["To"] = os.getenv("COMPANY_EMAIL")
    msg["Reply-To"] = email

    msg.set_content(
        f"Name: {name}\n"
        f"Email: {email}\n"
        f"Phone: {phone}\n"
        f"Subject: {subject}\n"
        f"Message: {message}"
    )

    try:
        with smtplib.SMTP_SSL(os.getenv("SMTP_HOST"),
                              int(os.getenv("SMTP_PORT", 465))) as server:

                server.login(
                os.getenv("SMTP_USERNAME"),
                os.getenv("SMTP_PASSWORD")
            )
                server.send_message(msg)

        return jsonify({"success": True, "message": "Message sent successfully!"})

    except Exception as e:
        print("Email error:", e)
        return jsonify({"error": "Unable to send message"}), 500


if __name__ == "__main__":
    app.run(debug=True)
