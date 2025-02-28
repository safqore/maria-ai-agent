from app import create_app
from dotenv import load_dotenv
import os

if __name__ == "__main__":
    load_dotenv()

    config_name = os.environ.get("FRONTEND_FLASK_ENV","development")
    app = create_app(config_name)
    app.run()
