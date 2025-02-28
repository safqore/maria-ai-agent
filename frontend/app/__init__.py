from flask import Flask
from app.routes import register_routes
from config import config

def create_app(config_name):
    app = Flask(__name__)
    app.config.from_object(config[config_name])

    register_routes(app)

    return app
