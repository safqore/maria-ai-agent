import os
from flask import Flask
from flask_cors import CORS
from dotenv import load_dotenv

def create_app():
    load_dotenv(dotenv_path=os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env'))
    app = Flask(__name__)
    CORS(app, origins=["http://localhost:3000"])

    # Register blueprints
    from app.routes.session import session_bp
    app.register_blueprint(session_bp)
    # Add other blueprints as needed

    return app
